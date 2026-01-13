import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMyposFieldsToCoursePurchases1769401000000
  implements MigrationInterface
{
  name = 'AddMyposFieldsToCoursePurchases1769401000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "course_purchases"
        ADD COLUMN IF NOT EXISTS "mypos_order_id" varchar(255),
        ADD COLUMN IF NOT EXISTS "mypos_trnref" varchar(255)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_course_purchases_mypos_order_id"
      ON "course_purchases" ("mypos_order_id")
      WHERE "mypos_order_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_course_purchases_mypos_trnref"
      ON "course_purchases" ("mypos_trnref")
      WHERE "mypos_trnref" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_course_purchases_mypos_trnref"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_course_purchases_mypos_order_id"',
    );

    await queryRunner.query(`
      ALTER TABLE "course_purchases"
        DROP COLUMN IF EXISTS "mypos_trnref",
        DROP COLUMN IF EXISTS "mypos_order_id"
    `);
  }
}
