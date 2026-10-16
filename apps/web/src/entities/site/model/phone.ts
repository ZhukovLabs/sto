/** +375291234567 → +375 29 123-45-67; прочие номера возвращаются как есть. */
export function prettyPhoneValue(value: string): string {
  const match = value.replace(/\D/g, '').match(/^(375)(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return match === null ? value : `+375 ${match[2]} ${match[3]}-${match[4]}-${match[5]}`;
}
