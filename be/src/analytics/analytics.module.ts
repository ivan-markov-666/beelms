import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsSession } from './analytics-session.entity';
import { AnalyticsPageViewDaily } from './analytics-page-view-daily.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsSession, AnalyticsPageViewDaily]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService, TypeOrmModule],
})
export class AnalyticsModule {}
