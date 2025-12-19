import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCoursePurchaseSchema1765935000000
  implements MigrationInterface
{
  name = 'InitCoursePurchaseSchema1765935000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "course_purchases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "purchased_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_course_purchases_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_course_purchases_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_course_purchases_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_course_purchases_course_user" ON "course_purchases" ("course_id", "user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_course_purchases_user_id" ON "course_purchases" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_course_purchases_user_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_course_purchases_course_user"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "course_purchases"');
  }
}
