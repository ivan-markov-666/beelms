import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOwnershipToCoursesAndWikiArticles1767600000000
  implements MigrationInterface
{
  name = 'AddOwnershipToCoursesAndWikiArticles1767600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "courses" ADD COLUMN "created_by_user_id" uuid NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_created_by_user_id" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_courses_created_by_user_id" ON "courses" ("created_by_user_id")',
    );

    await queryRunner.query(
      'ALTER TABLE "wiki_articles" ADD COLUMN "created_by_user_id" uuid NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "wiki_articles" ADD CONSTRAINT "FK_wiki_articles_created_by_user_id" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_wiki_articles_created_by_user_id" ON "wiki_articles" ("created_by_user_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_wiki_articles_created_by_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "wiki_articles" DROP CONSTRAINT IF EXISTS "FK_wiki_articles_created_by_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "wiki_articles" DROP COLUMN IF EXISTS "created_by_user_id"',
    );

    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_courses_created_by_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "FK_courses_created_by_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "courses" DROP COLUMN IF EXISTS "created_by_user_id"',
    );
  }
}
