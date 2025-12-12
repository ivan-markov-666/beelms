import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import {
  AdminMetricsService,
  type MetricsOverview,
  type AdminMetricsActivitySummary,
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
}
