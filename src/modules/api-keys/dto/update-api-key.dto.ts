import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateApiKeyDto {
  @ApiProperty({ example: 'My Updated App', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 500, required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number;

  @ApiProperty({ example: 300, required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  windowSec?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 30, required: false, description: 'Days from now until key expires (null = never)' })
  @IsInt()
  @IsOptional()
  @Min(1)
  expiresInDays?: number;
}
