# Task 1.2.1: Database Schema Design

## 🎯 Цел

Дефиниране на схемата на базата данни, включваща всички необходими таблици и връзки между тях.

## 🛠️ Действия

1. Дефиниране на таблиците и техните колони
2. Дефиниране на първични и външни ключове
3. Създаване на индекси за често използвани заявки
4. Дефиниране на ограничения и валидации
5. Осигуряване на съвместимост с PostgreSQL за production и SQLite за development/testing

## 📋 SQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color_code VARCHAR(7) DEFAULT '#1976d2',
    icon_name VARCHAR(50) DEFAULT 'book',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    topic_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    estimated_reading_time INTEGER DEFAULT 5,
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(category_id, topic_number)
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    passing_percentage INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 3,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(topic_id)
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    question_type VARCHAR(10) NOT NULL DEFAULT 'single' CHECK (question_type IN ('single', 'multiple')),
    question_text TEXT NOT NULL,
    explanation TEXT,
    sort_order INTEGER NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(test_id, sort_order)
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(question_id, sort_order)
);



-- Topic content table
CREATE TABLE IF NOT EXISTS topic_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    language_code VARCHAR(2) NOT NULL DEFAULT 'bg' CHECK (language_code IN ('bg', 'en', 'de')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    search_vector TSVECTOR, -- For full-text search
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(topic_id, language_code)
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_data JSONB, -- Използвайте simple-json за SQLite съвместимост
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, topic_id)
);

-- Test attempts by users
CREATE TABLE IF NOT EXISTS test_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT false,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    answers_data JSONB, -- Stores user's answers
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, test_id, attempt_number)
);

-- Create indexes for better query performance
CREATE INDEX idx_topics_category_id ON topics(category_id);
CREATE INDEX idx_topic_content_topic_id ON topic_content(topic_id);
CREATE INDEX idx_topic_content_language ON topic_content(language_code);
CREATE INDEX idx_tests_topic_id ON tests(topic_id);
CREATE INDEX idx_questions_test_id ON questions(test_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_topic_id ON user_progress(topic_id);
CREATE INDEX idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX idx_test_attempts_test_id ON test_attempts(test_id);
-- Create GIN index for full-text search
CREATE INDEX idx_topic_content_search ON topic_content USING GIN(search_vector);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at
BEFORE UPDATE ON tests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at
BEFORE UPDATE ON answers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at
BEFORE UPDATE ON topics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topic_content_updated_at
BEFORE UPDATE ON topic_content
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON user_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_attempts_updated_at
BEFORE UPDATE ON test_attempts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updating search_vector on topic_content insert/update
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
```

## 📦 Deliverables

- [x] SQL скрипт за създаване на схемата
- [x] Документация за всяка таблица и нейното предназначение
- [x] Индекси за оптимизиране на заявките
- [x] Миграционни скриптове за съществуващи данни (не се изискват за този проект)
- [x] Документация за връзките между таблиците

## 📋 Документация на таблиците и връзките между тях

### 1. Users

Представлява регистрирани потребители в системата с минимален набор от лична информация.

- **Роли**: 'user' (стандартна), 'admin' (административна)
- **Връзки**:
  - One-to-many с UserProgress (един потребител може да има много записи за прогрес)
  - One-to-many с Tests като създател/автор

### 2. Categories

Организира теми в логически групи (например QA Fundamentals, Automation, etc.)

- **Връзки**:
  - One-to-many с Topics (една категория може да съдържа много теми)

### 3. Topics

Индивидуални единици обучително съдържание.

- **Връзки**:
  - Many-to-one с Categories (всяка тема принадлежи на една категория)
  - One-to-many с TopicContent (една тема може да има съдържание на различни езици)
  - One-to-many с UserProgress (една тема може да има записи за прогрес от много потребители)

### 4. Topic Content

Езиково-специфично съдържание за всяка тема с поддръжка на PostgreSQL full-text search.

- **Връзки**:
  - Many-to-one с Topics (всяко съдържание принадлежи на една тема)

### 5. User Progress

Проследява прогреса на потребителите по теми.

- **Връзки**:
  - Many-to-one с Users (всеки запис за прогрес принадлежи на един потребител)
  - Many-to-one с Topics (всеки запис за прогрес е свързан с една тема)

### 6. Tests

Тестове, свързани с теми, за проверка на знанията.

- **Връзки**:
  - One-to-one с Topic (всеки тест е свързан с точно една тема)
  - One-to-many с Questions (всеки тест съдържа много въпроси)
  - One-to-many с TestAttempts (един тест може да има много опити от различни потребители)
  - Many-to-one с Users като създател/автор

### 7. Questions

Въпроси, които са част от тестовете.

- **Връзки**:
  - Many-to-one с Tests (всеки въпрос принадлежи на един тест)
  - One-to-many с Answers (всеки въпрос има много отговори)

### 8. Answers

Възможни отговори към въпросите, с маркиране на правилните.

- **Връзки**:
  - Many-to-one с Questions (всеки отговор принадлежи на един въпрос)

### 9. Test Attempts

Записи на опитите на потребителите да решат тестове, включително резултати и отговори.

- **Връзки**:
  - Many-to-one с Users (всеки опит принадлежи на един потребител)
  - Many-to-one с Tests (всеки опит е за един конкретен тест)
  - Съхранява информация за отговорите на потребителя в JSONB поле

## ⚠️ Бележки за TypeORM и SQLite съвместимост

За разработка и тестване може да се използва SQLite. При дефиниране на TypeORM ентитите, обърнете внимание на следните особености:

1. За JSON полета в PostgreSQL използвайте `type: 'jsonb'`, но за SQLite използвайте `type: 'simple-json'`
2. За timestamp полета в PostgreSQL използвайте `type: 'timestamp'`, но за SQLite използвайте `type: 'datetime'`
3. За enum полета в PostgreSQL може да използвате `type: 'enum'`, но за SQLite използвайте `type: 'varchar'` с `@Check` constraint
4. Настройте TypeORM да използва SQLite in-memory база данни за локална разработка и тестване

## 🧪 Тестване

```sql
-- Проверка за създадените таблици
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Проверка за наличието на всички необходими таблици
SELECT COUNT(*) = 9 AS all_tables_exist
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('users', 'categories', 'topics', 'topic_content', 'tests', 'questions', 'answers', 'user_progress', 'test_attempts');

-- Проверка за индексите
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public';

-- Проверка за ограниченията
SELECT conname, conrelid::regclass, confrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE contype = 'f';
```

## 📝 Бележки

- Уверете се, че всички таблици имат `created_at` и `updated_at` полета
- Добавете подходящи индекси според често използваните заявки
- Документирайте всички ограничения и валидации
- Проверете дали всички връзки между таблиците са правилно дефинирани
- При имплементация с TypeORM, следвайте singleton pattern за DB connection
- Осигурете съвместимост с Docker средата, която използва PostgreSQL 17
- Спазвайте naming convention от архитектурния документ: snake_case за имена на таблици и колони
