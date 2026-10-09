import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { BearerTokenGuard } from '../auth/bearer-token.guard';
import { NotificationService } from './notifications.service';
import type { PaidBudgetSnapshot } from './paid-budget';
import type {
  Channel,
  ChannelsPriceView,
  NotificationSettingsView,
  SmsBalanceView,
} from './notifications';

export class NotificationSettingsBody implements NotificationSettingsView {
  @ApiProperty({
    example: ['telegram', 'viber', 'sms'],
    description: 'Каналы подтверждений в порядке попытки доставки',
  })
  channelOrder!: Channel[];
}

@ApiTags('notifications')
@Controller()
export class NotificationsController {
  constructor(private readonly notifications: NotificationService) {}

  @Get('notifications/settings')
  @UseGuards(BearerTokenGuard)
  @ApiOperation({ summary: 'Настройки каналов подтверждений' })
  async getSettings(): Promise<NotificationSettingsView> {
    return this.notifications.getSettings();
  }

  @Put('notifications/settings')
  @UseGuards(BearerTokenGuard)
  @ApiOperation({ summary: 'Обновить порядок каналов подтверждений' })
  async updateSettings(@Body() body: NotificationSettingsBody): Promise<NotificationSettingsView> {
    return this.notifications.updateSettings(body.channelOrder);
  }

  @Get('notifications/balance')
  @UseGuards(BearerTokenGuard)
  @ApiOperation({ summary: 'Баланс SMS-шлюза' })
  async getBalance(): Promise<SmsBalanceView> {
    return this.notifications.getSmsBalance();
  }

  @Get('notifications/budget')
  @UseGuards(BearerTokenGuard)
  @ApiOperation({ summary: 'Дневной бюджет платных каналов (Viber + SMS)' })
  async getBudget(): Promise<PaidBudgetSnapshot> {
    return this.notifications.getBudget();
  }

  @Get('notifications/channels-price')
  @UseGuards(BearerTokenGuard)
  @ApiOperation({ summary: 'Цена одного подтверждения по каналам, без отправки' })
  async getChannelsPrice(@Query('phone') phone?: string): Promise<ChannelsPriceView> {
    return this.notifications.getChannelsPrice(phone ?? '375256156607');
  }
}
