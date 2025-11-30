# STORY-WS2-BE-AUTH-TOKEN-REVOCATION – Ревокация на токени при смяна на парола/изтриване на акаунт

Status: Done

## Summary
Като **регистриран потребител**, който сменя паролата си или изтрива акаунта си, искам **всички стари JWT токени да станат невалидни**, така че ако някой е компрометирал стар токен, да не може да го ползва след промяната.

Това WS-2 BE story надгражда `STORY-WS2-BE-AUTH-PROFILE-ACCOUNT` и логиката за `change-password` и `DELETE /api/users/me`, като въвежда централен механизъм за ревокация/инвалидиране на токените.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` (§4.2 FR-AUTH-5 Security, §4.7 FR-CROSS-2).
- System Architecture – `docs/architecture/system-architecture.md` (Auth, JWT, Security).
- OpenAPI – `docs/architecture/openapi.yaml` (`POST /api/auth/login`, `/users/me*`).
- WS-2 stories – `docs/backlog/ws-2/stories/STORY-WS2-BE-AUTH-PROFILE-ACCOUNT.md`.

## Acceptance Criteria
- Всеки JWT access token съдържа **версия на сигурността** (например `tokenVersion` или `securityVersion`), изведена от `User` модела.
- При всяка проверка на токена (`JwtAuthGuard` или еквивалентен guard), системата:
  - валидира подписа на JWT;
  - зарежда текущия `User` от базата;
  - проверява, че `user.active === true` **и** `payload.tokenVersion === user.tokenVersion`.
- При `POST /api/users/me/change-password`:
  - `tokenVersion` се инкрементира (или друг подход, който ефективно инвалидира старите токени);
  - всички съществуващи токени с по-стара версия престават да бъдат приемани от всички защитени ендпойнти (не само Auth/Account).
- При `DELETE /api/users/me`:
  - `user.active` става `false` и/или `tokenVersion` се променя;
  - всички токени (независимо от версия) престават да бъдат валидни за защитени ендпойнти.

## Dev Tasks
- [x] Дизайн на payload за JWT access токени (разширяване с `tokenVersion` / `securityVersion`).
- [x] Обновяване на `AuthService.login`:
  - да включва `tokenVersion` от `User` в JWT payload.
- [x] Добавяне на поле `tokenVersion: number` в `User` (миграция, default 0).
- [x] Обновяване на `JwtAuthGuard` (или централен guard за Bearer auth):
  - да зарежда `User` по `sub`;
  - да проверява `active` и `tokenVersion`.
- [x] При `changePassword`:
  - да инкрементира `tokenVersion` (и да запази потребителя);
  - да покрие сценария, в който паралелни токени по старата версия стават невалидни.
- [x] При `deleteAccount`:
  - да сетва `active=false` (валидира се от guard-а и ефективно ревокира всички токени за потребителя).
- [x] Unit тестове за новата логика (TokenVersion, Guard поведения).
- [x] E2E/integration тестове:
  - стар токен преди смяна на паролата → валиден;
  - същият токен след смяна на паролата → `401` за всички защитени ендпойнти;
  - аналогично поведение при изтриване на акаунта (след `DELETE /api/users/me` всички защитени ендпойнти връщат `401` за стария токен).

## Test Scenarios
- **[INT-TOK-1] Смяна на парола ревокира стари токени**
  - Сценарий:
    - Login → взимане на `accessToken v0`.
    - `GET /api/users/me` с `v0` → `200`.
    - `POST /api/users/me/change-password`.
    - `GET /api/users/me` с **същия** токен `v0` → `401`.
    - Login отново → `accessToken v1`; `GET /me` с `v1` → `200`.
- **[INT-TOK-2] Изтриване на акаунт ревокира токени**
  - Сценарий:
    - Login → `accessToken`.
    - `DELETE /api/users/me`.
    - `GET /api/users/me` с токена → `404` (или `401` според имплементацията).
    - Опит за достъп до други защитени ендпойнти с токена → `401`.

## Notes
- Тази WS-2 story въвежда централен механизъм за ревокация чрез версия на токена и не изисква сървърно съхранение на всички издадени JWT токени (blacklist таблица), което е по-леко и по-лесно за скалиране.
- Поведението трябва да бъде съгласувано с FE, за да може клиентът да се справя коректно с `401` и да инициира повторна автентикация, ако е необходимо.
