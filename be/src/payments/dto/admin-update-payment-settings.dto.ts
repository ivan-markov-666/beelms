import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class AdminUpdatePaymentSettingsDto {
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  priceCents?: number;
}
