import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { MastersModule } from './masters/masters.module';
import { PersonalTelegramModule } from './personal-telegram';
import { PrismaModule } from './prisma/prisma.module';
import { RequestsModule } from './requests/requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PersonalTelegramModule.register(process.env),
    AuthModule,
    RequestsModule,
    MastersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
