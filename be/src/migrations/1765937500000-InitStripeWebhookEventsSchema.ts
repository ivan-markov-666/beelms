import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitStripeWebhookEventsSchema1765937500000
  implements MigrationInterface
{
  name = 'InitStripeWebhookEventsSchema1765937500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_id" varchar(255) NOT NULL,
        "event_type" varchar(255) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'received',
        "error_message" text,
        "processed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stripe_webhook_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_stripe_webhook_events_event_id"
      ON "stripe_webhook_events" ("event_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stripe_webhook_events_status"
      ON "stripe_webhook_events" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stripe_webhook_events_event_type"
      ON "stripe_webhook_events" ("event_type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_stripe_webhook_events_event_type"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_stripe_webhook_events_status"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_stripe_webhook_events_event_id"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "stripe_webhook_events"');
  }
}
