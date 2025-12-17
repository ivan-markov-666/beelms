import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCourseSchema1765930000000 implements MigrationInterface {
  name = 'InitCourseSchema1765930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "courses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "language" character varying(8) NOT NULL,
        "status" character varying(20) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_courses_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_courses_status" ON "courses" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_courses_language" ON "courses" ("language")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_courses_language"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_courses_status"');
    await queryRunner.query('DROP TABLE IF EXISTS "courses"');
  }
}
