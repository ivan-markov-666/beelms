# QA Learning Management System - Regression Test Suite Documentation

Този документ описва тестовете, включени в регресионния пакет на проекта (`test:regression`).

## Unit Test: Environment Configuration Validation (Backend)

Файл: `apps/backend/test/config-validation.spec.ts`

**Цел:** Да гарантира, че backend приложението валидира правилно задължителните променливи на средата при стартиране.

### Покривани сценарии

| Сценарий | Очакван резултат |
| -------- | ---------------- |
| Липсва `DATABASE_URL` | Приложението хвърля грешка при инициализация |
| `DATABASE_URL` има невалиден формат | Приложението хвърля грешка при инициализация |

Тестът създава in-memory NestJS модул, който зарежда `ConfigModule` със същата Joi схема (`validationSchema`), и очаква `compile()` да отхвърли промиса.

