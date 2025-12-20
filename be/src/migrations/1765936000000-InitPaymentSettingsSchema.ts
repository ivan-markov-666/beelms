import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitPaymentSettingsSchema1765936000000
  implements MigrationInterface
{
  name = 'InitPaymentSettingsSchema1765936000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "payment_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "currency" varchar(3) NOT NULL DEFAULT 'eur',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_settings_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "payment_settings" ("currency") VALUES ('eur')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "payment_settings"');
  }
}
