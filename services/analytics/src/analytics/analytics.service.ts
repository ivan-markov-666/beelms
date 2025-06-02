import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import {
  DateRangeDto,
  UserProgressQueryDto,
  TestStatisticsQueryDto,
  ExportDataDto,
} from './dto/query-analytics.dto';
import {
  AggregatePerformanceReport,
  CourseCompletionRates,
  ExportDataResponse,
  IndividualPerformanceReport,
  IndividualPerformanceMetrics,
  IndividualPerformanceProgress,
  RecentTest,
  TestPerformance,
  TestStatistics,
  UserProgress,
} from './interfaces/analytics-response.interface';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
  ) {}

  async createEvent(createEventDto: CreateEventDto): Promise<AnalyticsEvent> {
    this.logger.debug(`Recording analytics event: ${createEventDto.eventType}`);
    const event = this.analyticsEventRepository.create(createEventDto);
    return this.analyticsEventRepository.save(event);
  }

  private getDateRangeFilter(
    dateRange: DateRangeDto,
  ): FindOptionsWhere<AnalyticsEvent> {
    const filter: FindOptionsWhere<AnalyticsEvent> = {};

    if (dateRange.startDate && dateRange.endDate) {
      // If both dates are provided, use Between
      filter.createdAt = Between(
        new Date(dateRange.startDate),
        new Date(dateRange.endDate),
      );
    } else if (dateRange.startDate) {
      // If only start date is provided
      filter.createdAt = MoreThanOrEqual(new Date(dateRange.startDate));
    } else if (dateRange.endDate) {
      // If only end date is provided
      filter.createdAt = LessThanOrEqual(new Date(dateRange.endDate));
    }

    return filter;
  }

  async getUserProgress(query: UserProgressQueryDto): Promise<UserProgress> {
    this.logger.debug(`Getting user progress for user ID: ${query.userId}`);

    const filter = this.getDateRangeFilter(query);

    // Find all events related to this user
    const events = await this.analyticsEventRepository.find({
      where: {
        ...filter,
        eventData: { userId: query.userId },
      },
      order: { createdAt: 'ASC' },
    });

    // Process events to create a user progress report
    const progressByTest: Record<
      string,
      {
        started: boolean;
        completed: boolean;
        score: number | null;
        passed?: boolean;
      }
    > = {};
    const completedCourses = new Set<string>();
    const completedChapters = new Set<number>();

    for (const event of events) {
      const { eventType, eventData } = event;

      if (eventType === 'test_started') {
        const testIdStr = String(eventData.testId);
        if (!progressByTest[testIdStr]) {
          progressByTest[testIdStr] = {
            started: true,
            completed: false,
            score: null,
          };
        }
      } else if (eventType === 'test_completed') {
        const testIdStr = String(eventData.testId);
        progressByTest[testIdStr] = {
          started: true,
          completed: true,
          score: Number(eventData.score),
          passed: Boolean(eventData.passed),
        };
      } else if (eventType === 'course_completed') {
        completedCourses.add(String(eventData.courseId));
      } else if (eventType === 'chapter_completed') {
        completedChapters.add(Number(eventData.chapterId));
      }
    }

    // Calculate average score for completed tests
    const completedTestScores = Object.values(progressByTest).filter(
      (
        test,
      ): test is {
        started: boolean;
        completed: true;
        score: number;
        passed?: boolean;
      } => test.completed && typeof test.score === 'number',
    );

    const averageScore =
      completedTestScores.length > 0
        ? completedTestScores.reduce(
            (sum, test) => sum + (test.score || 0),
            0,
          ) / completedTestScores.length
        : 0;

    return {
      userId: query.userId,
      completedCourses: completedCourses.size,
      totalCourses: 0, // Placeholder, would need to be fetched from courses service
      completedTests: Object.values(progressByTest).filter(
        (test) => test.completed,
      ).length,
      totalTests: 0, // Placeholder, would need to be fetched from tests service
      averageScore,
      timeSpent: '0', // Placeholder, would need to calculate from event timestamps
      progressTrend: [], // Placeholder, would need historical data
      completedChapters: Array.from(completedChapters).map(Number),
      totalEventsTracked: events.length,
      tests: progressByTest,
    };
  }

  async getTestStatistics(
    query: TestStatisticsQueryDto,
  ): Promise<TestStatistics> {
    this.logger.debug(`Getting test statistics for test ID: ${query.testId}`);

    const filter = this.getDateRangeFilter(query);

    // Find all events related to this test
    const events = await this.analyticsEventRepository.find({
      where: [
        {
          ...filter,
          eventType: 'test_completed',
          eventData: { testId: query.testId },
        },
        {
          ...filter,
          eventType: 'question_answered',
          eventData: { testId: query.testId },
        },
      ],
    });

    if (events.length === 0) {
      throw new NotFoundException(
        `No analytics data found for test ID: ${query.testId}`,
      );
    }

    // Process events to create test statistics
    const completedTests = events.filter(
      (e) => e.eventType === 'test_completed',
    );
    // We've already filtered events with the right criteria above
    const attemptCount = completedTests.length;
    const averageScore =
      attemptCount > 0
        ? completedTests.reduce(
            (sum, e) => sum + Number(e.eventData.score),
            0,
          ) / attemptCount
        : 0;
    const passRate =
      attemptCount > 0
        ? completedTests.filter((e) => e.eventData.passed).length / attemptCount
        : 0;

    // Group question answers by question ID
    interface QuestionStat {
      attempts: number;
      correct: number;
    }

    const questionStats: Record<string, QuestionStat> = {};
    for (const answer of events) {
      const questionId = String(answer.eventData.questionId);
      const isCorrect = Boolean(answer.eventData.isCorrect);
      if (!questionStats[questionId]) {
        questionStats[questionId] = {
          attempts: 0,
          correct: 0,
        };
      }
      questionStats[questionId].attempts += 1;
      if (isCorrect) {
        questionStats[questionId].correct += 1;
      }
    }

    // Calculate difficulty level for each question
    const questionDifficulty: Record<
      string,
      {
        correctRate: number;
        difficultyLevel: string;
        totalAttempts: number;
      }
    > = {};

    for (const [questionId, stats] of Object.entries(questionStats)) {
      const correctRate =
        stats.attempts > 0 ? stats.correct / stats.attempts : 0;
      questionDifficulty[questionId] = {
        correctRate,
        difficultyLevel:
          correctRate >= 0.8 ? 'easy' : correctRate >= 0.4 ? 'medium' : 'hard',
        totalAttempts: stats.attempts,
      };
    }

    return {
      testId: query.testId,
      attemptCount,
      averageScore,
      passRate,
      questionDifficulty,
    };
  }

  async getCourseCompletionRates(
    dateRange: DateRangeDto = {},
  ): Promise<CourseCompletionRates> {
    this.logger.debug('Getting course completion rates');

    const filter = this.getDateRangeFilter(dateRange);

    // Find all course start and completion events
    const courseStartEvents = await this.analyticsEventRepository.find({
      where: { ...filter, eventType: 'course_started' },
    });

    const courseCompletionEvents = await this.analyticsEventRepository.find({
      where: { ...filter, eventType: 'course_completed' },
    });

    // Process events to create completion rates by course
    interface CourseStats {
      starts: number;
      completions: number;
    }

    const courseStats: Record<string, CourseStats> = {};

    // Count starts by course
    for (const event of courseStartEvents) {
      const { courseId } = event.eventData;
      if (!courseStats[courseId as string]) {
        courseStats[courseId as string] = { starts: 0, completions: 0 };
      }
      courseStats[courseId as string].starts += 1;
    }

    // Count completions by course
    for (const event of courseCompletionEvents) {
      const { courseId } = event.eventData;
      if (!courseStats[courseId as string]) {
        courseStats[courseId as string] = { starts: 0, completions: 1 };
      } else {
        courseStats[courseId as string].completions += 1;
      }
    }

    // Calculate completion rates
    const completionRates: Record<
      string,
      {
        starts: number;
        completions: number;
        completionRate: number;
      }
    > = {};

    for (const [courseId, rates] of Object.entries(courseStats)) {
      const completionRate =
        rates.starts > 0 ? rates.completions / rates.starts : 0;

      completionRates[courseId] = {
        starts: rates.starts,
        completions: rates.completions,
        completionRate,
      };
    }

    return completionRates;
  }

  async getAggregatePerformanceReport(
    dateRange: DateRangeDto = {},
  ): Promise<AggregatePerformanceReport> {
    this.logger.debug('Generating aggregate performance report');

    const filter = this.getDateRangeFilter(dateRange);

    // Get all test completion events
    const testCompletionEvents = await this.analyticsEventRepository.find({
      where: { ...filter, eventType: 'test_completed' },
    });

    // Calculate overall statistics
    const totalTests = testCompletionEvents.length;
    const passedTests = testCompletionEvents.filter(
      (e) => e.eventData.passed,
    ).length;
    const averageScore =
      totalTests > 0
        ? testCompletionEvents.reduce(
            (sum, e) => sum + Number(e.eventData.score),
            0,
          ) / totalTests
        : 0;

    // Group by test to find most difficult tests
    interface TestStat {
      attempts: number;
      passed: number;
      totalScore: number;
    }

    const testStats: Record<string, TestStat> = {};
    for (const event of testCompletionEvents) {
      const { testId, score, passed } = event.eventData;
      const testIdStr = String(testId);
      if (!testStats[testIdStr]) {
        testStats[testIdStr] = { attempts: 0, passed: 0, totalScore: 0 };
      }
      testStats[testIdStr].attempts += 1;
      testStats[testIdStr].totalScore += Number(score);
      if (passed) {
        testStats[testIdStr].passed += 1;
      }
    }

    // Calculate pass rates and average scores by test
    const testPerformance: Record<string, TestPerformance> = {};
    for (const [testId, stats] of Object.entries(testStats)) {
      testPerformance[testId] = {
        attempts: stats.attempts,
        passRate: stats.attempts > 0 ? stats.passed / stats.attempts : 0,
        averageScore:
          stats.attempts > 0 ? stats.totalScore / stats.attempts : 0,
      };
    }

    // Find most difficult tests (lowest pass rate)
    const mostDifficultTests = Object.entries(testStats)
      .map(
        ([testId, stat]) =>
          ({
            testId: Number(testId),
            attempts: stat.attempts,
            passRate: stat.attempts > 0 ? stat.passed / stat.attempts : 0,
            averageScore:
              stat.attempts > 0 ? stat.totalScore / stat.attempts : 0,
          }) as TestPerformance & { testId: number },
      )
      .filter((test) => test.attempts >= 5) // Require at least 5 attempts for significance
      .sort((a, b) => a.passRate - b.passRate)
      .slice(0, 5);

    return {
      overview: {
        totalTestsTaken: totalTests,
        overallPassRate: totalTests > 0 ? passedTests / totalTests : 0,
        averageScore,
        averageTimeSpentSeconds: 0,
      },
      mostDifficultTests,
      period: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
    };
  }

  async getIndividualPerformanceReport(
    query: UserProgressQueryDto,
  ): Promise<IndividualPerformanceReport> {
    this.logger.debug(
      `Generating individual performance report for user ID: ${query.userId}`,
    );

    // Get user progress first
    const userProgress = await this.getUserProgress(query);

    // Get all test completion events for this user
    const filter = this.getDateRangeFilter(query);

    const testCompletionEvents = await this.analyticsEventRepository.find({
      where: {
        ...filter,
        eventType: 'test_completed',
        eventData: { userId: query.userId },
      },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Calculate performance metrics
    const totalTests = testCompletionEvents.length;
    const passedTests = testCompletionEvents.filter(
      (e) => e.eventData.passed,
    ).length;
    const averageScore =
      totalTests > 0
        ? testCompletionEvents.reduce(
            (sum, e) => sum + Number(e.eventData.score),
            0,
          ) / totalTests
        : 0;

    // Recent test history
    const recentTestHistory: RecentTest[] = testCompletionEvents
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 10)
      .map((event) => ({
        testId: Number(event.eventData.testId),
        score: Number(event.eventData.score),
        passed: Boolean(event.eventData.passed),
        timeSpentSeconds: Number(event.eventData.timeSpentSeconds),
        completedAt: event.createdAt,
      }));

    // Prepare the metrics object with correct typing
    const metrics: IndividualPerformanceMetrics = {
      totalTestsTaken: totalTests,
      testsPassed: passedTests,
      overallPassRate: totalTests > 0 ? passedTests / totalTests : 0,
      averageScore,
    };

    // Prepare the progress object with correct typing
    const progress: IndividualPerformanceProgress = {
      completedCourses:
        typeof userProgress.completedCourses === 'number'
          ? userProgress.completedCourses
          : 0,
      completedChapters: Array.isArray(userProgress.completedChapters)
        ? userProgress.completedChapters.length
        : 0,
    };

    return {
      userId: query.userId,
      metrics,
      progress,
      recentTests: recentTestHistory,
      period: {
        startDate: query.startDate,
        endDate: query.endDate,
      },
    };
  }

  async exportData(query: ExportDataDto): Promise<ExportDataResponse> {
    this.logger.debug('Exporting analytics data');

    const filter: FindOptionsWhere<AnalyticsEvent> =
      this.getDateRangeFilter(query);

    const events = await this.analyticsEventRepository.find({
      where: filter,
      order: { createdAt: 'ASC' },
    });

    // Create a typed array of events with known structure
    const exportedEvents = events
      .filter((event) => {
        if (query.eventTypes && query.eventTypes.length > 0) {
          return query.eventTypes.includes(event.eventType);
        }
        return true;
      })
      .map((event) => ({
        id: event.id,
        userId: Number(event.eventData.userId),
        eventType: event.eventType,
        eventData: event.eventData as Record<string, unknown>,
        createdAt: event.createdAt,
      }));

    // Create a properly typed response according to the interface
    const response: ExportDataResponse = {
      exportedAt: new Date().toISOString(),
      period: {
        startDate: query.startDate,
        endDate: query.endDate,
      },
      eventTypes: query.eventTypes,
      totalEvents: events.length,
      // Using any[] as specified in the interface definition
      // This is intentionally typed as any[] to match the interface
      events: exportedEvents.map((event) => ({
        id: event.id,
        userId: event.eventData.userId,
        eventType: event.eventType,
        eventData: event.eventData,
        createdAt: event.createdAt,
      })),
    };

    return response;
  }
}
