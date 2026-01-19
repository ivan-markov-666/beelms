import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitBackupSchema1769500000000 implements MigrationInterface {
  name = 'InitBackupSchema1769500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "backups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "filename" varchar(255) NOT NULL,
        "path" varchar(1024) NOT NULL,
        "type" varchar(20) NOT NULL,
        "storage" varchar(20) NOT NULL DEFAULT 'local',
        "size_bytes" bigint NOT NULL DEFAULT 0,
        "sha256" varchar(64) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'ready',
        "error_message" text,
        "created_by_user_id" uuid,
        "created_by_email" varchar(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_backups_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_backups_type" CHECK (type IN ('manual','scheduled','uploaded','pre_restore')),
        CONSTRAINT "CHK_backups_storage" CHECK (storage IN ('local','remote','both')),
        CONSTRAINT "CHK_backups_status" CHECK (status IN ('ready','failed','deleted'))
      )
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_backups_created_at" ON "backups" ("created_at")',
    );

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_backups_type" ON "backups" ("type")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "backup_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "backup_id" uuid,
        "action" varchar(30) NOT NULL,
        "actor_user_id" uuid,
        "actor_email" varchar(255),
        "details" jsonb,
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_backup_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_backup_logs_backup_id" FOREIGN KEY ("backup_id") REFERENCES "backups"("id") ON DELETE SET NULL,
        CONSTRAINT "CHK_backup_logs_action" CHECK (action IN ('backup_created','restore_started','restore_completed','restore_failed','backup_deleted'))
      )
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_backup_logs_occurred_at" ON "backup_logs" ("occurred_at")',
    );

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_backup_logs_backup_id" ON "backup_logs" ("backup_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_backup_logs_backup_id"');
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_backup_logs_occurred_at"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "backup_logs"');

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_backups_type"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_backups_created_at"');
    await queryRunner.query('DROP TABLE IF EXISTS "backups"');
  }
}
