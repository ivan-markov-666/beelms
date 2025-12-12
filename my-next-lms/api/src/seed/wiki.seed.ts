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
      title: 'Начало с платформата',
      content:
        'Това е примерна начална Wiki статия за демо платформа. Тя показва как може да изглежда съдържанието и как да започнеш.',
      versionNumber: 1,
      changeSummary: 'Първоначална примерна BG версия на начална статия.',
    },
    {
      language: 'en',
      title: 'Getting started with the platform',
      content:
        'This is a sample getting started Wiki article for a demo platform. It shows how content might look and how to get started.',
      versionNumber: 1,
      changeSummary: 'Initial sample EN version of the getting started article.',
    },
  ]);

  await ensureArticleWithVersions('faq', 'active', [
    {
      language: 'bg',
      title: 'Често задавани въпроси (FAQ)',
      content:
        'Тази статия съдържа примерни често задавани въпроси и кратки отговори към тях.',
      versionNumber: 1,
      changeSummary: 'Първоначална примерна версия на FAQ статията (BG).',
    },
  ]);

  await ensureArticleWithVersions('qa4free-overview', 'active', [
    {
      language: 'bg',
      title: 'Общ преглед на платформата',
      content:
        'Тази статия дава примерен общ преглед на демо платформа – каква е целта й, за кого е предназначена и какви раздели включва Wiki-то и практическите задачи.',
      versionNumber: 1,
      changeSummary: 'Първоначална примерна версия на обзорна статия (BG).',
    },
    {
      language: 'en',
      title: 'Platform overview',
      content:
        'This article gives a sample overview of a demo platform – what it aims to solve, who it is for and how the Wiki and practice sections are organised.',
      versionNumber: 1,
      changeSummary: 'Initial sample overview article (EN).',
    },
  ]);

  await SeedDataSource.destroy();
}

seedWiki()
  .then(() => {
    console.log('Wiki seed completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Wiki seed failed', err);
    process.exit(1);
  });
