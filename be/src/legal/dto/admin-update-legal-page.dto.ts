import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminUpdateLegalPageDto {
  @IsString()
  @IsOptional()
  @MaxLength(256)
  title?: string;

  @IsString()
  @IsNotEmpty()
  contentMarkdown: string;
}
