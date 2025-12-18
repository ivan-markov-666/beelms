import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class AdminUpdateCourseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'active', 'inactive'])
  status?: string;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;
}
