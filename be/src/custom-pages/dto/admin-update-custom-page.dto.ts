import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class AdminUpdateCustomPageDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(64)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  title?: string;

  @IsOptional()
  @IsString()
  contentMarkdown?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  titleByLang?: Record<string, string | null> | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  contentMarkdownByLang?: Record<string, string | null> | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
