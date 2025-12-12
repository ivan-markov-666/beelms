# STORY-CORE-SECURITY-RATE-LIMITING-INFRA – Rate limiting infrastructure (decorator + guard)

## Summary
Като **разработчик**, искам да имам **reusable rate limiting layer** (decorator + guard/interceptor), за да мога да прилагам лимити per-endpoint без copy/paste.

## Links to BMAD artifacts
- `docs/backlog/beelms-core-epics-and-stories.md` §4.11 (EPIC-CORE-CROSS-SECURITY)
- Master spec: `docs/backlog/ws-core-4/stories/STORY-CORE-SECURITY-RATE-LIMITING.md`

## Acceptance Criteria
- Има `@RateLimit(...)` decorator (или еквивалент), който може да се слага на controller methods.
- Има guard/interceptor, който:
  - чете metadata от decorator-а
  - изчислява key (ip или userId)
  - при allow → пропуска
  - при deny → хвърля `TooManyRequestsException` (429)
- Поддържа window-based лимит (например `limit` заявки за `windowSeconds`).
- Няма външни зависимости (MVP): in-memory storage.

## Dev Tasks
- [ ] Добавяне на decorator `RateLimit` (metadata: `limit`, `windowSeconds`, `key: 'ip' | 'userId'`).
- [ ] Добавяне на `RateLimitGuard` (или interceptor) и включване глобално (или per-controller чрез `@UseGuards`).
- [ ] Имплементация на in-memory store с TTL.
- [ ] Unit tests за store/guard (по избор; e2e покритието е в apply story).

## Test Plan (local)
- `cd be`
- `npm run test`
