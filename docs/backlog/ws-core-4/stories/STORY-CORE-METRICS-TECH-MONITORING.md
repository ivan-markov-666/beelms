# STORY-CORE-METRICS-TECH-MONITORING – Basic health + request latency logging

## Summary
Като **оператор/разработчик**, искам **базови технически метрики и monitoring hooks (health endpoint + latency logging)**, за да **мога бързо да проверя дали API е живо и да имам минимална видимост за бавни/грешни заявки**.

## Links to BMAD artifacts
- Backlog index – `docs/backlog/beelms-core-epics-and-stories.md` §4.10 (EPIC-CORE-CROSS-METRICS)

## Acceptance Criteria
- API има публичен endpoint `GET /health` (или `GET /api/health` ако има global prefix), който връща JSON със статус `ok`.
- `GET /health` не изисква auth.
- Има базово request latency logging за всички HTTP заявки:
  - логва се метод + path + status code + duration (ms)
  - при грешки (4xx/5xx) се логва на warn/error ниво.
- Има e2e тест, който проверява, че health endpoint-а отговаря с 200 и очакван payload.

## Dev Tasks
- [ ] Добавяне на `HealthController`/route в NestJS API.
- [ ] Добавяне на latency logging (middleware или interceptor) глобално.
- [ ] Добавяне/обновяване на e2e тест за health endpoint.

## Test Plan (local)
- 1) Start API локално:
  - `cd be`
  - `npm run start:dev`
- 2) Проверка:
  - `curl http://localhost:3000/health` (или `/api/health`)
- 3) E2E:
  - `cd be`
  - `npm run test:e2e`

## Notes
- Целта е минимален, dependency-free health check (без Prometheus/OpenTelemetry на този етап).
