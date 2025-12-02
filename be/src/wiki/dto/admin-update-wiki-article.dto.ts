import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class AdminUpdateWikiArticleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsIn(['draft', 'active', 'inactive'])
  status: string;
}
