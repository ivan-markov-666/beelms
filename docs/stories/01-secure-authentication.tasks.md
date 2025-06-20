# Tasks – Epic 01: Secure Authentication

Този документ съдържа техническите задачи (tasks), необходими за реализиране на user story-тата от епика **„Сигурна автентикация и управление на потребители“**. Всеки task има:

- ID (напр. `AUTH-1-T1`)
- Описание
- Категория / Компонент
- Очакван резултат (Definition of Done)
- Зависимости

---

## AUTH-1 – Регистрация на нов потребител
| Task ID | Описание | Компонент | DoD | Зависимости |
|---------|----------|-----------|-----|-------------|
| AUTH-1-T0 | Инициализация на NestJS проект (CLI) + базови конфигурации (TypeScript, ESLint, Prettier, Jest) | DevOps | `npm run start:dev` стартира без грешки | – |
| AUTH-1-T1 | Създаване/миграция на таблица `users` (email, hash, role, emailVerified, createdAt) | DB | Миграцията се изпълнява без грешки | T0 |
| AUTH-1-T2 | Имплементация на service за хеширане на пароли (bcrypt) | Backend | Юнит тест ≥ 90 % покритие | T1 |
| AUTH-1-T3 | Endpoint `POST /registration` с валидация (email, password) | Backend | Интеграционен тест **201** | T2 |
| AUTH-1-T4 | Генериране на email-verification token + модел `verification_tokens` | Backend, DB | Token TTL 24 h, миграция | T3 |
| AUTH-1-T5 | Имплементация на `EmailService` + изпращане на потвърдителен email | Infrastructure | Имейл получен в Mailhog dev | T4 |
| AUTH-1-T6 | Обновяване на OpenAPI (registration schema + examples) | Docs | `npm run swagger` генерира валиден spec | T3 |
| AUTH-1-T7 | Юнит и интеграционни тестове за registration flow | Tests | ≥ 90 % unit, pass CI | T3–T5 |

### Подробно описание на задачите за AUTH-1 – Регистрация на нов потребител

#### AUTH-1-T0 – Инициализация на NestJS проект
**Компонент:** DevOps / Backend

- Създай нов проект чрез `nest new auth-service` или добави `AuthModule` в mono repo.
- Добави `tsconfig` настройка `"strict": true`, ESLint, Prettier.
- Конфигурирай Jest с репорт за покритие и папка `test/`.
- Създай npm script `test:regression` който стартира всички `*.spec.ts`.
- **DoD:** `npm run start:dev` и `npm run test` минават без грешки; линтер и форматър са чисти.

#### AUTH-1-T1 – Миграция на таблица `users`
**Компонент:** DB

- Създай миграция за таблица `users` със следните колони:
  - `id` UUID, PK, auto-generated
  - `email` VARCHAR(320), UNIQUE, NOT NULL
  - `password_hash` VARCHAR(255), NOT NULL
  - `role` ENUM(`student`, `admin`) DEFAULT `student`
  - `email_verified` BOOLEAN DEFAULT FALSE
  - `created_at` TIMESTAMP DEFAULT NOW()
- Индекси: уникален индекс върху `email`
- Скриптът трябва да бъде обратим (down миграция)
- **DoD:** `npm run migrate` приключва без грешки в dev/test DB; `npm run migrate:undo` връща състоянието без грешки.
- **Тестове:** `users.migration.spec.ts` проверява Up/Down миграции, наличност на всички колони и уникален индекс върху `email`.

#### AUTH-1-T2 – Service за хеширане на пароли
**Компонент:** Backend

- Имплементирай `PasswordService` с методи `hashPassword(password)` и `comparePassword(password, hash)`.
- Използвай `bcrypt` със salt rounds, конфигурируеми чрез `env` (по подразбиране 12).
- Добави dependency injection, за да улесниш тестването.
- **DoD:** ≥ 90 % unit тест покритие; хеш/верификация за < 300 ms при 95-ти персентил.
- **Тестове:** `password.service.spec.ts` – проверява, че `hashPassword` връща различни стойности със случайни salt-ове, `comparePassword` връща true/false коректно и че времето за изпълнение остава под 300 ms.

#### AUTH-1-T3 – Endpoint `POST /registration`
**Компонент:** Backend

- Валидирай `email` (RFC 5322) и парола (мин. 8 символа) чрез `class-validator`.
- Извикай `PasswordService` за хеширане, създай ред в `users`.
- Върни **201 Created** със `Location: /me` и празно тяло.
- Отговори **400** при невалидни входни данни / дублиран email.
- **DoD:** Интеграционен тест покрива успешен и неуспешни сценарии.
- **Тестове:** `registration.e2e.spec.ts` – успешна регистрация (201), duplicate email (409), невалиден email/парола (400), проверка че паролата се хешира и потребителят се записва в БД.

#### AUTH-1-T4 – Email-verification token
**Компонент:** Backend, DB

- Създай таблица `verification_tokens` с `id`, `user_id`, `token`, `expires_at`, `created_at`, `used`.
- Метод `generateVerificationToken(userId)` генерира cryptographically secure token (≥ 32 bytes).
- TTL: 24 h; cron/worker трие изтеклите записи.
- **DoD:** Миграциите се изпълняват; token записан в БД; unit тест за генерация и изтичане.
- **Тестове:** `verification-token.spec.ts` – дължина и ентропия на токена, коректно записване в БД, изтичане след TTL, флаг `used` предотвратява повторна употреба.

#### AUTH-1-T5 – Имейл с потвърждение
**Компонент:** Infrastructure

- Добави `EmailService` (nodemailer) с HTML шаблон за „Активирай акаунта“.
- Линк: `${APP_URL}/verify-email?token=...`.
- Настрой Mailhog/SMTP в dev.
- **DoD:** Имейлът се получава в Mailhog; линкът води към правилния endpoint.
- **Тестове:** `email.service.spec.ts` – моква Nodemailer и проверява съдържанието и линка; e2e тест използва Mailhog API за проверка, че имейлът пристига.

#### AUTH-1-T6 – OpenAPI актуализация
**Компонент:** Docs

- Добави `RegistrationRequest`, `RegistrationResponse` модели.
- Документирай възможните грешки (**400**, **409**).
- Обнови примери в Swagger UI.
- **DoD:** `npm run swagger` генерира валиден spec без diff грешки.
- **Тестове:** `openapi.spec.ts` – assert-ва, че схемата `RegistrationRequest` съдържа `email` и `password`, а `RegistrationResponse` e празен; CI стъпка `swagger-diff` гарантира липса на breaking changes.

#### AUTH-1-T7 – Тестове за registration flow
**Компонент:** Tests

- Юнит тестове: `PasswordService`, `EmailService`, token генерация.
- Интеграционни: успешна регистрация, duplicate email, слабa парола.
- Конфигурирай CI job `auth-register.spec.ts`.
- Увери се, че `npm run test:regression` преминава успешно в CI и включва всички горни тестове.
- **DoD:** ≥ 90 % unit, ≥ 1 интеграционен тест за всеки път, pipeline green.

## AUTH-2 – Потвърждение на имейл
| Task ID | Описание | Компонент | DoD | Зависимости |
|---------|----------|-----------|-----|-------------|
| AUTH-2-T1 | Endpoint `GET /verify-email?token=` | Backend | Връща **200** и активира акаунта | AUTH-1-T4 |
| AUTH-2-T2 | Инвалидация/изтриване на използвани/изтекли токени | Backend, DB | Токен изчезва след use/TTL | T1 |
| AUTH-2-T3 | Front-end страница за успех/неуспех (placeholder) | Frontend | Показва статус | – |
| AUTH-2-T4 | Тестове (unit + integration) | Tests | CI зелено | T1–T2 |

## AUTH-3 – Вход с имейл и парола
| Task ID | Описание | Компонент | DoD | Зависимости |
|---------|----------|-----------|-----|-------------|
| AUTH-3-T1 | Service за издаване на JWT access + refresh токени | Backend | Подписани с RS256 | AUTH-2 |
| AUTH-3-T2 | Endpoint `POST /login` (HttpOnly cookies) | Backend | **200**, p95 ≤ 300 ms | T1 |
| AUTH-3-T3 | Съхранение на refresh токени (Redis/DB) | Infrastructure | Revocation работи | T1 |
| AUTH-3-T4 | Performance тест (k6) | QA | p95 ≤ 300 ms | T2 |
| AUTH-3-T5 | Тестове (unit+integration) | Tests | CI зелено | T2–T3 |

## AUTH-4 – Подновяване на сесия (refresh)
| Task ID | Описание | Компонент | DoD | Зависимости |
|---------|----------|-----------|-----|-------------|
| AUTH-4-T1 | Endpoint `POST /refresh` | Backend | Връща нов access, задава cookies | AUTH-3-T3 |
| AUTH-4-T2 | Revocation check за изтекли/блокирани refresh токени | Backend | Невалиден → **401** | T1 |
| AUTH-4-T3 | Тестове (unit+integration) | Tests | CI зелено | T1–T2 |

## AUTH-5 – Забравена парола
| Task ID | Описание | Компонент | DoD | Зависимости |
| AUTH-5-T1 | Endpoint `POST /forgot-password` генерира токен (TTL ≤30 min) | Backend | Връща **200** | AUTH-1 |
| AUTH-5-T2 | Endpoint `POST /reset-password` + валидация токен | Backend | Паролата сменена, токени инвалидирани | T1 |
| AUTH-5-T3 | Email шаблон за reset | Infra | Имейл получен | T1 |
| AUTH-5-T4 | Тестове (unit+integration) | Tests | CI зелено | T2 |

## AUTH-6 – Проверка на силата на пароли
| Task ID | Описание | Компонент | DoD | Зависимости |
| AUTH-6-T1 | Интеграция на `zxcvbn` за password strength | Backend | Weak → **400** | AUTH-1 |
| AUTH-6-T2 | Проверка срещу HaveIBeenPwned API | Backend | Pwned → **400** | T1 |
| AUTH-6-T3 | Тестове за слаб/компрометиран пароли | Tests | CI зелено | T1–T2 |

## AUTH-7 – RBAC (admin / student)
| Task ID | Описание | Компонент | DoD | Зависимости |
| AUTH-7-T1 | Дефиниция на enum `Role` + seed роли | Backend, DB | Enum наличен, seed script | AUTH-1 |
| AUTH-7-T2 | `RolesGuard` + `@Roles()` декоратор | Backend | Непозволен достъп → **403** | T1 |
| AUTH-7-T3 | Интеграционни тестове за защитени пътеки | Tests | 100 % покритие на guard | T2 |

## AUTH-8 – Seed скрипт за първи admin
| Task ID | Описание | Компонент | DoD | Зависимости |
| AUTH-8-T1 | CLI `npm run seed:admin` | DevOps | Скрипт идемпотентен | AUTH-7-T1 |
| AUTH-8-T2 | Документация в README | Docs | README секция „Seeding“ | T1 |
| AUTH-8-T3 | Интеграционен тест за скрипта | Tests | CI зелено | T1 |

## AUTH-9 – Логване на опити за вход
| Task ID | Описание | Компонент | DoD | Зависимости |
| AUTH-9-T1 | Structured logging (winston/pino) за `/login` | Backend | JSON + Sentry event | AUTH-3-T2 |
| AUTH-9-T2 | Филтри за успешно/неуспешно влизане | Backend | Логовете съдържат IP, UA, userId | T1 |
| AUTH-9-T3 | Тестове за логиране | Tests | CI зелено | T2 |

## AUTH-10 – Rate limiting на auth endpoints
| Task ID | Описание | Компонент | DoD | Зависимости |
| AUTH-10-T1 | Интеграция на rate-limiter (nestjs-rate-limiter) | Backend | 5 req/min → **429** | AUTH-3 |
| AUTH-10-T2 | Конфигурация чрез ENV | DevOps | Праг променяем без redeploy | T1 |
| AUTH-10-T3 | Тестове | Tests | CI зелено | T1 |

## AUTH-11 – Изтриване на акаунт (GDPR)
| Task ID | Описание | Компонент | DoD | Зависимости |
| AUTH-11-T1 | Endpoint `DELETE /me` (изисква email-confirm токен) | Backend | Връща **204** | AUTH-2 |
| AUTH-11-T2 | Логика за заличаване/анонимизиране на данни (≤30 дни) | Backend, DB | Данни изтрити | T1 |
| AUTH-11-T3 | Email шаблон за потвърждение | Infra | Имейл получен | T1 |
| AUTH-11-T4 | Тестове + GDPR log | Tests | CI зелено | T2 |

## AUTH-12 – OpenAPI спецификация
| Task ID | Описание | Компонент | DoD | Зависимости |
| AUTH-12-T1 | Конфигуриране на `@nestjs/swagger` | Backend | `swagger.json` генерирано | AUTH-3 |
| AUTH-12-T2 | CI стъпка за проверка на swagger diff | DevOps | Pipeline фейлва при breaking change | T1 |
| AUTH-12-T3 | Добавяне на описания/примери за всички auth модели | Docs | 100 % completeness | T1 |

---

### Dependencies Graph (високо ниво)
```
AUTH-1 → AUTH-2 → AUTH-3 → AUTH-4
            ↘
             AUTH-11
AUTH-3 → AUTH-10, AUTH-9, AUTH-12
AUTH-7 ← AUTH-3
AUTH-8 ← AUTH-7
```

### Definition of Done (global)
* ✅ Юнит/интеграционни тестове ≥ 90 % покритие
* ✅ 0 линт грешки
* ✅ Документация и OpenAPI актуализирани
* ✅ Нулева критична уязвимост (Snyk/OWASP)

---

> Поддържай задачите актуални. При промяна на изискванията, обнови този документ и отрази зависимостите.
