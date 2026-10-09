import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AUTH_SECRET, loadAuthSecret } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BearerTokenGuard } from './bearer-token.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [{ provide: AUTH_SECRET, useFactory: loadAuthSecret }, AuthService, BearerTokenGuard],
  exports: [AuthService, BearerTokenGuard],
})
export class AuthModule {}
