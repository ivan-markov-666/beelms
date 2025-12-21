import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitQuizSchema1765944000000 implements MigrationInterface {
  name = 'InitQuizSchema1765944000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quizzes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "passing_score" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quizzes_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quiz_questions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quiz_id" uuid NOT NULL,
        "text" text NOT NULL,
        "order_index" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quiz_questions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quiz_questions_quiz_id" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_quiz_questions_quiz_id" ON "quiz_questions" ("quiz_id")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quiz_options" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "question_id" uuid NOT NULL,
        "text" text NOT NULL,
        "option_index" integer NOT NULL,
        "is_correct" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quiz_options_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quiz_options_question_id" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_quiz_options_question_id" ON "quiz_options" ("question_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_quiz_options_question_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_quiz_questions_quiz_id"',
    );

    await queryRunner.query('DROP TABLE IF EXISTS "quiz_options"');
    await queryRunner.query('DROP TABLE IF EXISTS "quiz_questions"');
    await queryRunner.query('DROP TABLE IF EXISTS "quizzes"');
  }
}
