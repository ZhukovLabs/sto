import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { BearerTokenGuard } from '../auth/bearer-token.guard';
import { SiteSettingsService } from './site-settings.service';

export class UpdateSiteSettingsDto {
  @ApiProperty({
    description: 'Телефон на сайте',
    required: false,
    example: '+375 29 000-00-00',
  })
  phone?: string;

  @ApiProperty({
    description: 'Адрес (пустая строка — сбросить)',
    required: false,
    example: 'Гомель, ул. Интернациональная 5',
  })
  address?: string;

  @ApiProperty({
    description: 'УНП (9 цифр, пустая строка — сбросить)',
    required: false,
    example: '390000000',
  })
  unp?: string;

  @ApiProperty({
    description: 'Telegram-аккаунт (пустая строка — сбросить)',
    required: false,
    example: '@promaks_sto',
  })
  telegram?: string;

  @ApiProperty({
    description: 'Телефон Viber (пустая строка — сбросить)',
    required: false,
    example: '+375 29 000-00-00',
  })
  viber?: string;

  @ApiProperty({
    description: 'Широта (пустая строка — сбросить)',
    required: false,
    example: 52.4345,
  })
  lat?: number | string;

  @ApiProperty({
    description: 'Долгота (пустая строка — сбросить)',
    required: false,
    example: 30.9754,
  })
  lon?: number | string;
}

export class SiteSettingsResponse {
  /** E.164 (+375…) либо null — не задан, web показывает фолбэк. */
  @ApiProperty({ example: '+375290000000', nullable: true })
  phone!: string | null;

  /** Адрес либо null — не задан, web показывает фолбэк. */
  @ApiProperty({ example: 'Гомель, ул. Интернациональная 5', nullable: true })
  address!: string | null;

  /** УНП либо null — не задан, web показывает фолбэк. */
  @ApiProperty({ example: '390000000', nullable: true })
  unp!: string | null;

  /** Telegram вида @username либо null — не задан, web показывает фолбэк. */
  @ApiProperty({ example: '@promaks_sto', nullable: true })
  telegram!: string | null;

  /** Viber в E.164 либо null — не задан, web показывает фолбэк. */
  @ApiProperty({ example: '+375290000000', nullable: true })
  viber!: string | null;

  /** Координаты точки на карте; задаются парой, null — не заданы. */
  @ApiProperty({ example: 52.4345, nullable: true })
  lat!: number | null;

  @ApiProperty({ example: 30.9754, nullable: true })
  lon!: number | null;

  /** Часы работы из расписания записи (медианы начала/окончания); null — все дни выключены. */
  @ApiProperty({
    example: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'], from: '09:00', to: '20:00' },
    nullable: true,
  })
  hours!: { days: string[]; from: string; to: string } | null;

  /** false — онлайн-запись закрыта, сайт показывает «позвоните нам». */
  @ApiProperty({ example: true })
  bookingOnline!: boolean;
}

@ApiTags('site-settings')
@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly settings: SiteSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Публичные настройки сайта: телефон, адрес, часы работы' })
  async get(): Promise<SiteSettingsResponse> {
    return this.settings.get();
  }

  @Patch()
  @ApiBearerAuth('bearer')
  @UseGuards(BearerTokenGuard)
  @ApiOperation({ summary: 'Обновить телефон, адрес, УНП и/или координаты на сайте' })
  @ApiBadRequestResponse({ description: 'Некорректные значения' })
  async update(@Body() body: UpdateSiteSettingsDto): Promise<{ ok: true }> {
    await this.settings.update({
      phone: body.phone,
      address: body.address,
      unp: body.unp,
      telegram: body.telegram,
      viber: body.viber,
      lat: body.lat,
      lon: body.lon,
    });
    return { ok: true };
  }
}
