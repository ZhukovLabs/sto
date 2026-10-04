import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { HealthResponseDto } from './health.dto';

@Controller()
export class AppController {
  @Get('health')
  @ApiResponse({ type: HealthResponseDto })
  getHealth(): HealthResponseDto {
    return { status: 'ok', uptime: process.uptime() };
  }
}
