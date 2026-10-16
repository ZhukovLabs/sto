import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';
import { PrismaService } from '../prisma/prisma.service';
import { NewsService, type NewsView } from './news.service';
import { NewsCoverService } from './news-cover.service';
import { REWRITE_PROMPT, SELECT_PROMPT } from './news-auto-prompts';
import { SOURCE_HEADERS, SOURCE_TIMEOUT_MS } from './news-http';

/** RSS-ленты-источники: Onliner (Беларусь) + Автопилот Коммерсанта и Авто Mail (Россия). */
const FEEDS = [
  'https://auto.onliner.by/feed',
  'https://onliner.by/feed',
  'https://people.onliner.by/feed',
  'https://www.kommersant.ru/RSS/auto.xml',
  'https://auto.mail.ru/rss/',
] as const;

/** Берём материалы моложе трёх суток — «больше выборки» без протухших новостей. */
const FRESH_HOURS = 72;
/** Потолок кандидатов для одного запроса к ИИ. */
const MAX_CANDIDATES = 40;
/** Ретраи могут растянуть ступень: даём каждому LLM-вызову до 4 минут. */
const LLM_TIMEOUT_MS = 240_000;

export interface RssCandidate {
  feedTitle: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: Date;
}

export interface AutoNewsResult {
  news: NewsView;
  /** Заголовок выбранного первоисточника. */
  pickedFrom: string;
  /** Поисковая фокус-тема выбранного материала (2-5 слов). */
  focus: string;
  /** Обоснование выбора от ИИ (1-2 предложения). */
  reason: string;
  /** Сколько свежих непубликованных кандидатов было на входе. */
  candidates: number;
}

/** Информация о последнем завершённом прогоне автогенерации. */
export interface AutoNewsLastRun {
  ok: boolean;
  finishedAt: string;
  result?: {
    slug: string;
    title: string;
    pickedFrom: string;
    focus: string;
    reason: string;
    candidates: number;
  };
  message?: string;
}

/** Состояние автогенерации: лоадер в админке живёт даже после перезагрузки страницы. */
export interface AutoNewsState {
  running: boolean;
  startedAt: string | null;
  last: AutoNewsLastRun | null;
}

/** Свежие материалы из всех лент, отсортированные от новых к старым. */
export function pickFresh(
  items: RssCandidate[],
  now: Date = new Date(),
  freshHours: number = FRESH_HOURS,
  limit: number = MAX_CANDIDATES,
): RssCandidate[] {
  const minTime = now.getTime() - freshHours * 60 * 60 * 1000;
  return items
    .filter(
      (item) => item.publishedAt.getTime() >= minTime && item.link !== '' && item.title !== '',
    )
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, limit);
}

/**
 * Чинит частую поломку LLM-ответов: литеральные переводы строк и табы внутри
 * JSON-строк (должны быть \n и \t). Кавычки внутри строк починить нельзя -
 * их предотвращает JSON-режим и запрет ссылок в разметке.
 */
function repairJson(raw: string): string {
  let inString = false;
  let escaped = false;
  let result = '';
  for (const char of raw) {
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      result += char;
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    if (inString && char === '\n') {
      result += '\\n';
      continue;
    }
    if (inString && char === '\r') {
      continue;
    }
    if (inString && char === '\t') {
      result += '\\t';
      continue;
    }
    result += char;
  }
  return result;
}

/** JSON из ответа LLM: срезает markdown-заборы и лишний текст вокруг объекта. */
export function parseLlmJson(raw: string, stage = ''): Record<string, unknown> {
  const label = stage === '' ? 'ИИ' : `ИИ (${stage})`;
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new BadRequestException(`${label} вернул ответ без JSON — попробуйте ещё раз`);
  }
  const candidate = cleaned.slice(start, end + 1);
  // Три стратегии: как есть; с экранированными переносами; ещё и без висячих запятых.
  const repaired = repairJson(candidate);
  const variants = [candidate, repaired, repaired.replace(/,\s*([}\]])/g, '$1')];
  for (const variant of variants) {
    try {
      return JSON.parse(variant) as Record<string, unknown>;
    } catch {
      // следующая стратегия
    }
  }
  throw new BadRequestException(`${label} вернул сломанный JSON — попробуйте ещё раз`);
}

/**
 * Повторяет «качественные» ошибки LLM-ступени (сломанный JSON, кривую ссылку,
 * слабую переработку): новая попытка - новый ответ модели. Сетевые сбои приходят
 * BadRequestException от chat() и тоже пережимаются. Всё прочее (программные
 * ошибки) падает сразу, без бессмысленных повторов.
 */
export async function withAttempts<T>(
  stage: string,
  attempts: number,
  run: () => Promise<T>,
  warn: (message: string) => void,
): Promise<T> {
  let lastError: unknown = new Error(`${stage}: не было попыток`);
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (!(error instanceof BadRequestException)) {
        throw error;
      }
      lastError = error;
      warn(`${stage}: попытка ${attempt}/${attempts} не удалась — ${error.message.slice(0, 160)}`);
    }
  }
  throw lastError;
}

/** Ключи поиска стоковой обложки от ИИ: только латиница/цифры/пробелы, до 60 символов. */
export function sanitizeImageKeywords(raw: unknown): string {
  if (typeof raw !== 'string') {
    return '';
  }
  return raw
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

/**
 * Ищет кандидата по ссылке из ответа ИИ: та ссылка может прийти с обрезанным
 * хвостовым слэшем или markdown-обёрткой, поэтому сравниваем всё более мягко.
 */
export function matchCandidate(
  rawLink: unknown,
  candidates: readonly RssCandidate[],
): RssCandidate | undefined {
  if (typeof rawLink !== 'string' || rawLink.trim() === '') {
    return undefined;
  }
  const link = rawLink
    .trim()
    .replace(/^[<«]+/, '')
    .replace(/[>».,;]+$/, '');
  const bare = (value: string): string => value.replace(/\/$/, '');
  return (
    candidates.find((item) => item.link === link) ??
    candidates.find((item) => bare(item.link) === bare(link)) ??
    candidates.find((item) => bare(item.link).startsWith(bare(link)) && link.length > 20) ??
    undefined
  );
}

/**
 * Ищет кандидата по ответу ИИ: сперва по index (числу из списка - его модель
 * копирует надёжнее, чем длинный URL), затем по нечёткому сравнению ссылок.
 */
export function pickCandidate(
  pick: Record<string, unknown>,
  candidates: readonly RssCandidate[],
): RssCandidate | undefined {
  const index = pick.index;
  if (
    typeof index === 'number' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < candidates.length
  ) {
    return candidates[index];
  }
  if (typeof index === 'string' && /^\d+$/.test(index) && Number(index) < candidates.length) {
    return candidates[Number(index)];
  }
  return matchCandidate(pick.link, candidates);
}

/**
 * Чинит типичную ошибку LLM — кириллические буквы вместо латинских в тегах:
 * `<р>`/`&lt;р&gt;` становятся нормальными абзацами, прочие теги с кириллицей
 * в имени вырезаются (в нашем разметочном словаре таких нет).
 */
export function fixCyrillicTags(html: string): string {
  return (
    html
      .replace(/&lt;\s*(\/?)\s*р\s*&gt;/gi, (_, closing: string) =>
        closing === '/' ? '</p>' : '<p>',
      )
      .replace(/<\s*(\/?)\s*р\s*>/gi, (_, closing: string) => (closing === '/' ? '</p>' : '<p>'))
      // Сирота «p>» без открывающей угловой скобки в начале абзаца.
      .replace(/(^|[\n>])\s*p\s*>/gi, '$1<p>')
      .replace(/<\/?\s*[а-яё][^>]*>/gi, '')
  );
}

/** Вырезает финальную подпись «По материалам …» и хвостовой CTA источника, даже если ИИ их добавил. */
export function stripAttribution(html: string): string {
  return html
    .replace(/<p>\s*(?:По материалам|Источник:?)[\s\S]*?<\/p>\s*$/i, '')
    .replace(/<p>[\s\S]*?(?:подпиш|телеграм|наш бот)[\s\S]*?<\/p>\s*$/i, '')
    .trimEnd();
}

/**
 * Доля совпадающих шинглов (5-словных последовательностей) между текстом источника
 * и переработкой: 0 - тексты не пересекаются, 1 - идентичны. Порог здоровой
 * переработки - до 0.2: факты и имена совпасть могут, формулировки - нет.
 */
export function shingleOverlap(source: string, output: string, size = 5): number {
  const shingles = (text: string): Set<string> => {
    const words = text
      .toLowerCase()
      .replace(/<[^>]+>/g, ' ')
      .replace(/[«»"„“.,!?;:()—–-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word !== '');
    const set = new Set<string>();
    for (let i = 0; i + size <= words.length; i++) {
      set.add(words.slice(i, i + size).join(' '));
    }
    return set;
  };
  const origin = shingles(source);
  const rewrite = shingles(output);
  if (rewrite.size === 0) {
    return 0;
  }
  let hits = 0;
  for (const shingle of rewrite) {
    if (origin.has(shingle)) {
      hits++;
    }
  }
  return hits / rewrite.size;
}

/** Служебные абзацы источника, которые тащатся в текст статьи. */
const JUNK_PARAGRAPH =
  /основные источники|Подписывайтесь|Читайте также|Нашли ошибку|Сообщите редакции|Быстрая связь с редакцией|телеграм|Telegram|напишите нам|подпиш|©|все права|перепечатк|сетевое издание|доменное имя|рекомендательн|роскомнадзор|учредител|источник:/i;

/** Классы <p>, в которых живёт не текст статьи, а подписи и шапка. */
const JUNK_P_CLASS = /picture|photo|caption|k-header|doc-subtitle|news-reference/i;

function paragraphsOf(scope: string): string {
  const paragraphs: string[] = [];
  for (const match of scope.matchAll(/<p([^>]*)>([\s\S]*?)<\/p>/gi)) {
    if (JUNK_P_CLASS.test(match[1] ?? '')) {
      continue;
    }
    const text = match[2]
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;?/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;|&#39;/gi, '"')
      .replace(/&laquo;/gi, '«')
      .replace(/&raquo;/gi, '»')
      .replace(/&mdash;/gi, '-')
      .replace(/&ndash;/gi, '-')
      .replace(/&hellip;/gi, '…')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length >= 30 && !JUNK_PARAGRAPH.test(text)) {
      paragraphs.push(text);
    }
  }
  return paragraphs.join('\n\n');
}

/**
 * Полный текст статьи из html страницы. Пробует семантические контейнеры по убыванию
 * точности: main[itemprop=articleBody] (Авто Mail), <article> (Коммерсант, БелТА),
 * блок news-text (Onliner), в конце - вся страница. Первый контейнер, давший
 * содержательный текст (от 200 символов), и используется.
 */
export function extractArticleText(html: string): string {
  const scopes: string[] = [];
  const main = /<main[^>]*itemprop=["']articlebody["'][^>]*>/i.exec(html);
  if (main !== null) {
    const end = html.indexOf('</main>', main.index);
    scopes.push(html.slice(main.index, end === -1 ? main.index + 80_000 : end));
  }
  const article = /<article[\s>][\s\S]*?<\/article>/i.exec(html);
  if (article !== null) {
    scopes.push(article[0]);
  }
  const newsText = html.indexOf('news-text');
  if (newsText !== -1) {
    scopes.push(html.slice(newsText, newsText + 60_000));
  }
  scopes.push(html);
  for (const scope of scopes) {
    const text = paragraphsOf(scope);
    if (text.length >= 200) {
      return text.slice(0, 12_000);
    }
  }
  return '';
}

@Injectable()
export class NewsAutoService {
  private readonly logger = new Logger(NewsAutoService.name);

  /** Момент старта текущего прогона; null - сейчас никто не генерирует. */
  private runningSince: Date | null = null;
  private lastRun: AutoNewsLastRun | null = null;
  /** Прогон дольше 15 минут считаем зависшим: ретраи ступеней могут занять до ~11. */
  private static readonly RUN_STALE_MS = 15 * 60 * 1000;

  private readonly parser = new Parser({
    timeout: SOURCE_TIMEOUT_MS,
    headers: SOURCE_HEADERS,
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly news: NewsService,
    private readonly covers: NewsCoverService,
  ) {}

  /** Состояние генерации для админки: идёт ли сейчас и чем закончился прошлый прогон. */
  getState(): AutoNewsState {
    const stale =
      this.runningSince !== null &&
      Date.now() - this.runningSince.getTime() > NewsAutoService.RUN_STALE_MS;
    return {
      running: this.runningSince !== null && !stale,
      startedAt: this.runningSince !== null ? this.runningSince.toISOString() : null,
      last: this.lastRun,
    };
  }

  private isRunning(): boolean {
    return this.getState().running;
  }

  /** Полный конвейер: ленты → свежее → без дублей → ИИ выбирает лучшую → полный текст → ИИ пишет → публикация. */
  async run(): Promise<AutoNewsResult> {
    if (this.isRunning()) {
      throw new ConflictException('Генерация уже идёт — дождитесь завершения');
    }
    this.runningSince = new Date();
    try {
      const result = await this.runPipeline();
      this.lastRun = {
        ok: true,
        finishedAt: new Date().toISOString(),
        result: {
          slug: result.news.slug,
          title: result.news.title,
          pickedFrom: result.pickedFrom,
          focus: result.focus,
          reason: result.reason,
          candidates: result.candidates,
        },
      };
      return result;
    } catch (error) {
      this.lastRun = {
        ok: false,
        finishedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : String(error),
      };
      throw error;
    } finally {
      this.runningSince = null;
    }
  }

  private async runPipeline(): Promise<AutoNewsResult> {
    const fetched = await this.fetchFeeds();
    const fresh = pickFresh(fetched);
    if (fresh.length === 0) {
      throw new BadRequestException('В лентах нет свежих материалов (72 часа)');
    }
    const candidates = await this.excludePublished(fresh);
    if (candidates.length === 0) {
      throw new BadRequestException('Все свежие материалы уже публиковались');
    }

    const apiKey = process.env.LLM_API_KEY;
    if (apiKey === undefined || apiKey === '') {
      throw new BadRequestException(
        'LLM_API_KEY не задан в apps/api/.env — получите ключ на api.z.ai и перезапустите API',
      );
    }
    const baseUrl = process.env.LLM_BASE_URL ?? 'https://api.z.ai/api/paas/v4';
    const model = process.env.LLM_MODEL ?? 'glm-4.5-flash';

    // Ступень 1: отбор лучшего материала. Ошибки качества (мусорный JSON,
    // невыразимая ссылка) перебираем новой попыткой, а не сваливаем на админа.
    const { pick, source } = await withAttempts(
      'отбор',
      3,
      async () => {
        const pick = parseLlmJson(
          await this.chat(
            baseUrl,
            apiKey,
            model,
            SELECT_PROMPT,
            JSON.stringify(this.selectPayload(candidates)),
            8000,
            {
              fast: true,
            },
          ),
          'отбор',
        );
        const source = pickCandidate(pick, candidates);
        if (source === undefined) {
          throw new BadRequestException('ИИ не смог указать выбранный материал');
        }
        return { pick, source };
      },
      (message) => this.logger.warn(message),
    );
    const reason = typeof pick.reason === 'string' ? pick.reason.trim().slice(0, 300) : '';
    const focus = typeof pick.focus === 'string' ? pick.focus.trim().slice(0, 80) : '';

    // Ступень 2: полный текст выбранной статьи — и на переработку.
    const articleText = await this.fetchArticleText(source.link);
    if (articleText.length < 200) {
      this.logger.warn(`Полный текст не извлёкся (${source.link}) — пишем по аннотации`);
    }
    const sourceForRewrite =
      articleText.length >= 200 ? articleText : `${source.title}\n\n${source.summary}`;
    // Причина провала прошлой попытки уходит в следующий промпт: модель знает, что чинить.
    let critique = '';
    const { title, excerpt, contentHtml, keywords } = await withAttempts(
      'переработка',
      3,
      () =>
        this.askRewrite(baseUrl, apiKey, model, focus, source, sourceForRewrite, critique).catch(
          (error: unknown) => {
            critique = error instanceof BadRequestException ? error.message : '';
            throw error;
          },
        ),
      (message) => this.logger.warn(message),
    );

    const cover = await this.covers.downloadStockCover(keywords);
    const news = await this.news.create({
      title,
      excerpt,
      content: contentHtml,
      isPublished: true,
      sourceUrl: source.link,
      ...(cover !== null ? { cover } : {}),
    });
    this.logger.log(
      `Автоновость из ${source.link}: ${news.slug}${cover !== null ? ' (с обложкой)' : ''}`,
    );
    return { news, pickedFrom: source.title, focus, reason, candidates: candidates.length };
  }

  /** Одна попытка переработки: LLM + все валидации качества. */
  private async askRewrite(
    baseUrl: string,
    apiKey: string,
    model: string,
    focus: string,
    source: RssCandidate,
    sourceForRewrite: string,
    critique = '',
  ): Promise<{ title: string; excerpt: string; contentHtml: string; keywords: string }> {
    const feedback =
      critique !== ''
        ? `\n\nЗамечание к прошлой попытке: ${critique}. Исправь это: если текст был слишком похож на источник - построй иначе (другой лид, другой порядок, свои формулировки); если заголовок повторял источник - придумай полностью свой.`
        : '';
    const draft = parseLlmJson(
      await this.chat(
        baseUrl,
        apiKey,
        model,
        REWRITE_PROMPT,
        `Фокус-тема (SEO): ${focus !== '' ? focus : source.title}\n\nЗаголовок: ${
          source.title
        }\n\nТекст статьи:\n${sourceForRewrite}${feedback}`,
        4000,
      ),
      'переработка',
    );

    const title = typeof draft.title === 'string' ? draft.title.trim() : '';
    const excerpt = typeof draft.excerpt === 'string' ? draft.excerpt.trim() : '';
    const contentHtml = stripAttribution(
      fixCyrillicTags(typeof draft.contentHtml === 'string' ? draft.contentHtml.trim() : ''),
    );
    if (title.length < 5 || title.length > 200) {
      throw new BadRequestException('ИИ вернул некорректный заголовок');
    }
    if (shingleOverlap(`${source.title} ${sourceForRewrite}`, title, 4) > 0.3) {
      throw new BadRequestException('Заголовок повторяет источник почти дословно');
    }
    if (excerpt.length === 0 || excerpt.length > 300) {
      throw new BadRequestException('ИИ вернул некорректное описание');
    }
    if (contentHtml.length < 200) {
      throw new BadRequestException('ИИ вернул слишком короткий текст');
    }
    const overlap = shingleOverlap(sourceForRewrite, `${title} ${excerpt} ${contentHtml}`);
    if (overlap > 0.2) {
      throw new BadRequestException(
        `Переработка слишком близка к источнику (${Math.round(overlap * 100)}% совпадений)`,
      );
    }
    this.logger.log(`Шинго-проверка: ${Math.round(overlap * 100)}% совпадений с источником`);
    const keywords = sanitizeImageKeywords(draft.imageKeywords);
    return {
      title,
      excerpt,
      contentHtml,
      keywords: keywords !== '' ? keywords : 'car service repair',
    };
  }

  /** Компактный список кандидатов для ступени отбора: 30 самых свежих -
   *  короткий список модель оценивает надёжнее (меньше рассуждений, реже пустой ответ). */
  private selectPayload(candidates: RssCandidate[]): unknown {
    return [...candidates]
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, 30)
      .map((item, index) => ({
        index,
        feed: item.feedTitle,
        title: item.title,
        link: item.link,
        publishedAt: item.publishedAt.toISOString(),
        summary: item.summary,
      }));
  }

  /** Полный текст статьи со страницы источника; пустая строка - не удалось. */
  private async fetchArticleText(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: SOURCE_HEADERS,
        signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
      });
      if (!response.ok) {
        return '';
      }
      return extractArticleText(await response.text());
    } catch {
      return '';
    }
  }

  private async fetchFeeds(): Promise<RssCandidate[]> {
    // Один ретрай на ленту: WAF источников иногда бракует запрос ответом 406 без причины.
    const results = await Promise.allSettled(
      FEEDS.map(async (url) => {
        try {
          return await this.parser.parseURL(url);
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return this.parser.parseURL(url);
        }
      }),
    );
    const items: RssCandidate[] = [];
    for (const [index, result] of results.entries()) {
      if (result.status === 'rejected') {
        this.logger.warn(
          `Лента ${FEEDS[index]} недоступна: ${String(result.reason).slice(0, 120)}`,
        );
        continue;
      }
      for (const item of result.value.items ?? []) {
        const date = item.isoDate ?? item.pubDate;
        // Нет даты -> Invalid Date -> отсеется в pickFresh.
        items.push({
          feedTitle: result.value.title ?? '',
          title: (item.title ?? '').trim(),
          link: (item.link ?? '').trim(),
          summary: (item.contentSnippet ?? item.summary ?? '').trim().slice(0, 500),
          publishedAt: date !== undefined ? new Date(date) : new Date(NaN),
        });
      }
    }
    return items;
  }

  private async excludePublished(items: RssCandidate[]): Promise<RssCandidate[]> {
    const links = items.map((item) => item.link);
    const used = await this.prisma.news.findMany({
      where: { sourceUrl: { in: links } },
      select: { sourceUrl: true },
    });
    const usedSet = new Set(used.map((row) => row.sourceUrl));
    return items.filter((item) => !usedSet.has(item.link));
  }

  /**
   * Один вызов OpenAI-совместимого чата; возвращает сырой текст ответа.
   * fast: отключает «размышления» GLM - для ранжирования они не нужны; параметр
   * понимают только Z.ai-совместимые инференсы, остальным его не отправляем.
   */
  private async chat(
    baseUrl: string,
    apiKey: string,
    model: string,
    system: string,
    user: string,
    maxTokens = 2500,
    options: { fast?: boolean } = {},
  ): Promise<string> {
    const fastThinking =
      options.fast === true && new URL(baseUrl).hostname.includes('z.ai')
        ? { thinking: { type: 'disabled' } }
        : {};
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        max_tokens: maxTokens,
        // Строгий JSON-режим инференса: без markdown-заборов и сломанных строк.
        response_format: { type: 'json_object' },
        ...fastThinking,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    }).catch((error: unknown) => {
      throw new BadRequestException(`ИИ недоступен: ${String(error).slice(0, 120)}`);
    });
    if (!response.ok) {
      const body = (await response.text().catch(() => '')).slice(0, 200);
      throw new BadRequestException(`ИИ ответил ${response.status}: ${body}`);
    }
    const body = (await response.json().catch(() => null)) as {
      choices?: { message?: { content?: string; reasoning_content?: string } }[];
    } | null;
    if (body === null) {
      throw new BadRequestException('ИИ вернул не-JSON ответ — попробуйте ещё раз');
    }
    const message = body.choices?.[0]?.message;
    return message?.content !== '' && message?.content != null
      ? message.content
      : (message?.reasoning_content ?? '');
  }
}
