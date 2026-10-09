const BELARUS_MOBILE_PATTERN = /^375(25|29|33|44)\d{7}$/;

/** Строгая проверка: белорусский мобильный (life/A1/МТС), как на беке. */
export function isBelarusMobilePhone(phone: string): boolean {
  return BELARUS_MOBILE_PATTERN.test(phone.replace(/\D/g, ''));
}

/** Начал вводить белорусский номер (+375…), но ещё не дописал. */
export function looksLikeBelarusPhone(phone: string): boolean {
  return phone.replace(/\D/g, '').startsWith('375');
}
