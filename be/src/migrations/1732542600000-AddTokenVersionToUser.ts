import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenVersionToUser1732542600000 implements MigrationInterface {
  name = 'AddTokenVersionToUser1732542600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "token_version" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "token_version"
    `);
  }
}
