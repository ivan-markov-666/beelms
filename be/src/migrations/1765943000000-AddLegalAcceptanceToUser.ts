import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLegalAcceptanceToUser1765943000000
  implements MigrationInterface
{
  name = 'AddLegalAcceptanceToUser1765943000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "terms_accepted_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "privacy_accepted_at" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "privacy_accepted_at",
      DROP COLUMN "terms_accepted_at"
    `);
  }
}
