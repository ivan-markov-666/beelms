import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { WikiArticle } from '../src/wiki/wiki-article.entity';
import { WikiArticleVersion } from '../src/wiki/wiki-article-version.entity';

describe('Wiki DB migrations and seed (e2e)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      dataSource = await AppDataSource.initialize();
    } else {
      dataSource = AppDataSource;
    }
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('has wiki_articles seed with getting-started and faq', async () => {
    const articleRepo = dataSource.getRepository(WikiArticle);

    const articles = await articleRepo.find();
    const slugs = articles.map((a) => a.slug);

    expect(slugs).toEqual(expect.arrayContaining(['getting-started', 'faq']));

    const gettingStarted = articles.find((a) => a.slug === 'getting-started');
    const faq = articles.find((a) => a.slug === 'faq');

    expect(gettingStarted).toBeDefined();
    expect(gettingStarted?.status).toBe('active');

    expect(faq).toBeDefined();
    expect(faq?.status).toBe('active');
  });

  it('has BG and EN versions for getting-started, and BG version for faq', async () => {
    const versionRepo = dataSource.getRepository(WikiArticleVersion);

    const versions = await versionRepo.find({ relations: ['article'] });

    const gettingStartedVersions = versions.filter(
      (v) => v.article.slug === 'getting-started',
    );
    const gettingStartedLangs = gettingStartedVersions
      .map((v) => v.language)
      .sort();

    expect(gettingStartedLangs).toEqual(expect.arrayContaining(['bg', 'en']));

    const faqVersions = versions.filter((v) => v.article.slug === 'faq');
    const faqLangs = faqVersions.map((v) => v.language).sort();

    expect(faqLangs).toEqual(['bg']);
  });

  it('has no duplicate versions for the same article, language and versionNumber', async () => {
    const versionRepo = dataSource.getRepository(WikiArticleVersion);

    const versions = await versionRepo.find({ relations: ['article'] });

    const seenKeys = new Set<string>();

    for (const v of versions) {
      const slug = v.article.slug;
      const key = `${slug}:${v.language}:${v.versionNumber}`;

      expect(seenKeys.has(key)).toBe(false);
      seenKeys.add(key);
    }
  });
});
