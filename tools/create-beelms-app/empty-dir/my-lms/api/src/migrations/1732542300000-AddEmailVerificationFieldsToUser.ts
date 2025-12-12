import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerificationFieldsToUser1732542300000
  implements MigrationInterface
{
  name = 'AddEmailVerificationFieldsToUser1732542300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "email_verified" boolean NOT NULL DEFAULT false,
      ADD COLUMN "email_verification_token" character varying(255),
      ADD COLUMN "email_verification_token_expires_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "pending_email" character varying(255),
      ADD COLUMN "pending_email_verification_token" character varying(255),
      ADD COLUMN "pending_email_verification_token_expires_at" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "email_verified" = true
      WHERE "active" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "pending_email_verification_token_expires_at",
      DROP COLUMN "pending_email_verification_token",
      DROP COLUMN "pending_email",
      DROP COLUMN "email_verification_token_expires_at",
      DROP COLUMN "email_verification_token",
      DROP COLUMN "email_verified"
    `);
  }
}
