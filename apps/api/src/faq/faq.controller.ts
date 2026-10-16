import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { BearerTokenGuard } from '../auth/bearer-token.guard';
import type { FaqItemView } from './faq.service';
import { FaqService } from './faq.service';

export class FaqItemBody {
  @ApiProperty({ example: 'Нужно ли записываться заранее?' })
  question!: string;

  @ApiProperty({ example: 'Да, так мы не заставим машину ждать. Запишитесь онлайн или позвоните.' })
  answer!: string;
}

export class UpdateFaqItemBody {
  @ApiProperty({ required: false, example: 'Нужно ли записываться заранее?' })
  question?: string;

  @ApiProperty({
    required: false,
    example: 'Да, так мы не заставим машину ждать. Запишитесь онлайн или позвоните.',
  })
  answer?: string;

  @ApiProperty({ required: false })
  isActive?: boolean;
}

export class FaqOrderBody {
  @ApiProperty({ type: [String] })
  ids!: string[];
}

class FaqItemViewDto implements FaqItemView {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Нужно ли записываться заранее?' })
  question!: string;

  @ApiProperty({ example: 'Да, так мы не заставим машину ждать.' })
  answer!: string;

  @ApiProperty({ example: 0 })
  position!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

@ApiTags('faq')
@Controller('faq')
export class FaqController {
  constructor(private readonly faq: FaqService) {}

  @Get()
  @ApiOkResponse({ type: [FaqItemViewDto] })
  @ApiOperation({ summary: 'FAQ для сайта (только активные)' })
  async listPublic(): Promise<FaqItemView[]> {
    return this.faq.listPublic();
  }

  @Get('all')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: [FaqItemViewDto] })
  @ApiOperation({ summary: 'Полный FAQ для админки' })
  async listAll(): Promise<FaqItemView[]> {
    return this.faq.listAll();
  }

  @Post()
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: [FaqItemViewDto] })
  @ApiOperation({ summary: 'Добавить вопрос' })
  async create(@Body() body: FaqItemBody): Promise<FaqItemView> {
    return this.faq.create(body);
  }

  @Put('order')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Порядок вопросов' })
  async reorder(@Body() body: FaqOrderBody): Promise<void> {
    await this.faq.reorder(body);
  }

  @Patch(':id')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: [FaqItemViewDto] })
  @ApiOperation({ summary: 'Изменить вопрос' })
  async update(@Param('id') id: string, @Body() body: UpdateFaqItemBody): Promise<FaqItemView> {
    return this.faq.update(id, body);
  }

  @Delete(':id')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить вопрос' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.faq.remove(id);
  }
}
