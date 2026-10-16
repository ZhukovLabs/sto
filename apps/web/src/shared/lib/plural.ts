/** Русская плюрализация: [один, несколько, много] — 1 вопрос, 3 вопроса, 5 вопросов. */
export function pluralRu(count: number, forms: readonly [string, string, string]): string {
  const last = count % 10;
  const lastTwo = count % 100;
  if (last === 1 && lastTwo !== 11) return forms[0];
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return forms[1];
  return forms[2];
}
