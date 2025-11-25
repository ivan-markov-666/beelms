# STORY-WS2-BE-AUTH-REGISTER-LOGIN – Регистрация и вход (Auth API)

Status: Draft

## Summary
Като **краен потребител** искам да мога да се **регистрирам и вписвам** в платформата чрез имейл и парола, за да имам личен акаунт и достъп до функционалности, изискващи идентификация.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` (§4.2 FR-AUTH-1, FR-AUTH-2, FR-AUTH-7).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§2.1 Регистрация, §2.2 Вход/Изход).
- System Architecture – `docs/architecture/system-architecture.md` (Auth service, JWT, security).
- OpenAPI – `docs/architecture/openapi.yaml` (`POST /api/auth/register`, `POST /api/auth/login`).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-AUTH-ACCOUNTS, EPIC-CROSS-SECURITY).

## Acceptance Criteria
- `POST /api/auth/register`:
  - Съществува ендпойнт за регистрация, приемащ имейл и парола (и евентуално допълнителни полета според PRD).
  - При валидни данни се създава нов потребител в базата, с парола, съхранена като bcryptjs hash.
  - При вече зает имейл се връща подходящ код/съобщение за грешка (напр. `400` или `409`).
  - При невалидни данни (къса парола, невалиден имейл и др.) се връщат ясни validation грешки.
  - Анти-bot защита: заявката изисква успешно преминаване през защитен механизъм (напр. reCAPTCHA), както е описано в PRD.
- `POST /api/auth/login`:
  - Съществува ендпойнт за вход, приемащ имейл и парола.
  - При валидни креденшъли API връща `200 OK` и JWT токен (и/или refresh token, ако архитектурата го изисква), в съответствие с OpenAPI.
  - При невалидни креденшъли се връща `401 Unauthorized` без изтичане на информация (напр. „invalid credentials“ без уточнение кое поле е грешно).
  - При няколко последователни неуспешни опита може да се активира защитен механизъм (напр. CAPTCHA), ако е в обхвата на WS-2.
- Security/поведение:
  - JWT токените използват конфигурируема тайна и разумен срок на валидност.
  - Няма логиране на пароли в raw вид.

## Dev Tasks
- [ ] Имплементиране на `POST /api/auth/register` с валидация, bcryptjs hashing и обработка на дублиран имейл.
- [ ] Имплементиране на `POST /api/auth/login` с проверка на креденшъли и издаване на JWT токен.
- [ ] Конфигуриране на JWT (секрет, валидност, payload), в синхрон със System Architecture.
- [ ] Интеграция с anti-bot механизъм (напр. reCAPTCHA) за регистрация (и по избор за вход след множество неуспешни опити).
- [ ] Unit тестове за основната бизнес логика (register/login, validation, JWT issuance).
- [ ] (по избор) Интеграционни тестове за Auth ендпойнтите срещу test база.
- [ ] Ръчно тестване чрез Swagger UI/Postman на основните сценарии (успешна регистрация, неуспешна регистрация, успешен/неуспешен вход).

## Notes
- Тази story е в тясна връзка със `STORY-WS2-FE-AUTH-REGISTER-LOGIN`, която дефинира UI флоу за register/login.
- Необходимо е да се използва `bcryptjs` (а не native `bcrypt`) за съвместимост с Windows и CI средата.
- Добре е отговорите на API да са оформени така, че да не разкриват излишна информация при грешки (особено при вход), в съответствие с security препоръките.
