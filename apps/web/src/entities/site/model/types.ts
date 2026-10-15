export interface SitePhone {
  /** E.164, например +375290000000 — для href="tel:". */
  value: string;
  /** Человекочитаемый, например +375 29 000-00-00. */
  pretty: string;
}

/** Сырые часы из api (медианы начала/окончания по расписанию записи). */
export interface SiteHoursData {
  days: string[];
  from: string;
  to: string;
}

/** Готовые подписи часов для всех мест сайта. */
export interface SiteHours {
  /** «Пн–Сб 9:00–20:00» */
  label: string;
  /** «Пн–Сб 9–20» */
  short: string;
  /** «Вс — по записи»; пустая строка, если выключенных дней нет */
  note: string;
}

export interface SiteAddress {
  /** Готовая строка: из админки либо фолбэк «адрес появится перед открытием». */
  value: string;
  /** true — адрес задан в админке (можно строить маршрут). */
  isSet: boolean;
}

export interface SiteCoords {
  lat: number;
  lon: number;
}

export interface SiteInfo {
  phone: SitePhone;
  hours: SiteHours;
  address: SiteAddress;
  /** УНП из админки; если не задан — статический из конфига. */
  unp: string;
  /** Telegram-аккаунт вида @username; если не задан — статический из конфига. */
  telegram: string;
  /** Телефон Viber; если не задан — статический из конфига. */
  viber: SitePhone;
  /** false — онлайн-запись закрыта из админки (диалог показывает «позвоните нам»). */
  bookingOnline: boolean;
  /** Точные координаты из админки; null — не заданы (карты используют статические). */
  coords: SiteCoords | null;
}
