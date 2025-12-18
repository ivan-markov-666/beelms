import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AdminCreateCourseCurriculumItemDto {
  @IsString()
  @IsIn(['wiki', 'task', 'quiz'])
  itemType: 'wiki' | 'task' | 'quiz';

  @IsString()
  @IsNotEmpty()
  title: string;

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
