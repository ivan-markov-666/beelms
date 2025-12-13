# STORY-CORE-SECURITY-RATE-LIMITING-APPLY-OPTIONAL-PUBLIC – Apply anti-spam rate limiting to public endpoints

## Summary
Като **оператор**, искам да приложим rate limiting и върху някои публични (no-auth) endpoints, за да ограничим spam/abuse и да защитим API ресурсите.

## Links to BMAD artifacts
- `docs/backlog/beelms-core-epics-and-stories.md` §4.11 (EPIC-CORE-CROSS-SECURITY)
- Master spec: `docs/backlog/ws-core-4/stories/STORY-CORE-SECURITY-RATE-LIMITING.md`
- Infra: `docs/backlog/ws-core-4/stories/STORY-CORE-SECURITY-RATE-LIMITING-INFRA.md`

## Scope
- `POST /api/training/echo`
- `POST /api/tasks/:id/submit`

## Proposed limits
- `POST /api/training/echo`
  - Key: `ip`
  - Limit: 60 / 60s
- `POST /api/tasks/:id/submit`
  - Key: `ip`
  - Limit: 120 / 60s

## Acceptance Criteria
- И двата endpoint-а от scope имат ефективен rate limit.
- При превишаване:
  - status `429`
  - JSON payload (минимум `message`)
- E2E тестове доказват:
  - `POST /api/training/echo` → 60 OK, 61-ва → 429
  - `POST /api/tasks/:id/submit` → 120 OK, 121-ва → 429

## Dev Tasks
- [ ] Добавяне на `@RateLimit(...)` върху endpoint-ите.
- [ ] Разширяване на `be/test/rate-limit.e2e-spec.ts` с тестове за echo + submit.

## Test Plan (local)
- `docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db`
- `cd be`
- `npm run test:setup-db`
- `npm run test:e2e`
