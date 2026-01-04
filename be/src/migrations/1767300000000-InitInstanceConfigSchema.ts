import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitInstanceConfigSchema1767300000000
  implements MigrationInterface
{
  name = 'InitInstanceConfigSchema1767300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "instance_config" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "branding" jsonb NOT NULL,
        "features" jsonb NOT NULL,
        "languages" jsonb NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_instance_config_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "instance_config" ("branding", "features", "languages")
      VALUES (
        '{"appName":"BeeLMS","cursorUrl":null,"cursorLightUrl":null,"cursorDarkUrl":null,"logoUrl":null,"logoLightUrl":null,"logoDarkUrl":null,"primaryColor":null}',
        '{"wikiPublic":true,"courses":true,"auth":true,"paidCourses":true,"gdprLegal":true,"infraRedis":false,"infraRabbitmq":false,"infraMonitoring":true,"infraErrorTracking":false}',
        '{"supported":["bg","en","de"],"default":"bg"}'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "instance_config"');
  }
}
