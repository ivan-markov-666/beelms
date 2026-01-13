import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAdditionalLegalPages1769200000000
  implements MigrationInterface
{
  name = 'SeedAdditionalLegalPages1769200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "legal_pages" ("slug", "title", "content_markdown")
      VALUES
        ('cookie-policy', 'Cookie Policy', '# Cookie Policy\n\nPlaceholder cookie policy content.'),
        ('imprint', 'Imprint', '# Imprint\n\nPlaceholder imprint content.'),
        ('accessibility', 'Accessibility Statement', '# Accessibility\n\nPlaceholder accessibility statement.'),
        ('contact', 'Contact', '# Contact\n\nPlaceholder contact content.'),
        ('faq', 'FAQ', '# FAQ\n\nPlaceholder FAQ content.'),
        ('support', 'Support', '# Support\n\nPlaceholder support content.')
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "legal_pages"
      WHERE "slug" IN (
        'cookie-policy',
        'imprint',
        'accessibility',
        'contact',
        'faq',
        'support'
      )
    `);
  }
}
