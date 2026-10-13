import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { BearerTokenGuard } from '../auth/bearer-token.guard';
import type { NewsCardView, NewsView, PublicNewsView } from './news.service';
import { NewsService } from './news.service';
import { NewsAutoService, type AutoNewsState } from './news-auto.service';

export class NewsBody {
  @ApiProperty({ example: 'Зимняя подготовка: чек-лист' })
  title!: string;

  @ApiProperty({ required: false, example: 'Что проверить до морозов — коротко.' })
  excerpt?: string;

  @ApiProperty({ example: '<h2>Аккумулятор</h2><p>Проверьте напряжение…</p>' })
  content!: string;

  @ApiProperty({ required: false, example: '/uploads/8f0c1a2b-4d3e-4f5a-9b6c-1d2e3f4a5b6c.webp' })
  cover?: string;

  @ApiProperty({ required: false, example: false })
  isPublished?: boolean;

  @ApiProperty({ required: false, example: 'zimnyaya-podgotovka' })
  slug?: string;
}

export class UpdateNewsBody {
  @ApiProperty({ required: false, example: 'Зимняя подготовка: чек-лист' })
  title?: string;

  @ApiProperty({ required: false, example: 'Что проверить до морозов — коротко.' })
  excerpt?: string | null;

  @ApiProperty({ required: false, example: '<h2>Аккумулятор</h2><p>Проверьте напряжение…</p>' })
  content?: string;

  @ApiProperty({ required: false, example: '/uploads/8f0c1a2b-4d3e-4f5a-9b6c-1d2e3f4a5b6c.webp' })
  cover?: string | null;

  @ApiProperty({ required: false, example: false })
  isPublished?: boolean;

  @ApiProperty({ required: false, example: 'zimnyaya-podgotovka' })
  slug?: string;
}

class NewsCardViewDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'zimnyaya-podgotovka' })
  slug!: string;

  @ApiProperty({ example: 'Зимняя подготовка: чек-лист' })
  title!: string;

  @ApiProperty({ nullable: true, example: 'Что проверить до морозов — коротко.' })
  excerpt!: string | null;

  @ApiProperty({ nullable: true, example: '/uploads/cover.webp' })
  cover!: string | null;

  @ApiProperty({ nullable: true, example: '2026-10-13T10:00:00.000Z' })
  publishedAt!: string | null;

  @ApiProperty({ example: '2026-10-13T10:00:00.000Z' })
  updatedAt!: string;
}

class NewsViewDto extends NewsCardViewDto {
  @ApiProperty({ example: '<h2>Аккумулятор</h2><p>Проверьте напряжение…</p>' })
  content!: string;

  @ApiProperty({ example: true })
  isPublished!: boolean;

  @ApiProperty({ example: '2026-10-13T10:00:00.000Z' })
  createdAt!: string;
}

/** Публичная статья: без isPublished/sourceUrl/createdAt. */
class PublicNewsDto extends NewsCardViewDto {
  @ApiProperty({ example: '<h2>Аккумулятор</h2><p>Проверьте напряжение…</p>' })
  content!: string;
}

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(
    private readonly news: NewsService,
    private readonly newsAuto: NewsAutoService,
  ) {}

  @Post('auto')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Собрать автоновость из RSS через ИИ и опубликовать' })
  async autoPublish(): Promise<{
    slug: string;
    title: string;
    pickedFrom: string;
    focus: string;
    reason: string;
    candidates: number;
  }> {
    const result = await this.newsAuto.run();
    return {
      slug: result.news.slug,
      title: result.news.title,
      pickedFrom: result.pickedFrom,
      focus: result.focus,
      reason: result.reason,
      candidates: result.candidates,
    };
  }

  @Get('auto/status')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Состояние автогенерации: идёт ли сейчас и итог прошлого прогона' })
  autoStatus(): AutoNewsState {
    return this.newsAuto.getState();
  }

  @Get()
  @ApiOkResponse({ type: [NewsCardViewDto] })
  @ApiOperation({ summary: 'Опубликованные новости для сайта' })
  async listPublic(): Promise<NewsCardView[]> {
    return this.news.listPublic();
  }

  @Get('all')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: [NewsViewDto] })
  @ApiOperation({ summary: 'Все новости для админки' })
  async listAll(): Promise<NewsView[]> {
    return this.news.listAll();
  }

  @Get('by-slug/:slug')
  @ApiOkResponse({ type: PublicNewsDto })
  @ApiOperation({ summary: 'Опубликованная новость по слагу (без служебных полей)' })
  async getBySlug(@Param('slug') slug: string): Promise<PublicNewsView> {
    return this.news.getPublicBySlug(slug);
  }

  @Post()
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: NewsViewDto })
  @ApiOperation({ summary: 'Создать новость' })
  async create(@Body() body: NewsBody): Promise<NewsView> {
    return this.news.create(body);
  }

  @Patch(':id')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: NewsViewDto })
  @ApiOperation({ summary: 'Изменить новость' })
  async update(@Param('id') id: string, @Body() body: UpdateNewsBody): Promise<NewsView> {
    return this.news.update(id, body);
  }

  @Delete(':id')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить новость' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.news.remove(id);
  }
}
