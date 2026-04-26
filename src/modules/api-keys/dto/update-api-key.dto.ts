import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdateApiKeyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  windowSec?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
