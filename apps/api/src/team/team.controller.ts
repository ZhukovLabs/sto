import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { BearerTokenGuard } from '../auth/bearer-token.guard';
import type { TeamMemberView } from './team.service';
import { TeamService } from './team.service';

export class CreateTeamMemberBody {
  @ApiProperty({ example: 'Максим' })
  name!: string;

  @ApiProperty({ example: 'Владелец · мастер' })
  role!: string;

  @ApiProperty({ example: 'Принимает машину, считает смету, отвечает за гарантию' })
  spec!: string;

  @ApiProperty({ required: false, nullable: true, example: '/uploads/master.webp' })
  photo?: string | null;

  @ApiProperty({ required: false, nullable: true, example: 'Максим за стойкой приёмки' })
  photoAlt?: string | null;
}

export class UpdateTeamMemberBody {
  @ApiProperty({ required: false, example: 'Максим' })
  name?: string;

  @ApiProperty({ required: false, example: 'Владелец · мастер' })
  role?: string;

  @ApiProperty({
    required: false,
    example: 'Принимает машину, считает смету, отвечает за гарантию',
  })
  spec?: string;

  @ApiProperty({ required: false, nullable: true, example: '/uploads/master.webp' })
  photo?: string | null;

  @ApiProperty({ required: false, nullable: true, example: 'Максим за стойкой приёмки' })
  photoAlt?: string | null;

  @ApiProperty({ required: false })
  isActive?: boolean;
}

export class OrderBody {
  @ApiProperty({ type: [String] })
  ids!: string[];
}

class TeamMemberViewDto implements TeamMemberView {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Максим' })
  name!: string;

  @ApiProperty({ example: 'Владелец · мастер' })
  role!: string;

  @ApiProperty({ example: 'Принимает машину, считает смету, отвечает за гарантию' })
  spec!: string;

  @ApiProperty({ nullable: true, example: '/uploads/master.webp' })
  photo!: string | null;

  @ApiProperty({ nullable: true, example: 'Максим за стойкой приёмки' })
  photoAlt!: string | null;

  @ApiProperty({ example: 0 })
  position!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

@ApiTags('team')
@Controller('team')
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get()
  @ApiOkResponse({ type: [TeamMemberViewDto] })
  @ApiOperation({ summary: 'Состав команды для сайта (только активные)' })
  async listPublic(): Promise<TeamMemberView[]> {
    return this.team.listPublic();
  }

  @Get('all')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: [TeamMemberViewDto] })
  @ApiOperation({ summary: 'Полный состав команды для админки' })
  async listAll(): Promise<TeamMemberView[]> {
    return this.team.listAll();
  }

  @Post()
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: TeamMemberViewDto })
  @ApiOperation({ summary: 'Добавить участника команды' })
  async create(@Body() body: CreateTeamMemberBody): Promise<TeamMemberView> {
    return this.team.create(body as unknown as Record<string, unknown>);
  }

  @Put('order')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Порядок участников' })
  async reorder(@Body() body: OrderBody): Promise<void> {
    await this.team.reorder(body as unknown as Record<string, unknown>);
  }

  @Patch(':id')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: TeamMemberViewDto })
  @ApiOperation({ summary: 'Изменить участника' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateTeamMemberBody,
  ): Promise<TeamMemberView> {
    return this.team.update(id, body as unknown as Record<string, unknown>);
  }

  @Delete(':id')
  @UseGuards(BearerTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить участника' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.team.remove(id);
  }
}
