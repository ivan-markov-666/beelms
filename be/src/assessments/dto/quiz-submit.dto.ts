import { IsArray, IsInt, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QuizSubmitAnswerDto {
  @IsString()
  questionId: string;

  @IsInt()
  optionIndex: number;
}

export class QuizSubmitInputDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizSubmitAnswerDto)
  answers: QuizSubmitAnswerDto[];
}

export type QuizSubmitResultDto = {
  score: number;
  maxScore: number;
  passed: boolean;
};
