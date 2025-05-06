// db/migrations/migrations/1683456789000-CreateInitialSchema.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1683456789000 implements MigrationInterface {
  name = 'CreateInitialSchema1683456789000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Създаване на таблица Users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password_hash" VARCHAR(255) NOT NULL,
        "salt" VARCHAR(255) NOT NULL,
        "role" VARCHAR(50) NOT NULL DEFAULT 'user',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
        "last_login" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Създаване на таблица UserProfiles
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL UNIQUE,
        "first_name" VARCHAR(100),
        "last_name" VARCHAR(100),
        "avatar_url" VARCHAR(255),
        "preferences" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_user_profiles_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    // Създаване на таблица Courses
    await queryRunner.query(`
      CREATE TABLE "courses" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "cover_image_url" VARCHAR(255),
        "metadata" JSONB,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Създаване на таблица Chapters
    await queryRunner.query(`
      CREATE TABLE "chapters" (
        "id" SERIAL PRIMARY KEY,
        "course_id" INTEGER NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_chapters_course" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE
      )
    `);

    // Създаване на таблица Contents
    await queryRunner.query(`
      CREATE TABLE "contents" (
        "id" SERIAL PRIMARY KEY,
        "chapter_id" INTEGER NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "content" TEXT NOT NULL,
        "content_type" VARCHAR(50) NOT NULL DEFAULT 'text',
        "order" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_contents_chapter" FOREIGN KEY ("chapter_id") REFERENCES "chapters" ("id") ON DELETE CASCADE
      )
    `);

    // Създаване на таблица UserProgress
    await queryRunner.query(`
      CREATE TABLE "user_progress" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "chapter_id" INTEGER NOT NULL,
        "content_id" INTEGER,
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "progress_percentage" INTEGER NOT NULL DEFAULT 0,
        "last_accessed" TIMESTAMP NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_user_progress_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_progress_chapter" FOREIGN KEY ("chapter_id") REFERENCES "chapters" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_progress_content" FOREIGN KEY ("content_id") REFERENCES "contents" ("id") ON DELETE SET NULL
      )
    `);

    // Създаване на таблица Tests
    await queryRunner.query(`
      CREATE TABLE "tests" (
        "id" SERIAL PRIMARY KEY,
        "chapter_id" INTEGER NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "time_limit" INTEGER,
        "passing_score" INTEGER NOT NULL DEFAULT 60,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_tests_chapter" FOREIGN KEY ("chapter_id") REFERENCES "chapters" ("id") ON DELETE CASCADE
      )
    `);

    // Създаване на таблица Questions
    await queryRunner.query(`
      CREATE TABLE "questions" (
        "id" SERIAL PRIMARY KEY,
        "test_id" INTEGER NOT NULL,
        "question_text" TEXT NOT NULL,
        "question_type" VARCHAR(50) NOT NULL DEFAULT 'single_choice',
        "options" JSONB NOT NULL,
        "correct_answers" JSONB NOT NULL,
        "points" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_questions_test" FOREIGN KEY ("test_id") REFERENCES "tests" ("id") ON DELETE CASCADE
      )
    `);

    // Създаване на таблица UserTestAttempts
    await queryRunner.query(`
      CREATE TABLE "user_test_attempts" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "test_id" INTEGER NOT NULL,
        "score" INTEGER NOT NULL DEFAULT 0,
        "passed" BOOLEAN NOT NULL DEFAULT false,
        "time_spent" INTEGER NOT NULL DEFAULT 0,
        "started_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP,
        CONSTRAINT "fk_user_test_attempts_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_test_attempts_test" FOREIGN KEY ("test_id") REFERENCES "tests" ("id") ON DELETE CASCADE
      )
    `);

    // Създаване на таблица UserAnswers
    await queryRunner.query(`
      CREATE TABLE "user_answers" (
        "id" SERIAL PRIMARY KEY,
        "attempt_id" INTEGER NOT NULL,
        "question_id" INTEGER NOT NULL,
        "selected_answers" JSONB NOT NULL,
        "is_correct" BOOLEAN NOT NULL DEFAULT false,
        "points_earned" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_user_answers_attempt" FOREIGN KEY ("attempt_id") REFERENCES "user_test_attempts" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_answers_question" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE CASCADE
      )
    `);

    // Създаване на таблица Advertisements
    await queryRunner.query(`
      CREATE TABLE "advertisements" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "image_url" VARCHAR(255) NOT NULL,
        "target_url" VARCHAR(255) NOT NULL,
        "start_date" TIMESTAMP NOT NULL,
        "end_date" TIMESTAMP NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "impressions" INTEGER NOT NULL DEFAULT 0,
        "clicks" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Създаване на таблица UserAdViews
    await queryRunner.query(`
      CREATE TABLE "user_ad_views" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "ad_id" INTEGER NOT NULL,
        "clicked" BOOLEAN NOT NULL DEFAULT false,
        "viewed_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_user_ad_views_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_ad_views_ad" FOREIGN KEY ("ad_id") REFERENCES "advertisements" ("id") ON DELETE CASCADE
      )
    `);

    // Създаване на таблица PasswordResets
    await queryRunner.query(`
      CREATE TABLE "password_resets" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "token" VARCHAR(255) NOT NULL,
        "used" BOOLEAN NOT NULL DEFAULT false,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_password_resets_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    // Създаване на таблица Sessions
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "token" VARCHAR(255) NOT NULL,
        "ip_address" VARCHAR(45),
        "user_agent" TEXT,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "last_active" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    // Създаване на индекси за оптимизация на заявките
    await queryRunner.query(`CREATE INDEX "idx_user_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "idx_user_profile_user_id" ON "user_profiles" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_chapter_course_id" ON "chapters" ("course_id")`);
    await queryRunner.query(`CREATE INDEX "idx_content_chapter_id" ON "contents" ("chapter_id")`);
    await queryRunner.query(`CREATE INDEX "idx_user_progress_user_id" ON "user_progress" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_user_progress_chapter_id" ON "user_progress" ("chapter_id")`);
    await queryRunner.query(`CREATE INDEX "idx_test_chapter_id" ON "tests" ("chapter_id")`);
    await queryRunner.query(`CREATE INDEX "idx_question_test_id" ON "questions" ("test_id")`);
    await queryRunner.query(`CREATE INDEX "idx_user_test_attempts_user_id" ON "user_test_attempts" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_user_test_attempts_test_id" ON "user_test_attempts" ("test_id")`);
    await queryRunner.query(`CREATE INDEX "idx_user_answers_attempt_id" ON "user_answers" ("attempt_id")`);
    await queryRunner.query(`CREATE INDEX "idx_user_answers_question_id" ON "user_answers" ("question_id")`);
    await queryRunner.query(`CREATE INDEX "idx_advertisement_is_active" ON "advertisements" ("is_active")`);
    await queryRunner.query(`CREATE INDEX "idx_advertisement_dates" ON "advertisements" ("start_date", "end_date")`);
    await queryRunner.query(`CREATE INDEX "idx_user_ad_views_user_id" ON "user_ad_views" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_user_ad_views_ad_id" ON "user_ad_views" ("ad_id")`);
    await queryRunner.query(`CREATE INDEX "idx_password_reset_token" ON "password_resets" ("token")`);
    await queryRunner.query(`CREATE INDEX "idx_password_reset_user_id" ON "password_resets" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_session_token" ON "sessions" ("token")`);
    await queryRunner.query(`CREATE INDEX "idx_session_user_id" ON "sessions" ("user_id")`);

    // Създаване на админ потребител (закоментирано, ще се създаде ръчно по-късно)
    /*
    await queryRunner.query(`
      INSERT INTO "users" ("email", "password_hash", "salt", "role", "is_active")
      VALUES ('admin@example.com', 'HASH_PLACEHOLDER', 'SALT_PLACEHOLDER', 'admin', true)
    `);
    */
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Изтриване на таблиците в обратен ред
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_resets" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_ad_views" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "advertisements" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_answers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_test_attempts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "questions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tests" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_progress" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chapters" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "courses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
  }
}
