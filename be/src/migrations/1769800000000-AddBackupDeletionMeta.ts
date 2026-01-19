import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBackupDeletionMeta1769800000000 implements MigrationInterface {
  name = 'AddBackupDeletionMeta1769800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "backups"
        ADD COLUMN "deleted_by_user_id" uuid NULL,
        ADD COLUMN "deleted_by_email" varchar(255) NULL,
        ADD COLUMN "deleted_reason" varchar(20) NULL,
        ADD COLUMN "deleted_at" timestamptz NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "backups"
        DROP COLUMN "deleted_at",
        DROP COLUMN "deleted_reason",
        DROP COLUMN "deleted_by_email",
        DROP COLUMN "deleted_by_user_id"
    `);
  }
}
