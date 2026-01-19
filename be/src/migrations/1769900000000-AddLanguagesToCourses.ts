import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLanguagesToCourses1769900000000 implements MigrationInterface {
  name = 'AddLanguagesToCourses1769900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "courses" ADD COLUMN "languages" text[] NOT NULL DEFAULT ARRAY[]::text[]',
    );

    await queryRunner.query(`
      UPDATE "courses"
      SET "languages" = ARRAY[LOWER("language")]
      WHERE ("languages" IS NULL OR array_length("languages", 1) IS NULL)
        AND "language" IS NOT NULL
        AND LENGTH(TRIM("language")) > 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "courses" DROP COLUMN IF EXISTS "languages"',
    );
  }
}
