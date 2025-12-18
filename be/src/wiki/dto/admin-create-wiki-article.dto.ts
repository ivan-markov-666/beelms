import {
  ArrayMinSize,
  ArrayUnique,
  IsIn,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdminCreateWikiArticleContentDto {
  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class AdminCreateWikiArticleDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  @IsIn(['public', 'course_only'])
  visibility?: string;

  @IsArray()
  @IsOptional()
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];

  @IsString()
  @IsIn(['draft', 'active', 'inactive'])
  status: string;

  @ValidateNested({ each: true })
  @Type(() => AdminCreateWikiArticleContentDto)
  @ArrayMinSize(1)
  contents: AdminCreateWikiArticleContentDto[];
}
