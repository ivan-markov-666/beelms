import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaypalFieldsToCoursePurchases1769311000000
  implements MigrationInterface
{
  name = 'AddPaypalFieldsToCoursePurchases1769311000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "course_purchases"
        ADD COLUMN IF NOT EXISTS "paypal_order_id" varchar(255),
        ADD COLUMN IF NOT EXISTS "paypal_capture_id" varchar(255)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_course_purchases_paypal_order_id"
      ON "course_purchases" ("paypal_order_id")
      WHERE "paypal_order_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_course_purchases_paypal_capture_id"
      ON "course_purchases" ("paypal_capture_id")
      WHERE "paypal_capture_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_course_purchases_paypal_capture_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_course_purchases_paypal_order_id"',
    );

    await queryRunner.query(`
      ALTER TABLE "course_purchases"
        DROP COLUMN IF EXISTS "paypal_capture_id",
        DROP COLUMN IF EXISTS "paypal_order_id"
    `);
  }
}
