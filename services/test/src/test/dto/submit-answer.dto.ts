import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsInt,
  Min,
  ValidateNested,
  IsOptional,
  IsArray,
  IsString,
  IsBoolean,
} from 'class-validator';

export class SelectedAnswerDto {
  @ApiProperty({
    description: 'The ID of the selected answer option',
    example: 1,
    required: true,
  })
  @IsNotEmpty({ message: 'Answer option ID is required' })
  @IsNumber({}, { message: 'Answer option ID must be a number' })
  @IsInt({ message: 'Answer option ID must be an integer' })
  @Min(1, { message: 'Answer option ID must be a positive number' })
  optionId: number;

  @ApiProperty({
    description: 'The text of the answer (for text input questions)',
    example: 'This is my answer',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Answer text must be a string' })
  text?: string;

  @ApiProperty({
    description: 'Whether this answer is selected (for multiple choice)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Selected must be a boolean' })
  selected?: boolean;
}

export class SubmitAnswerDto {
  @ApiProperty({
    description: 'ID of the test attempt',
    example: 1,
    required: true,
  })
  @IsNotEmpty({ message: 'Attempt ID is required' })
  @IsNumber({}, { message: 'Attempt ID must be a number' })
  @IsInt({ message: 'Attempt ID must be an integer' })
  @Min(1, { message: 'Attempt ID must be a positive number' })
  attempt_id: number;

  @ApiProperty({
    description: 'ID of the question being answered',
    example: 1,
    required: true,
  })
  @IsNotEmpty({ message: 'Question ID is required' })
  @IsNumber({}, { message: 'Question ID must be a number' })
  @IsInt({ message: 'Question ID must be an integer' })
  @Min(1, { message: 'Question ID must be a positive number' })
  question_id: number;

  @ApiProperty({
    description: 'Array of selected answers',
    type: [SelectedAnswerDto],
    required: true,
  })
  @IsNotEmpty({ message: 'Selected answers are required' })
  @IsArray({ message: 'Selected answers must be an array' })
  @ValidateNested({ each: true })
  selected_answers: SelectedAnswerDto[];

  @ApiProperty({
    description: 'Time spent on the question in seconds',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Time spent must be a number' })
  @Min(0, { message: 'Time spent cannot be negative' })
  time_spent_seconds?: number;
}
