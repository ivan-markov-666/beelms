import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { WikiArticle } from '../wiki/wiki-article.entity';
import { WikiArticleVersion } from '../wiki/wiki-article-version.entity';

const SeedDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'qa4free',
  password: process.env.DB_PASSWORD ?? 'qa4free',
  database: process.env.DB_NAME ?? 'qa4free',
  entities: [WikiArticle, WikiArticleVersion],
  synchronize: false,
});

async function seedWiki() {
  await SeedDataSource.initialize();

  const articleRepo = SeedDataSource.getRepository(WikiArticle);
  const versionRepo = SeedDataSource.getRepository(WikiArticleVersion);

  async function ensureArticleWithVersions(
    slug: string,
    status: string,
    versions: {
      language: string;
      title: string;
      content: string;
      versionNumber: number;
      isPublished?: boolean;
      changeSummary?: string | null;
    }[],
  ) {
    let article = await articleRepo.findOne({ where: { slug } });

    if (!article) {
      article = articleRepo.create({ slug, status });
      await articleRepo.save(article);
    }

    for (const v of versions) {
      const exists = await versionRepo.findOne({
        where: {
          article: { id: article.id },
          language: v.language,
          versionNumber: v.versionNumber,
        },
        relations: ['article'],
      });

      if (exists) {
        continue;
      }

      const version = versionRepo.create({
        article,
        language: v.language,
        title: v.title,
        content: v.content,
        versionNumber: v.versionNumber,
        isPublished: v.isPublished ?? true,
        changeSummary: v.changeSummary ?? null,
        createdByUserId: null,
      });

      await versionRepo.save(version);
    }
  }

  await ensureArticleWithVersions('getting-started', 'active', [
    {
      language: 'bg',
      title: 'Начало с QA4Free',
      content:
        'Това е началната статия за QA4Free на български. Тя описва какво представлява платформата и как да започнеш.',
      versionNumber: 1,
      changeSummary: 'Първоначална версия на статията за начало (BG).',
    },
    {
      language: 'en',
      title: 'Getting started with QA4Free',
      content:
        'This is the initial Wiki article in English. It explains what QA4Free is and how to get started.',
      versionNumber: 1,
      changeSummary: 'Initial version of the getting started article (EN).',
    },
  ]);

  await ensureArticleWithVersions('faq', 'active', [
    {
      language: 'bg',
      title: 'Често задавани въпроси (FAQ)',
      content:
        'Тази статия събира често задавани въпроси за QA4Free и кратки отговори към тях.',
      versionNumber: 1,
      changeSummary: 'Първоначална версия на FAQ статията (BG).',
    },
  ]);

  await SeedDataSource.destroy();
}

seedWiki()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Wiki seed completed');
    process.exit(0);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Wiki seed failed', err);
    process.exit(1);
  });
