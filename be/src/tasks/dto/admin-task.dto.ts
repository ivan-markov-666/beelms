import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const TASK_STATUSES = ['draft', 'active', 'inactive'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export class AdminCreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  language?: string;

  @IsIn(TASK_STATUSES)
  @IsOptional()
  status?: TaskStatus;
}

export class AdminUpdateTaskDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  language?: string;

  @IsIn(TASK_STATUSES)
  @IsOptional()
  status?: TaskStatus;
}

export type AdminTaskDto = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};
