# STORY-OPS-1: Automated DB Migrations on Deploy

_BMAD Story Spec | Status: 🟢 Implemented_

---

## 1. Goal

Гарантираме, че при deploy (staging/prod) базата винаги е с приложени последни TypeORM миграции, за да работят коректно новите features (напр. `course_purchases`, certificates).

---

## 2. Non-Goals

- Zero-downtime миграции за тежки промени
- Multi-tenant / multi-db orchestration

---

## 3. Acceptance Criteria

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Има документ/инструкция как се пускат миграции при deploy за текущия hosting | ✅ |
| AC-2 | CI/CD или deploy скрипт включва стъпка `npm --prefix be run migration:run` | ✅ |
| AC-3 | Има безопасна проверка/лог, че няма pending migrations след deploy | ✅ |
| AC-4 | Deploy pipeline failure ако миграцията fail-не (fail-fast) | ✅ |

---

## 4. Implementation Notes

- Зависи от hosting подхода:
  - Docker Compose: run migrations в отделен one-off container/step
  - PM2/systemd: run migrations като pre-start step
  - Managed CI/CD (GitHub Actions): добавяне на job/step

### 4.1 Commands (from repo root)

Run migrations:

```bash
npm --prefix be run migration:run
```

Fail-fast check for pending migrations (should be executed after `migration:run`):

```bash
npm --prefix be run migration:check
```

### 4.2 Docker Compose deploy

Docker compose includes a one-off `migrate` service that depends on DB healthcheck and runs:

- `npm run migration:run`
- `npm run migration:check`

Use it as a deploy step:

```bash
docker compose run --rm migrate
```

The `api` service is configured to start only after migrations complete successfully.

---

## 5. Questions / Inputs Needed

- Къде деплойвате BE/FE (VPS, Docker, Render, Railway, Fly.io, etc.)?
- Имате ли staging отделно от prod?
- Как се пуска app-а (docker compose, pm2, systemd)?

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-19 | Cascade | Initial story spec |
| 2025-12-20 | Cascade | Added automated migration run + pending check + docker compose migrate step |
