# Web automation scenarios – Auth / Profile / Wiki

Този документ описва предложени сценарии за бъдещи web automation тестове (напр. с **Playwright**), комбинирани с директни REST заявки към BE.

Целта е да имаме ясен списък със сценарии, които по-късно да автоматизираме, след като MCP версията / тестовия framework е готов.

## Общи бележки

- **Инструменти (планирани):**
  - Playwright за UI навигация и проверки по DOM.
  - REST клиент (fetch/axios или Playwright `request`) за seed/cleanup и директни API проверки.
- **BE base URL:** `http://localhost:3000/api` (конфигурируемо чрез `NEXT_PUBLIC_API_BASE_URL`).
- **FE base URL:** `http://localhost:3001` (Next.js dev сървър).

## Auth – Register / Login

### [WA-AUTH-1] Успешна регистрация + login (UI + REST верификация)

- **Предварителни условия:** BE и FE работят, DB празна или в известен state.
- **Стъпки (UI):**
  1. Навигация до `/auth/register`.
  2. Попълване на валиден имейл + парола (>= 8 символа) + потвърждение на паролата.
  3. Маркиране на Terms и CAPTCHA checkbox.
  4. Submit на формата.
  5. Изчакване на success съобщението и redirect към `/auth/login`.
  6. Попълване на същия имейл/парола в login формата и submit.
  7. Очакван redirect към `/wiki`.
- **Проверки (REST):**
  - `GET /api/users/me` с токена, който UI е записал → връща коректен профил (id, email, createdAt, active=true).

### [WA-AUTH-2] Невалидни креденшъли при login

- Навигация до `/auth/login`.
- Въвеждане на валиден имейл и грешна парола.
- Очакване на съобщение „Невалидни данни за вход.“ и липса на redirect.

### [WA-AUTH-3] Дублиран имейл при регистрация

- Регистрация на потребител А през `/auth/register`.
- Опит за регистрация със същия имейл отново.
- Очакване на UI съобщение „Този имейл вече е регистриран.“ без redirect.

## Account / Profile – UI + API

Използваме комбинация: UI за логване, REST за директни проверки/cleanup.

### [WA-ACC-1] Пълен happy path: профил → update email → export → change-password → delete

1. UI: login през `/auth/login`, запазване на accessToken от `localStorage`.
2. REST: `GET /api/users/me` → базова проверка на профила.
3. REST: `PATCH /api/users/me` с нов имейл → проверка, че email се е сменил.
4. REST: `POST /api/users/me/export` → валидация на payload `{ id, email, createdAt, active }`.
5. REST: `POST /api/users/me/change-password` → смяна на паролата.
6. UI: logout (когато има такъв flow) или ръчно чистене на токена в теста.
7. UI: login със старата парола → очакван fail.
8. UI: login с новата парола → очакван success.
9. REST: `DELETE /api/users/me` → soft delete.
10. REST: `GET /api/users/me` със същия токен → `404`.
11. REST: `POST /api/auth/login` със старите креденшъли → `401`.

### [WA-ACC-2] Invalid update email

- REST: след успешен login опит за `PATCH /api/users/me` с невалиден email (напр. `"invalid"`).
- Очакване: `400` и подходящо съобщение.

### [WA-ACC-3] Грешна текуща парола при change-password

- REST: `POST /api/users/me/change-password` с грешен `currentPassword`.
- Очакване: `400` и съобщение за невалидна заявка.

### [WA-ACC-4] Export с липсващ CAPTCHA, когато е задължителен

- Env: `ACCOUNT_EXPORT_REQUIRE_CAPTCHA=true`.
- REST: `POST /api/users/me/export` без `captchaToken`.
- Очакване: `400`.

## Wiki – публични сценарии (UI heavy)

### [WA-WIKI-1] Списък + филтри + пагинация

- UI: навигация до `/wiki`.
- Проверка, че се визуализира списък от статии.
- Приложение на търсене (`q`) и език (`lang`), проверка на филтриран резултат.
- Навигация по страници чрез параметъра `page` (Previous/Next).

### [WA-WIKI-2] Отваряне на статия

- UI: клик върху статия от списъка → пренасочване към `/wiki/[slug]`.
- Проверка на заглавие, език, мета информация.

## Бележки за имплементация по-късно

- За всеки сценарий можем да изградим **Playwright тест**, който:
  - ползва UI стъпките за навигация и въвеждане;
  - при нужда ползва `page.request` (Playwright API) за директни REST заявки към BE.
- Reset/seed на данни може да се прави чрез:
  - отделни seed/migration стъпки преди suite-а (както в README);
  - или специални test-only endpoints (ако бъдат добавени в бъдеще).

Този файл е само за описване на сценарии – имплементацията на самите Playwright тестове ще бъде направена на по-късен етап.
