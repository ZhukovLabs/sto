import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_SECRET } from './auth.constants';
import { hashPassword, verifyPassword } from './password';
import { loginRateLimiter } from './rate-limiter';
import {
  createSessionToken,
  SESSION_TTL_SECONDS,
  verifySessionToken,
  type SessionPayload,
} from './session';

export interface AuthedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResult {
  token: string;
  expiresAt: number;
  user: AuthedUser;
}

const GENERIC_LOGIN_ERROR = 'Неверный email или пароль';

/** Кэш фиктивного хэша: ответ на вход с несуществующим email
 * выполняет тот же scrypt, что и с существующим, — время ответа
 * не раскрывает перебором, какие адреса зарегистрированы. */
let dummyHashPromise: Promise<string> | null = null;
function dummyPasswordHash(): Promise<string> {
  dummyHashPromise ??= hashPassword(randomUUID());
  return dummyHashPromise;
}

@Injectable()
export class AuthService {
  /** Отозванные сессии: ключ `${sub}:${iat}` -> exp (сек). Память живёт до
   * перезапуска процесса — как и in-memory рейт-лимитеры. */
  private readonly revokedSessions = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_SECRET) private readonly authSecret: string,
  ) {}

  async login(email: string, password: string, clientKey: string): Promise<LoginResult> {
    if (loginRateLimiter.isBlocked(clientKey)) {
      throw new UnauthorizedException('Слишком много попыток входа. Повторите через 15 минут');
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    let passwordOk = false;
    if (user !== null) {
      passwordOk = await verifyPassword(password, user.passwordHash);
    } else {
      await verifyPassword(password, await dummyPasswordHash());
    }
    if (user === null || !passwordOk) {
      loginRateLimiter.registerFailure(clientKey);
      throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
    }
    loginRateLimiter.reset(clientKey);
    return { ...this.issueToken(user.id), user };
  }

  verifyToken(token: string): SessionPayload | null {
    const payload = verifySessionToken(token, this.authSecret);
    if (payload === null) {
      return null;
    }
    this.pruneRevokedSessions(Date.now());
    if (this.revokedSessions.has(this.sessionKey(payload))) {
      return null;
    }
    return payload;
  }

  /** Отзывает сессию (logout): выпущенные токены этой сессии перестают действовать. */
  revokeSession(payload: SessionPayload): void {
    this.pruneRevokedSessions(Date.now());
    this.revokedSessions.set(this.sessionKey(payload), payload.exp);
  }

  /** jti делает ключ уникальным даже при двух логинах в одну секунду. */
  private sessionKey(payload: SessionPayload): string {
    return payload.jti ?? `${payload.sub}:${payload.iat}`;
  }

  /** Выбрасывает истёкшие записи, чтобы Map не рос бесконечно. */
  private pruneRevokedSessions(now: number): void {
    for (const [key, expiresAt] of this.revokedSessions) {
      if (expiresAt * 1000 <= now) {
        this.revokedSessions.delete(key);
      }
    }
  }

  async getUser(userId: string): Promise<AuthedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user === null) {
      return null;
    }
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  /** Продлевает сессию: новый токен с той же длительностью. */
  refresh(userId: string): { token: string; expiresAt: number } {
    return this.issueToken(userId);
  }

  private issueToken(userId: string): { token: string; expiresAt: number } {
    const token = createSessionToken(userId, this.authSecret);
    return { token, expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  }
}
