import { describe, expect, it } from 'vitest';
import { sanitizeHtml, slugifyTitle } from './news.service';
import { NewsService } from './news.service';

describe('slugifyTitle', () => {
  it('транслитерирует кириллицу', () => {
    expect(slugifyTitle('Зимняя подготовка: чек-лист')).toBe('zimnyaya-podgotovka-chek-list');
  });

  it('оставляет только латиницу, цифры и дефисы', () => {
    expect(slugifyTitle('ТОП-5 причин! (обновлено) 2026')).toBe('top-5-prichin-obnovleno-2026');
  });

  it('пустой результат для мусора', () => {
    expect(slugifyTitle('!!! ???')).toBe('');
  });
});

describe('sanitizeHtml', () => {
  it('вырезает script целиком', () => {
    expect(sanitizeHtml('<p>ок</p><script>alert(1)</script>')).toBe('<p>ок</p>');
  });

  it('вырезает обработчики on*', () => {
    expect(sanitizeHtml('<img src="/uploads/a.webp" onerror="alert(1)">')).toBe(
      '<img src="/uploads/a.webp" />',
    );
  });

  it('вырезает javascript:-ссылку целиком, включая закодированную схему', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">ок</a>')).toBe('<a>ок</a>');
    expect(sanitizeHtml('<a href="javascript&#58;alert(1)">ок</a>')).toBe('<a>ок</a>');
    expect(sanitizeHtml('<a href="jAvAsCrIpT:alert(1)">ок</a>')).toBe('<a>ок</a>');
  });

  it('вырезает скрипты, включая рассыпанные вложенные теги', () => {
    expect(sanitizeHtml('<scr<script>ipt>alert(1)</scr</script>ipt>')).not.toMatch(/script/i);
    expect(sanitizeHtml('<script>alert(1)</script>текст')).toBe('текст');
    expect(sanitizeHtml('<img src="data:text/html;base64,x" onerror="x">')).toBe('<img />');
  });

  it('не трогает обычную разметку', () => {
    const html = '<h2>Заголовок</h2><p>Текст <strong>жирный</strong> и <em>курсив</em>.</p>';
    expect(sanitizeHtml(html)).toBe(html);
  });
});

describe('NewsService.create', () => {
  it('добавляет отметку времени и суффикс при конфликте в ту же минуту', async () => {
    const taken: string[] = [];
    const created: { slug: string }[] = [];
    const service = new NewsService({
      news: {
        findFirst: async (args: unknown) => {
          const { where } = args as { where: { slug?: string } };
          if (where?.slug !== undefined) {
            return taken.includes(where.slug) ? { id: 'x' } : null;
          }
          return null;
        },
        create: async (args: unknown) => {
          const { data } = args as { data: { slug: string } };
          created.push({ slug: data.slug });
          taken.push(data.slug);
          return { id: 'x', slug: data.slug };
        },
      },
    } as never);
    await service.create({ title: 'Зимняя подготовка', content: '<p>Текст новости.</p>' });
    await service.create({ title: 'Зимняя подготовка', content: '<p>Другой текст.</p>' });
    expect(created[0]?.slug).toMatch(/^zimnyaya-podgotovka-\d{10}$/);
    expect(created[1]?.slug).toMatch(/^zimnyaya-podgotovka-\d{10}-2$/);
  });

  it('отклоняет короткий заголовок', async () => {
    const service = new NewsService({ news: {} } as never);
    await expect(
      service.create({ title: 'Что?', content: '<p>Достаточно длинный текст.</p>' }),
    ).rejects.toThrow('Заголовок');
  });

  it('отклоняет плохую обложку', async () => {
    const service = new NewsService({ news: {} } as never);
    await expect(
      service.create({
        title: 'Зимняя подготовка',
        content: '<p>Текст.</p>',
        cover: 'https://evil.example/pic.png',
      }),
    ).rejects.toThrow('Обложка');
  });
});
