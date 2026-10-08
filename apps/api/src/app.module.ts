import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { MastersModule } from './masters/masters.module';
import { PersonalTelegramModule } from './personal-telegram';
import { PrismaModule } from './prisma/prisma.module';
import { RequestsModule } from './requests/requests.module';
import { SmsModule } from './sms/sms.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PersonalTelegramModule.register(process.env),
    SmsModule.register(process.env),
    NotificationsModule,
    AuthModule,
    RequestsModule,
    MastersModule,
    BookingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
