import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCourseCategoriesSchema1767700000000
  implements MigrationInterface
{
  name = 'InitCourseCategoriesSchema1767700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "course_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" character varying(255) NOT NULL,
        "title" character varying(255) NOT NULL,
        "order_index" integer NOT NULL DEFAULT 0,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_course_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_course_categories_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "IDX_course_categories_active" ON "course_categories" ("active")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_course_categories_order" ON "course_categories" ("order_index")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_course_categories_order"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_course_categories_active"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "course_categories"');
  }
}
