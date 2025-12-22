import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  LessThan,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
  type FindOperator,
} from 'typeorm';
import { User } from './user.entity';
import { WikiArticle } from '../wiki/wiki-article.entity';
import { WikiArticleView } from '../wiki/wiki-article-view.entity';
import { AnalyticsSession } from '../analytics/analytics-session.entity';
import { AnalyticsPageViewDaily } from '../analytics/analytics-page-view-daily.entity';

export type MetricsOverview = {
  totalUsers: number;
  totalArticles: number;
  topArticles: Array<{ slug: string }>;
  usersChangePercentSinceLastMonth: number | null;
};

export type AdminMetricsUserTrendPoint = {
  month: string;
  userRegistered: number;
  userDeactivated: number;
};

export type AdminMetricsActivitySummary = {
  userRegistered: number;
  userDeactivated: number;
  articleCreated: number;
  articleUpdated: number;
  userTrend: AdminMetricsUserTrendPoint[];
};

export type AdminWikiViewsTopArticle = {
  slug: string;
  views: number;
};

export type AdminWikiViewsDailyPoint = {
  date: string;
  views: number;
};

export type AdminWikiViewsMetrics = {
  totalViews: number;
  topArticles: AdminWikiViewsTopArticle[];
  daily: AdminWikiViewsDailyPoint[];
};

export type AdminAdvancedMetricsSourcePoint = {
  source: string;
  sessions: number;
};

export type AdminAdvancedMetricsPageSourcePoint = {
  source: string;
  views: number;
};

export type AdminAdvancedMetricsTopPage = {
  path: string;
  views: number;
};

export type AdminAdvancedMetricsDailyPoint = {
  date: string;
  value: number;
};

export type AdminAdvancedMetrics = {
  totalSessions: number;
  avgSessionDurationSeconds: number;
  sessionSources: AdminAdvancedMetricsSourcePoint[];
  pageViewSources: AdminAdvancedMetricsPageSourcePoint[];
  topPages: AdminAdvancedMetricsTopPage[];
  dailySessions: AdminAdvancedMetricsDailyPoint[];
  dailyPageViews: AdminAdvancedMetricsDailyPoint[];
};

@Injectable()
export class AdminMetricsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(WikiArticle)
    private readonly wikiArticleRepo: Repository<WikiArticle>,
    @InjectRepository(WikiArticleView)
    private readonly wikiArticleViewRepo: Repository<WikiArticleView>,
    @InjectRepository(AnalyticsSession)
    private readonly analyticsSessionRepo: Repository<AnalyticsSession>,
    @InjectRepository(AnalyticsPageViewDaily)
    private readonly analyticsPageViewDailyRepo: Repository<AnalyticsPageViewDaily>,
  ) {}

  private formatUtcDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  async getOverview(): Promise<MetricsOverview> {
    const totalUsers = await this.usersRepo.count();

    const now = new Date();
    const startOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

    const totalUsersPrevMonth = await this.usersRepo.count({
      where: {
        createdAt: LessThan(startOfCurrentMonth),
      },
    });

    let usersChangePercentSinceLastMonth: number | null = null;

    if (totalUsersPrevMonth > 0) {
      usersChangePercentSinceLastMonth =
        ((totalUsers - totalUsersPrevMonth) / totalUsersPrevMonth) * 100;
    }

    const totalArticles = await this.wikiArticleRepo.count();

    return {
      totalUsers,
      totalArticles,
      topArticles: [],
      usersChangePercentSinceLastMonth,
    };
  }

  private parseDateParam(value?: string): Date | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  }

  async getAdvancedAnalytics(
    from?: string,
    to?: string,
    limit?: string,
  ): Promise<AdminAdvancedMetrics> {
    const parsedFrom = this.parseDateParam(from);
    const parsedTo = this.parseDateParam(to);

    const now = new Date();
    const toDate = parsedTo ?? now;
    const fromDate =
      parsedFrom ?? new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const fromIsoDate = this.formatUtcDate(fromDate);
    const toIsoDate = this.formatUtcDate(toDate);

    const fromTs = fromDate.toISOString();
    const toTs = toDate.toISOString();

    const safeLimit = (() => {
      const n = limit ? Number(limit) : 10;
      if (!Number.isFinite(n) || n <= 0) return 10;
      return Math.min(50, Math.floor(n));
    })();

    const totalSessionsRow = await this.analyticsSessionRepo
      .createQueryBuilder('s')
      .select('COUNT(*)', 'total')
      .where('s.startedAt BETWEEN :from AND :to', { from: fromTs, to: toTs })
      .getRawOne<{ total: string }>();

    const totalSessions = Number(totalSessionsRow?.total ?? 0);

    const avgDurationRow = await this.analyticsSessionRepo
      .createQueryBuilder('s')
      .select(
        'COALESCE(AVG(EXTRACT(EPOCH FROM (s.lastSeenAt - s.startedAt))), 0)',
        'avgSeconds',
      )
      .where('s.startedAt BETWEEN :from AND :to', { from: fromTs, to: toTs })
      .getRawOne<{ avgSeconds: string }>();

    const avgSessionDurationSeconds = Math.round(
      Number(avgDurationRow?.avgSeconds ?? 0),
    );

    const sessionSourcesRows = await this.analyticsSessionRepo
      .createQueryBuilder('s')
      .select("COALESCE(s.source, 'direct')", 'source')
      .addSelect('COUNT(*)', 'sessions')
      .where('s.startedAt BETWEEN :from AND :to', { from: fromTs, to: toTs })
      .groupBy("COALESCE(s.source, 'direct')")
      .orderBy('sessions', 'DESC')
      .limit(safeLimit)
      .getRawMany<{ source: string; sessions: string }>();

    const sessionSources: AdminAdvancedMetricsSourcePoint[] = (
      sessionSourcesRows ?? []
    ).map((r) => ({
      source: r.source,
      sessions: Number(r.sessions ?? 0),
    }));

    const pageViewSourcesRows = await this.analyticsPageViewDailyRepo
      .createQueryBuilder('p')
      .select('p.source', 'source')
      .addSelect('SUM(p.viewCount)', 'views')
      .where('p.viewDate BETWEEN :from AND :to', {
        from: fromIsoDate,
        to: toIsoDate,
      })
      .groupBy('p.source')
      .orderBy('views', 'DESC')
      .limit(safeLimit)
      .getRawMany<{ source: string; views: string }>();

    const pageViewSources: AdminAdvancedMetricsPageSourcePoint[] = (
      pageViewSourcesRows ?? []
    ).map((r) => ({
      source: r.source,
      views: Number(r.views ?? 0),
    }));

    const topPagesRows = await this.analyticsPageViewDailyRepo
      .createQueryBuilder('p')
      .select('p.path', 'path')
      .addSelect('SUM(p.viewCount)', 'views')
      .where('p.viewDate BETWEEN :from AND :to', {
        from: fromIsoDate,
        to: toIsoDate,
      })
      .groupBy('p.path')
      .orderBy('views', 'DESC')
      .limit(safeLimit)
      .getRawMany<{ path: string; views: string }>();

    const topPages: AdminAdvancedMetricsTopPage[] = (topPagesRows ?? []).map(
      (r) => ({
        path: r.path,
        views: Number(r.views ?? 0),
      }),
    );

    const dailySessionsRows = await this.analyticsSessionRepo
      .createQueryBuilder('s')
      .select("to_char(date_trunc('day', s.startedAt), 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'value')
      .where('s.startedAt BETWEEN :from AND :to', { from: fromTs, to: toTs })
      .groupBy("to_char(date_trunc('day', s.startedAt), 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; value: string }>();

    const dailySessions: AdminAdvancedMetricsDailyPoint[] = (
      dailySessionsRows ?? []
    ).map((r) => ({
      date: r.date,
      value: Number(r.value ?? 0),
    }));

    const dailyPageViewsRows = await this.analyticsPageViewDailyRepo
      .createQueryBuilder('p')
      .select('p.viewDate', 'date')
      .addSelect('SUM(p.viewCount)', 'value')
      .where('p.viewDate BETWEEN :from AND :to', {
        from: fromIsoDate,
        to: toIsoDate,
      })
      .groupBy('p.viewDate')
      .orderBy('p.viewDate', 'ASC')
      .getRawMany<{ date: string; value: string }>();

    const dailyPageViews: AdminAdvancedMetricsDailyPoint[] = (
      dailyPageViewsRows ?? []
    ).map((r) => ({
      date: r.date,
      value: Number(r.value ?? 0),
    }));

    return {
      totalSessions,
      avgSessionDurationSeconds,
      sessionSources,
      pageViewSources,
      topPages,
      dailySessions,
      dailyPageViews,
    };
  }

  async getAdvancedAnalyticsCsv(
    from?: string,
    to?: string,
    limit?: string,
  ): Promise<string> {
    const data = await this.getAdvancedAnalytics(from, to, limit);

    const lines: string[] = [];

    lines.push('metric,value');
    lines.push(`totalSessions,${data.totalSessions}`);
    lines.push(`avgSessionDurationSeconds,${data.avgSessionDurationSeconds}`);
    lines.push('');

    lines.push('sessionSources_source,sessionSources_sessions');
    for (const r of data.sessionSources) {
      lines.push(`${JSON.stringify(r.source)},${r.sessions}`);
    }
    lines.push('');

    lines.push('pageViewSources_source,pageViewSources_views');
    for (const r of data.pageViewSources) {
      lines.push(`${JSON.stringify(r.source)},${r.views}`);
    }
    lines.push('');

    lines.push('topPages_path,topPages_views');
    for (const r of data.topPages) {
      lines.push(`${JSON.stringify(r.path)},${r.views}`);
    }
    lines.push('');

    lines.push('dailySessions_date,dailySessions_value');
    for (const r of data.dailySessions) {
      lines.push(`${r.date},${r.value}`);
    }
    lines.push('');

    lines.push('dailyPageViews_date,dailyPageViews_value');
    for (const r of data.dailyPageViews) {
      lines.push(`${r.date},${r.value}`);
    }

    return lines.join('\n');
  }

  async getWikiViews(
    from?: string,
    to?: string,
    limit?: string,
  ): Promise<AdminWikiViewsMetrics> {
    const parsedFrom = this.parseDateParam(from);
    const parsedTo = this.parseDateParam(to);

    const now = new Date();
    const toDate = parsedTo ?? now;
    const fromDate =
      parsedFrom ?? new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const fromIso = this.formatUtcDate(fromDate);
    const toIso = this.formatUtcDate(toDate);

    const safeLimit = (() => {
      const n = limit ? Number(limit) : 10;
      if (!Number.isFinite(n) || n <= 0) return 10;
      return Math.min(50, Math.floor(n));
    })();

    const totalRow = await this.wikiArticleViewRepo
      .createQueryBuilder('v')
      .select('COALESCE(SUM(v.viewCount), 0)', 'total')
      .where('v.viewDate BETWEEN :from AND :to', { from: fromIso, to: toIso })
      .getRawOne<{ total: string }>();

    const totalViews = Number(totalRow?.total ?? 0);

    const topRows = await this.wikiArticleViewRepo
      .createQueryBuilder('v')
      .innerJoin(WikiArticle, 'a', 'a.id = v.articleId')
      .select('a.slug', 'slug')
      .addSelect('SUM(v.viewCount)', 'views')
      .where('v.viewDate BETWEEN :from AND :to', { from: fromIso, to: toIso })
      .groupBy('a.slug')
      .orderBy('views', 'DESC')
      .limit(safeLimit)
      .getRawMany<{ slug: string; views: string }>();

    const topArticles: AdminWikiViewsTopArticle[] = (topRows ?? []).map(
      (r) => ({
        slug: r.slug,
        views: Number(r.views ?? 0),
      }),
    );

    const dailyRows = await this.wikiArticleViewRepo
      .createQueryBuilder('v')
      .select('v.viewDate', 'date')
      .addSelect('SUM(v.viewCount)', 'views')
      .where('v.viewDate BETWEEN :from AND :to', { from: fromIso, to: toIso })
      .groupBy('v.viewDate')
      .orderBy('v.viewDate', 'ASC')
      .getRawMany<{ date: string; views: string }>();

    const daily: AdminWikiViewsDailyPoint[] = (dailyRows ?? []).map((r) => ({
      date: r.date,
      views: Number(r.views ?? 0),
    }));

    return {
      totalViews,
      topArticles,
      daily,
    };
  }

  // Small helper to build a TypeORM range condition for date fields
  // Returns undefined when there is no restriction for the given side
  private buildDateCondition(
    from: Date | null,
    to: Date | null,
  ): FindOperator<Date> | undefined {
    if (from && to) {
      return Between(from, to);
    }
    if (from) {
      return MoreThanOrEqual(from);
    }
    if (to) {
      return LessThanOrEqual(to);
    }
    return undefined;
  }

  async getActivitySummary(
    from?: string,
    to?: string,
  ): Promise<AdminMetricsActivitySummary> {
    const fromDate = this.parseDateParam(from);
    const toDate = this.parseDateParam(to);

    const createdCond = this.buildDateCondition(fromDate, toDate);

    const registeredUsers = await this.usersRepo.find({
      where: createdCond ? { createdAt: createdCond } : {},
      select: ['id', 'createdAt'],
    });

    const updatedCond = this.buildDateCondition(fromDate, toDate);
    const deactivatedWhere: Record<string, unknown> = { active: false };
    if (updatedCond) {
      deactivatedWhere.updatedAt = updatedCond;
    }
    const deactivatedUsers = await this.usersRepo.find({
      where: deactivatedWhere,
      select: ['id', 'createdAt', 'updatedAt'],
    });

    const wikiCreatedCond = this.buildDateCondition(fromDate, toDate);
    const createdArticles = await this.wikiArticleRepo.find({
      where: wikiCreatedCond ? { createdAt: wikiCreatedCond } : {},
      select: ['id', 'createdAt'],
    });

    const wikiUpdatedCond = this.buildDateCondition(fromDate, toDate);
    const updatedArticles = await this.wikiArticleRepo.find({
      where: wikiUpdatedCond ? { updatedAt: wikiUpdatedCond } : {},
      select: ['id', 'updatedAt'],
    });

    const userRegistered = registeredUsers.length;
    const userDeactivated = deactivatedUsers.length;
    const articleCreated = createdArticles.length;
    const articleUpdated = updatedArticles.length;

    const buckets: Record<
      string,
      { userRegistered: number; userDeactivated: number }
    > = {};

    for (const user of registeredUsers) {
      const d = user.createdAt;
      if (!d) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}`;
      if (!buckets[key]) {
        buckets[key] = { userRegistered: 0, userDeactivated: 0 };
      }
      buckets[key].userRegistered += 1;
    }

    for (const user of deactivatedUsers) {
      const d = user.updatedAt ?? user.createdAt;
      if (!d) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}`;
      if (!buckets[key]) {
        buckets[key] = { userRegistered: 0, userDeactivated: 0 };
      }
      buckets[key].userDeactivated += 1;
    }

    const months = Object.keys(buckets).sort();
    const userTrend: AdminMetricsUserTrendPoint[] = months.map((month) => ({
      month,
      userRegistered: buckets[month].userRegistered,
      userDeactivated: buckets[month].userDeactivated,
    }));

    return {
      userRegistered,
      userDeactivated,
      articleCreated,
      articleUpdated,
      userTrend,
    };
  }
}
