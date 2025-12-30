import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitLegalPagesSchema1767400000000 implements MigrationInterface {
  name = 'InitLegalPagesSchema1767400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "legal_pages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" varchar(64) NOT NULL,
        "title" varchar(256) NOT NULL,
        "content_markdown" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_legal_pages_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_legal_pages_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "legal_pages" ("slug", "title", "content_markdown")
      VALUES
        ('terms', 'Terms and Conditions', '# Terms\n\nPlaceholder terms content.'),
        ('privacy', 'Privacy / GDPR', '# Privacy\n\nPlaceholder privacy content.')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "legal_pages"');
  }
}
