import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { BearerTokenGuard } from '../auth/bearer-token.guard';
import type { ServiceGroupView, ServiceView, ShowcaseSlotView } from './services.service';
import { ServicesService, SHOWCASE_SIZE } from './services.service';

export class CreateServiceGroupBody {
  @ApiProperty({ example: 'Шиномонтаж' })
  title!: string;

  @ApiProperty({
    required: false,
    enum: ['scan', 'wrench', 'disc', 'cog', 'gauge', 'circle', 'snowflake'],
    nullable: true,
  })
  icon?: string | null;

  @ApiProperty({ required: false, nullable: true, example: '/uploads/tyres.webp' })
  photo?: string | null;
}

export class UpdateServiceGroupBody extends CreateServiceGroupBody {
  @ApiProperty({ required: false })
  isActive?: boolean;
}

export class CreateServiceBody {
  @ApiProperty({ example: 'Замена масла' })
  title!: string;

  @ApiProperty({ required: false, example: 'Синтетика' })
  description?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    maxLength: 2000,
    example: 'В стоимость входит масло, фильтр и работа мастера…',
  })
  details?: string | null;

  @ApiProperty({ example: 60 })
  priceFrom!: number;

  @ApiProperty({ required: false, nullable: true, example: 120 })
  priceTo?: number | null;

  @ApiProperty({ required: false, enum: ['wheel', 'pcs', 'season'], nullable: true })
  unit?: string | null;

  @ApiProperty({ required: false, nullable: true, example: '/uploads/oil.webp' })
  photo?: string | null;

  @ApiProperty({ example: 'shinomontazh' })
  groupId!: string;
}

export class UpdateServiceBody extends CreateServiceBody {
  @ApiProperty({ required: false })
  isActive?: boolean;
}

export class OrderBody {
  @ApiProperty({ type: [String] })
  ids!: string[];
}

export class ServicesOrderBody extends OrderBody {
  @ApiProperty({ example: 'shinomontazh' })
  groupId!: string;
}

export class ShowcaseBody {
  @ApiProperty({ type: [String], minItems: SHOWCASE_SIZE, maxItems: SHOWCASE_SIZE })
  serviceIds!: string[];
}

class ServiceViewDto {
  @ApiProperty({ example: 'zamena-masla' })
  id!: string;

  @ApiProperty({ example: 'shinomontazh' })
  groupId!: string;

  @ApiProperty({ example: 'Замена масла' })
  title!: string;

  @ApiProperty({ example: 'Синтетика' })
  description!: string;

  @ApiProperty({ nullable: true, maxLength: 2000 })
  details!: string | null;

  @ApiProperty({ example: 60 })
  priceFrom!: number;

  @ApiProperty({ nullable: true, example: 120 })
  priceTo!: number | null;

  @ApiProperty({ nullable: true, enum: ['wheel', 'pcs', 'season'] })
  unit!: string | null;

  @ApiProperty({ nullable: true, example: '/uploads/oil.webp' })
  photo!: string | null;

  @ApiProperty({ example: 0 })
  position!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

class ServiceGroupViewDto {
  @ApiProperty({ example: 'shinomontazh' })
  id!: string;

  @ApiProperty({ example: 'Шиномонтаж' })
  title!: string;

  @ApiProperty({
    nullable: true,
    enum: ['scan', 'wrench', 'disc', 'cog', 'gauge', 'circle', 'snowflake'],
  })
  icon!: string | null;

  @ApiProperty({ nullable: true, example: '/uploads/tyres.webp' })
  photo!: string | null;

  @ApiProperty({ example: 0 })
  position!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ type: [ServiceViewDto] })
  services!: ServiceView[];
}

class ShowcaseSlotViewDto {
  @ApiProperty({ example: 'zamena-masla' })
  serviceId!: string;

  @ApiProperty({ example: 0 })
  position!: number;
}

class CatalogResponseDto {
  @ApiProperty({ type: [ServiceGroupViewDto] })
  groups!: ServiceGroupView[];

  @ApiProperty({ type: [ShowcaseSlotViewDto] })
  showcase!: ShowcaseSlotView[];
}

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get('catalog')
  @ApiOkResponse({ type: CatalogResponseDto })
  @ApiOperation({ summary: 'Публичный каталог (только активные)' })
  async catalog(): Promise<CatalogResponseDto> {
    return this.services.catalog(true);
  }

  @Get()
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: CatalogResponseDto })
  @ApiOperation({ summary: 'Полный каталог для админки' })
  async adminCatalog(): Promise<CatalogResponseDto> {
    return this.services.catalog(false);
  }

  @Post('groups')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ServiceGroupViewDto })
  @ApiOperation({ summary: 'Создать группу' })
  async createGroup(@Body() body: CreateServiceGroupBody): Promise<ServiceGroupView> {
    return this.services.createGroup(body as unknown as Record<string, unknown>);
  }

  @Put('groups/order')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Порядок групп' })
  async reorderGroups(@Body() body: OrderBody): Promise<void> {
    await this.services.reorderGroups(body as unknown as Record<string, unknown>);
  }

  @Patch('groups/:id')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ServiceGroupViewDto })
  @ApiOperation({ summary: 'Изменить группу' })
  async updateGroup(
    @Param('id') id: string,
    @Body() body: UpdateServiceGroupBody,
  ): Promise<ServiceGroupView> {
    return this.services.updateGroup(id, body as unknown as Record<string, unknown>);
  }

  @Delete('groups/:id')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить группу с услугами' })
  async deleteGroup(@Param('id') id: string): Promise<void> {
    await this.services.deleteGroup(id);
  }

  @Post()
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ServiceViewDto })
  @ApiOperation({ summary: 'Создать услугу' })
  async createService(@Body() body: CreateServiceBody): Promise<ServiceView> {
    return this.services.createService(body as unknown as Record<string, unknown>);
  }

  @Put('order')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Порядок услуг в группе' })
  async reorderServices(@Body() body: ServicesOrderBody): Promise<void> {
    await this.services.reorderServices(body as unknown as Record<string, unknown>);
  }

  @Patch(':id')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ServiceViewDto })
  @ApiOperation({ summary: 'Изменить услугу' })
  async updateService(
    @Param('id') id: string,
    @Body() body: UpdateServiceBody,
  ): Promise<ServiceView> {
    return this.services.updateService(id, body as unknown as Record<string, unknown>);
  }

  @Delete(':id')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить услугу' })
  async deleteService(@Param('id') id: string): Promise<void> {
    await this.services.deleteService(id);
  }

  @Put('showcase')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: [ShowcaseSlotViewDto] })
  @ApiOperation({ summary: 'Задать витрину (ровно 8)' })
  async updateShowcase(@Body() body: ShowcaseBody): Promise<ShowcaseSlotView[]> {
    return this.services.updateShowcase(body as unknown as Record<string, unknown>);
  }
}
