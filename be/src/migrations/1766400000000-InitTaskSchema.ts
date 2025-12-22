import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitTaskSchema1766400000000 implements MigrationInterface {
  name = 'InitTaskSchema1766400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "language" character varying(10) NOT NULL DEFAULT 'bg',
        "status" character varying(20) NOT NULL DEFAULT 'draft',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_tasks_status" ON "tasks" ("status")',
    );

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_tasks_language" ON "tasks" ("language")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_language"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_status"');
    await queryRunner.query('DROP TABLE IF EXISTS "tasks"');
  }
}
