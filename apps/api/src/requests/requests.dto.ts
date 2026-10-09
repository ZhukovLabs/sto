import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestDto {
  @ApiProperty({ example: 'Иван' })
  name: string;

  @ApiProperty({ example: '+375 29 123-45-67' })
  phone: string;
}

export class CreateRequestResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Созданная заявка' })
  id: string;
}

export class RequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Иван' })
  name: string;

  @ApiProperty({ example: '+375 29 123-45-67' })
  phone: string;

  @ApiProperty({ enum: ['new', 'done'] })
  status: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class UpdateRequestStatusDto {
  @ApiProperty({ enum: ['new', 'done'] })
  status: 'new' | 'done';
}
