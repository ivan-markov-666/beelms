import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class AdminCreateCustomPageDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(64)
  slug: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  title: string;

  @IsString()
  @IsNotEmpty()
  contentMarkdown: string;

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
