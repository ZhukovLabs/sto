import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { BearerTokenGuard, type SessionRequest } from './bearer-token.guard';
import { LoginRequestDto, LoginResponseDto, RefreshResponseDto, UserResponseDto } from './auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Вход по email и паролю' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Неверные данные или лимит попыток' })
  async login(@Body() body: LoginRequestDto, @Req() request: Request): Promise<LoginResponseDto> {
    const clientKey = `${body.email.trim().toLowerCase()}|${request.ip ?? 'unknown'}`;
    return this.authService.login(body.email, body.password, clientKey);
  }

  @Get('me')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Текущий пользователь по токену сессии' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async me(@Req() request: SessionRequest): Promise<UserResponseDto> {
    const userId = request.session?.sub;
    if (userId === undefined) {
      throw new Error('Guard не заполнил сессию');
    }
    const user = await this.authService.getUser(userId);
    if (user === null) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    return user;
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Продлить сессию до полной длительности' })
  @ApiResponse({ status: 200, type: RefreshResponseDto })
  async refresh(@Req() request: SessionRequest): Promise<RefreshResponseDto> {
    const userId = request.session?.sub;
    if (userId === undefined) {
      throw new Error('Guard не заполнил сессию');
    }
    return this.authService.refresh(userId);
  }
}
