import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoursesService } from '../courses/courses.service';
import { Quiz } from './quiz.entity';
import { QuizQuestion } from './quiz-question.entity';
import { QuizOption } from './quiz-option.entity';
import { QuizDto } from './dto/quiz.dto';
import { QuizSubmitInputDto, QuizSubmitResultDto } from './dto/quiz-submit.dto';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly coursesService: CoursesService,
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(QuizQuestion)
    private readonly questionRepo: Repository<QuizQuestion>,
    @InjectRepository(QuizOption)
    private readonly optionRepo: Repository<QuizOption>,
  ) {}

  async getQuizForCourseUser(
    userId: string,
    courseId: string,
    quizId: string,
  ): Promise<QuizDto> {
    await this.coursesService.requireEnrollment(userId, courseId);
    await this.coursesService.requireQuizInCurriculum(courseId, quizId);

    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const questions = await this.questionRepo.find({
      where: { quizId },
      order: { order: 'ASC' },
    });

    const questionIds = questions.map((q) => q.id);
    const options = questionIds.length
      ? await this.optionRepo.find({
          where: questionIds.map((id) => ({ questionId: id })),
          order: { optionIndex: 'ASC' },
        })
      : [];

    const optionsByQuestion = new Map<string, QuizOption[]>();
    for (const opt of options) {
      const bucket = optionsByQuestion.get(opt.questionId) ?? [];
      bucket.push(opt);
      optionsByQuestion.set(opt.questionId, bucket);
    }

    return {
      id: quiz.id,
      title: quiz.title,
      passingScore: quiz.passingScore ?? null,
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: (optionsByQuestion.get(q.id) ?? []).map((o) => o.text),
      })),
    };
  }

  async submitQuizForCourseUser(
    userId: string,
    courseId: string,
    quizId: string,
    dto: QuizSubmitInputDto,
  ): Promise<QuizSubmitResultDto> {
    await this.coursesService.requireEnrollment(userId, courseId);
    await this.coursesService.requireQuizInCurriculum(courseId, quizId);

    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const questions = await this.questionRepo.find({
      where: { quizId },
      order: { order: 'ASC' },
    });

    if (!questions.length) {
      if (dto.answers?.length) {
        throw new BadRequestException('Quiz has no questions');
      }
      return { score: 0, maxScore: 0, passed: true };
    }

    const questionIds = new Set(questions.map((q) => q.id));

    for (const ans of dto.answers) {
      if (!questionIds.has(ans.questionId)) {
        throw new BadRequestException('Invalid questionId');
      }
      if (!Number.isInteger(ans.optionIndex) || ans.optionIndex < 0) {
        throw new BadRequestException('Invalid optionIndex');
      }
    }

    const allOptions = await this.optionRepo.find({
      where: questions.map((q) => ({ questionId: q.id })),
      order: { optionIndex: 'ASC' },
    });

    const optionsByQuestion = new Map<string, QuizOption[]>();
    for (const opt of allOptions) {
      const bucket = optionsByQuestion.get(opt.questionId) ?? [];
      bucket.push(opt);
      optionsByQuestion.set(opt.questionId, bucket);
    }

    const correctIndexByQuestion = new Map<string, number>();
    for (const opt of allOptions) {
      if (opt.isCorrect) {
        correctIndexByQuestion.set(opt.questionId, opt.optionIndex);
      }
    }

    const answerByQuestion = new Map<string, number>();
    for (const ans of dto.answers) {
      const opts = optionsByQuestion.get(ans.questionId) ?? [];
      if (ans.optionIndex >= opts.length) {
        throw new BadRequestException('Invalid optionIndex');
      }
      answerByQuestion.set(ans.questionId, ans.optionIndex);
    }

    let score = 0;
    for (const q of questions) {
      const submittedIndex = answerByQuestion.get(q.id);
      if (submittedIndex === undefined) {
        continue;
      }
      const correctIndex = correctIndexByQuestion.get(q.id);
      if (correctIndex !== undefined && submittedIndex === correctIndex) {
        score += 1;
      }
    }

    const maxScore = questions.length;
    const required = quiz.passingScore ?? maxScore;
    const passed = score >= required;

    return { score, maxScore, passed };
  }
}
