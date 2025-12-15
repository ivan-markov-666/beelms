# STORY-CORE-DX-SEED-MIGRATIONS-GENERIC – Generic migrations/seed workflow

Status: Planned

## Summary
Като **maintainer**, искам стандартен migrations/seed workflow с generic seed данни (или изцяло опционален seed), за да може beelms core да работи като framework без QA4Free-специфично съдържание.

## Links to BMAD artifacts
- EPIC – `docs/backlog/ws-core-5/epics/EPIC-WS-CORE-5-NEUTRAL-INSTANCE-READINESS.md`
- Extraction plan – `docs/architecture/core-framework-extraction-plan.md`

## Acceptance Criteria
- Seed-ът не зависи от QA4Free конкретни wiki статии/текстове.
- Има ясен command(и) за migrations и seed (local dev).
- Тестовете не очакват QA4Free конкретни seed данни.

## Dev Tasks
- [ ] Преглед на текущите seed скриптове.
- [ ] Извеждане на QA4Free seed към future instance repo или маркиране като example.
- [ ] Update на тестове към generics.
