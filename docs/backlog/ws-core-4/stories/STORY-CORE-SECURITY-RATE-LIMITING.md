# STORY-CORE-SECURITY-RATE-LIMITING – Rate limiting for sensitive operations

## Summary
Като **оператор/продуктов собственик**, искам да имаме **rate limiting** за чувствителни операции (auth + account actions), за да ограничим brute-force и abusive поведение, и да пазим инфраструктурата.

Това story е **master spec** (инвентаризация + policy). Имплементацията е split-ната в под-story-та (виж “Related stories”).

## Links to BMAD artifacts
- Backlog index – `docs/backlog/beelms-core-epics-and-stories.md` §4.11 (EPIC-CORE-CROSS-SECURITY)

## Endpoint Inventory (BE, с global prefix `/api`)

### Public / no auth
- `GET /api/health`
- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `POST /api/auth/verify-email`
- Wiki (public read):
  - `GET /api/wiki/articles`
  - `GET /api/wiki/articles/:slug`
- Training demo:
  - `GET /api/training/ping`
  - `POST /api/training/echo`
- Tasks:
  - `GET /api/tasks/:id`
  - `POST /api/tasks/:id/submit`

### Authenticated (JwtAuthGuard)
- Account:
  - `GET /api/users/me`
  - `PATCH /api/users/me`
  - `POST /api/users/me/change-password`
  - `DELETE /api/users/me`
  - `POST /api/users/me/export`

### Admin (JwtAuthGuard + AdminGuard)
- Admin Users:
  - `GET /api/admin/users`
  - `GET /api/admin/users/stats`
  - `PATCH /api/admin/users/:id`
- Admin Metrics:
  - `GET /api/admin/metrics/overview`
  - `GET /api/admin/metrics/activity-summary`
- Admin Activity:
  - `GET /api/admin/activity`
- Admin Wiki:
  - `GET /api/admin/wiki/articles`
  - `GET /api/admin/wiki/articles/by-slug/:slug`
  - `POST /api/admin/wiki/articles`
  - `PUT /api/admin/wiki/articles/:id`
  - `PATCH /api/admin/wiki/articles/:id/status`
  - `DELETE /api/admin/wiki/articles/:id`
  - `PATCH /api/admin/wiki/articles/:id/draft-autosave`
  - `GET /api/admin/wiki/articles/:id/versions`
  - `POST /api/admin/wiki/articles/:id/versions/:versionId/restore`
  - `DELETE /api/admin/wiki/articles/:id/versions/:versionId`
  - `GET /api/admin/wiki/articles/:id/media`
  - `POST /api/admin/wiki/articles/:id/media`
  - `DELETE /api/admin/wiki/articles/:id/media/:filename`

## Proposed Rate Limit Policy (initial)

### Sensitive endpoints (MVP to enforce)
- **`POST /api/auth/login`**
  - Key: `ip+email`
  - Limit: 10 / 60s
- **`POST /api/auth/register`**
  - Key: `ip`
  - Limit: 5 / 3600s
- **`POST /api/auth/forgot-password`**
  - Key: `ip`
  - Limit: 5 / 3600s
- **`POST /api/auth/reset-password`**
  - Key: `ip`
  - Limit: 10 / 3600s
- **`POST /api/users/me/export`**
  - Key: `userId`
  - Limit: 3 / 86400s
- **`POST /api/users/me/change-password`**
  - Key: `userId`
  - Limit: 10 / 3600s
- **`DELETE /api/users/me`**
  - Key: `userId`
  - Limit: 3 / 86400s

### Optional / nice-to-have limits (can be separate story)
- `POST /api/training/echo` (anti spam): 60 / 60s by `ip`
- `POST /api/tasks/:id/submit` (anti spam): 120 / 60s by `ip`
- Admin endpoints: usually not needed initially; consider light limit per `userId` if abuse is possible.

## Acceptance Criteria
- Съществува механизъм за rate limiting, който може да се прилага per-endpoint.
- За endpoints в “Sensitive endpoints (MVP to enforce)” при превишаване се връща:
  - HTTP `429 Too Many Requests`
  - JSON error payload (минимум `message`)
- Rate limiting key-овете са:
  - unauthenticated: `ip`
  - unauthenticated login: `ip+email`
  - authenticated: `userId`
- Има e2e тестове, които доказват поне:
  - login rate limit (429 при N+1 заявки)
  - export rate limit (429 при N+1 заявки)

## Related stories (split)
- `STORY-CORE-SECURITY-RATE-LIMITING-INFRA` – implementation of reusable rate limiter + decorator/guard.
- `STORY-CORE-SECURITY-RATE-LIMITING-APPLY-SENSITIVE` – apply policy to MVP sensitive endpoints + e2e tests.

## Notes
- Първата версия може да е **in-memory** (Map в процеса). Redis-backed лимитиране може да е follow-up, ако трябва multi-instance.
