import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendBackupLogActions1769600100000 implements MigrationInterface {
  name = 'ExtendBackupLogActions1769600100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "backup_logs" DROP CONSTRAINT IF EXISTS "CHK_backup_logs_action"',
    );
    await queryRunner.query(
      "ALTER TABLE \"backup_logs\" ADD CONSTRAINT \"CHK_backup_logs_action\" CHECK (action IN ('backup_created','backup_synced','backup_sync_failed','restore_started','restore_completed','restore_failed','backup_deleted'))",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "backup_logs" DROP CONSTRAINT IF EXISTS "CHK_backup_logs_action"',
    );
    await queryRunner.query(
      "ALTER TABLE \"backup_logs\" ADD CONSTRAINT \"CHK_backup_logs_action\" CHECK (action IN ('backup_created','restore_started','restore_completed','restore_failed','backup_deleted'))",
    );
  }
}
