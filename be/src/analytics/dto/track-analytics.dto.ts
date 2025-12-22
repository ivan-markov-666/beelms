import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class TrackAnalyticsDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  visitorId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(512)
  path: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  referrer?: string;
}
