import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './quiz.entity';
import { QuizQuestion } from './quiz-question.entity';
import { QuizOption } from './quiz-option.entity';
import {
  AdminCreateQuizDto,
  AdminCreateQuizQuestionDto,
  AdminQuizDto,
  AdminQuizQuestionDto,
  AdminUpdateQuizDto,
  AdminUpdateQuizQuestionDto,
} from './dto/admin-quiz.dto';

@Injectable()
export class AdminQuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(QuizQuestion)
    private readonly questionRepo: Repository<QuizQuestion>,
    @InjectRepository(QuizOption)
    private readonly optionRepo: Repository<QuizOption>,
  ) {}

  async list(): Promise<AdminQuizDto[]> {
    const quizzes = await this.quizRepo.find({ order: { createdAt: 'DESC' } });
    return quizzes.map((q) => this.toDto(q));
  }

  async create(dto: AdminCreateQuizDto): Promise<AdminQuizDto> {
    this.validatePassingScore(dto.passingScore);
    const quiz = this.quizRepo.create({
      title: dto.title,
      description: dto.description ?? null,
      language: dto.language ?? 'bg',
      status: dto.status ?? 'draft',
      passingScore: dto.passingScore ?? null,
    });
    const saved = await this.quizRepo.save(quiz);
    return this.toDto(saved, []);
  }

  async get(quizId: string): Promise<AdminQuizDto> {
    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    const questions = await this.questionRepo.find({
      where: { quizId },
      order: { order: 'ASC' },
    });
    const options = await this.optionRepo.find({
      where: questions.map((q) => ({ questionId: q.id })),
      order: { optionIndex: 'ASC' },
    });
    return this.toDto(quiz, questions, options);
  }

  async update(quizId: string, dto: AdminUpdateQuizDto): Promise<AdminQuizDto> {
    this.validatePassingScore(dto.passingScore);
    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (dto.title !== undefined) quiz.title = dto.title;
    if (dto.description !== undefined) quiz.description = dto.description;
    if (dto.language !== undefined) quiz.language = dto.language;
    if (dto.status !== undefined) quiz.status = dto.status;
    if (dto.passingScore !== undefined) quiz.passingScore = dto.passingScore;

    const saved = await this.quizRepo.save(quiz);
    return this.get(saved.id);
  }

  async delete(quizId: string): Promise<void> {
    const res = await this.quizRepo.delete({ id: quizId });
    if (!res.affected) {
      throw new NotFoundException('Quiz not found');
    }
  }

  async addQuestion(
    quizId: string,
    dto: AdminCreateQuizQuestionDto,
  ): Promise<AdminQuizDto> {
    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    this.validateQuestion(dto.options, dto.correctOptionIndex);

    const order =
      dto.order ??
      (await this.questionRepo.count({
        where: { quizId },
      })) + 1;

    const question = await this.questionRepo.save(
      this.questionRepo.create({
        quizId,
        text: dto.text,
        order,
      }),
    );

    await this.optionRepo.save(
      dto.options.map((text, idx) =>
        this.optionRepo.create({
          questionId: question.id,
          text,
          optionIndex: idx,
          isCorrect: idx === dto.correctOptionIndex,
        }),
      ),
    );

    return this.get(quizId);
  }

  async updateQuestion(
    quizId: string,
    questionId: string,
    dto: AdminUpdateQuizQuestionDto,
  ): Promise<AdminQuizDto> {
    const question = await this.questionRepo.findOne({
      where: { id: questionId, quizId },
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    this.validateQuestion(dto.options, dto.correctOptionIndex);

    if (dto.text !== undefined) question.text = dto.text;
    if (dto.order !== undefined) question.order = dto.order;

    await this.questionRepo.save(question);

    await this.optionRepo.delete({ questionId: question.id });
    await this.optionRepo.save(
      dto.options.map((text, idx) =>
        this.optionRepo.create({
          questionId: question.id,
          text,
          optionIndex: idx,
          isCorrect: idx === dto.correctOptionIndex,
        }),
      ),
    );

    return this.get(quizId);
  }

  async deleteQuestion(quizId: string, questionId: string): Promise<void> {
    const question = await this.questionRepo.findOne({
      where: { id: questionId, quizId },
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    await this.questionRepo.delete({ id: questionId });
  }

  private validatePassingScore(passingScore: number | null | undefined): void {
    if (passingScore === null || passingScore === undefined) return;
    if (passingScore < 0) {
      throw new BadRequestException('passingScore cannot be negative');
    }
  }

  private validateQuestion(options: string[], correctIndex: number): void {
    if (!options || options.length < 2) {
      throw new BadRequestException('At least two options are required');
    }
    if (correctIndex < 0 || correctIndex >= options.length) {
      throw new BadRequestException('correctOptionIndex is out of range');
    }
  }

  private toDto(
    quiz: Quiz,
    questions: QuizQuestion[] = [],
    options: QuizOption[] = [],
  ): AdminQuizDto {
    const optionsByQuestion = new Map<string, QuizOption[]>();
    for (const opt of options) {
      const bucket = optionsByQuestion.get(opt.questionId) ?? [];
      bucket.push(opt);
      optionsByQuestion.set(opt.questionId, bucket);
    }

    const questionDtos: AdminQuizQuestionDto[] = questions.map((q) => {
      const opts = optionsByQuestion.get(q.id) ?? [];
      const correct = opts.find((o) => o.isCorrect);
      return {
        id: q.id,
        text: q.text,
        options: opts.map((o) => o.text),
        correctOptionIndex: correct?.optionIndex ?? 0,
        order: q.order,
      };
    });

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description ?? null,
      language: quiz.language,
      status: quiz.status,
      passingScore: quiz.passingScore ?? null,
      questions: questionDtos,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
    };
  }
}
