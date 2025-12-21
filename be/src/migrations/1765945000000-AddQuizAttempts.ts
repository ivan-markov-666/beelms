import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuizAttempts1765945000000 implements MigrationInterface {
  name = 'AddQuizAttempts1765945000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quiz_attempts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quiz_id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "score" integer NOT NULL,
        "max_score" integer NOT NULL,
        "passed" boolean NOT NULL,
        "answers" jsonb NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quiz_attempts_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_quiz_attempts_quiz_user" ON "quiz_attempts" ("quiz_id", "user_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_quiz_attempts_quiz_user"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "quiz_attempts"');
  }
}
