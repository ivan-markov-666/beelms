import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsPaidToCourses1765932100000 implements MigrationInterface {
  name = 'AddIsPaidToCourses1765932100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courses" ADD "is_paid" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "is_paid"`);
  }
}
