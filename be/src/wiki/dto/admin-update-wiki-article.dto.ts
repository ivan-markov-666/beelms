import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class AdminUpdateWikiArticleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsIn(['draft', 'active', 'inactive'])
  status: string;

  @IsString()
  @IsOptional()
  @IsIn(['single', 'all', 'selected'])
  statusScope?: string;

  @IsArray()
  @IsOptional()
  @ArrayUnique()
  @IsString({ each: true })
  statusScopeLanguages?: string[];

  @IsString()
  @IsOptional()
  @IsIn(['public', 'course_only'])
  visibility?: string;

  @IsArray()
  @IsOptional()
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];
}
