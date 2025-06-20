# Backend API Документация (v1)

> Забележка: Това е **headless** backend. Всички заявки и отговори са в JSON формат, UTF-8. Всички публични URL префиксират `/api/v1`.

## Общи правила

| Поле | Стойност |
|------|----------|
| Content-Type | `application/json` |
| Authentication | Bearer JWT в `Authorization` header |
| Pagination | Query параметри `page` (1-based) и `limit` (<=100) |
| X-Request-Id | Уникален идентификатор на заявката (UUID) изпращан и от клиента; връща се обратно в отговора |
| Date/Time | ISO-8601, UTC |
| Версиониране | `/api/v{n}` в пътя |
| Idempotency | Повтарящите се POST/PUT заявки трябва да са идемпотентни |

Стандартният формат на успешен отговор:
```jsonc
{
  "success": true,
  "data": { /* payload */ }
}
```

Формат на грешка:
```jsonc
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is invalid",
    "details": [
      { "field": "email", "message": "Invalid format" }
    ]
  }
}
```

---

## 1. Auth Service

| Метод | Път | Описание | Тяло (пример) | Отговор 200 |
|-------|-----|----------|---------------|-------------|
| POST | `/auth/register` | Регистрация на нов потребител | `{ "email": "user@site.com", "password": "Passw0rd!" }` | `{ "accessToken": "...", "refreshToken": "..." }` |
| POST | `/auth/login` | Вписване | `{ "email": "user@site.com", "password": "Passw0rd!" }` | Същото |
| POST | `/auth/logout` | Инвалидация на сесия | — | `{ "message": "Logged out" }` |
| POST | `/auth/refresh` | Нови токени | `{ "refreshToken": "..." }` | Нови токени |
| POST | `/auth/forgot-password` | Искане за ресет | `{ "email": "user@site.com" }` | 204 |
| POST | `/auth/reset-password` | Смяна на парола | `{ "token": "...", "password": "NewPass1!" }` | 204 |
| GET  | `/auth/verify-email?token=...` | Потвърждаване на email | — | 200 |

---

## 2. User Service

| Метод | Път | Scope | Описание |
|-------|-----|-------|----------|
| GET | `/users/profile` | USER | Взима профила на текущия user |
| PUT | `/users/profile` | USER | Актуализира профила |
| GET | `/users/:id` | ADMIN | Взима потребител по id |
| GET | `/users` | ADMIN | Списък с потребители (`page`,`limit`) |
| PUT | `/users/:id` | ADMIN | Актуализира потребител |
| DELETE | `/users/:id` | ADMIN | Изтрива/деактивира |
| POST | `/users/:id/deactivate` | ADMIN | Деактивира акаунт |
| GET | `/users/:id/sessions` | ADMIN | Активни сесии |

---

## 3. Course Service

Основен ресурс **Course** (и вложени Chapter/Content).

| Метод | Път | Описание |
|-------|-----|----------|
| GET | `/courses` | Филтър, търсене, сорт. |
| POST | `/courses` | Създаване (ADMIN) |
| GET | `/courses/:id` | Детайли |
| PUT | `/courses/:id` | Обновяване |
| DELETE | `/courses/:id` | Изтриване |
| GET | `/courses/:id/chapters` | Списък глави |
| POST | `/courses/:id/chapters` | Добавяне глава |
| ... | ... | Вж. `03-service-schemas.md` |

Pattern за вложени ресурси се повтаря (`/chapters/:id/content`, `/content/:id/versions`, и т.н.).

---

## 4. Test Service

| Метод | Път | Описание |
|-------|-----|----------|
| GET | `/tests/chapter/:chapterId` | Всички тестове в глава |
| POST | `/tests` | Създаване на тест |
| POST | `/tests/:id/start` | Стартиране на тест (създава attempt) |
| POST | `/attempts/:attemptId/answer` | Записва отговор |
| POST | `/attempts/:attemptId/complete` | Приключва тест |
| GET | `/attempts/:attemptId/results` | Взима резултат |

---

## 5. Analytics Service

| Метод | Път | Описание |
|-------|-----|----------|
| GET | `/analytics/user/:userId/progress` | Прогрес на потребител |
| GET | `/analytics/test/:testId/statistics` | Статистика за тест |
| GET | `/analytics/course/:courseId/completion` | Резултати по курс |
| GET | `/analytics/dashboard` | Админ дашборд |
| POST | `/analytics/export` | Експорт (CSV/PDF) |

---

## 6. Ads Service

| Метод | Път | Scope | Описание |
|-------|-----|-------|----------|
| GET | `/ads/serve` | PUBLIC | Връща реклама спрямо таргетиране |
| POST | `/ads/view` | PUBLIC | Записва импресия |
| POST | `/ads/click` | PUBLIC | Записва клик |
| GET | `/ads` | ADMIN | Списък реклами |
| POST | `/ads` | ADMIN | Създава реклама |
| PUT | `/ads/:id` | ADMIN | Обновява реклама |
| DELETE | `/ads/:id` | ADMIN | Изтрива реклама |

---

## OpenAPI/Swagger

> TODO: Когато билдът генерира Swagger спецификациите, добавете линк към съответния `/api/v1/docs` на всеки микросервис или агрегирания API Gateway.


Всеки микросервис генерира Swagger UI на `/api/v1/docs`.
- Генерира се автоматично чрез `@nestjs/swagger`
- YAML/JSON spec се публикува в CI артефактите
- Глобален API Gateway агрегатор (optional) може да събира specs за единна документация
