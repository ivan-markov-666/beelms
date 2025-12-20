import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPricingToCourses1765936200000 implements MigrationInterface {
  name = 'AddPricingToCourses1765936200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "courses"
      ADD COLUMN IF NOT EXISTS "currency" character varying(3)
    `);

    await queryRunner.query(`
      ALTER TABLE "courses"
      ADD COLUMN IF NOT EXISTS "price_cents" integer
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_courses_currency" ON "courses" ("currency")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_courses_currency"');
    await queryRunner.query(
      'ALTER TABLE "courses" DROP COLUMN IF EXISTS "price_cents"',
    );
    await queryRunner.query(
      'ALTER TABLE "courses" DROP COLUMN IF EXISTS "currency"',
    );
  }
}
