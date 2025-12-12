import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitWikiSchema1732542000000 implements MigrationInterface {
  name = 'InitWikiSchema1732542000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "wiki_articles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" character varying(255) NOT NULL,
        "status" character varying(20) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wiki_articles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wiki_articles_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "wiki_article_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "article_id" uuid NOT NULL,
        "language" character varying(8) NOT NULL,
        "title" character varying(255) NOT NULL,
        "content" text NOT NULL,
        "version_number" integer NOT NULL,
        "created_by_user_id" uuid NULL,
        "change_summary" text NULL,
        "is_published" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wiki_article_versions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wiki_article_versions_article_id" FOREIGN KEY ("article_id") REFERENCES "wiki_articles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_wiki_article_versions_article_lang_version"
      ON "wiki_article_versions" ("article_id", "language", "version_number")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_wiki_article_versions_article_lang_version"',
    );

    await queryRunner.query('DROP TABLE IF EXISTS "wiki_article_versions"');
    await queryRunner.query('DROP TABLE IF EXISTS "wiki_articles"');
  }
}
