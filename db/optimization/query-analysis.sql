-- Анализира всички таблици
ANALYZE;

-- Включване на времето за изпълнение на заявките
\timing on

-- Проверка за бавни заявки от потребителските прогреси
EXPLAIN ANALYZE
SELECT up.*, c.title as chapter_title, co.title as content_title
FROM user_progress up
JOIN chapters c ON up.chapter_id = c.id
LEFT JOIN contents co ON up.content_id = co.id
WHERE up.user_id = 1
ORDER BY c.order, co.order;

-- Оптимизирана версия:
EXPLAIN ANALYZE
SELECT up.*, c.title as chapter_title, co.title as content_title
FROM user_progress up
JOIN chapters c ON up.chapter_id = c.id
LEFT JOIN contents co ON up.content_id = co.id
WHERE up.user_id = 1
ORDER BY c.order, co.order;

-- Проверка за бавни заявки при вземане на тестове с въпроси
EXPLAIN ANALYZE
SELECT t.*, q.*
FROM tests t
JOIN questions q ON q.test_id = t.id
WHERE t.chapter_id = 1
ORDER BY q.id;

-- Оптимизирана версия:
EXPLAIN ANALYZE
SELECT t.*, q.*
FROM tests t
JOIN questions q ON q.test_id = t.id
WHERE t.chapter_id = 1
ORDER BY q.id;

-- Препоръки за партициониране на големи таблици
-- Например, партициониране на user_answers по месеци:

/*
CREATE TABLE user_answers_partitioned (
    id SERIAL,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_answers JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    points_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE TABLE user_answers_y2023m01 PARTITION OF user_answers_partitioned
    FOR VALUES FROM ('2023-01-01') TO ('2023-02-01');

CREATE TABLE user_answers_y2023m02 PARTITION OF user_answers_partitioned
    FOR VALUES FROM ('2023-02-01') TO ('2023-03-01');

-- и т.н. за всеки месец
*/

-- Потребителски дефинирани индекси за специфични заявки
-- Например, индекс за търсене в JSON полета:

/*
CREATE INDEX idx_question_options ON questions USING gin(options);
CREATE INDEX idx_question_correct_answers ON questions USING gin(correct_answers);
*/

-- Настройка на автовакуум за често променящи се таблици
/*
ALTER TABLE user_progress SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.025
);
*/