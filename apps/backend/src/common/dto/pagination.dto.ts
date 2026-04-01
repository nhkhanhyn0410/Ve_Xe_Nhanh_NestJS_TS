import { DEFAULT_PAGE, MAX_LIMIT, DEFAULT_LIMIT } from '@common/constants';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsPositive, IsString, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiPropertyOptional({ default: DEFAULT_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page: number = DEFAULT_PAGE;

  @ApiPropertyOptional({ default: DEFAULT_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(MAX_LIMIT)
  limit: number = DEFAULT_LIMIT;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
