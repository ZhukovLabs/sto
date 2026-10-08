import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_SECRET } from './auth.constants';
import { verifyPassword } from './password';
import { isBlocked, registerFailure, reset } from './rate-limiter';
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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_SECRET) private readonly authSecret: string,
  ) {}

  async login(email: string, password: string, clientKey: string): Promise<LoginResult> {
    if (isBlocked(clientKey)) {
      throw new UnauthorizedException('Слишком много попыток входа. Повторите через 15 минут');
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    const passwordOk = user !== null && (await verifyPassword(password, user.passwordHash));
    if (user === null || !passwordOk) {
      registerFailure(clientKey);
      throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
    }
    reset(clientKey);
    return { ...this.issueToken(user.id), user };
  }

  verifyToken(token: string): SessionPayload | null {
    return verifySessionToken(token, this.authSecret);
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
