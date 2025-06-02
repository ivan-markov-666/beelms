import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
@Controller('api/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @ApiOperation({ summary: 'Record an analytics event' })
  @ApiResponse({ status: 201, description: 'Event recorded successfully' })
  async createEvent(
    @Body() createEventDto: CreateEventDto,
  ): Promise<AnalyticsEvent> {
    return this.analyticsService.createEvent(createEventDto);
  }

  @Get('user-progress/:userId')
  @ApiOperation({ summary: 'Get progress for a specific user' })
  @ApiResponse({ status: 200, description: 'User progress data' })
  async getUserProgress(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() dateRange: DateRangeDto,
  ): Promise<UserProgress> {
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

  @Get('aggregate-performance')
  @ApiOperation({ summary: 'Get aggregate performance report' })
  @ApiResponse({ status: 200, description: 'Aggregate performance data' })
  async getAggregatePerformanceReport(
    @Query() dateRange: DateRangeDto,
  ): Promise<AggregatePerformanceReport> {
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

  @Get('export')
  @ApiOperation({ summary: 'Export analytics data' })
  @ApiResponse({ status: 200, description: 'Exported analytics data' })
  async exportData(@Query() query: ExportDataDto): Promise<ExportDataResponse> {
    return this.analyticsService.exportData(query);
  }
}
