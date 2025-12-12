import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetPasswordFieldsToUser1732542200000
  implements MigrationInterface
{
  name = 'AddResetPasswordFieldsToUser1732542200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "reset_password_token" character varying(255),
      ADD COLUMN "reset_password_token_expires_at" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "reset_password_token",
      DROP COLUMN "reset_password_token_expires_at"
    `);
  }
}
