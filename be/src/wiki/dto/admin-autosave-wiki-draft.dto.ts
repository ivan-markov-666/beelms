import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminAutosaveWikiDraftDto {
  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;
}
