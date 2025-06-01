import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly analyticsServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.analyticsServiceUrl = this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://localhost:3105',
    );
  }

  async trackTestStarted(userId: number, testId: number): Promise<void> {
    await this.sendAnalyticsEvent('test_started', {
      userId,
      testId,
      timestamp: new Date().toISOString(),
    });
  }

  async trackTestCompleted(
    userId: number,
    testId: number,
    score: number,
    timeSpentSeconds: number,
  ): Promise<void> {
    await this.sendAnalyticsEvent('test_completed', {
      userId,
      testId,
      score,
      timeSpentSeconds,
      timestamp: new Date().toISOString(),
    });
  }

  async trackQuestionAnswered(
    userId: number,
    testId: number,
    questionId: number,
    isCorrect: boolean,
    timeSpentSeconds: number,
  ): Promise<void> {
    await this.sendAnalyticsEvent('question_answered', {
      userId,
      testId,
      questionId,
      isCorrect,
      timeSpentSeconds,
      timestamp: new Date().toISOString(),
    });
  }

  private async sendAnalyticsEvent(
    eventType: string,
    eventData: Record<string, any>,
  ): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .post(`${this.analyticsServiceUrl}/api/analytics/events`, {
            eventType,
            eventData,
          })
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(
                `Failed to send analytics event: ${error.message}`,
                error.stack,
              );
              // We don't want to fail the main request if analytics tracking fails
              return [];
            }),
          ),
      );

      if (response) {
        this.logger.debug(`Analytics event ${eventType} sent successfully`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(
        `Error sending analytics event: ${errorMessage}`,
        errorStack,
      );
      // Swallow the error to prevent it from affecting the main application flow
    }
  }
}
