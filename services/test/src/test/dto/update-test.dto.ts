import {
  IsNumber,
  IsString,
  MaxLength,
  Min,
  IsOptional,
} from 'class-validator';

// Manually implementing the UpdateTestDto with optional fields
// This avoids using PartialType which is causing TypeScript errors
export class UpdateTestDto {
  @IsOptional()
  @IsNumber()
  chapter_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  time_limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  passing_score?: number;
}
