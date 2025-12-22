import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWikiArticleViews1767002000000 implements MigrationInterface {
  name = 'AddWikiArticleViews1767002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "wiki_article_views" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "article_id" uuid NOT NULL,
        "language" character varying(8) NOT NULL,
        "view_date" date NOT NULL,
        "view_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wiki_article_views_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wiki_article_views_article_id" FOREIGN KEY ("article_id") REFERENCES "wiki_articles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_wiki_article_views_article_lang_date" ON "wiki_article_views" ("article_id", "language", "view_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wiki_article_views_view_date" ON "wiki_article_views" ("view_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wiki_article_views_article_id" ON "wiki_article_views" ("article_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_wiki_article_views_article_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_wiki_article_views_view_date"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_wiki_article_views_article_lang_date"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "wiki_article_views"');
  }
}
