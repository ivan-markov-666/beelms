import { IsOptional, IsString } from 'class-validator';

export class AccountExportRequestDto {
  @IsOptional()
  @IsString()
  captchaToken?: string;
}
