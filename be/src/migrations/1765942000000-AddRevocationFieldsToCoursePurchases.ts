import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRevocationFieldsToCoursePurchases1765942000000
  implements MigrationInterface
{
  name = 'AddRevocationFieldsToCoursePurchases1765942000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "course_purchases"
        ADD COLUMN IF NOT EXISTS "revoked_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "revoked_reason" varchar(255),
        ADD COLUMN IF NOT EXISTS "revoked_event_id" varchar(255)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_course_purchases_revoked_at"
      ON "course_purchases" ("revoked_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_course_purchases_revoked_event_id"
      ON "course_purchases" ("revoked_event_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_course_purchases_revoked_event_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_course_purchases_revoked_at"',
    );

    await queryRunner.query(`
      ALTER TABLE "course_purchases"
        DROP COLUMN IF EXISTS "revoked_event_id",
        DROP COLUMN IF EXISTS "revoked_reason",
        DROP COLUMN IF EXISTS "revoked_at"
    `);
  }
}
