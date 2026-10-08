import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { TelegramUpdatesService } from './telegram-updates.service';
import { RequestsReminderService } from './requests-reminder.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RequestsController],
  providers: [RequestsService, TelegramUpdatesService, RequestsReminderService],
})
export class RequestsModule {}
