import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const QUIZ_STATUSES = ['draft', 'active', 'inactive'] as const;
export type QuizStatus = (typeof QUIZ_STATUSES)[number];

export class AdminCreateQuizDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  language?: string;

  @IsIn(QUIZ_STATUSES)
  @IsOptional()
  status?: QuizStatus;

  @IsInt()
  @IsOptional()
  passingScore?: number | null;
}

export class AdminUpdateQuizDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  language?: string;

  @IsIn(QUIZ_STATUSES)
  @IsOptional()
  status?: QuizStatus;

  @IsInt()
  @IsOptional()
  passingScore?: number | null;
}

export class AdminQuizQuestionInputDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  text: string;

  @IsArray()
  @IsString({ each: true })
  @MinLength(2, { each: true })
  options: string[];

  @IsInt()
  correctOptionIndex: number;
}

export class AdminCreateQuizQuestionDto extends AdminQuizQuestionInputDto {
  @IsInt()
  @IsOptional()
  order?: number;
}

export class AdminUpdateQuizQuestionDto extends AdminQuizQuestionInputDto {
  @IsInt()
  @IsOptional()
  order?: number;
}

export type AdminQuizQuestionDto = {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  order: number;
};

export type AdminQuizDto = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  status: QuizStatus;
  passingScore: number | null;
  questions: AdminQuizQuestionDto[];
  createdAt: string;
  updatedAt: string;
};
