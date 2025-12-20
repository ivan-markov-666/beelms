import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeFieldsToCoursePurchases1765936300000
  implements MigrationInterface
{
  name = 'AddStripeFieldsToCoursePurchases1765936300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "course_purchases"
        ADD COLUMN IF NOT EXISTS "stripe_session_id" varchar(255),
        ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" varchar(255),
        ADD COLUMN IF NOT EXISTS "amount_cents" integer,
        ADD COLUMN IF NOT EXISTS "currency" varchar(3)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_course_purchases_stripe_session_id"
      ON "course_purchases" ("stripe_session_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_course_purchases_stripe_payment_intent_id"
      ON "course_purchases" ("stripe_payment_intent_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_course_purchases_stripe_payment_intent_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_course_purchases_stripe_session_id"',
    );

    await queryRunner.query(`
      ALTER TABLE "course_purchases"
        DROP COLUMN IF EXISTS "currency",
        DROP COLUMN IF EXISTS "amount_cents",
        DROP COLUMN IF EXISTS "stripe_payment_intent_id",
        DROP COLUMN IF EXISTS "stripe_session_id"
    `);
  }
}
