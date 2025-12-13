# STORY-CORE-SECURITY-ACCOUNT-PROTECTION – Account protection for login (failed attempt tracking)

## Summary
Като **оператор**, искам да ограничим brute-force опитите за вход чрез tracking на неуспешни login опити и временно блокиране, за да намалим риска от компрометиране на акаунти.

## Links to BMAD artifacts
- `docs/backlog/beelms-core-epics-and-stories.md` §4.11 (EPIC-CORE-CROSS-SECURITY)
- Rate limiting master: `docs/backlog/ws-core-4/stories/STORY-CORE-SECURITY-RATE-LIMITING.md`

## Scope (MVP)
- `POST /api/auth/login`

## Proposed behavior (MVP)
- Track failed logins by key `ip+email` (normalized email).
- If there are more than **5 failed attempts within 5 minutes** for the same `ip+email`, block further attempts for **15 minutes**.
- While blocked, return:
  - HTTP `429`
  - JSON payload containing at least `message`

## Acceptance Criteria
- On invalid credentials, login continues to return `401` until the threshold is exceeded.
- On N+1 invalid attempt after threshold, login returns `429`.
- A successful login clears the failure counter for that `ip+email`.
- E2E tests cover the behavior without affecting the rest of the e2e suite.

## Dev Tasks
- [ ] Add in-memory failed-login tracker (MVP; Redis is follow-up).
- [ ] Pass client IP to login flow (respect `x-forwarded-for`).
- [ ] Apply block behavior (429) based on tracker state.
- [ ] Add dedicated e2e tests.

## Test Plan (local)
- `docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db`
- `cd be`
- `npm run test:setup-db`
- `npm run test:e2e`
