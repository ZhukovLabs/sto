import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MastersController } from './masters.controller';
import { MastersService } from './masters.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MastersController],
  providers: [MastersService],
})
export class MastersModule {}
