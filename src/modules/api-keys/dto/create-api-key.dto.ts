import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'My App' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 100, required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number;

  @ApiProperty({ example: 60, required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  windowSec?: number;
}
