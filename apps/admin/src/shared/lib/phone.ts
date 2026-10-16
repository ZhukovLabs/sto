/** +375291234567 (или 375291234567) → +375 29 123-45-67; прочее возвращается как есть. */
export function prettyPhone(phone: string): string {
  const match = phone.replace(/\D/g, '').match(/^(375)(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return match === null ? phone : `+375 ${match[2]} ${match[3]}-${match[4]}-${match[5]}`;
}
