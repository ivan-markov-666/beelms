import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WikiService } from './wiki.service';
import { WikiArticle } from './wiki-article.entity';
import { WikiArticleVersion } from './wiki-article-version.entity';
import { WikiArticleFeedback } from './wiki-article-feedback.entity';
import { WikiArticleView } from './wiki-article-view.entity';
import { WikiArticleIpViewDaily } from './wiki-article-ip-view-daily.entity';
import { User } from '../auth/user.entity';

/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

describe('WikiService', () => {
  let service: WikiService;
  let articleRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
  };
  let versionRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
  };
  let usersRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WikiService,
        {
          provide: getRepositoryToken(WikiArticle),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn((entity) => entity),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WikiArticleVersion),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn((entity) => entity),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WikiArticleFeedback),
          useValue: {
            findOne: jest.fn(),
            count: jest.fn(),
            save: jest.fn(),
            create: jest.fn((entity) => entity),
          },
        },
        {
          provide: getRepositoryToken(WikiArticleView),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn((entity) => entity),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WikiArticleIpViewDaily),
          useValue: {
            delete: jest.fn(),
            query: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(WikiService);
    articleRepo = module.get(getRepositoryToken(WikiArticle));
    versionRepo = module.get(getRepositoryToken(WikiArticleVersion));
    usersRepo = module.get<{ find: jest.Mock; findOne: jest.Mock }>(
      getRepositoryToken(User),
    );

    (usersRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'admin-user',
      active: true,
      role: 'admin',
    });
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
            title: 'Начало с платформата',
            isPublished: true,
            createdAt: new Date('2023-01-01T00:00:00Z'),
          },
          {
            language: 'en',
            title: 'Getting started with the platform',
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
    expect(first.title).toBe('Getting started with the platform');
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
            title: 'Начало с платформата',
            isPublished: true,
            createdAt: new Date('2023-01-01T00:00:00Z'),
          },
          {
            language: 'en',
            title: 'Getting started with the platform',
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
    expect(first.title).toBe('Начало с платформата');
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
            title: 'Начало с платформата',
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
    expect(first.title).toBe('Начало с платформата');
  });

  it('returns empty array when there are no active articles', async () => {
    (articleRepo.find as jest.Mock).mockResolvedValue([]);

    const result = await service.getActiveArticlesList();

    expect(result).toEqual([]);
  });

  it('getAdminArticlesList uses default pagination when page and pageSize are not provided', async () => {
    (usersRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'admin-user',
      active: true,
      role: 'admin',
    });
    (articleRepo.find as jest.Mock).mockResolvedValue([]);

    await service.getAdminArticlesList('admin-user');

    expect(articleRepo.find as jest.Mock).toHaveBeenCalledTimes(1);
    const firstCall = (articleRepo.find as jest.Mock).mock.calls[0] as [
      {
        skip?: number;
        take?: number;
      },
    ];
    const options = firstCall[0];
    expect(options.skip).toBeUndefined();
    expect(options.take).toBeUndefined();
  });

  it('getAdminArticlesList returns articles with status and updatedAt', async () => {
    (usersRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'admin-user',
      active: true,
      role: 'admin',
    });
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
            title: 'Начало с платформата (draft)',
            isPublished: false,
            createdAt: now,
          },
        ],
      } as unknown as WikiArticle,
    ]);

    const result = await service.getAdminArticlesList('admin-user');

    expect(result).toHaveLength(1);
    const first = result[0] as { status: string; updatedAt: string };
    expect(first.status).toBe('active');
    expect(typeof first.updatedAt).toBe('string');
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

  describe('adminUpdateArticle', () => {
    it('updates article status and creates a new version with incremented versionNumber', async () => {
      const now = new Date('2023-01-10T00:00:00Z');

      (articleRepo.findOne as jest.Mock).mockResolvedValue({
        id: '1',
        slug: 'getting-started',
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        versions: [],
      } as unknown as WikiArticle);

      (versionRepo.find as jest.Mock).mockResolvedValue([
        {
          versionNumber: 1,
          language: 'bg',
        } as unknown as WikiArticleVersion,
      ]);

      const savedCreatedAt = new Date('2023-01-11T00:00:00Z');

      (versionRepo.save as jest.Mock).mockImplementation(
        async (entity: Partial<WikiArticleVersion>) => ({
          id: 'v2-id',
          ...entity,
          createdAt: savedCreatedAt,
        }),
      );

      const dto = {
        language: 'bg',
        title: 'Нова BG версия',
        content: 'ново съдържание',
        status: 'active',
      };

      const result = await service.adminUpdateArticle('1', dto, 'admin-id');

      expect(articleRepo.findOne).toHaveBeenCalledTimes(1);
      expect(articleRepo.save).toHaveBeenCalledTimes(1);

      expect(versionRepo.find).toHaveBeenCalledTimes(1);

      expect(versionRepo.save).toHaveBeenCalledTimes(1);
      const savedArg = (versionRepo.save as jest.Mock).mock
        .calls[0][0] as WikiArticleVersion;
      expect(savedArg.versionNumber).toBe(2);
      expect(savedArg.language).toBe('bg');
      expect(savedArg.title).toBe('Нова BG версия');
      expect(savedArg.content).toBe('ново съдържание');
      expect(savedArg.createdByUserId).toBe('admin-id');
      expect(savedArg.isPublished).toBe(true);

      expect(result.slug).toBe('getting-started');
      expect(result.language).toBe('bg');
      expect(result.title).toBe('Нова BG версия');
      expect(result.content).toBe('ново съдържание');
      expect(result.status).toBe('active');
      expect(result.updatedAt).toBe(savedCreatedAt.toISOString());
    });

    it('throws NotFoundException when article does not exist', async () => {
      (articleRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(
        service.adminUpdateArticle(
          'missing-id',
          {
            language: 'bg',
            title: 't',
            content: 'c',
            status: 'draft',
          },
          'admin-user',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('starts versionNumber from 1 when there are no existing versions for language', async () => {
      const now = new Date('2023-01-10T00:00:00Z');

      (articleRepo.findOne as jest.Mock).mockResolvedValue({
        id: '2',
        slug: 'faq',
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        versions: [],
      } as unknown as WikiArticle);

      (versionRepo.find as jest.Mock).mockResolvedValue([]);

      (versionRepo.save as jest.Mock).mockImplementation(
        async (entity: Partial<WikiArticleVersion>) => ({
          id: 'v1-id',
          ...entity,
          createdAt: now,
        }),
      );

      await service.adminUpdateArticle(
        '2',
        {
          language: 'bg',
          title: 'FAQ BG ново заглавие',
          content: 'FAQ BG ново съдържание',
          status: 'draft',
        },
        'admin-id',
      );

      expect(versionRepo.save).toHaveBeenCalledTimes(1);
      const savedArg = (versionRepo.save as jest.Mock).mock
        .calls[0][0] as WikiArticleVersion;
      expect(savedArg.versionNumber).toBe(1);
      expect(savedArg.isPublished).toBe(false);
    });
  });

  describe('getArticleVersionsForAdmin', () => {
    it('returns versions list for existing article', async () => {
      (articleRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'article-1',
      } as WikiArticle);

      const now = new Date('2023-01-01T00:00:00Z');

      (versionRepo.find as jest.Mock).mockResolvedValue([
        {
          id: 'v1',
          versionNumber: 1,
          language: 'bg',
          title: 'Title 1',
          content: 'Content 1',
          createdAt: now,
          createdByUserId: 'admin-id',
        } as unknown as WikiArticleVersion,
      ]);

      (usersRepo.find as jest.Mock).mockResolvedValue([
        {
          id: 'admin-id',
          email: 'admin@example.com',
        } as unknown as User,
      ]);

      const result = await service.getArticleVersionsForAdmin(
        'admin-user',
        'article-1',
      );

      expect(result[0]).toEqual({
        id: 'v1',
        version: 1,
        language: 'bg',
        title: 'Title 1',
        content: 'Content 1',
        createdAt: now.toISOString(),
        createdBy: 'admin@example.com',
        status: 'draft',
        subtitle: undefined,
      });
    });

    it('throws NotFoundException when article does not exist', async () => {
      (articleRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(
        service.getArticleVersionsForAdmin('admin-user', 'missing-id'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('uses user id as createdBy when user email is not found', async () => {
      (articleRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'article-1',
      } as WikiArticle);

      const now = new Date('2023-01-01T00:00:00Z');

      (versionRepo.find as jest.Mock).mockResolvedValue([
        {
          id: 'v1',
          versionNumber: 1,
          language: 'bg',
          title: 'Title 1',
          content: 'Content 1',
          createdAt: now,
          createdByUserId: 'missing-user-id',
        } as unknown as WikiArticleVersion,
      ]);

      (usersRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getArticleVersionsForAdmin(
        'admin-user',
        'article-1',
      );

      expect(result).toHaveLength(1);
      expect(result[0].createdBy).toBe('missing-user-id');
    });
  });

  describe('restoreArticleVersionForAdmin', () => {
    it('updates the target version as the current one and returns updated article detail', async () => {
      const now = new Date('2023-01-01T00:00:00Z');

      (articleRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'article-1',
        slug: 'getting-started',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      } as unknown as WikiArticle);

      (versionRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'target-version',
        language: 'bg',
        title: 'Rollback title',
        content: 'Rollback content',
      } as unknown as WikiArticleVersion);

      const savedCreatedAt = new Date('2023-01-02T00:00:00Z');

      (versionRepo.save as jest.Mock).mockImplementation(
        async (entity: Partial<WikiArticleVersion>) => ({
          id: 'new-version-id',
          ...entity,
          createdAt: savedCreatedAt,
        }),
      );

      const result = await service.restoreArticleVersionForAdmin(
        'article-1',
        'target-version',
        'admin-id',
      );

      expect(articleRepo.findOne).toHaveBeenCalledTimes(1);
      expect(versionRepo.findOne).toHaveBeenCalledTimes(1);
      expect(versionRepo.save).toHaveBeenCalledTimes(1);

      const savedArg = (versionRepo.save as jest.Mock).mock
        .calls[0][0] as WikiArticleVersion;
      expect(savedArg.language).toBe('bg');
      expect(savedArg.title).toBe('Rollback title');
      expect(savedArg.content).toBe('Rollback content');
      expect(savedArg.createdByUserId).toBe('admin-id');
      expect(savedArg.isPublished).toBe(true);

      expect(result.slug).toBe('getting-started');
      expect(result.language).toBe('bg');
      expect(result.title).toBe('Rollback title');
      expect(result.content).toBe('Rollback content');
      expect(result.status).toBe('active');
      expect(result.updatedAt).toBe(savedCreatedAt.toISOString());
    });

    it('throws NotFoundException when article does not exist', async () => {
      (articleRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(
        service.restoreArticleVersionForAdmin(
          'missing-article',
          'version-id',
          'admin-id',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when version does not exist', async () => {
      const now = new Date('2023-01-01T00:00:00Z');

      (articleRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'article-1',
        slug: 'getting-started',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      } as unknown as WikiArticle);

      (versionRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(
        service.restoreArticleVersionForAdmin(
          'article-1',
          'missing-version',
          'admin-id',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('adminDeleteArticleVersion', () => {
    it('deletes a specific version when there are multiple versions', async () => {
      const article = {
        id: 'article-1',
        versions: [
          {
            id: 'v1',
            language: 'bg',
            versionNumber: 1,
            createdAt: new Date('2023-01-01T00:00:00Z'),
          } as WikiArticleVersion,
          {
            id: 'v2',
            language: 'bg',
            versionNumber: 2,
            createdAt: new Date('2023-01-02T00:00:00Z'),
          } as WikiArticleVersion,
        ],
      } as unknown as WikiArticle;

      (articleRepo.findOne as jest.Mock).mockResolvedValue(article);

      await service.adminDeleteArticleVersion('admin-user', 'article-1', 'v1');

      expect(articleRepo.findOne).toHaveBeenCalledTimes(1);
      expect(versionRepo.remove).toHaveBeenCalledTimes(1);
      const removedArg = (versionRepo.remove as jest.Mock).mock
        .calls[0][0] as WikiArticleVersion;
      expect(removedArg.id).toBe('v1');
    });

    it('throws NotFoundException when article does not exist', async () => {
      (articleRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(
        service.adminDeleteArticleVersion(
          'admin-user',
          'missing-article',
          'version-id',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when version does not exist', async () => {
      const article = {
        id: 'article-1',
        versions: [{ id: 'v1' } as WikiArticleVersion],
      } as unknown as WikiArticle;

      (articleRepo.findOne as jest.Mock).mockResolvedValue(article);

      await expect(
        service.adminDeleteArticleVersion(
          'admin-user',
          'article-1',
          'missing-version',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when trying to delete the last remaining version', async () => {
      const article = {
        id: 'article-1',
        versions: [{ id: 'v1' } as WikiArticleVersion],
      } as unknown as WikiArticle;

      (articleRepo.findOne as jest.Mock).mockResolvedValue(article);

      await expect(
        service.adminDeleteArticleVersion('admin-user', 'article-1', 'v1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when trying to delete the current version for a language', async () => {
      const article = {
        id: 'article-1',
        versions: [
          {
            id: 'bg-v1',
            language: 'bg',
            versionNumber: 1,
            createdAt: new Date('2023-01-01T00:00:00Z'),
          } as WikiArticleVersion,
          {
            id: 'bg-v2',
            language: 'bg',
            versionNumber: 2,
            createdAt: new Date('2023-01-02T00:00:00Z'),
          } as WikiArticleVersion,
          {
            id: 'en-v1',
            language: 'en',
            versionNumber: 1,
            createdAt: new Date('2023-01-01T00:00:00Z'),
          } as WikiArticleVersion,
        ],
      } as unknown as WikiArticle;

      (articleRepo.findOne as jest.Mock).mockResolvedValue(article);

      await expect(
        service.adminDeleteArticleVersion('admin-user', 'article-1', 'bg-v2'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows deleting a non-current version for a language', async () => {
      const article = {
        id: 'article-1',
        versions: [
          {
            id: 'bg-v1',
            language: 'bg',
            versionNumber: 1,
            createdAt: new Date('2023-01-01T00:00:00Z'),
          } as WikiArticleVersion,
          {
            id: 'bg-v2',
            language: 'bg',
            versionNumber: 2,
            createdAt: new Date('2023-01-02T00:00:00Z'),
          } as WikiArticleVersion,
        ],
      } as unknown as WikiArticle;

      (articleRepo.findOne as jest.Mock).mockResolvedValue(article);

      await service.adminDeleteArticleVersion(
        'admin-user',
        'article-1',
        'bg-v1',
      );

      expect(versionRepo.remove).toHaveBeenCalledTimes(1);
      const removedArg = (versionRepo.remove as jest.Mock).mock
        .calls[0][0] as WikiArticleVersion;
      expect(removedArg.id).toBe('bg-v1');
    });
  });

  describe('adminDeleteArticle', () => {
    it('deletes an existing article', async () => {
      const article = {
        id: 'article-1',
        status: 'inactive',
      } as unknown as WikiArticle;

      (articleRepo.findOne as jest.Mock).mockResolvedValue(article);
      (articleRepo.remove as jest.Mock).mockResolvedValue(undefined);

      await service.adminDeleteArticle('admin-user', 'article-1');

      expect(articleRepo.findOne).toHaveBeenCalledTimes(1);
      expect(articleRepo.remove).toHaveBeenCalledTimes(1);
      const removedArg = (articleRepo.remove as jest.Mock).mock
        .calls[0][0] as WikiArticle;
      expect(removedArg.id).toBe('article-1');
    });

    it('throws NotFoundException when article does not exist', async () => {
      (articleRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(
        service.adminDeleteArticle('admin-user', 'missing-article'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when trying to delete an active article', async () => {
      const article = {
        id: 'article-1',
        status: 'active',
      } as unknown as WikiArticle;

      (articleRepo.findOne as jest.Mock).mockResolvedValue(article);

      await expect(
        service.adminDeleteArticle('admin-user', 'article-1'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(articleRepo.remove).not.toHaveBeenCalled();
    });
  });
});
