import {
  IsNumber,
  IsString,
  IsObject,
  Min,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { QuestionType } from './create-question.dto';

// Manually implementing the UpdateQuestionDto with optional fields
// This avoids using PartialType which is causing TypeScript errors
export class UpdateQuestionDto {
  @IsOptional()
  @IsNumber()
  test_id?: number;

  @IsOptional()
  @IsString()
  question_text?: string;

  @IsOptional()
  @IsEnum(QuestionType)
  question_type?: QuestionType;

  @IsOptional()
  @IsObject()
  options?: Record<string, any>;

  @IsOptional()
  @IsObject()
  correct_answers?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  @Min(1)
  points?: number;
}
