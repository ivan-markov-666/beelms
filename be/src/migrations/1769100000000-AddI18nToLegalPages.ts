import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddI18nToLegalPages1769100000000 implements MigrationInterface {
  name = 'AddI18nToLegalPages1769100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "legal_pages"
      ADD COLUMN "title_by_lang" jsonb,
      ADD COLUMN "content_markdown_by_lang" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "legal_pages"
      DROP COLUMN "content_markdown_by_lang",
      DROP COLUMN "title_by_lang"
    `);
  }
}
