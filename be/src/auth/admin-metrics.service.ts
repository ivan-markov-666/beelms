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

@Injectable()
export class AdminMetricsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(WikiArticle)
    private readonly wikiArticleRepo: Repository<WikiArticle>,
    @InjectRepository(WikiArticleView)
    private readonly wikiArticleViewRepo: Repository<WikiArticleView>,
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
