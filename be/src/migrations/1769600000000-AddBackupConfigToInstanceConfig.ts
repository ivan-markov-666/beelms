import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBackupConfigToInstanceConfig1769600000000
  implements MigrationInterface
{
  name = 'AddBackupConfigToInstanceConfig1769600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "instance_config" ADD COLUMN IF NOT EXISTS "backup_config" jsonb',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "instance_config" DROP COLUMN IF EXISTS "backup_config"',
    );
  }
}
