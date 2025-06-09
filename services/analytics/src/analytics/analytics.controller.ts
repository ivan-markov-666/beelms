import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { PublicApi } from '../auth/decorators/public-api.decorator';
import { User } from '../auth/interfaces/user.interface';
import { AnalyticsService } from './analytics.service';
import { CreateEventDto } from './dto/create-event.dto';
import {
  DateRangeDto,
  ExportDataDto,
  TestStatisticsQueryDto,
  UserProgressQueryDto,
} from './dto/query-analytics.dto';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import {
  AggregatePerformanceReport,
  CourseCompletionRates,
  ExportDataResponse,
  IndividualPerformanceReport,
  TestStatistics,
  UserProgress,
} from './interfaces/analytics-response.interface';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('api/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Запис на аналитично събитие - достъпно за всички потребители
   */
  @Post('events')
  @PublicApi()
  @ApiOperation({ summary: 'Record an analytics event (Public endpoint)' })
  @ApiResponse({ status: 201, description: 'Event recorded successfully' })
  async createEvent(
    @Body() createEventDto: CreateEventDto,
  ): Promise<AnalyticsEvent> {
    // Публичен ендпойнт, не изисква JWT автентикация
    return this.analyticsService.createEvent(createEventDto);
  }

  /**
   * Получаване на прогрес за потребител. Достъп имат администратори
   * или самият потребител за собствения му прогрес.
   */
  @Get('user-progress/:userId')
  @ApiOperation({ summary: 'Get progress for a specific user' })
  @ApiResponse({ status: 200, description: 'User progress data' })
  async getUserProgress(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() dateRange: DateRangeDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserProgress> {
    Logger.log(
      `User ${currentUser.userId} requested progress for user ${userId}`,
    );

    // Проверка дали текущият потребител има право да вижда данните за потребителя
    if (
      currentUser.userId !== userId.toString() &&
      !currentUser.roles?.includes(UserRole.ADMIN)
    ) {
      throw new Error(
        'Unauthorized: You can only view your own progress unless you are an admin',
      );
    }

    const query: UserProgressQueryDto = { userId, ...dateRange };
    return this.analyticsService.getUserProgress(query);
  }

  @Get('test-statistics/:testId')
  @ApiOperation({ summary: 'Get statistics for a specific test' })
  @ApiResponse({ status: 200, description: 'Test statistics data' })
  async getTestStatistics(
    @Param('testId', ParseIntPipe) testId: number,
    @Query() dateRange: DateRangeDto,
  ): Promise<TestStatistics> {
    const query: TestStatisticsQueryDto = { testId, ...dateRange };
    return this.analyticsService.getTestStatistics(query);
  }

  @Get('course-completion-rates')
  @ApiOperation({ summary: 'Get course completion rates' })
  @ApiResponse({ status: 200, description: 'Course completion rate data' })
  async getCourseCompletionRates(
    @Query() dateRange: DateRangeDto,
  ): Promise<CourseCompletionRates> {
    return this.analyticsService.getCourseCompletionRates(dateRange);
  }

  /**
   * Получаване на агрегирани данни за представянето - само за администратори
   */
  @Get('aggregate-performance')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get aggregate performance report (Admin only)' })
  @ApiResponse({ status: 200, description: 'Aggregate performance data' })
  async getAggregatePerformanceReport(
    @Query() dateRange: DateRangeDto,
    @CurrentUser() currentUser: User,
  ): Promise<AggregatePerformanceReport> {
    Logger.log(
      `Admin ${currentUser.email} requested aggregate performance report`,
    );
    return this.analyticsService.getAggregatePerformanceReport(dateRange);
  }

  @Get('individual-performance/:userId')
  @ApiOperation({ summary: 'Get individual performance report for a user' })
  @ApiResponse({ status: 200, description: 'Individual performance data' })
  async getIndividualPerformanceReport(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() dateRange: DateRangeDto,
  ): Promise<IndividualPerformanceReport> {
    const query: UserProgressQueryDto = { userId, ...dateRange };
    return this.analyticsService.getIndividualPerformanceReport(query);
  }

  /**
   * Експорт на аналитични данни - само за инструктори и администратори
   */
  @Get('export')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Export analytics data (Admin only)' })
  @ApiResponse({ status: 200, description: 'Exported analytics data' })
  async exportData(
    @Query() query: ExportDataDto,
    @CurrentUser() currentUser: User,
  ): Promise<ExportDataResponse> {
    Logger.log(
      `User ${currentUser.email} with role(s) ${currentUser.roles?.join(', ')} requested analytics export`,
    );
    return this.analyticsService.exportData(query);
  }
}
