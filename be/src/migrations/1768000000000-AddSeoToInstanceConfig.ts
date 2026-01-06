import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSeoToInstanceConfig1768000000000 implements MigrationInterface {
  name = 'AddSeoToInstanceConfig1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "instance_config" ADD COLUMN IF NOT EXISTS "seo" jsonb',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "instance_config" DROP COLUMN IF EXISTS "seo"',
    );
  }
}
