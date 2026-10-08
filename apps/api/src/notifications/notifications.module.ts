import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [NotificationService],
  controllers: [NotificationsController],
  exports: [NotificationService],
})
export class NotificationsModule {}
