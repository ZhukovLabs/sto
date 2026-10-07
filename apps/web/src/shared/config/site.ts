export const site = {
  name: 'СТО «ПроМакс»',
  slogan: 'Автосервис в Гомеле',
  city: 'Гомель',
  address: 'ул. Примерная, 1 (ориентир уточняйте по телефону)',
  hours: {
    label: 'Пн–Сб 9:00–20:00',
    short: 'Пн–Сб 9–20',
    note: 'Вс — по записи',
  },
  phones: [
    { label: 'МТС', value: '+375290000000', pretty: '+375 29 000-00-00' },
    { label: 'A1', value: '+375250000000', pretty: '+375 25 000-00-00' },
  ],
  telegram: '@promaks_sto',
  viber: '+375290000000',
  unp: '000000000',
} as const;

export type Site = typeof site;
