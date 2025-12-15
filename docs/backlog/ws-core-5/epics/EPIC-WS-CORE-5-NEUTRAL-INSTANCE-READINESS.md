# EPIC-WS-CORE-5-NEUTRAL-INSTANCE-READINESS – Neutral instance readiness (beelms core)

Status: In Progress

## Summary
Този epic дефинира WS-CORE-5 walking skeleton за **beelms core** с фокус върху **DX readiness за “generic instance”**:
- обезличаване на QA4Free-специфични defaults/брандинг;
- стандартизирани env templates;
- минимален docker-compose стек;
- generic seed/migrations workflow;
- кратък runbook за локално стартиране.

Целта е core репото да може да се използва като **framework base**, върху който по-късно да се изгради отделна QA4Free инстанция в отделно repo.

## Links to BMAD artifacts
- Product Brief – `docs/product/product-brief.md`
- PRD – `docs/product/prd.md`
- Backlog index – `docs/backlog/beelms-core-epics-and-stories.md` (EPIC-CORE-DX-CLI-INFRA)
- Extraction plan – `docs/architecture/core-framework-extraction-plan.md`

## Scope (какво покрива този epic)
- “Neutralize” на QA4Free специфики в core:
  - default DB креденшъли/име;
  - домейни/ключове в auth flows (напр. deleted email domain, localStorage token key);
  - UI copy/branding (където е критично за core);
  - docker/compose naming.
- Env templates за api/web.
- Минимален docker-compose стек (db + api) за локален старт.
- Generic seed/migrations workflow.
- Runbook: “How to run beelms core locally as a generic instance”.

## Out of scope
- `npx create-beelms-app` scaffold/publish (това е следващ слой на EPIC-CORE-DX-CLI-INFRA).
- Production hardening (TLS, secrets mgmt, k8s).
- Multi-tenant.

## Child user stories
- [ ] STORY-CORE-DX-NEUTRALIZE-BRANDING-DEFAULTS
- [ ] STORY-CORE-DX-ENV-TEMPLATES
- [ ] STORY-CORE-DX-DOCKER-COMPOSE-STACK-MINIMAL
- [ ] STORY-CORE-DX-SEED-MIGRATIONS-GENERIC
- [ ] STORY-CORE-DX-RUNBOOK-LOCAL-INSTANCE

## Definition of Done (Epic)
- Core репото може да се стартира локално като generic instance без QA4Free-specific defaults.
- Има ясни env templates и минимален docker-compose стек.
- Има описан и повторяем migrations/seed workflow.
- Има кратък runbook за local dev.
- Няма отворени P0/P1 дефекти, свързани с DX/local startup.
