# QA Learning Management System - Regression Test Suite Documentation

Този документ описва тестовете, включени в регресионния пакет на проекта (`test:regression`).

## Regression Suite Overview

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

| Сценарий | Очакван резултат |
| -------- | ---------------- |
| Липсва `DATABASE_URL` | Приложението хвърля грешка при инициализация |
| `DATABASE_URL` има невалиден формат | Приложението хвърля грешка при инициализация |

Тестът създава in-memory NestJS модул, който зарежда `ConfigModule` със същата Joi схема (`validationSchema`), и очаква `compile()` да отхвърли промиса.

