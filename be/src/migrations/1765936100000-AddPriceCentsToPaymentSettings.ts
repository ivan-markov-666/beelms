import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPriceCentsToPaymentSettings1765936100000
  implements MigrationInterface
{
  name = 'AddPriceCentsToPaymentSettings1765936100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payment_settings"
      ADD COLUMN IF NOT EXISTS "price_cents" integer NOT NULL DEFAULT 999
    `);

    await queryRunner.query(`
      UPDATE "payment_settings"
      SET "price_cents" = 999
      WHERE "price_cents" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "payment_settings" DROP COLUMN IF EXISTS "price_cents"',
    );
  }
}
