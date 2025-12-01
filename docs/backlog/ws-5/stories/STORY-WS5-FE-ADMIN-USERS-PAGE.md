# STORY-WS5-FE-ADMIN-USERS-PAGE – Admin Users страница с таблица и toggle за active

Status: Planned

## Summary
Като **администратор** искам **страница `/admin/users` в Admin портала с таблица с потребители и възможност за активиране/деактивиране**, за да мога лесно да управлявам достъпа до платформата.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` (FR-ADMIN-* – управление на потребители).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (Admin Portal – Users management).
- System Architecture – `docs/architecture/system-architecture.md` (Admin FE/BE integration).
- OpenAPI – `docs/architecture/openapi.yaml` (`GET /api/admin/users`, `PATCH /api/admin/users/{id}`).
- Walking skeleton – `docs/delivery/walking-skeleton.md` (WS-5 Admin vertical – когато бъде допълнен).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-ADMIN-PORTAL).

## Acceptance Criteria
- Съществува страница `/admin/users`, достъпна само за логнат admin (през Admin shell/layout).
- Страницата показва:
  - таблица с колони (пример): Email, Role, Active, Created At;
  - indicator/badge за активен/деактивиран статус.
- Има поле за търсене по email, което:
  - актуализира списъка чрез заявка към `GET /api/admin/users?q=...` (substring match по email);
  - показва празно състояние, когато няма резултати.
- За всяко редче има UI елемент (switch/toggle/бутон) за промяна на `active`:
  - при клик се вика `PATCH /api/admin/users/{id}` и UI се обновява;
  - при грешка се показва съобщение и състоянието се връща обратно.
- Покрити са:
  - Loading състояние (първоначално зареждане и при филтър).
  - Error състояние (невъзможност за зареждане на списъка).
- Страницата използва съществуващия Admin shell (header/nav/sidebar) и е локализирана (минимум en/bg, според i18n слоя).

## Dev Tasks
- [ ] Дефиниране на route `/admin/users` във FE и включването му в Admin навигацията.
- [ ] Имплементация на таблицата и филтъра по email, свързани с Admin Users API.
- [ ] Имплементация на toggle за `active` с оптимистично/песимистично обновяване и обработка на грешки.
- [ ] Добавяне на loading/error/empty състояния.
- [ ] FE тестове (React Testing Library или екв.) за основните поведения:
  - рендер на таблицата и данните;
  - работещ филтър по email;
  - успешна/неуспешна промяна на `active`.
