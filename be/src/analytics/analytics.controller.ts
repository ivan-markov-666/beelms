import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RateLimit } from '../security/rate-limit/rate-limit.decorator';
import { AnalyticsService } from './analytics.service';
import { TrackAnalyticsDto } from './dto/track-analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @HttpCode(204)
  @Post('track')
  @RateLimit({ limit: 120, windowSeconds: 60, key: 'ip' })
  async track(@Body() dto: TrackAnalyticsDto): Promise<void> {
    await this.analyticsService.track(dto);
  }
}
