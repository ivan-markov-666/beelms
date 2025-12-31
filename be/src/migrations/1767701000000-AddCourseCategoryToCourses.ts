import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseCategoryToCourses1767701000000
  implements MigrationInterface
{
  name = 'AddCourseCategoryToCourses1767701000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "courses" ADD COLUMN "category_id" uuid NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_category_id" FOREIGN KEY ("category_id") REFERENCES "course_categories"("id") ON DELETE SET NULL',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_courses_category_id" ON "courses" ("category_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_courses_category_id"');
    await queryRunner.query(
      'ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "FK_courses_category_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "courses" DROP COLUMN IF EXISTS "category_id"',
    );
  }
}
