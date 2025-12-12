import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { User } from './user.entity';
import { WikiArticle } from '../wiki/wiki-article.entity';
import {
  AdminMetricsService,
  type MetricsOverview,
} from './admin-metrics.service';

describe('AdminMetricsService', () => {
  let service: AdminMetricsService;
  let usersRepo: jest.Mocked<Repository<User>>;
  let wikiArticleRepo: jest.Mocked<Repository<WikiArticle>>;

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
      ],
    }).compile();

    service = module.get(AdminMetricsService);
    usersRepo = module.get(getRepositoryToken(User));
    wikiArticleRepo = module.get(getRepositoryToken(WikiArticle));
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
});
