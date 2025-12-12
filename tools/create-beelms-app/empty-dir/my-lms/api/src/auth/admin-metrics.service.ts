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

@Injectable()
export class AdminMetricsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(WikiArticle)
    private readonly wikiArticleRepo: Repository<WikiArticle>,
  ) {}

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
