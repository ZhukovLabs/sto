/** Общие паттерны публичных форм (заявка «перезвоните» и запись) — должны валидироваться одинаково. */
export const NAME_PATTERN = /^.{2,80}$/s;
export const PHONE_PATTERN = /^[0-9+()\-\s]{9,20}$/;
export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
