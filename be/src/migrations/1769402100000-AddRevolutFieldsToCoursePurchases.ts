import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRevolutFieldsToCoursePurchases1769402100000
  implements MigrationInterface
{
  name = 'AddRevolutFieldsToCoursePurchases1769402100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "course_purchases"
      ADD COLUMN IF NOT EXISTS "revolut_order_id" varchar(255)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_course_purchases_revolut_order_id"
      ON "course_purchases" ("revolut_order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_course_purchases_revolut_order_id"
      ON "course_purchases" ("revolut_order_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_course_purchases_revolut_order_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_course_purchases_revolut_order_id"',
    );

    await queryRunner.query(
      'ALTER TABLE "course_purchases" DROP COLUMN IF EXISTS "revolut_order_id"',
    );
  }
}
