export type QuizQuestionDto = {
  id: string;
  text: string;
  options: string[];
};

export type QuizDto = {
  id: string;
  title: string;
  passingScore: number | null;
  questions: QuizQuestionDto[];
};
