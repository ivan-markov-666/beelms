import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitPaymentCheckoutsSchema1769400000000
  implements MigrationInterface
{
  name = 'InitPaymentCheckoutsSchema1769400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_checkouts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "provider" varchar(20) NOT NULL,
        "course_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "external_order_id" varchar(255) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'created',
        "amount_cents" integer NOT NULL,
        "currency" varchar(3) NOT NULL,
        "mypos_trnref" varchar(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_checkouts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payment_checkouts_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payment_checkouts_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_payment_checkouts_provider_external_order_id"
      ON "payment_checkouts" ("provider", "external_order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_checkouts_user_id"
      ON "payment_checkouts" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_checkouts_course_id"
      ON "payment_checkouts" ("course_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_payment_checkouts_course_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_payment_checkouts_user_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_payment_checkouts_provider_external_order_id"',
    );

    await queryRunner.query('DROP TABLE IF EXISTS "payment_checkouts"');
  }
}
