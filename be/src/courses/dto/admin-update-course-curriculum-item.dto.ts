import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AdminUpdateCourseCurriculumItemDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  wikiSlug?: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;

  @IsUUID()
  @IsOptional()
  quizId?: string;
}
