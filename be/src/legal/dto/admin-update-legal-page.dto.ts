import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class AdminUpdateLegalPageDto {
  @IsString()
  @IsOptional()
  @MaxLength(256)
  title?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  titleByLang?: Record<string, string | null> | null;

  @IsString()
  @IsNotEmpty()
  contentMarkdown: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  contentMarkdownByLang?: Record<string, string | null> | null;
}
