import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEncryptionMetaToBackups1769700000000
  implements MigrationInterface
{
  name = 'AddEncryptionMetaToBackups1769700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "backups" ADD COLUMN IF NOT EXISTS "encryption_meta" jsonb',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "backups" DROP COLUMN IF EXISTS "encryption_meta"',
    );
  }
}
