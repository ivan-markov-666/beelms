import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import {
  AdminMetricsService,
  type MetricsOverview,
  type AdminMetricsActivitySummary,
  type AdminWikiViewsMetrics,
  type AdminAdvancedMetrics,
} from './admin-metrics.service';

@Controller('admin/metrics')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminMetricsController {
  constructor(private readonly metricsService: AdminMetricsService) {}

  @Get('overview')
  async getOverview(): Promise<MetricsOverview> {
    return this.metricsService.getOverview();
  }

  @Get('activity-summary')
  async getActivitySummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<AdminMetricsActivitySummary> {
    return this.metricsService.getActivitySummary(from, to);
  }

  @Get('wiki-views')
  async getWikiViews(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ): Promise<AdminWikiViewsMetrics> {
    return this.metricsService.getWikiViews(from, to, limit);
  }

  @Get('advanced')
  async getAdvanced(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ): Promise<AdminAdvancedMetrics> {
    return this.metricsService.getAdvancedAnalytics(from, to, limit);
  }

  @Get('advanced/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="advanced-metrics.csv"')
  async exportAdvanced(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ): Promise<string> {
    return this.metricsService.getAdvancedAnalyticsCsv(from, to, limit);
  }
}
