import { describe, expect, it } from 'vitest';
import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  extractArticleText,
  fixCyrillicTags,
  matchCandidate,
  NewsAutoService,
  parseLlmJson,
  pickCandidate,
  pickFresh,
  sanitizeImageKeywords,
  shingleOverlap,
  stripAttribution,
  withAttempts,
  type RssCandidate,
} from './news-auto.service';
import { s3KeyForUrl } from '../uploads/s3';

function item(hoursAgo: number, link: string, title = 'Заголовок материала'): RssCandidate {
  return {
    feedTitle: 'Onliner',
    title,
    link,
    summary: 'Короткое описание',
    publishedAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
  };
}

describe('pickFresh', () => {
  it('берёт свежие материалы и сортирует от новых к старым', () => {
    const fresh = pickFresh([item(48, '/a'), item(1, '/b'), item(10, '/c')]);
    expect(fresh.map((i) => i.link)).toEqual(['/b', '/c', '/a']);
  });

  it('отбрасывает старше трёх суток и без ссылки', () => {
    expect(pickFresh([item(100, '/old'), item(1, '')])).toHaveLength(0);
  });

  it('ограничивает выборку потолком', () => {
    const many = Array.from({ length: 60 }, (_, index) => item(1, `/${index}`));
    expect(pickFresh(many)).toHaveLength(40);
  });
});

describe('fixCyrillicTags', () => {
  it('кириллический <р> становится абзацем', () => {
    expect(fixCyrillicTags('<р>Текст</р>')).toBe('<p>Текст</p>');
  });

  it('лечит и entity-вид (&lt;р&gt;)', () => {
    expect(fixCyrillicTags('&lt;р&gt;Привет&lt;/р&gt;')).toBe('<p>Привет</p>');
  });

  it('чинит сироту «p>» без открывающей скобки', () => {
    expect(fixCyrillicTags('</h2>\np>Будущим водителям стоит')).toBe(
      '</h2><p>Будущим водителям стоит',
    );
  });

  it('прочие теги с кириллицей в имени вырезаются', () => {
    expect(fixCyrillicTags('<strong>жирный</strong> <б>мусор</б>')).toBe(
      '<strong>жирный</strong> мусор',
    );
  });

  it('нормальную разметку не трогает', () => {
    const html = '<p>Текст <strong>жирный</strong> и <a href="https://a.by/b">ссылка</a>.</p>';
    expect(fixCyrillicTags(html)).toBe(html);
  });
});

describe('stripAttribution', () => {
  it('вырезает финальную подпись «По материалам …»', () => {
    const html = '<p>Текст</p><p>По материалам <a href="https://a.by">источника</a>.</p>';
    expect(stripAttribution(html)).toBe('<p>Текст</p>');
  });

  it('не трогает текст без подписи', () => {
    expect(stripAttribution('<p>Текст</p>')).toBe('<p>Текст</p>');
  });
});

describe('extractArticleText', () => {
  const onlinerPage = `
    <nav><p>Перейти в раздел</p></nav>
    <div class="news-text">
      <div class="news-reference">Автор: Иванов</div>
      <p>Добавить в основные источники Google</p>
      <p>Генпрокуратура проверила автошколы: нарушения нашлись почти везде, документы оформляли задним числом, а экзамены принимали формально и без должного контроля со стороны инструкторов.</p>
      <p><strong>Проверка</strong> коснулась 14 учреждений &mdash; итоги уже передали в &nbsp;МИД, часть лицензий приостановлена до устранения замечаний.</p>
      <script>var x = 'pseudo paragraph';</script>
    </div>`;
  const automailPage = `
    <nav><p>Новости Статьи Деньги Лайфстайл Технологии Рынок Законодательство очень длинная навигационная строка</p></nav>
    <main itemProp="articleBody">
      <p class="photo">Руководство BMW у ворот завода в Мюнхене, архив</p>
      <p>Руководство BMW и его подразделение M неоднократно заявляли о намерении сохранить механическую коробку передач.</p>
      <p>Инженеры подтвердили: очередная модификация M3 получит исключительно восьмиступенчатый автомат.</p>
    </main>`;
  const kommersantPage = `
    <div class="k-header"><p class="k-header-radio-text__title">Эфир радиостанции очень длинное название передачи</p></div>
    <article>
      <p class="doc-subtitle">Подзаголовок спецпроекта про документы</p>
      <p class="picture">1/4 Фото: Из архива «Автопилота»</p>
      <p>Производители шин напомнили о сезонной смене резины: тормозной путь на летних покрышках зимой заметно длиннее.</p>
      <p>В сервисных центрах советуют записываться заранее, очередь в сезон растёт в несколько раз каждый год.</p>
    </article>`;

  it('onliner: собирает абзацы news-text и чистит разметку', () => {
    const text = extractArticleText(onlinerPage);
    expect(text).toContain('Генпрокуратура проверила автошколы');
    expect(text).toContain('Проверка коснулась 14 учреждений');
    expect(text).not.toContain('основные источники');
    expect(text).not.toContain('Перейти в раздел');
    expect(text).not.toContain('Автор');
  });

  it('авто mail: берёт main[itemprop=articleBody] и выкидывает подписи к фото и навигацию', () => {
    const text = extractArticleText(automailPage);
    expect(text).toContain('механическую коробку передач');
    expect(text).not.toContain('архив');
    expect(text).not.toContain('Новости Статьи');
  });

  it('декодирует типографские сущности источника', () => {
    const page = `<main itemProp="articleBody">
      <p>Инженеры подтвердили &laquo;восьмиступенчатый&raquo; автомат &mdash; вместо &laquo;механики&raquo;, о которой так долго все говорили и спорили.</p>
      <p>Дилеры уже принимают заказы на новую модификацию, первые машины приедут к концу зимы, цены обещают сохранить.</p>
    </main>`;
    const text = extractArticleText(page);
    expect(text).toContain('«восьмиступенчатый» автомат - вместо');
  });

  it('коммерсант: ограничивается <article> и выкидывает шапку и галерею', () => {
    const text = extractArticleText(kommersantPage);
    expect(text).toContain('сезонной смене резины');
    expect(text).not.toContain('Автопилота');
    expect(text).not.toContain('радиостанции');
    expect(text).not.toContain('документы');
  });

  it('мелкий мусорный html без контейнеров даёт пустой текст', () => {
    expect(extractArticleText('<html><body><p>коротко</p></body></html>')).toBe('');
  });
});

describe('shingleOverlap', () => {
  const source =
    'Генпрокуратура проверила автошколы и нашла нарушения: документы оформляли задним числом, ' +
    'а экзамены принимали формально. Часть лицензий приостановлена до устранения замечаний.';

  it('дословная копия даёт почти полную сумму', () => {
    expect(shingleOverlap(source, source)).toBeGreaterThan(0.9);
  });

  it('самостоятельная переработка даёт низкое пересечение', () => {
    const rewrite =
      'Проверка автошкол закончилась приостановкой лицензий. Проверяющие выяснили: ' +
      'бумаги студенты получали задним числом, экзамены превращались в формальность.';
    expect(shingleOverlap(source, rewrite)).toBeLessThan(0.2);
  });

  it('html-разметка результата не влияет на сравнение', () => {
    const copy = `<p>${source}</p>`;
    expect(shingleOverlap(source, copy)).toBeGreaterThan(0.9);
  });

  it('пустой результат даёт 0', () => {
    expect(shingleOverlap(source, '')).toBe(0);
  });

  it('четырёхсловные повторы ловятся отдельным размером шингла', () => {
    const copied = 'Документы оформляли задним числом, а экзамены принимали формально.';
    expect(shingleOverlap(source, copied, 4)).toBeGreaterThan(0.3);
    expect(shingleOverlap(source, 'Автошколы попали под проверку: лицензии заморозили', 4)).toBe(0);
  });
});

describe('NewsAutoService: состояние генерации', () => {
  const service = new NewsAutoService({} as never, {} as never, {} as never);

  it('покоится по умолчанию', () => {
    expect(service.getState()).toEqual({ running: false, startedAt: null, last: null });
  });

  it('показывает идущую генерацию, а зависшую (15+ минут) отбрасывает', () => {
    const fields = service as unknown as { runningSince: Date | null };
    fields.runningSince = new Date();
    expect(service.getState().running).toBe(true);
    expect(typeof service.getState().startedAt).toBe('string');
    fields.runningSince = new Date(Date.now() - 16 * 60 * 1000);
    expect(service.getState().running).toBe(false);
    fields.runningSince = null;
  });

  it('не даёт запустить вторую генерацию, пока идёт первая', async () => {
    const fields = service as unknown as { runningSince: Date | null };
    fields.runningSince = new Date();
    await expect(service.run()).rejects.toThrow(ConflictException);
    await expect(service.run()).rejects.toThrow('уже идёт');
    fields.runningSince = null;
  });
});

describe('parseLlmJson', () => {
  it('читает чистый JSON', () => {
    expect(parseLlmJson('{"title":"Тест"}')).toEqual({ title: 'Тест' });
  });

  it('срезает markdown-заборы и болтовню вокруг', () => {
    const raw = 'Вот ответ:\n```json\n{"link":"https://a.example","title":"Ок"}\n```\nГотово!';
    expect(parseLlmJson(raw)).toEqual({ link: 'https://a.example', title: 'Ок' });
  });

  it('ломается на мусоре понятной ошибкой', () => {
    expect(() => parseLlmJson('никакого json здесь нет')).toThrow(BadRequestException);
  });

  it('чинит литеральные переносы строк внутри значений', () => {
    const raw =
      '```json\n{"title":"Зима близко","contentHtml":"<p>Первый абзац</p>\n\n<p>Второй абзац</p>"}\n```';
    const parsed = parseLlmJson(raw);
    expect(parsed['title']).toBe('Зима близко');
    expect(parsed['contentHtml']).toBe('<p>Первый абзац</p>\n\n<p>Второй абзац</p>');
  });

  it('чинит висячие запятые', () => {
    expect(parseLlmJson('{"title":"Тест","tags":[1,2,],}')).toEqual({
      title: 'Тест',
      tags: [1, 2],
    });
  });

  it('различает «нет JSON» и «сломанный JSON» с указанием ступени', () => {
    expect(() => parseLlmJson('{"title": "без закрывающей', 'тест')).toThrow(
      'ИИ (тест) вернул ответ без JSON',
    );
    expect(() => parseLlmJson('{"title": "ок", "x": }', 'тест')).toThrow(
      'ИИ (тест) вернул сломанный JSON',
    );
  });
});

describe('matchCandidate', () => {
  const list: readonly RssCandidate[] = [
    {
      feedTitle: 'a',
      title: '1',
      link: 'https://auto.onliner.by/2026/10/13/one',
      summary: '',
      publishedAt: new Date(),
    },
    {
      feedTitle: 'a',
      title: '2',
      link: 'https://auto.mail.ru/article/123-tyres/',
      summary: '',
      publishedAt: new Date(),
    },
  ];

  it('точное совпадение', () => {
    expect(matchCandidate('https://auto.onliner.by/2026/10/13/one', list)?.title).toBe('1');
  });

  it('терпит хвостовой слэш и мусор вокруг', () => {
    expect(matchCandidate('https://auto.mail.ru/article/123-tyres', list)?.title).toBe('2');
    expect(matchCandidate('<https://auto.mail.ru/article/123-tyres/>.', list)?.title).toBe('2');
  });

  it('мусор на входе даёт undefined', () => {
    expect(matchCandidate('нет ссылки', list)).toBeUndefined();
    expect(matchCandidate(null, list)).toBeUndefined();
  });
});

describe('sanitizeImageKeywords', () => {
  it('оставляет только латиницу, цифры и пробелы', () => {
    expect(sanitizeImageKeywords('car water «помпа» pump! 42')).toBe('car water pump 42');
  });

  it('схлопывает пробелы и режет длину', () => {
    expect(sanitizeImageKeywords('  a   b  ')).toBe('a b');
    expect(sanitizeImageKeywords('x'.repeat(100)).length).toBe(60);
  });

  it('не-строка даёт пустую строку', () => {
    expect(sanitizeImageKeywords(null)).toBe('');
    expect(sanitizeImageKeywords(42)).toBe('');
  });
});

describe('pickCandidate', () => {
  const list: readonly RssCandidate[] = [
    {
      feedTitle: 'a',
      title: '1',
      link: 'https://auto.onliner.by/2026/10/13/one',
      summary: '',
      publishedAt: new Date(),
    },
    {
      feedTitle: 'a',
      title: '2',
      link: 'https://auto.mail.ru/article/123-tyres/',
      summary: '',
      publishedAt: new Date(),
    },
  ];

  it('числовой index решает', () => {
    expect(pickCandidate({ index: 1, link: 'мусор' }, list)?.title).toBe('2');
    expect(pickCandidate({ index: 0 }, list)?.title).toBe('1');
  });

  it('index строкой тоже подходит', () => {
    expect(pickCandidate({ index: '1' }, list)?.title).toBe('2');
  });

  it('битый index падает на нечёткое сравнение ссылок', () => {
    expect(
      pickCandidate({ index: 99, link: 'https://auto.mail.ru/article/123-tyres' }, list)?.title,
    ).toBe('2');
    expect(pickCandidate({ link: 'нет ссылки' }, list)).toBeUndefined();
  });
});

describe('withAttempts', () => {
  it('повторяет качественные ошибки LLM и возвращает первый успех', async () => {
    const warnings: string[] = [];
    let calls = 0;
    const result = await withAttempts(
      'стадия',
      3,
      async () => {
        calls++;
        if (calls < 3) {
          throw new BadRequestException('сломанный JSON');
        }
        return 'ок';
      },
      (message) => warnings.push(message),
    );
    expect(result).toBe('ок');
    expect(calls).toBe(3);
    expect(warnings).toHaveLength(2);
  });

  it('выбрасывает последнюю ошибку, когда попытки кончились', async () => {
    await expect(
      withAttempts(
        'стадия',
        2,
        () => Promise.reject(new BadRequestException('опять')),
        () => undefined,
      ),
    ).rejects.toThrow('опять');
  });

  it('программные ошибки не ретраятся - падают сразу', async () => {
    let calls = 0;
    await expect(
      withAttempts(
        'стадия',
        3,
        () => {
          calls++;
          return Promise.reject(new TypeError('сломалось в коде'));
        },
        () => undefined,
      ),
    ).rejects.toThrow('сломалось в коде');
    expect(calls).toBe(1);
  });
});

describe('s3KeyForUrl', () => {
  it('режет префикс /uploads/ и режет обход пути', () => {
    expect(s3KeyForUrl('/uploads/news/a.jpg')).toBe('news/a.jpg');
    expect(s3KeyForUrl('/uploads/../etc/passwd')).toBeNull();
    expect(s3KeyForUrl('https://evil.ru/x.jpg')).toBeNull();
    expect(s3KeyForUrl('/uploads/')).toBeNull();
  });
});
