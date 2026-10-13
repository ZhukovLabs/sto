import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { FaqModule } from './faq/faq.module';
import { MastersModule } from './masters/masters.module';
import { NewsModule } from './news/news.module';
import { PersonalTelegramModule } from './personal-telegram';
import { PrismaModule } from './prisma/prisma.module';
import { RequestsModule } from './requests/requests.module';
import { SmsModule } from './sms/sms.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ServicesModule } from './services/services.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { TeamModule } from './team/team.module';
import { UploadsModule } from './uploads/uploads.module';

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
    ServicesModule,
    TeamModule,
    SiteSettingsModule,
    FaqModule,
    NewsModule,
    UploadsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
