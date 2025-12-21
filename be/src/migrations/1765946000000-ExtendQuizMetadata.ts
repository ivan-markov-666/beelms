import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendQuizMetadata1765946000000 implements MigrationInterface {
  name = 'ExtendQuizMetadata1765946000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      ALTER TABLE "quizzes"
      ADD COLUMN IF NOT EXISTS "description" text,
      ADD COLUMN IF NOT EXISTS "language" character varying(10) NOT NULL DEFAULT 'bg',
      ADD COLUMN IF NOT EXISTS "status" character varying(20) NOT NULL DEFAULT 'active'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "quizzes"
      DROP COLUMN IF EXISTS "status",
      DROP COLUMN IF EXISTS "language",
      DROP COLUMN IF EXISTS "description"
    `);
  }
}
