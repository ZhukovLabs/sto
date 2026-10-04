import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Статус сервиса' })
  status: string;

  @ApiProperty({ example: 123.45, description: 'Uptime процесса в секундах' })
  uptime: number;
}
