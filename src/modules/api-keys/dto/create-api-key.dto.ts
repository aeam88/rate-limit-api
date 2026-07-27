import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'My App' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 100, required: false, description: 'Max requests per window' })
  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number;

  @ApiProperty({ example: 60, required: false, description: 'Window size in seconds' })
  @IsInt()
  @IsOptional()
  @Min(1)
  windowSec?: number;

  @ApiProperty({ example: 30, required: false, description: 'Days until key expires (null = never)' })
  @IsInt()
  @IsOptional()
  @Min(1)
  expiresInDays?: number;
}
