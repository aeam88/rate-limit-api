import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExchangeOAuthCodeDto {
  @ApiProperty({ example: '7f8c2a1e-...' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
