import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApprovalStatus } from '../entities/content-approval.entity';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitForReviewDto {
  @IsString()
  changeDescription: string;
}

export class ReviewContentDto {
  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @IsString()
  @IsOptional()
  reviewComments?: string;

  @IsNumber()
  reviewedBy: number;
}

export class SchedulePublishDto {
  @IsString()
  scheduledPublishAt: string; // ISO date string

  @IsNumber()
  scheduledBy: number;
}

export class ContentApprovalFilterDto {
  @ApiProperty({
    enum: ApprovalStatus,
    required: false,
    description: 'Filter by approval status',
  })
  @IsEnum(ApprovalStatus)
  @IsOptional()
  status?: ApprovalStatus;

  @ApiProperty({
    required: false,
    description: 'Filter by content creator ID',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  createdBy?: number;

  @ApiProperty({
    required: false,
    description: 'Filter by reviewer ID',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  reviewedBy?: number;

  @ApiProperty({
    required: false,
    description: 'Search term to filter by title or content',
  })
  @ApiProperty({
    required: false,
    description: 'Search term to filter by title or content',
  })
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @ApiProperty({
    required: false,
    default: 1,
    description: 'Page number for pagination',
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page = 1;

  @ApiProperty({
    required: false,
    default: 10,
    description: 'Number of items per page',
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit = 10;
}
