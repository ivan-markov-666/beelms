import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRevolutFieldsToPaymentCheckouts1769402000000
  implements MigrationInterface
{
  name = 'AddRevolutFieldsToPaymentCheckouts1769402000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payment_checkouts"
      ADD COLUMN IF NOT EXISTS "revolut_order_id" varchar(255)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_payment_checkouts_revolut_order_id"
      ON "payment_checkouts" ("revolut_order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_checkouts_revolut_order_id"
      ON "payment_checkouts" ("revolut_order_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_payment_checkouts_revolut_order_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_payment_checkouts_revolut_order_id"',
    );

    await queryRunner.query(
      'ALTER TABLE "payment_checkouts" DROP COLUMN IF EXISTS "revolut_order_id"',
    );
  }
}
