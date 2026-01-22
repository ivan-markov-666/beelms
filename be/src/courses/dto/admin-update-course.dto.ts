import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsArray,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'active', 'inactive'])
  status?: string;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  priceCents?: number | null;

  @IsOptional()
  @IsUUID('4')
  categoryId?: string | null;
}
