import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { BearerTokenGuard } from '../auth/bearer-token.guard';
import { REQUEST_STATUSES, type RequestStatus } from './telegram';
import { RequestsService } from './requests.service';

class CreateRequestBody {
  @ApiProperty({ example: 'Иван', minLength: 2, maxLength: 80 })
  name!: string;

  @ApiProperty({ example: '+375 29 123-45-67' })
  phone!: string;
}

class UpdateRequestStatusBody {
  @ApiProperty({ enum: [...REQUEST_STATUSES] })
  status!: RequestStatus;
}

class ListRequestsQuery {
  @ApiProperty({ enum: [...REQUEST_STATUSES], required: false })
  status?: RequestStatus;
}

class RequestResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Иван' })
  name!: string;

  @ApiProperty({ example: '+375 29 123-45-67' })
  phone!: string;

  @ApiProperty({ enum: [...REQUEST_STATUSES] })
  status!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

class CreateRequestResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    example: false,
    description: 'true — заявка уже существовала (повторный Idempotency-Key)',
  })
  duplicate!: boolean;
}

class CountNewResponse {
  @ApiProperty({ example: 3 })
  count!: number;
}

class UpdateStatusResponse {
  @ApiProperty({ enum: [...REQUEST_STATUSES] })
  status!: RequestStatus;
}

@ApiTags('requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Создать заявку «Перезвоните мне» (публичный, идемпотентен с Idempotency-Key)',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Ключ идемпотентности (8–64 символа)',
  })
  @ApiResponse({ status: 201, type: CreateRequestResponse })
  @ApiResponse({ status: 429, description: 'Слишком много заявок с одного адреса' })
  async create(
    @Body() body: CreateRequestBody,
    @Req() request: Request,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<CreateRequestResponse> {
    const clientKey = `request|${request.ip ?? 'unknown'}`;
    return this.requestsService.create(body.name, body.phone, clientKey, idempotencyKey);
  }

  @Get()
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список заявок (по убыванию даты)' })
  async list(@Query() query: ListRequestsQuery): Promise<RequestResponse[]> {
    return this.requestsService.list(query.status);
  }

  @Get('count-new')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Количество новых заявок' })
  async countNew(): Promise<CountNewResponse> {
    const count = await this.requestsService.countNew();
    return { count };
  }

  @Patch(':id/status')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Изменить статус заявки и синхронизировать сообщение в Telegram' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateRequestStatusBody,
  ): Promise<UpdateStatusResponse> {
    return this.requestsService.updateStatus(id, body.status);
  }
}
