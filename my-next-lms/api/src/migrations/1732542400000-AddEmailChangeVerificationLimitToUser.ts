import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailChangeVerificationLimitToUser1732542400000
  implements MigrationInterface
{
  name = 'AddEmailChangeVerificationLimitToUser1732542400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "email_change_verification_count" integer NOT NULL DEFAULT 0,
      ADD COLUMN "email_change_verification_window_started_at" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "email_change_verification_window_started_at",
      DROP COLUMN "email_change_verification_count"
    `);
  }
}
