import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCourseEnrollmentSchema1765931000000
  implements MigrationInterface
{
  name = 'InitCourseEnrollmentSchema1765931000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "course_enrollments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'not_started',
        "enrolled_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_course_enrollments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_course_enrollments_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_course_enrollments_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_course_enrollments_course_user" ON "course_enrollments" ("course_id", "user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_course_enrollments_user_id" ON "course_enrollments" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_course_enrollments_user_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_course_enrollments_course_user"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "course_enrollments"');
  }
}
