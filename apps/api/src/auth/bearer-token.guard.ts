import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { SessionPayload } from './session';
import { AuthService } from './auth.service';

export interface SessionRequest extends Request {
  session?: SessionPayload;
}

@Injectable()
export class BearerTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const header = request.headers.authorization;
    if (header === undefined || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Нужен заголовок Authorization: Bearer <token>');
    }
    const payload = this.authService.verifyToken(header.slice('Bearer '.length));
    if (payload === null) {
      throw new UnauthorizedException('Сессия недействительна или истекла');
    }
    request.session = payload;
    return true;
  }
}
