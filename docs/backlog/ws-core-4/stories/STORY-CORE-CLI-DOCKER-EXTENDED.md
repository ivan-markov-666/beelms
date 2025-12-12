# STORY-CORE-CLI-DOCKER-EXTENDED – Extended Docker Compose scaffold (web + redis)

## Summary
Като **developer**, искам **CLI scaffold-ът да генерира разширен Docker Compose стек с опционални `web` и `redis` услуги**, за да **мога да стартирам Lean Tier 0 локално с по-реалистична инфраструктура (api + web + db + redis)**.

## Links to BMAD artifacts
- Backlog index – `docs/backlog/beelms-core-epics-and-stories.md` §4.7 (EPIC-CORE-DX-CLI-INFRA)
- WS-CORE-4 design – `docs/sprint-artifacts/beelms-core-ws-core-4-cli-design.md`

## Scope / Non-goals
- В обхвата:
  - Docker Compose scaffold, който добавя `web` и `redis` като **опционални** услуги.
  - `web` да има работещ Docker build (multi-stage), който стартира Next.js.
  - `redis` да е стандартен Redis image, с минимална конфигурация.
- Извън обхвата:
  - Production hardening (TLS, secrets management, k8s).
  - CI интеграция (GitHub Actions са disabled при този repo).

## Acceptance Criteria
- Генерираният `docker/docker-compose.yml` съдържа услуги:
  - `db` (postgres)
  - `api` (NestJS)
  - `web` (Next.js) – **опционално**
  - `redis` – **опционално**
- `web` и `redis` са изключени по default (напр. чрез Compose profiles), и се включват само при изрично указване.
- `web` услуга:
  - има Dockerfile в scaffold проекта (напр. `web/Dockerfile`)
  - expose-ва порт `3001:3000`
  - използва `NEXT_PUBLIC_API_BASE_URL` към `api` service
- `redis` услуга:
  - expose-ва порт `6379:6379` (или само вътрешен, ако предпочитаме)
  - има volume за persistence (по избор)
- Compose ресурсите (networks/volumes) са уникални per project (без колизии при много scaffold-и).

## Dev Tasks
- [ ] Добавяне на `web` Dockerfile scaffold (multi-stage) към CLI-generated проекта.
- [ ] Обновяване на CLI docker-compose generator да добавя `web` и `redis` като профили.
- [ ] Обновяване на `.env.example`/README в scaffold проекта с Docker инструкции.
- [ ] Локален smoke тест за `docker compose --profile web --profile redis up --build -d`.

## Test Plan (local)
- 1) Scaffold project:
  - `npx create-beelms-app <name>`
- 2) Start full stack:
  - `cd <name>/docker`
  - `docker compose --profile web --profile redis up --build -d`
- 3) Verify:
  - `api` отговаря на `http://localhost:3000/api/...`
  - `web` е достъпен на `http://localhost:3001/`
- 4) Regression локално:
  - `docker compose exec api npm run test:regression:local`
- 5) Cleanup:
  - `docker compose down -v`

## Notes
- В момента `fe/` няма Dockerfile в repo-то, затова Dockerfile-ът за `web` ще бъде генериран от CLI.
