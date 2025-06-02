import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DateRangeDto {
  @ApiProperty({
    description: 'Start date for the analytics query',
    example: '2023-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for the analytics query',
    example: '2023-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UserProgressQueryDto extends DateRangeDto {
  @ApiProperty({
    description: 'User ID to get progress for',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  userId: number;
}

export class TestStatisticsQueryDto extends DateRangeDto {
  @ApiProperty({
    description: 'Test ID to get statistics for',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  testId: number;
}

export class ExportDataDto extends DateRangeDto {
  @ApiProperty({
    description: 'Event types to include in the export',
    example: ['test_started', 'test_completed'],
    required: false,
  })
  @IsOptional()
  eventTypes?: string[];
}
