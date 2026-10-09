import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { BearerTokenGuard } from '../auth/bearer-token.guard';
import { assertCaptchaAllowed, isHoneypotFilled, registerCreation } from '../anti-abuse';
import { verifyCaptchaToken } from '../anti-abuse/yandex-captcha';
import { BOOKING_STATUSES, type BookingStatus } from './booking.settings';
import { BookingService } from './booking.service';
import type { BookingSettingsData } from './booking.settings';

class CreateBookingBody {
  @ApiProperty({ example: 'Иван', minLength: 2, maxLength: 80 })
  name!: string;

  @ApiProperty({ example: '+375 29 123-45-67' })
  phone!: string;

  @ApiProperty({
    required: false,
    description: 'Honeypot-поле: заполнено только ботами',
  })
  company?: string;

  @ApiProperty({ example: 'Toyota Corolla 2015', required: false })
  car?: string;

  @ApiProperty({ example: ['Диагностика подвески', 'Замена масла'], required: false })
  services?: string[];

  @ApiProperty({ example: 'Стучит спереди на кочках', maxLength: 500, required: false })
  comment?: string;

  @ApiProperty({ example: '2026-11-12', description: 'YYYY-MM-DD' })
  date!: string;

  @ApiProperty({ example: '14:00', description: 'HH:MM' })
  time!: string;
}

class UpdateBookingStatusBody {
  @ApiProperty({ enum: [...BOOKING_STATUSES] })
  status!: BookingStatus;
}

class ListBookingsQuery {
  @ApiProperty({ enum: [...BOOKING_STATUSES], required: false })
  status?: BookingStatus;
}

class CreateBookingResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    example: false,
    description: 'true — запись уже существовала (повторный Idempotency-Key)',
  })
  duplicate!: boolean;
}

class BookingResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Иван' })
  name!: string;

  @ApiProperty({ example: '+375 29 123-45-67' })
  phone!: string;

  @ApiProperty({ example: 'Toyota Corolla 2015', nullable: true })
  car!: string | null;

  @ApiProperty({ example: ['Диагностика подвески', 'Замена масла'] })
  services!: string[];

  @ApiProperty({ example: 'Стучит спереди', nullable: true })
  comment!: string | null;

  @ApiProperty({ format: 'date-time', description: 'Дата и время слота' })
  scheduledAt!: Date;

  @ApiProperty({ enum: [...BOOKING_STATUSES] })
  status!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

class SlotView {
  @ApiProperty({ example: '14:00' })
  time!: string;

  @ApiProperty({ example: true })
  available!: boolean;
}

class DateView {
  @ApiProperty({ example: '2026-11-12' })
  date!: string;

  @ApiProperty({ example: false, description: 'true — свободных слотов нет' })
  disabled!: boolean;
}

class CountUnconfirmedResponse {
  @ApiProperty({ example: 2 })
  count!: number;
}

class DayOverviewSlot {
  @ApiProperty({ example: '14:00' })
  time!: string;

  @ApiProperty({ enum: ['free', 'booked', 'blocked'] })
  status!: string;

  @ApiProperty({ example: false, description: 'true — слот уже прошёл' })
  past!: boolean;

  @ApiProperty({ example: ['Иван'], description: 'Имена клиентов с активной записью на слот' })
  bookingNames!: string[];
}

class DayOverviewResponse {
  @ApiProperty({ example: '2026-11-12' })
  date!: string;

  @ApiProperty({ example: true, description: 'false — день закрыт (выходной)' })
  enabled!: boolean;

  @ApiProperty({ example: '09:00', required: false })
  from?: string;

  @ApiProperty({ example: '20:00', required: false })
  to?: string;

  @ApiProperty({ type: [DayOverviewSlot] })
  slots!: DayOverviewSlot[];
}

class DayOverviewQuery {
  @ApiProperty({ example: '2026-11-12', description: 'YYYY-MM-DD' })
  date!: string;
}

class UpdateStatusResponse {
  @ApiProperty({ enum: [...BOOKING_STATUSES] })
  status!: BookingStatus;
}

@ApiTags('bookings')
@Controller()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('bookings/dates')
  @ApiOperation({ summary: 'Даты горизонта записи с признаком занятости (публичный)' })
  @ApiResponse({ status: 200, type: [DateView] })
  async dates(): Promise<DateView[]> {
    return this.bookingService.availableDates();
  }

  @Get('bookings/slots')
  @ApiOperation({ summary: 'Слоты дня со свободностью (публичный)' })
  @ApiResponse({ status: 200, type: [SlotView] })
  async slots(@Query('date') date: string): Promise<SlotView[]> {
    return this.bookingService.slots(date);
  }

  @Post('bookings')
  @HttpCode(201)
  @ApiOperation({ summary: 'Создать запись «Сам запишусь» (публичный, идемпотентен)' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Ключ идемпотентности (8–64 символа)',
  })
  @ApiHeader({
    name: 'x-captcha-token',
    required: false,
    description: 'Токен Яндекс SmartCaptcha — нужен при повторных отправках',
  })
  @ApiResponse({ status: 201, type: CreateBookingResponse })
  @ApiResponse({ status: 409, description: 'Слот занят или время прошло' })
  @ApiResponse({ status: 428, description: 'Требуется прохождение капчи' })
  @ApiResponse({ status: 429, description: 'Слишком много попыток с одного адреса' })
  async create(
    @Body() body: CreateBookingBody,
    @Req() request: Request,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-captcha-token') captchaToken?: string,
  ): Promise<CreateBookingResponse> {
    const ip = request.ip ?? 'unknown';
    if (isHoneypotFilled(body.company)) {
      // Бот заполнил невидимое поле — молча имитируем успех, ничего не создавая.
      return { id: randomUUID(), duplicate: false };
    }
    const captchaPassed = captchaToken ? await verifyCaptchaToken(captchaToken, ip) : false;
    assertCaptchaAllowed(ip, captchaPassed);
    const clientKey = `booking|${ip}`;
    const result = await this.bookingService.create(body, clientKey, idempotencyKey);
    if (!result.duplicate) {
      registerCreation(ip);
    }
    return result;
  }

  @Get('bookings')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список записей (по убыванию даты создания)' })
  async list(@Query() query: ListBookingsQuery): Promise<BookingResponse[]> {
    return this.bookingService.list(query.status);
  }

  @Get('bookings/day-overview')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обзор дня для настройки блокировок: слоты с занятостью' })
  @ApiResponse({ status: 200, type: DayOverviewResponse })
  async dayOverview(@Query() query: DayOverviewQuery): Promise<DayOverviewResponse> {
    return this.bookingService.dayOverview(query.date);
  }

  @Get('bookings/count-unconfirmed')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Количество записей, ждущих подтверждения' })
  async countUnconfirmed(): Promise<CountUnconfirmedResponse> {
    const count = await this.bookingService.countUnconfirmed();
    return { count };
  }

  @Patch('bookings/:id/status')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Изменить статус записи и синхронизировать Telegram' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateBookingStatusBody,
  ): Promise<UpdateStatusResponse> {
    return this.bookingService.updateStatus(id, body.status);
  }

  @Get('booking-settings')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Настройки записи' })
  async getSettings(): Promise<BookingSettingsData> {
    return this.bookingService.getSettings();
  }

  @Put('booking-settings')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить настройки записи (частичное)' })
  async updateSettings(@Body() body: Record<string, unknown>): Promise<BookingSettingsData> {
    return this.bookingService.updateSettings(body);
  }
}
