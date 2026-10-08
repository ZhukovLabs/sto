export const AUTH_SECRET = 'AUTH_SECRET';

export function loadAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret === undefined || secret.length < 32) {
    throw new Error('AUTH_SECRET отсутствует или короче 32 символов');
  }
  return secret;
}
