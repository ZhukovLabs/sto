import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { BearerTokenGuard } from '../auth/bearer-token.guard';
import { MastersService } from './masters.service';

export class CreateMasterDto {
  @ApiProperty({ description: 'Имя мастера', example: 'Максим' })
  name!: string;

  @ApiProperty({ description: 'chat_id из /start у бота', example: '1160368886' })
  telegramChatId!: string;
}

export class UpdateMasterDto {
  @ApiProperty({ description: 'Имя мастера', required: false, example: 'Максим' })
  name?: string;

  @ApiProperty({ description: 'Получать заявки', required: false, example: true })
  isActive?: boolean;
}

export class MasterResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Максим' })
  name!: string;

  @ApiProperty({ example: '1160368886' })
  telegramChatId!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

export class CreateMasterResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

export class UpdateMasterResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

@ApiTags('masters')
@ApiBearerAuth('bearer')
@UseGuards(BearerTokenGuard)
@Controller('masters')
export class MastersController {
  constructor(private readonly masters: MastersService) {}

  @Get()
  @ApiOperation({ summary: 'Список мастеров' })
  async list(): Promise<MasterResponse[]> {
    return this.masters.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Добавить мастера (chat_id — из ответа бота на /start)' })
  @ApiConflictResponse({ description: 'Мастер с таким chat_id уже добавлен' })
  @ApiBadRequestResponse({ description: 'Некорректное имя или chat_id' })
  async create(@Body() body: CreateMasterDto): Promise<CreateMasterResponse> {
    return this.masters.create(body.name, body.telegramChatId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Переименовать или включить/выключить получение заявок' })
  @ApiNotFoundResponse({ description: 'Мастер не найден' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateMasterDto,
  ): Promise<UpdateMasterResponse> {
    return this.masters.update(id, body.name, body.isActive);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить мастера' })
  @ApiNotFoundResponse({ description: 'Мастер не найден' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.masters.remove(id);
  }
}
