import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsObject,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsOptional,
  MinLength,
  IsBoolean,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  TEXT_INPUT = 'text_input',
}

export class AnswerOptionDto {
  @ApiProperty({
    description: 'Answer option text',
    example: 'Option 1',
    required: true,
  })
  @IsNotEmpty({ message: 'Answer text is required' })
  @IsString({ message: 'Answer text must be a string' })
  text: string;

  @ApiProperty({
    description: 'Whether this answer is correct',
    example: true,
    required: true,
  })
  @IsBoolean({ message: 'isCorrect must be a boolean' })
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @ApiProperty({
    description: 'ID of the test this question belongs to',
    example: 1,
    required: true,
  })
  @IsNotEmpty({ message: 'Test ID is required' })
  @IsNumber({}, { message: 'Test ID must be a number' })
  @IsInt({ message: 'Test ID must be an integer' })
  @Min(1, { message: 'Test ID must be a positive number' })
  test_id: number;

  @ApiProperty({
    description: 'The question text',
    example: 'What is the capital of France?',
    required: true,
  })
  @IsNotEmpty({ message: 'Question text is required' })
  @IsString({ message: 'Question text must be a string' })
  @MinLength(5, { message: 'Question text must be at least 5 characters long' })
  question_text: string;

  @ApiProperty({
    description: 'Type of the question',
    enum: QuestionType,
    example: QuestionType.SINGLE_CHOICE,
    required: true,
  })
  @IsNotEmpty({ message: 'Question type is required' })
  @IsEnum(QuestionType, { message: 'Invalid question type' })
  question_type: QuestionType;

  @ApiProperty({
    description: 'Question options (required for choice-based questions)',
    type: [AnswerOptionDto],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Options must be an array' })
  @ValidateNested({ each: true })
  @Type(() => AnswerOptionDto)
  options?: AnswerOptionDto[];

  @ApiProperty({
    description: 'Points for this question',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Points must be a number' })
  @Min(0.1, { message: 'Points must be at least 0.1' })
  @Max(100, { message: 'Points cannot exceed 100' })
  points: number = 1;

  @ApiProperty({
    description: 'Correct answers for the question',
    type: Object,
    required: true,
    isArray: false,
  } as const)
  @IsObject({ message: 'Correct answers must be an object' })
  @IsNotEmpty({ message: 'Correct answers are required' })
  correct_answers: Record<string, any>;

  @ApiProperty({
    description: 'Explanation for the correct answer',
    example: 'This is the correct answer because...',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Explanation must be a string' })
  explanation?: string;

  @ApiProperty({
    description: 'Whether this question is active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Active must be a boolean' })
  is_active: boolean = true;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
