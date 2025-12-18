import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCourseCurriculumSchema1765933000000
  implements MigrationInterface
{
  name = 'InitCourseCurriculumSchema1765933000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "course_curriculum_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL,
        "item_type" character varying(10) NOT NULL,
        "title" character varying(255) NOT NULL,
        "order_index" integer NOT NULL,
        "wiki_slug" character varying(255),
        "task_id" uuid,
        "quiz_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_course_curriculum_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_course_curriculum_items_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_course_curriculum_items_course_id" ON "course_curriculum_items" ("course_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_course_curriculum_items_course_order" ON "course_curriculum_items" ("course_id", "order_index")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_course_curriculum_items_course_order"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_course_curriculum_items_course_id"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "course_curriculum_items"');
  }
}
