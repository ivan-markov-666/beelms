import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1689151200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Включваме UUID extension за PostgreSQL, но пропускаме за SQLite
    if (queryRunner.connection.options.type === 'postgres') {
      await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    }

    // Създаваме таблица за потребители
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        is_active BOOLEAN NOT NULL DEFAULT false,
        preferred_language VARCHAR(2) DEFAULT 'bg' CHECK (preferred_language IN ('bg', 'en', 'de')),
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Създаваме таблица за категории
    await queryRunner.query(`
      CREATE TABLE categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color_code VARCHAR(7) DEFAULT '#1976d2',
        icon_name VARCHAR(50) DEFAULT 'book',
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Създаваме таблица за теми
    await queryRunner.query(`
      CREATE TABLE topics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        category_id UUID NOT NULL,
        topic_number INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        estimated_reading_time INTEGER DEFAULT 5,
        is_published BOOLEAN DEFAULT FALSE,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category_id, topic_number),
        CONSTRAINT fk_topic_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        CONSTRAINT fk_topic_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Създаваме таблица за съдържание на темите
    await queryRunner.query(`
      CREATE TABLE topic_content (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        topic_id UUID NOT NULL,
        language_code VARCHAR(2) NOT NULL DEFAULT 'bg' CHECK (language_code IN ('bg', 'en', 'de')),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        meta_description TEXT,
        search_vector ${queryRunner.connection.options.type === 'postgres' ? 'TSVECTOR' : 'TEXT'},
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(topic_id, language_code),
        CONSTRAINT fk_topic_content_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
        CONSTRAINT fk_topic_content_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Създаваме таблица за тестове
    await queryRunner.query(`
      CREATE TABLE tests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        topic_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        passing_percentage INTEGER DEFAULT 70,
        max_attempts INTEGER DEFAULT 3,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(topic_id),
        CONSTRAINT fk_test_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
        CONSTRAINT fk_test_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Създаваме таблица за въпроси
    await queryRunner.query(`
      CREATE TABLE questions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id UUID NOT NULL,
        question_type VARCHAR(10) NOT NULL DEFAULT 'single' CHECK (question_type IN ('single', 'multiple')),
        question_text TEXT NOT NULL,
        explanation TEXT,
        sort_order INTEGER NOT NULL,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(test_id, sort_order),
        CONSTRAINT fk_question_test FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
        CONSTRAINT fk_question_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Създаваме таблица за отговори
    await queryRunner.query(`
      CREATE TABLE answers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        question_id UUID NOT NULL,
        answer_text TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(question_id, sort_order),
        CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);

    // Създаваме таблица за потребителски прогрес
    await queryRunner.query(`
      CREATE TABLE user_progress (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        topic_id UUID NOT NULL,
        is_completed BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMP WITH TIME ZONE,
        progress_data ${queryRunner.connection.options.type === 'postgres' ? 'JSONB' : 'TEXT'},
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, topic_id),
        CONSTRAINT fk_user_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_progress_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
      )
    `);

    // Създаваме таблица за опити на тестове
    await queryRunner.query(`
      CREATE TABLE test_attempts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        test_id UUID NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        passed BOOLEAN NOT NULL DEFAULT false,
        attempt_number INTEGER NOT NULL DEFAULT 1,
        answers_data ${queryRunner.connection.options.type === 'postgres' ? 'JSONB' : 'TEXT'},
        started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, test_id, attempt_number),
        CONSTRAINT fk_test_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_test_attempt_test FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
      )
    `);

    // Създаваме индекси
    await queryRunner.query(`CREATE INDEX idx_topics_category_id ON topics(category_id)`);
    await queryRunner.query(`CREATE INDEX idx_topic_content_topic_id ON topic_content(topic_id)`);
    await queryRunner.query(`CREATE INDEX idx_topic_content_language ON topic_content(language_code)`);
    await queryRunner.query(`CREATE INDEX idx_tests_topic_id ON tests(topic_id)`);
    await queryRunner.query(`CREATE INDEX idx_questions_test_id ON questions(test_id)`);
    await queryRunner.query(`CREATE INDEX idx_answers_question_id ON answers(question_id)`);
    await queryRunner.query(`CREATE INDEX idx_user_progress_user_id ON user_progress(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_user_progress_topic_id ON user_progress(topic_id)`);
    await queryRunner.query(`CREATE INDEX idx_test_attempts_user_id ON test_attempts(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_test_attempts_test_id ON test_attempts(test_id)`);

    // Създаваме специфичен GIN индекс само за PostgreSQL
    if (queryRunner.connection.options.type === 'postgres') {
      await queryRunner.query(`CREATE INDEX idx_topic_content_search ON topic_content USING GIN(search_vector)`);
    }

    // Създаваме trigger функцията за update_updated_at само за PostgreSQL
    if (queryRunner.connection.options.type === 'postgres') {
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Създаваме всички triggers за updated_at
      const tables = [
        'users',
        'categories',
        'topics',
        'topic_content',
        'tests',
        'questions',
        'answers',
        'user_progress',
        'test_attempts',
      ];

      for (const table of tables) {
        await queryRunner.query(`
          CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);
      }

      // Създаваме trigger за full-text search
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION update_topic_content_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
          IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (NEW.title <> OLD.title OR NEW.content <> OLD.content)) THEN
            NEW.search_vector = setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
                              setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER update_topic_content_search
        BEFORE INSERT OR UPDATE ON topic_content
        FOR EACH ROW EXECUTE FUNCTION update_topic_content_search_vector();
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Изтриваме таблиците в обратен ред
    await queryRunner.query(`DROP TABLE IF EXISTS test_attempts`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_progress`);
    await queryRunner.query(`DROP TABLE IF EXISTS answers`);
    await queryRunner.query(`DROP TABLE IF EXISTS questions`);
    await queryRunner.query(`DROP TABLE IF EXISTS tests`);
    await queryRunner.query(`DROP TABLE IF EXISTS topic_content`);
    await queryRunner.query(`DROP TABLE IF EXISTS topics`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);

    // Изтриваме trigger функциите само за PostgreSQL
    if (queryRunner.connection.options.type === 'postgres') {
      await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`);
      await queryRunner.query(`DROP FUNCTION IF EXISTS update_topic_content_search_vector() CASCADE`);
    }
  }
}
