# STORY-CORE-SECURITY-RATE-LIMITING-APPLY-SENSITIVE – Apply rate limiting to sensitive endpoints + e2e

## Summary
Като **оператор**, искам rate limiting да бъде приложен върху **MVP sensitive endpoints** (auth + account), за да намалим brute-force и abuse.

## Links to BMAD artifacts
- `docs/backlog/beelms-core-epics-and-stories.md` §4.11 (EPIC-CORE-CROSS-SECURITY)
- Master spec: `docs/backlog/ws-core-4/stories/STORY-CORE-SECURITY-RATE-LIMITING.md`
- Infra: `docs/backlog/ws-core-4/stories/STORY-CORE-SECURITY-RATE-LIMITING-INFRA.md`

## Scope (MVP)
Apply per-endpoint limits (as defined in master spec):
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/users/me/export`
- `POST /api/users/me/change-password`
- `DELETE /api/users/me`

## Acceptance Criteria
- Всеки endpoint от scope има ефективен rate limit.
- При превишаване:
  - status `429`
  - JSON payload (минимум `message`)
- E2E:
  - тест за `POST /api/auth/login` → N заявки OK, N+1 → 429
  - тест за `POST /api/users/me/export` → N заявки OK, N+1 → 429

## Dev Tasks
- [ ] Добавяне на `@RateLimit(...)` върху endpoint-ите.
- [ ] Добавяне/обновяване на e2e тестове.

## Test Plan (local)
- `docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db`
- `cd be`
- `npm run test:setup-db`
- `npm run test:e2e`
