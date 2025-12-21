import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendStripeWebhookEventsForObservability1765940000000
  implements MigrationInterface
{
  name = 'ExtendStripeWebhookEventsForObservability1765940000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stripe_webhook_events"
      ADD COLUMN IF NOT EXISTS "event_payload" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "stripe_webhook_events"
      ADD COLUMN IF NOT EXISTS "error_stack" text
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stripe_webhook_events_processed_at"
      ON "stripe_webhook_events" ("processed_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_stripe_webhook_events_processed_at"',
    );

    await queryRunner.query(`
      ALTER TABLE "stripe_webhook_events"
      DROP COLUMN IF EXISTS "error_stack"
    `);

    await queryRunner.query(`
      ALTER TABLE "stripe_webhook_events"
      DROP COLUMN IF EXISTS "event_payload"
    `);
  }
}
