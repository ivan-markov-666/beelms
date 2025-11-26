import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WikiService } from './wiki.service';
import { WikiArticle } from './wiki-article.entity';
import { WikiArticleVersion } from './wiki-article-version.entity';

/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

describe('WikiService', () => {
  let service: WikiService;
  let articleRepo: { find: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WikiService,
        {
          provide: getRepositoryToken(WikiArticle),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
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

  it('uses default pagination when page and pageSize are not provided', async () => {
    (articleRepo.find as jest.Mock).mockResolvedValue([]);

    await service.getActiveArticlesList();

    expect(articleRepo.find as jest.Mock).toHaveBeenCalledTimes(1);
    const firstCall = (articleRepo.find as jest.Mock).mock.calls[0] as [
      {
        skip: number;
        take: number;
      },
    ];
    const options = firstCall[0];
    expect(options.skip).toBe(0);
    expect(options.take).toBe(20);
  });

  it('normalizes invalid page and pageSize to safe defaults', async () => {
    (articleRepo.find as jest.Mock).mockResolvedValue([]);

    await service.getActiveArticlesList(0, 0);
    await service.getActiveArticlesList(-1, -5);

    expect(articleRepo.find as jest.Mock).toHaveBeenCalledTimes(2);

    const calls = (articleRepo.find as jest.Mock).mock.calls as [
      {
        skip: number;
        take: number;
      }[],
    ];

    for (let i = 0; i < calls.length; i += 1) {
      const call = calls[i];
      const options = call[0];
      expect(options.skip).toBe(0);
      expect(options.take).toBe(20);
    }
  });

  it('calculates skip and take for given page and pageSize', async () => {
    (articleRepo.find as jest.Mock).mockResolvedValue([]);

    await service.getActiveArticlesList(2, 10);

    expect(articleRepo.find as jest.Mock).toHaveBeenCalledTimes(1);
    const firstCall = (articleRepo.find as jest.Mock).mock.calls[0] as [
      {
        skip: number;
        take: number;
      },
    ];
    const options = firstCall[0];
    expect(options.skip).toBe(10);
    expect(options.take).toBe(10);
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

    const result = (await service.getActiveArticlesList()) as {
      slug: string;
      language: string;
      title: string;
    }[];

    expect(result).toHaveLength(1);
    const first = result[0];
    expect(first.slug).toBe('getting-started');
    expect(first.language).toBe('en');
    expect(first.title).toBe('Getting started with QA4Free');
  });

  it('filters list by language when lang filter is provided', async () => {
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

    const result = (await service.getActiveArticlesList(
      undefined,
      undefined,
      undefined,
      'bg',
    )) as {
      slug: string;
      language: string;
      title: string;
    }[];

    expect(result).toHaveLength(1);
    const first = result[0];
    expect(first.slug).toBe('getting-started');
    expect(first.language).toBe('bg');
    expect(first.title).toBe('Начало с QA4Free');
  });

  it('filters list by search query when q filter is provided', async () => {
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
        ],
      } as unknown as WikiArticle,
      {
        id: '2',
        slug: 'faq',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        versions: [
          {
            language: 'bg',
            title: 'Често задавани въпроси (FAQ)',
            isPublished: true,
            createdAt: new Date('2023-01-01T00:00:00Z'),
          },
        ],
      } as unknown as WikiArticle,
    ]);

    const result = (await service.getActiveArticlesList(
      undefined,
      undefined,
      'начало',
    )) as {
      slug: string;
      language: string;
      title: string;
    }[];

    expect(result).toHaveLength(1);
    const first = result[0];
    expect(first.slug).toBe('getting-started');
    expect(first.title).toBe('Начало с QA4Free');
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

  it('getArticleBySlug returns latest published version for given language', async () => {
    const now = new Date();

    (articleRepo.findOne as jest.Mock).mockResolvedValue({
      id: '1',
      slug: 'getting-started',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      versions: [
        {
          language: 'bg',
          title: 'Стара BG версия',
          content: 'old',
          isPublished: true,
          createdAt: new Date('2023-01-01T00:00:00Z'),
        },
        {
          language: 'bg',
          title: 'Нова BG версия',
          content: 'new',
          isPublished: true,
          createdAt: new Date('2023-01-02T00:00:00Z'),
        },
        {
          language: 'en',
          title: 'English version',
          content: 'en content',
          isPublished: true,
          createdAt: new Date('2023-01-03T00:00:00Z'),
        },
      ],
    } as unknown as WikiArticle);

    const result = await service.getArticleBySlug('getting-started', 'bg');

    expect(result.slug).toBe('getting-started');
    expect(result.language).toBe('bg');
    expect(result.title).toBe('Нова BG версия');
    expect(result.content).toBe('new');
  });

  it('getArticleBySlug falls back to default language when lang is not provided', async () => {
    const now = new Date();

    (articleRepo.findOne as jest.Mock).mockResolvedValue({
      id: '2',
      slug: 'faq',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      versions: [
        {
          language: 'bg',
          title: 'FAQ BG',
          content: 'bg content',
          isPublished: true,
          createdAt: new Date('2023-01-01T00:00:00Z'),
        },
        {
          language: 'en',
          title: 'FAQ EN',
          content: 'en content',
          isPublished: true,
          createdAt: new Date('2023-01-02T00:00:00Z'),
        },
      ],
    } as unknown as WikiArticle);

    const result = await service.getArticleBySlug('faq');

    expect(result.slug).toBe('faq');
    expect(result.language).toBe('bg');
    expect(result.title).toBe('FAQ BG');
  });

  it('getArticleBySlug throws NotFoundException when article is not found', async () => {
    (articleRepo.findOne as jest.Mock).mockResolvedValue(undefined);

    await expect(service.getArticleBySlug('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getArticleBySlug throws NotFoundException when no published version for requested language', async () => {
    const now = new Date();

    (articleRepo.findOne as jest.Mock).mockResolvedValue({
      id: '3',
      slug: 'only-en',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      versions: [
        {
          language: 'en',
          title: 'Only EN',
          content: 'en content',
          isPublished: true,
          createdAt: new Date('2023-01-01T00:00:00Z'),
        },
      ],
    } as unknown as WikiArticle);

    await expect(
      service.getArticleBySlug('only-en', 'bg'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getArticleBySlug falls back to any language when default language is not available', async () => {
    const now = new Date();

    (articleRepo.findOne as jest.Mock).mockResolvedValue({
      id: '4',
      slug: 'only-en-fallback',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      versions: [
        {
          language: 'en',
          title: 'EN only article',
          content: 'en content',
          isPublished: true,
          createdAt: new Date('2023-01-02T00:00:00Z'),
        },
      ],
    } as unknown as WikiArticle);

    const result = await service.getArticleBySlug('only-en-fallback');

    expect(result.slug).toBe('only-en-fallback');
    expect(result.language).toBe('en');
    expect(result.title).toBe('EN only article');
  });

  it('getArticleBySlug throws NotFoundException when there are no published versions', async () => {
    const now = new Date();

    (articleRepo.findOne as jest.Mock).mockResolvedValue({
      id: '5',
      slug: 'no-published',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      versions: [
        {
          language: 'bg',
          title: 'Draft BG',
          content: 'draft bg',
          isPublished: false,
          createdAt: new Date('2023-01-01T00:00:00Z'),
        },
        {
          language: 'en',
          title: 'Draft EN',
          content: 'draft en',
          isPublished: false,
          createdAt: new Date('2023-01-02T00:00:00Z'),
        },
      ],
    } as unknown as WikiArticle);

    await expect(
      service.getArticleBySlug('no-published'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getArticleBySlug propagates unexpected errors from repository', async () => {
    (articleRepo.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));

    await expect(service.getArticleBySlug('getting-started')).rejects.toThrow(
      'DB error',
    );
  });
});
