import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({ example: 'admin@promaks.by' })
  email: string;

  @ApiProperty({ example: 'пароль' })
  password: string;
}

export class UserResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'admin@promaks.by' })
  email: string;

  @ApiProperty({ example: 'Максим' })
  name: string;

  @ApiProperty({ example: 'admin' })
  role: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Токен сессии для заголовка Authorization: Bearer' })
  token: string;

  @ApiProperty({ description: 'Токен истекает в Unix-времени, секунды' })
  expiresAt: number;

  user: UserResponseDto;
}

export class RefreshResponseDto {
  @ApiProperty({ description: 'Новый токен сессии' })
  token: string;

  @ApiProperty({ description: 'Новый срок истечения, Unix-время в секундах' })
  expiresAt: number;
}
