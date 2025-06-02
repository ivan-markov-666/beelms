import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdClickDto {
  @IsNotEmpty()
  @IsNumber()
  adId: number;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
