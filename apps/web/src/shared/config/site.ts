export const site = {
  /** Канонический origin: нужен для OG-тегов и canonical (переменная окружения прод-домена). */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  name: 'СТО «ПроМакс»',
  legalName: 'СТО «ПроМакс»',
  slogan: 'Автосервис в Гомеле',
  city: 'Гомель',
  address: 'Гомель, ул. Телегина, 7',
  hours: {
    label: 'Пн–Сб 9:00–20:00',
    short: 'Пн–Сб 9–20',
    note: 'Вс — по записи',
  },
  /** Фолбэк телефона, пока не задан в админке (entities/site → GET /site-settings). */
  phones: [{ label: 'МТС', value: '+375256156607', pretty: '+375 25 615-66-07' }],
  telegram: '@promaks_sto',
  viber: '+375256156607',
  /** УНП появится, когда его впишут в админке (Настройки → Сайт); пустой - не рендерим. */
  unp: '',
  map: {
    lat: 52.4345,
    lon: 30.9754,
    zoom: 14,
  },
} as const;

export type Site = typeof site;
