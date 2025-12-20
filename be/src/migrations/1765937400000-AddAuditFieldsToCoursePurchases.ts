import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditFieldsToCoursePurchases1765937400000
  implements MigrationInterface
{
  name = 'AddAuditFieldsToCoursePurchases1765937400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "course_purchases"
        ADD COLUMN IF NOT EXISTS "source" varchar(20) NOT NULL DEFAULT 'stripe',
        ADD COLUMN IF NOT EXISTS "granted_by_user_id" uuid,
        ADD COLUMN IF NOT EXISTS "grant_reason" varchar(255)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_course_purchases_granted_by_user_id"
      ON "course_purchases" ("granted_by_user_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_course_purchases_granted_by_user_id'
        ) THEN
          ALTER TABLE "course_purchases"
          ADD CONSTRAINT "FK_course_purchases_granted_by_user_id"
          FOREIGN KEY ("granted_by_user_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "course_purchases" DROP CONSTRAINT IF EXISTS "FK_course_purchases_granted_by_user_id"',
    );

    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_course_purchases_granted_by_user_id"',
    );

    await queryRunner.query(`
      ALTER TABLE "course_purchases"
        DROP COLUMN IF EXISTS "grant_reason",
        DROP COLUMN IF EXISTS "granted_by_user_id",
        DROP COLUMN IF EXISTS "source"
    `);
  }
}
