import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTwoFactorAuthToUser1769000000000 implements MigrationInterface {
  name = 'AddTwoFactorAuthToUser1769000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "two_factor_enabled" boolean NOT NULL DEFAULT false,
      ADD COLUMN "two_factor_secret" character varying(255),
      ADD COLUMN "two_factor_confirmed_at" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "two_factor_confirmed_at",
      DROP COLUMN "two_factor_secret",
      DROP COLUMN "two_factor_enabled"
    `);
  }
}
