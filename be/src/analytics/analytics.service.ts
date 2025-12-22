import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsSession } from './analytics-session.entity';
import { AnalyticsPageViewDaily } from './analytics-page-view-daily.entity';
import { TrackAnalyticsDto } from './dto/track-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsSession)
    private readonly sessionsRepo: Repository<AnalyticsSession>,
    @InjectRepository(AnalyticsPageViewDaily)
    private readonly pageViewsRepo: Repository<AnalyticsPageViewDaily>,
  ) {}

  private lastRetentionRunDate: string | null = null;

  private formatUtcDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private normalizePath(path: string): string {
    const trimmed = path.trim();
    if (!trimmed) {
      return '/';
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        return new URL(trimmed).pathname || '/';
      } catch {
        return '/';
      }
    }

    if (!trimmed.startsWith('/')) {
      return `/${trimmed}`;
    }

    return trimmed;
  }

  private parseSource(referrer?: string): string | null {
    if (!referrer) return null;
    const trimmed = referrer.trim();
    if (!trimmed) return null;

    try {
      const url = new URL(trimmed);
      const host = url.host.trim().toLowerCase();
      return host.length > 0 ? host : null;
    } catch {
      return null;
    }
  }

  private async cleanupOldAnalyticsIfNeeded(todayIso: string): Promise<void> {
    if (this.lastRetentionRunDate === todayIso) {
      return;
    }

    this.lastRetentionRunDate = todayIso;

    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 180);

    const cutoffDateIso = this.formatUtcDate(cutoff);

    await this.pageViewsRepo.query(
      'DELETE FROM analytics_page_views_daily WHERE view_date < $1',
      [cutoffDateIso],
    );

    await this.sessionsRepo.query(
      'DELETE FROM analytics_sessions WHERE started_at < $1',
      [cutoff.toISOString()],
    );
  }

  async track(dto: TrackAnalyticsDto): Promise<void> {
    const now = new Date();
    const todayIso = this.formatUtcDate(now);
    const path = this.normalizePath(dto.path);
    const source = this.parseSource(dto.referrer) ?? 'direct';

    try {
      await this.cleanupOldAnalyticsIfNeeded(todayIso);

      const sessionWindowStart = new Date(now.getTime() - 30 * 60 * 1000);

      const session = await this.sessionsRepo
        .createQueryBuilder('s')
        .where('s.visitorId = :visitorId', { visitorId: dto.visitorId })
        .andWhere('s.lastSeenAt >= :windowStart', {
          windowStart: sessionWindowStart.toISOString(),
        })
        .orderBy('s.lastSeenAt', 'DESC')
        .getOne();

      if (session) {
        session.lastSeenAt = now;
        await this.sessionsRepo.save(session);
      } else {
        await this.sessionsRepo.save(
          this.sessionsRepo.create({
            visitorId: dto.visitorId,
            startedAt: now,
            lastSeenAt: now,
            source,
            initialPath: path,
          }),
        );
      }

      const viewDate = todayIso;
      await this.pageViewsRepo.query(
        `
          INSERT INTO analytics_page_views_daily (view_date, path, source, view_count, created_at, updated_at)
          VALUES ($1, $2, $3, 1, now(), now())
          ON CONFLICT (view_date, path, source)
          DO UPDATE SET view_count = analytics_page_views_daily.view_count + 1, updated_at = now()
        `,
        [viewDate, path, source],
      );
    } catch {
      return;
    }
  }
}
