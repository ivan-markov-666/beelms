import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class AdminCreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsString()
  @IsIn(['draft', 'active', 'inactive'])
  status: string;

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
