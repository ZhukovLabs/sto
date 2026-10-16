import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsAutoService } from './news-auto.service';
import { NewsCoverService } from './news-cover.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NewsController],
  providers: [NewsService, NewsAutoService, NewsCoverService],
})
export class NewsModule {}
