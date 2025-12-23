import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { User } from './user.entity';
import { WikiArticle } from '../wiki/wiki-article.entity';
import { WikiArticleFeedback } from '../wiki/wiki-article-feedback.entity';
import { WikiArticleView } from '../wiki/wiki-article-view.entity';
import { WikiArticleIpViewDaily } from '../wiki/wiki-article-ip-view-daily.entity';
import { AnalyticsSession } from '../analytics/analytics-session.entity';
import { AnalyticsPageViewDaily } from '../analytics/analytics-page-view-daily.entity';
import {
  AdminMetricsService,
  type MetricsOverview,
} from './admin-metrics.service';

describe('AdminMetricsService', () => {
  let service: AdminMetricsService;
  let usersRepo: jest.Mocked<Repository<User>>;
  let wikiArticleRepo: jest.Mocked<Repository<WikiArticle>>;
  let wikiArticleFeedbackRepo: jest.Mocked<Repository<WikiArticleFeedback>>;
  let wikiArticleIpViewDailyRepo: jest.Mocked<
    Repository<WikiArticleIpViewDaily>
  >;
  let analyticsSessionRepo: jest.Mocked<Repository<AnalyticsSession>>;
  let analyticsPageViewDailyRepo: jest.Mocked<
    Repository<AnalyticsPageViewDaily>
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminMetricsService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WikiArticle),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WikiArticleFeedback),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WikiArticleView),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WikiArticleIpViewDaily),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AnalyticsSession),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AnalyticsPageViewDaily),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AdminMetricsService);
    usersRepo = module.get(getRepositoryToken(User));
    wikiArticleRepo = module.get(getRepositoryToken(WikiArticle));
    wikiArticleFeedbackRepo = module.get(
      getRepositoryToken(WikiArticleFeedback),
    );
    wikiArticleIpViewDailyRepo = module.get(
      getRepositoryToken(WikiArticleIpViewDaily),
    );
    analyticsSessionRepo = module.get(getRepositoryToken(AnalyticsSession));
    analyticsPageViewDailyRepo = module.get(
      getRepositoryToken(AnalyticsPageViewDaily),
    );
  });

  it('getWikiFeedback returns totals, top articles by not helpful and daily points', async () => {
    const qbTotals = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest
        .fn()
        .mockResolvedValue({ helpfulYes: '8', helpfulNo: '2' }),
    };

    const qbTop = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([
          { slug: 'getting-started', helpfulYes: '3', helpfulNo: '2' },
        ]),
    };

    const qbDaily = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([
          { date: '2025-12-22', helpfulYes: '8', helpfulNo: '2' },
        ]),
    };

    (wikiArticleFeedbackRepo.createQueryBuilder as jest.Mock)
      .mockReturnValueOnce(qbTotals)
      .mockReturnValueOnce(qbTop)
      .mockReturnValueOnce(qbDaily);

    const res = await service.getWikiFeedback(undefined, undefined, '10');

    expect(res.totalHelpfulYes).toBe(8);
    expect(res.totalHelpfulNo).toBe(2);
    expect(res.total).toBe(10);
    expect(res.helpfulRate).toBeCloseTo(80);
    expect(res.topArticlesByNotHelpful).toEqual([
      {
        slug: 'getting-started',
        helpfulYes: 3,
        helpfulNo: 2,
        total: 5,
        notHelpfulRate: 40,
      },
    ]);
    expect(res.daily).toEqual([
      {
        date: '2025-12-22',
        helpfulYes: 8,
        helpfulNo: 2,
        total: 10,
      },
    ]);
  });

  it('getWikiAttention returns scored items combining views and feedback', async () => {
    const qbViews = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { slug: 'a', views: '100' },
        { slug: 'b', views: '50' },
      ]),
    };

    const qbFeedback = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { slug: 'a', helpfulYes: '9', helpfulNo: '1' },
        { slug: 'b', helpfulYes: '1', helpfulNo: '9' },
      ]),
    };

    (
      wikiArticleIpViewDailyRepo.createQueryBuilder as jest.Mock
    ).mockReturnValueOnce(qbViews);
    (
      wikiArticleFeedbackRepo.createQueryBuilder as jest.Mock
    ).mockReturnValueOnce(qbFeedback);

    const res = await service.getWikiAttention(undefined, undefined, '10');

    expect(res.items).toHaveLength(2);
    // b: score = 50 * (9/10) = 45
    // a: score = 100 * (1/10) = 10
    expect(res.items[0]?.slug).toBe('b');
    expect(res.items[0]?.views).toBe(50);
    expect(res.items[0]?.helpfulNo).toBe(9);
    expect(res.items[0]?.totalFeedback).toBe(10);
    expect(res.items[0]?.notHelpfulRate).toBeCloseTo(90);
    expect(res.items[0]?.score).toBeCloseTo(45);

    expect(res.items[1]?.slug).toBe('a');
    expect(res.items[1]?.views).toBe(100);
    expect(res.items[1]?.helpfulNo).toBe(1);
    expect(res.items[1]?.totalFeedback).toBe(10);
    expect(res.items[1]?.notHelpfulRate).toBeCloseTo(10);
    expect(res.items[1]?.score).toBeCloseTo(10);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns overview with totalUsers from repository and default values for other fields', async () => {
    (usersRepo.count as jest.Mock).mockResolvedValue(5);
    (wikiArticleRepo.count as jest.Mock).mockResolvedValue(3);

    const result: MetricsOverview = await service.getOverview();

    expect(usersRepo.count).toHaveBeenCalledTimes(2);
    expect(result.totalUsers).toBe(5);
    expect(wikiArticleRepo.count).toHaveBeenCalledTimes(1);
    expect(result.totalArticles).toBe(3);
    expect(Array.isArray(result.topArticles)).toBe(true);
    expect(result.topArticles).toHaveLength(0);
  });

  it('returns overview with totalUsers and monthly change when previous-month data exists', async () => {
    // First call: totalUsers, second call: totalUsersPrevMonth
    (usersRepo.count as jest.Mock)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(8);
    (wikiArticleRepo.count as jest.Mock).mockResolvedValue(2);

    const result: MetricsOverview = await service.getOverview();

    expect(usersRepo.count).toHaveBeenCalledTimes(2);
    expect(wikiArticleRepo.count).toHaveBeenCalledTimes(1);
    expect(result.totalUsers).toBe(10);
    expect(result.totalArticles).toBe(2);
    expect(Array.isArray(result.topArticles)).toBe(true);
    expect(result.topArticles).toHaveLength(0);
    expect(result.usersChangePercentSinceLastMonth).toBeCloseTo(25);
  });

  it('returns null monthly change when there is no previous-month data', async () => {
    (usersRepo.count as jest.Mock)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(0);
    (wikiArticleRepo.count as jest.Mock).mockResolvedValue(0);

    const result = await service.getOverview();

    expect(usersRepo.count).toHaveBeenCalledTimes(2);
    expect(wikiArticleRepo.count).toHaveBeenCalledTimes(1);
    expect(result.totalUsers).toBe(3);
    expect(result.totalArticles).toBe(0);
    expect(result.usersChangePercentSinceLastMonth).toBeNull();
  });

  it('getWikiViews returns aggregated totals, top articles and daily points', async () => {
    const qbTotal = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '12' }),
    };

    const qbTotalUnique = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '5' }),
    };

    const qbTop = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ slug: 'getting-started', views: '7' }]),
    };

    const qbTopUnique = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ slug: 'getting-started', uniqueVisitors: '3' }]),
    };

    const qbDaily = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ date: '2025-12-22', views: '12' }]),
    };

    const qbDailyUnique = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ date: '2025-12-22', uniqueVisitors: '5' }]),
    };

    (wikiArticleIpViewDailyRepo.createQueryBuilder as jest.Mock)
      .mockReturnValueOnce(qbTotal)
      .mockReturnValueOnce(qbTotalUnique)
      .mockReturnValueOnce(qbTop)
      .mockReturnValueOnce(qbTopUnique)
      .mockReturnValueOnce(qbDaily)
      .mockReturnValueOnce(qbDailyUnique);

    const res = await service.getWikiViews(undefined, undefined, '10');

    expect(res.totalViews).toBe(12);
    expect(res.totalUniqueVisitors).toBe(5);
    expect(res.topArticles).toEqual([
      {
        slug: 'getting-started',
        views: 7,
      },
    ]);
    expect(res.topArticlesByUniqueVisitors).toEqual([
      {
        slug: 'getting-started',
        uniqueVisitors: 3,
      },
    ]);
    expect(res.daily).toEqual([
      {
        date: '2025-12-22',
        views: 12,
      },
    ]);
    expect(res.dailyUniqueVisitors).toEqual([
      {
        date: '2025-12-22',
        uniqueVisitors: 5,
      },
    ]);
  });

  it('getAdvancedAnalytics returns aggregated sessions, sources, top pages and daily series', async () => {
    const qbTotalSessions = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '5' }),
    };

    const qbAvg = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ avgSeconds: '42' }),
    };

    const qbSessionSources = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ source: 'direct', sessions: '5' }]),
    };

    const qbDailySessions = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ date: '2025-12-22', value: '5' }]),
    };

    (analyticsSessionRepo.createQueryBuilder as jest.Mock)
      .mockReturnValueOnce(qbTotalSessions)
      .mockReturnValueOnce(qbAvg)
      .mockReturnValueOnce(qbSessionSources)
      .mockReturnValueOnce(qbDailySessions);

    const qbPageViewSources = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ source: 'direct', views: '9' }]),
    };

    const qbTopPages = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          path: '/',
          views: '9',
        },
      ]),
    };

    const qbDailyPageViews = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ date: '2025-12-22', value: '9' }]),
    };

    (analyticsPageViewDailyRepo.createQueryBuilder as jest.Mock)
      .mockReturnValueOnce(qbPageViewSources)
      .mockReturnValueOnce(qbTopPages)
      .mockReturnValueOnce(qbDailyPageViews);

    const res = await service.getAdvancedAnalytics(undefined, undefined, '10');

    expect(res.totalSessions).toBe(5);
    expect(res.avgSessionDurationSeconds).toBe(42);
    expect(res.sessionSources).toEqual([{ source: 'direct', sessions: 5 }]);
    expect(res.pageViewSources).toEqual([{ source: 'direct', views: 9 }]);
    expect(res.topPages).toEqual([{ path: '/', views: 9 }]);
    expect(res.dailySessions).toEqual([{ date: '2025-12-22', value: 5 }]);
    expect(res.dailyPageViews).toEqual([{ date: '2025-12-22', value: 9 }]);
  });
});
