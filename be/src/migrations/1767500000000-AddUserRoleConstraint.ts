import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleConstraint1767500000000 implements MigrationInterface {
  name = 'AddUserRoleConstraint1767500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_users_role" CHECK (role IN ('user','admin','monitoring','teacher','author'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "CHK_users_role"',
    );
  }
}
