import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGdprLifecycleFieldsToUser1732542500000
  implements MigrationInterface
{
  name = 'AddGdprLifecycleFieldsToUser1732542500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "password_last_changed_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "gdpr_erasure_requested_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "gdpr_erasure_completed_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "last_export_requested_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "last_export_delivered_at" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "last_export_delivered_at",
      DROP COLUMN "last_export_requested_at",
      DROP COLUMN "gdpr_erasure_completed_at",
      DROP COLUMN "gdpr_erasure_requested_at",
      DROP COLUMN "password_last_changed_at"
    `);
  }
}
