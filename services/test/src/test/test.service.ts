import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Repository, FindOptionsWhere } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AnalyticsService } from '../analytics/analytics.service';

import { Test } from './entities/test.entity';
import { Question } from './entities/question.entity';
import { UserTestAttempt } from './entities/user-test-attempt.entity';
import { UserAnswer } from './entities/user-answer.entity';
import {
  CreateTestDto,
  UpdateTestDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  StartTestAttemptDto,
  SubmitAnswerDto,
  CompleteTestAttemptDto,
} from './dto';

@Injectable()
export class TestService {
  private readonly logger = new Logger(TestService.name);

  // Helper method to standardize error handling
  private handleError(message: string, error: any): void {
    this.logger.error(
      `${message}: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error.stack : undefined,
    );
  }

  constructor(
    @InjectRepository(Test)
    private testsRepository: Repository<Test>,
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    @InjectRepository(UserTestAttempt)
    private attemptsRepository: Repository<UserTestAttempt>,
    @InjectRepository(UserAnswer)
    private answersRepository: Repository<UserAnswer>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private analyticsService: AnalyticsService,
  ) {}

  // Test CRUD operations
  async createTest(createTestDto: CreateTestDto): Promise<Test> {
    const test = this.testsRepository.create(createTestDto);
    return this.testsRepository.save(test);
  }

  async findAllTests(filters?: FindOptionsWhere<Test>): Promise<Test[]> {
    const cacheKey = `tests:all:${JSON.stringify(filters || {})}`;

    // Try to get data from cache first
    const cachedData = await this.cacheManager.get<Test[]>(cacheKey);
    if (cachedData) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cachedData;
    }

    // If not in cache, get from database
    this.logger.debug(`Cache miss for ${cacheKey}, fetching from database`);
    const tests = await this.testsRepository.find({
      where: filters,
      relations: ['questions'],
    });

    // Store in cache for future requests
    await this.cacheManager.set(cacheKey, tests, 300000); // 5 minutes cache TTL

    return tests;
  }

  async findTestById(id: number): Promise<Test> {
    const cacheKey = `test:${id}`;

    // Try to get data from cache first
    const cachedTest = await this.cacheManager.get<Test>(cacheKey);
    if (cachedTest) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cachedTest;
    }

    // If not in cache, get from database
    this.logger.debug(`Cache miss for ${cacheKey}, fetching from database`);
    const test = await this.testsRepository.findOne({
      where: { id },
      relations: ['questions'],
    });

    if (!test) {
      throw new NotFoundException(`Test with ID ${id} not found`);
    }

    // Store in cache for future requests
    await this.cacheManager.set(cacheKey, test, 300000); // 5 minutes cache TTL

    return test;
  }

  async findTestsByChapterId(chapterId: number): Promise<Test[]> {
    return this.testsRepository.find({
      where: { chapter_id: chapterId },
      relations: ['questions'],
    });
  }

  async updateTest(id: number, updateTestDto: UpdateTestDto): Promise<Test> {
    const test = await this.findTestById(id);

    Object.assign(test, updateTestDto);

    return this.testsRepository.save(test);
  }

  async removeTest(id: number): Promise<void> {
    const test = await this.findTestById(id);
    await this.testsRepository.remove(test);
  }

  // Question CRUD operations
  async createQuestion(
    createQuestionDto: CreateQuestionDto,
  ): Promise<Question> {
    // Validate that the test exists
    await this.findTestById(createQuestionDto.test_id);

    const question = this.questionsRepository.create(createQuestionDto);
    return this.questionsRepository.save(question);
  }

  async findQuestionById(id: number): Promise<Question> {
    const question = await this.questionsRepository.findOne({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return question;
  }

  async updateQuestion(
    id: number,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    const question = await this.findQuestionById(id);

    Object.assign(question, updateQuestionDto);

    return this.questionsRepository.save(question);
  }

  async removeQuestion(id: number): Promise<void> {
    const question = await this.findQuestionById(id);
    await this.questionsRepository.remove(question);
  }

  // Test attempt operations
  async startTestAttempt(
    startTestDto: StartTestAttemptDto,
  ): Promise<UserTestAttempt> {
    const { user_id, test_id } = startTestDto;

    // Check if the test exists
    await this.findTestById(test_id); // Validate test exists

    // Create a new test attempt
    const attempt = this.attemptsRepository.create({
      user_id,
      test_id,
      started_at: new Date(),
      status: 'in_progress',
      score: 0,
      time_spent: 0,
      passed: false,
    });

    const savedAttempt = await this.attemptsRepository.save(attempt);

    // Track analytics event for test started
    try {
      await this.analyticsService.trackTestStarted(user_id, test_id);
    } catch (error) {
      this.handleError('Failed to track test started analytics', error);
      // Continue execution even if analytics tracking fails
    }

    return savedAttempt;
  }

  async submitAnswer(submitAnswerDto: SubmitAnswerDto): Promise<UserAnswer> {
    const { attempt_id, question_id, selected_answers, time_spent_seconds } =
      submitAnswerDto;

    // Verify the test attempt exists and is in progress
    const attempt = await this.attemptsRepository.findOne({
      where: { id: attempt_id, status: 'in_progress' },
    });

    if (!attempt) {
      throw new BadRequestException(
        `Test attempt with ID ${attempt_id} not found or not in progress`,
      );
    }

    // Verify the question exists and belongs to the test
    const question = await this.questionsRepository.findOne({
      where: { id: question_id, test_id: attempt.test_id },
    });

    if (!question) {
      throw new BadRequestException(
        `Question with ID ${question_id} not found or does not belong to this test`,
      );
    }

    // Check if an answer for this question already exists, if so, update it
    const existingAnswer = await this.answersRepository.findOne({
      where: { attempt_id, question_id },
    });

    // Calculate if the answer is correct based on the question's correct_answers
    const isCorrect = this.checkAnswerCorrectness(
      question.correct_answers,
      selected_answers,
    );

    let savedAnswer;

    if (existingAnswer) {
      // Update existing answer
      existingAnswer.selected_answers = selected_answers;
      existingAnswer.is_correct = isCorrect;
      existingAnswer.time_spent_seconds =
        time_spent_seconds || existingAnswer.time_spent_seconds;
      savedAnswer = await this.answersRepository.save(existingAnswer);
    } else {
      // Create new answer
      const newAnswer = this.answersRepository.create({
        attempt_id,
        question_id,
        selected_answers,
        is_correct: isCorrect,
        time_spent_seconds,
      });

      savedAnswer = await this.answersRepository.save(newAnswer);
    }

    // Track analytics event for question answered
    try {
      await this.analyticsService.trackQuestionAnswered(
        attempt.user_id,
        attempt.test_id,
        question_id,
        isCorrect,
        time_spent_seconds || 0,
      );
    } catch (error) {
      this.handleError('Failed to track question answered analytics', error);
      // Continue execution even if analytics tracking fails
    }

    return savedAnswer as UserAnswer;
  }

  async completeTestAttempt(
    completeTestDto: CompleteTestAttemptDto,
  ): Promise<UserTestAttempt> {
    const { attempt_id } = completeTestDto;

    // Verify the test attempt exists and is in progress
    const attempt = await this.attemptsRepository.findOne({
      where: { id: attempt_id, status: 'in_progress' },
    });

    if (!attempt) {
      throw new BadRequestException(
        `Test attempt with ID ${attempt_id} not found or not in progress`,
      );
    }

    // Calculate the score
    const answers = await this.answersRepository.find({
      where: { attempt_id },
    });

    // Get all questions for this test to calculate total possible points
    const questions = await this.questionsRepository.find({
      where: { test_id: attempt.test_id },
    });

    let earnedPoints = 0;
    let totalPoints = 0;

    questions.forEach((question) => {
      totalPoints += question.points;

      // Find if there's a correct answer for this question
      const answer = answers.find((a) => a.question_id === question.id);
      if (answer && answer.is_correct) {
        earnedPoints += question.points;
      }
    });

    // Calculate percentage score
    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    // Update the attempt with completion details
    attempt.completed_at = new Date();
    attempt.status = 'completed';
    attempt.score = score;

    // Calculate time spent
    if (attempt.started_at && attempt.completed_at) {
      const timeSpentMs =
        attempt.completed_at.getTime() - attempt.started_at.getTime();
      attempt.time_spent = Math.floor(timeSpentMs / 1000);
    }

    const savedAttempt = await this.attemptsRepository.save(attempt);

    // When a test is completed, invalidate related caches
    await this.cacheManager.del(`test:${attempt.test_id}`);
    await this.cacheManager.del(`tests:all:{}`);

    // Track analytics event for test completed
    try {
      await this.analyticsService.trackTestCompleted(
        attempt.user_id,
        attempt.test_id,
        score,
        attempt.time_spent || 0,
      );
    } catch (error) {
      this.handleError('Failed to track test completed analytics', error);
      // Continue execution even if analytics tracking fails
    }

    return savedAttempt;
  }

  async getUserTestAttempts(userId: number): Promise<UserTestAttempt[]> {
    return this.attemptsRepository.find({
      where: { user_id: userId },
      relations: ['test'],
      order: { started_at: 'DESC' },
    });
  }

  async getTestAttemptDetails(
    attemptId: number,
  ): Promise<{ attempt: UserTestAttempt; answers: UserAnswer[] }> {
    const attempt = await this.attemptsRepository.findOne({
      where: { id: attemptId },
      relations: ['test'],
    });

    if (!attempt) {
      throw new NotFoundException(
        `Test attempt with ID ${attemptId} not found`,
      );
    }

    const answers = await this.answersRepository.find({
      where: { attempt_id: attemptId },
      relations: ['question'],
    });

    return { attempt, answers };
  }

  private checkAnswerCorrectness(
    correctAnswers: Record<string, any>,
    selectedAnswers: Record<string, any>,
  ): boolean {
    // Prepare variables outside of switch to avoid lexical declaration errors
    let correctValues: string[] = [];
    let selectedValues: string[] = [];
    let selectedValue = '';

    switch (correctAnswers.type) {
      case 'single_choice':
        return correctAnswers.value === selectedAnswers.value;

      case 'multiple_choice':
        if (
          !Array.isArray(correctAnswers.values) ||
          !Array.isArray(selectedAnswers.values)
        ) {
          return false;
        }

        // Check if arrays have the same length and same elements
        if (correctAnswers.values.length !== selectedAnswers.values.length) {
          return false;
        }

        // Type assertion to ensure type safety when using array methods
        correctValues = correctAnswers.values as string[];
        selectedValues = selectedAnswers.values as string[];

        return (
          correctValues.every((value) => selectedValues.includes(value)) &&
          selectedValues.every((value) => correctValues.includes(value))
        );

      case 'true_false':
        return correctAnswers.value === selectedAnswers.value;

      case 'text_input':
        if (Array.isArray(correctAnswers.values)) {
          // Check if any of the accepted answers match the provided answer
          correctValues = correctAnswers.values as string[];
          selectedValue = String(selectedAnswers.value || '');

          return correctValues.some((value) => {
            return (
              this.normalizeString(String(value)) ===
              this.normalizeString(selectedValue)
            );
          });
        }
        return (
          this.normalizeString(String(correctAnswers.value || '')) ===
          this.normalizeString(String(selectedAnswers.value || ''))
        );

      default:
        return false;
    }
  }

  private normalizeString(str: string): string {
    if (!str) return '';
    return str.toLowerCase().trim();
  }
}
