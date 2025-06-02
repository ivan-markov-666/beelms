import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateAdvertisementDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsUrl()
  imageUrl: string;

  @IsNotEmpty()
  @IsUrl()
  targetUrl: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  displayLocation?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
