/** Таймаут одного запроса к внешним источникам: ленты, страницы статей, картинки. */
export const SOURCE_TIMEOUT_MS = 12_000;

/** Заголовки запросов к источникам: часть хостов режет ботов по User-Agent (ответ 406). */
export const SOURCE_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html, application/rss+xml, application/xml;q=0.9, */*;q=0.8',
};
