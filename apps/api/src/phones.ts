const BELARUS_MOBILE_PATTERN = /^375(25|29|33|44)\d{7}$/;

/**
 * Приводит номер к формату 375XXXXXXXXX и проверяет, что это
 * белорусский мобильный (life/A1/MTS). Возвращает null для прочих номеров.
 */
export function normalizeBelarusPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  return BELARUS_MOBILE_PATTERN.test(digits) ? digits : null;
}
