import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

async function derive(password: string, salt: Buffer): Promise<Buffer> {
  return (await scryptAsync(password.normalize('NFKC'), salt, KEY_LENGTH)) as Buffer;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await derive(password, salt);
  return `scrypt$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, saltPart, hashPart] = stored.split('$');
  if (algorithm !== 'scrypt' || saltPart === undefined || hashPart === undefined) {
    return false;
  }
  const salt = Buffer.from(saltPart, 'base64');
  const expected = Buffer.from(hashPart, 'base64');
  const derived = await derive(password, salt);
  if (derived.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(derived, expected);
}
