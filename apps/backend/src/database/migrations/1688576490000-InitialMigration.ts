/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm'

/*
 * InitialMigration auto-generated manually.
 * It mirrors the current entity definitions as of 2025-07-05.
 * If you later change entities, generate a new migration instead of editing this one.
 */
export class InitialMigration1688576490000 implements MigrationInterface {
  name = 'InitialMigration1688576490000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid extension (PostgreSQL)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

    // --- core tables ---
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \"category\" (\n      \"id\" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),\n      \"name\" varchar NOT NULL UNIQUE,\n      \"created_at\" TIMESTAMP NOT NULL DEFAULT now(),\n      \"updated_at\" TIMESTAMP NOT NULL DEFAULT now()\n    )`)

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \"course\" (\n      \"id\" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),\n      \"title\" varchar NOT NULL,\n      \"description\" text NOT NULL,\n      \"category_id\" uuid REFERENCES \"category\"(\"id\") ON DELETE CASCADE,\n      \"created_at\" TIMESTAMP NOT NULL DEFAULT now(),\n      \"updated_at\" TIMESTAMP NOT NULL DEFAULT now()\n    )`)

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \"topic\" (\n      \"id\" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),\n      \"title\" varchar NOT NULL,\n      \"content\" text NOT NULL,\n      \"course_id\" uuid REFERENCES \"course\"(\"id\") ON DELETE CASCADE,\n      \"created_at\" TIMESTAMP NOT NULL DEFAULT now(),\n      \"updated_at\" TIMESTAMP NOT NULL DEFAULT now()\n    )`)

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \"test\" (\n      \"id\" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),\n      \"title\" varchar NOT NULL,\n      \"topic_id\" uuid REFERENCES \"topic\"(\"id\") ON DELETE CASCADE,\n      \"created_at\" TIMESTAMP NOT NULL DEFAULT now(),\n      \"updated_at\" TIMESTAMP NOT NULL DEFAULT now()\n    )`)

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \"question\" (\n      \"id\" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),\n      \"text\" text NOT NULL,\n      \"options\" jsonb NOT NULL,\n      \"correct_answer_index\" int NOT NULL,\n      \"test_id\" uuid REFERENCES \"test\"(\"id\") ON DELETE CASCADE,\n      \"created_at\" TIMESTAMP NOT NULL DEFAULT now(),\n      \"updated_at\" TIMESTAMP NOT NULL DEFAULT now()\n    )`)

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \"user\" (\n      \"id\" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),\n      \"email\" varchar NOT NULL UNIQUE,\n      \"password\" varchar NOT NULL,\n      \"role\" varchar NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),\n      \"created_at\" TIMESTAMP NOT NULL DEFAULT now(),\n      \"updated_at\" TIMESTAMP NOT NULL DEFAULT now()\n    )`)

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \"user_progress\" (\n      \"user_id\" uuid NOT NULL,\n      \"topic_id\" uuid NOT NULL,\n      \"completed_at\" TIMESTAMP NOT NULL DEFAULT now(),\n      PRIMARY KEY (\"user_id\", \"topic_id\"),\n      FOREIGN KEY (\"user_id\") REFERENCES \"user\"(\"id\") ON DELETE CASCADE,\n      FOREIGN KEY (\"topic_id\") REFERENCES \"topic\"(\"id\") ON DELETE CASCADE\n    )`)

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \"user_course_progress\" (\n      \"user_id\" uuid NOT NULL,\n      \"course_id\" uuid NOT NULL,\n      \"completed_topics\" int NOT NULL DEFAULT 0,\n      \"total_topics\" int NOT NULL,\n      \"progress_percentage\" int NOT NULL DEFAULT 0,\n      \"updated_at\" TIMESTAMP NOT NULL DEFAULT now(),\n      PRIMARY KEY (\"user_id\", \"course_id\"),\n      FOREIGN KEY (\"user_id\") REFERENCES \"user\"(\"id\") ON DELETE CASCADE,\n      FOREIGN KEY (\"course_id\") REFERENCES \"course\"(\"id\") ON DELETE CASCADE\n    )`)

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \"system_setting\" (\n      \"id\" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),\n      \"key\" varchar NOT NULL UNIQUE,\n      \"value\" varchar NOT NULL,\n      \"description\" text,\n      \"created_at\" TIMESTAMP NOT NULL DEFAULT now(),\n      \"updated_at\" TIMESTAMP NOT NULL DEFAULT now()\n    )`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS \"system_setting\"')
    await queryRunner.query('DROP TABLE IF EXISTS \"user_course_progress\"')
    await queryRunner.query('DROP TABLE IF EXISTS \"user_progress\"')
    await queryRunner.query('DROP TABLE IF EXISTS \"user\"')
    await queryRunner.query('DROP TABLE IF EXISTS \"question\"')
    await queryRunner.query('DROP TABLE IF EXISTS \"test\"')
    await queryRunner.query('DROP TABLE IF EXISTS \"topic\"')
    await queryRunner.query('DROP TABLE IF EXISTS \"course\"')
    await queryRunner.query('DROP TABLE IF EXISTS \"category\"')
  }
}
