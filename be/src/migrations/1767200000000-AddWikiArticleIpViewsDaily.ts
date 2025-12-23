import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWikiArticleIpViewsDaily1767200000000
  implements MigrationInterface
{
  name = 'AddWikiArticleIpViewsDaily1767200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "wiki_article_ip_views_daily" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "article_id" uuid NOT NULL,
        "language" character varying(8) NOT NULL,
        "view_date" date NOT NULL,
        "ip_hash" character varying(64) NOT NULL,
        "session_count" integer NOT NULL DEFAULT 0,
        "last_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wiki_article_ip_views_daily_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wiki_article_ip_views_daily_article_id" FOREIGN KEY ("article_id") REFERENCES "wiki_articles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_wiki_article_ip_views_daily_article_lang_date_ip" ON "wiki_article_ip_views_daily" ("article_id", "language", "view_date", "ip_hash")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wiki_article_ip_views_daily_view_date" ON "wiki_article_ip_views_daily" ("view_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wiki_article_ip_views_daily_article_id" ON "wiki_article_ip_views_daily" ("article_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_wiki_article_ip_views_daily_article_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_wiki_article_ip_views_daily_view_date"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_wiki_article_ip_views_daily_article_lang_date_ip"',
    );
    await queryRunner.query(
      'DROP TABLE IF EXISTS "wiki_article_ip_views_daily"',
    );
  }
}
