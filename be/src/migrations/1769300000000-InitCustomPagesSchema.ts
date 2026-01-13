import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCustomPagesSchema1769300000000 implements MigrationInterface {
  name = 'InitCustomPagesSchema1769300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "custom_pages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" varchar(64) NOT NULL,
        "title" varchar(256) NOT NULL,
        "title_by_lang" jsonb,
        "content_markdown" text NOT NULL,
        "content_markdown_by_lang" jsonb,
        "is_published" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_custom_pages_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_custom_pages_slug" UNIQUE ("slug")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "custom_pages"');
  }
}
