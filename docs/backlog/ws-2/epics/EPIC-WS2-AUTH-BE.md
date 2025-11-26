# EPIC-WS2-AUTH-BE – Auth API (регистрация, вход, забравена парола, профил)

## Summary
Този epic обхваща backend и API частта на walking skeleton WS-2 за **Auth & Accounts**: NestJS услуга, която предоставя JWT-базирани ендпойнти за регистрация, вход, забравена парола/ресет, преглед на профила, изтриване на акаунт и експорт на лични данни. Тези ендпойнти се използват директно от frontend-а и покриват минималния, но реален Auth skeleton за MCP.

## Scope (какво покрива този epic)
- NestJS `AuthModule` и свързаните `AuthController` / `AuthService` и `UsersService` за публичните Auth flows.
- Ендпойнти (минимален WS-2 scope):
  - `POST /api/auth/register` – регистрация с имейл и парола, включително валидация на паролата според минимални правила за сигурност (PRD §4.2, MVP feature list §2.1).
  - `POST /api/auth/login` – вход с имейл и парола, издаване на JWT токен.
  - `POST /api/auth/forgot-password` – заявка за възстановяване на парола.
  - `POST /api/auth/reset-password` – задаване на нова парола чрез токен.
  - `GET /api/users/me` – преглед на основна профилна информация за текущия потребител.
  - `DELETE /api/users/me` – закриване/изтриване на акаунта (GDPR – right to be forgotten).
  - `POST /api/users/me/export` – експорт на лични данни.
- JWT-базирана автентикация и базова конфигурация на защитени маршрути.
- Базова anti-bot защита (reCAPTCHA/еквивалент) за критични операции (регистрация, forgot-password, export), в рамките на WS-2.
- Логика за изтичане и валидиране на reset токени (напр. 24 часа), съгласно PRD.

Този epic **не** покрива (out of scope):
- Пълен Admin панел за управление на потребители (това е част от `EPIC-ADMIN-PORTAL`).
- Backend endpoint за logout (изход); в MVP logout се реализира чрез изтриване на JWT токена на frontend ниво (stateless auth, без отделен API endpoint в WS-2).
- API за редакция/корекция на профилни данни; планирано е за отделен epic/story (Profile / Admin), в синхрон с FR-CROSS-2 от PRD.
- Social login (Google, GitHub и др.).
- MFA/2FA и по-сложни security механизми отвъд минимално нужните за MVP.
- Пълна observability/metrics имплементация (освен каквото е нужно за basic logging и error tracking).

## Related BMAD artifacts
- Product Brief – `docs/product/product-brief.md` (§5.1–5.2 – Auth/акаунти в MVP).
- PRD – `docs/product/prd.md` (§4.2 FR-AUTH-1..7, §4.7 FR-CROSS-2, FR-CROSS-4).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§2.1–2.4 Auth & Profile).
- System Architecture – `docs/architecture/system-architecture.md` (компонент „Auth service“, сигурност, GDPR).
- OpenAPI – `docs/architecture/openapi.yaml` (Auth и Users ендпойнти).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-AUTH-ACCOUNTS, EPIC-CROSS-SECURITY, EPIC-CROSS-GDPR-LEGAL; security аспектите – CSRF/XSS/SQL injection, rate limiting и защита от brute-force – се реализират в синхрон с `EPIC-CROSS-SECURITY` и `system-architecture.md`).

## Child user stories
- [ ] STORY-WS2-BE-AUTH-REGISTER-LOGIN – Регистрация и вход (API).
- [ ] STORY-WS2-BE-AUTH-FORGOT-RESET – Забравена парола и ресет на парола (API).
- [ ] STORY-WS2-BE-AUTH-PROFILE-ACCOUNT – Профил, изтриване на акаунт и експорт на лични данни (API).

## Risks / Assumptions
- **Risks:**
  - Зависимост от външна имейл услуга за forgot/reset flows – закъснения или проблеми могат да блокират част от функционалността.
  - Неправилна конфигурация на JWT (срок, подпис) може да доведе до security рискове.
  - Некоректно изтриване/анонимизиране на лични данни може да наруши GDPR изискванията.
- **Assumptions:**
  - За WS-2 се имплементира минимално реалистична интеграция с имейл услуга (дори и през mock/stub в dev), достатъчна за E2E тестване.
  - reCAPTCHA/anti-bot слоят ще бъде наличен или поне лесно добавим на FE/BE ниво, без да блокира основните Auth flows.
  - Потребителските данни и паролите се съхраняват в PostgreSQL с подходящи security практики (bcryptjs, сол, индекси).

## Definition of Done (Epic)
- Всички child stories по-горе са изпълнени и затворени.
- Всички изброени Auth ендпойнти съществуват и отговарят на OpenAPI спецификацията.
- Паролите се съхраняват само като bcryptjs hash-ове; няма логнати или записани в raw вид пароли.
- JWT автентикацията работи коректно за защитени ресурси (напр. `GET /api/users/me`).
- Правата по GDPR, описани в PRD (изтриване и експорт на акаунта), са имплементирани на API ниво и покрити с тестове.
- Съществуват базови unit/integration тестове за Auth/Users service и контролерите.
- Ръчно е потвърдено, че frontend-ът на WS-2 може да използва тези ендпойнти по основните сценарии без промени по API.
- Няма отворени критични (P0/P1) security дефекти, свързани с Auth & Accounts.
