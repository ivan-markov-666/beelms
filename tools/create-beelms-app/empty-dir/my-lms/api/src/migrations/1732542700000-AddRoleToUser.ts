import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleToUser1732542700000 implements MigrationInterface {
  name = 'AddRoleToUser1732542700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN "role" character varying(20) NOT NULL DEFAULT \'user\'',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "role"');
  }
}
