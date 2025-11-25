import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WikiService } from './wiki.service';
import { WikiArticle } from './wiki-article.entity';
import { WikiArticleVersion } from './wiki-article-version.entity';

describe('WikiService', () => {
  let service: WikiService;
  let articleRepo: Repository<WikiArticle>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WikiService,
        {
          provide: getRepositoryToken(WikiArticle),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WikiArticleVersion),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get(WikiService);
    articleRepo = module.get(getRepositoryToken(WikiArticle));
  });

  it('returns active articles with latest published version', async () => {
    const now = new Date();

    (articleRepo.find as jest.Mock).mockResolvedValue([
      {
        id: '1',
        slug: 'getting-started',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        versions: [
          {
            language: 'bg',
            title: 'Начало с QA4Free',
            isPublished: true,
            createdAt: new Date('2023-01-01T00:00:00Z'),
          },
          {
            language: 'en',
            title: 'Getting started with QA4Free',
            isPublished: true,
            createdAt: new Date('2023-01-02T00:00:00Z'),
          },
        ],
      } as unknown as WikiArticle,
    ]);

    const result = await service.getActiveArticlesList();

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('getting-started');
    expect(result[0].language).toBe('en');
    expect(result[0].title).toBe('Getting started with QA4Free');
  });

  it('returns empty array when there are no active articles', async () => {
    (articleRepo.find as jest.Mock).mockResolvedValue([]);

    const result = await service.getActiveArticlesList();

    expect(result).toEqual([]);
  });

  it('skips articles without published versions', async () => {
    (articleRepo.find as jest.Mock).mockResolvedValue([
      {
        id: '1',
        slug: 'draft-article',
        status: 'active',
        versions: [
          {
            language: 'bg',
            title: 'Draft article',
            isPublished: false,
            createdAt: new Date('2023-01-01T00:00:00Z'),
          },
        ],
      } as unknown as WikiArticle,
    ]);

    const result = await service.getActiveArticlesList();

    expect(result).toHaveLength(0);
  });
});
