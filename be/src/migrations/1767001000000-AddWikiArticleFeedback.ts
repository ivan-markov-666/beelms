import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWikiArticleFeedback1767001000000 implements MigrationInterface {
  name = 'AddWikiArticleFeedback1767001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "wiki_article_feedback" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "article_id" uuid NOT NULL,
        "user_id" uuid,
        "helpful" boolean NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wiki_article_feedback_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wiki_article_feedback_article_id" FOREIGN KEY ("article_id") REFERENCES "wiki_articles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wiki_article_feedback_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wiki_article_feedback_article_id" ON "wiki_article_feedback" ("article_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_wiki_article_feedback_article_user" ON "wiki_article_feedback" ("article_id", "user_id") WHERE "user_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_wiki_article_feedback_article_user"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_wiki_article_feedback_article_id"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "wiki_article_feedback"');
  }
}
