import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { User } from './user.entity';
import {
  AdminMetricsService,
  type MetricsOverview,
} from './admin-metrics.service';

describe('AdminMetricsService', () => {
  let service: AdminMetricsService;
  let usersRepo: jest.Mocked<Repository<User>>;

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
      ],
    }).compile();

    service = module.get(AdminMetricsService);
    usersRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns overview with totalUsers from repository and default values for other fields', async () => {
    (usersRepo.count as jest.Mock).mockResolvedValue(5);

    const result: MetricsOverview = await service.getOverview();

    expect(usersRepo.count).toHaveBeenCalledTimes(1);
    expect(result.totalUsers).toBe(5);
    expect(result.totalArticles).toBe(0);
    expect(Array.isArray(result.topArticles)).toBe(true);
    expect(result.topArticles).toHaveLength(0);
  });
});
