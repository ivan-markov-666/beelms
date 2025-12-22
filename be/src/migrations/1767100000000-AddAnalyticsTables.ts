import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnalyticsTables1767100000000 implements MigrationInterface {
  name = 'AddAnalyticsTables1767100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "analytics_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "visitor_id" character varying(64) NOT NULL,
        "started_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "last_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "source" character varying(128),
        "initial_path" character varying(512),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analytics_sessions_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analytics_sessions_visitor_last_seen" ON "analytics_sessions" ("visitor_id", "last_seen_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analytics_sessions_started_at" ON "analytics_sessions" ("started_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "analytics_page_views_daily" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "view_date" date NOT NULL,
        "path" character varying(512) NOT NULL,
        "source" character varying(128) NOT NULL DEFAULT 'direct',
        "view_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analytics_page_views_daily_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_analytics_page_views_daily_date_path_source" ON "analytics_page_views_daily" ("view_date", "path", "source")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analytics_page_views_daily_view_date" ON "analytics_page_views_daily" ("view_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analytics_page_views_daily_path" ON "analytics_page_views_daily" ("path")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_analytics_page_views_daily_path"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_analytics_page_views_daily_view_date"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_analytics_page_views_daily_date_path_source"',
    );
    await queryRunner.query(
      'DROP TABLE IF EXISTS "analytics_page_views_daily"',
    );

    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_analytics_sessions_started_at"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_analytics_sessions_visitor_last_seen"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "analytics_sessions"');
  }
}
