# QA Learning Management System - Regression Test Suite Documentation

Този документ описва тестовете, включени в регресионния пакет на проекта (`test:regression`).

## Regression Suite Overview

### Smoke Test – Миграции (Task 1.2.2)

| Файл / Стъпка в CI | Цел |
| ------------------ | ------------------------------------------------------------ |
| `.github/workflows/ci.yml` – **Validate DB Migrations** | Стартира чист контейнер с PostgreSQL 15, задава `DATABASE_URL` и изпълнява `pnpm --filter @qa-platform/backend run migration:run`. Целта е да се гарантира, че всички миграции се изпълняват без синтактични или логически грешки върху празна база данни. Ако SQL е невалиден или липсва миграция, pipeline-ът ще се провали. |

Локално можете да стартирате същата проверка с:

```bash
pnpm --filter @qa-platform/backend run migration:run
```

Това ще приложи миграциите към базата, посочена в `DATABASE_URL`.

`test:regression` е npm скрипт, дефиниран в коренния `package.json`, който изпълнява всички видове тестове (unit, integration, e2e) във всеки пакет на monorepo-то, използвайки **pnpm workspaces**. Всички тестове се стартират паралелно за бърза обратна връзка.

### Стартиране локално

```bash
pnpm test:regression
```

### В CI Pipeline

В GitHub Actions workflow-а (`ci.yml`) този скрипт се изпълнява автоматично след стъпката `build`. Ако някой тест се провали, pipeline-ът ще бъде маркиран като неуспешен и кодът няма да бъде слят.

## Unit Test: Environment Configuration Validation (Backend)

Файл: `apps/backend/test/config-validation.spec.ts`

**Цел:** Да гарантира, че backend приложението валидира правилно задължителните променливи на средата при стартиране.

### Покривани сценарии

| Сценарий                            | Очакван резултат                             |
| ----------------------------------- | -------------------------------------------- |
| Липсва `DATABASE_URL`               | Приложението хвърля грешка при инициализация |
| `DATABASE_URL` има невалиден формат | Приложението хвърля грешка при инициализация |

Тестът създава in-memory NestJS модул, който зарежда `ConfigModule` със същата Joi схема (`validationSchema`), и очаква `compile()` да отхвърли промиса.

---

## Integration Tests: Core Entities (Task 1.2.1)

Интеграционните тестове за задачата **1.2.1** гарантират, че всички TypeORM entities са правилно дефинирани, взаимносвързани и отговарят на заложените ограничения.

| Файл                                                         | Основна цел                                                                                                                                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/backend/test/entities.integration.spec.ts`             | Smoke-тест за пълната йерархия (User → Category → Course → Topic → Test → Question + SystemSetting). Проверява успешен `save` / `find` и коректност на релациите.                                            |
| `apps/backend/test/user-progress.integration.spec.ts`        | Специфични сценарии за таблиците с композитен ключ `UserProgress` и `UserCourseProgress`: уникалност, cascade delete, bulk insert.                                                                           |
| `apps/backend/test/entities-constraints.integration.spec.ts` | Валидира UNIQUE (`User.email`, `Category.name`), CHECK (`User.role`), `updatedAt` timestamp, както и каскадна верига Category ➜ … ➜ Question.                                                                |
| `apps/backend/test/entities-edge.integration.spec.ts`        | Negative FK случаи, default стойности, повторно създаване на запис след изтриване, `Topic.content` update.                                                                                                   |
| `apps/backend/test/entities-coverage.integration.spec.ts`    | Допълнителни ъглови случаи: cascade delete на `Course`, duplicate composite-PK за `UserCourseProgress`, големи стойности в `SystemSetting`, JSON сериализация на `Question.options`, транзакционен rollback. |

### Команда за стартиране само на тези тестове

```bash
pnpm --filter backend test -- --runTestsByPath \
  test/entities.integration.spec.ts \
  test/user-progress.integration.spec.ts \
  test/entities-constraints.integration.spec.ts \
  test/entities-edge.integration.spec.ts \
  test/entities-coverage.integration.spec.ts --runInBand
```

Всички тестове използват in-memory SQLite база (`DataSource` с `database: ':memory:'`), което ги прави бързи и изолирани от външни услуги.

### Integration Test – Data Seeding (Task 1.2.3)

| Файл | Цел |
| ----- | ---- |
| `apps/backend/test/seeders.integration.spec.ts` | Стартира празна in-memory база, изпълнява `seedDatabase` и проверява:
  1. Създадени са ≥1 категория и admin потребител.
  2. Изпълнението е идемпотентно – повторно пускане не добавя дублирания.
  3. Общият брой е точно 5 категории и 11 потребителя (1 admin + 10 users).
  4. Имената на категориите и email-ите на потребителите са уникални.|

Стартиране само на този тест:

```bash
pnpm --filter @qa-platform/backend test -- --runTestsByPath test/seeders.integration.spec.ts
```

### Integration Test – Global ValidationPipe (Task 1.3.1)

| Файл | Цел |
| ----- | ---- |
| `apps/backend/test/validation-pipe.integration.spec.ts` | Потвърждава, че глобалният `ValidationPipe` е активен: изпраща DTO с невалиден email към `/test-dto` и очаква HTTP 400 (Bad Request).


