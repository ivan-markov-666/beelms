# STORY-CORE-DX-NEUTRALIZE-BRANDING-DEFAULTS – Neutralize QA4Free-specific defaults

Status: In Progress

## Summary
Като **maintainer**, искам core проектът да няма QA4Free-специфични defaults/брандинг (DB defaults, домейни, token ключове, UI копи), за да може beelms да се използва като **generic framework base**.

## Links to BMAD artifacts
- EPIC – `docs/backlog/ws-core-5/epics/EPIC-WS-CORE-5-NEUTRAL-INSTANCE-READINESS.md`
- Extraction plan – `docs/architecture/core-framework-extraction-plan.md`

## Acceptance Criteria
- Няма hardcoded `qa4free` default стойности за DB credentials/DB name в core.
- Няма hardcoded `deleted.qa4free.invalid` домейн; домейнът е неутрален или е конфигурация.
- Няма hardcoded `qa4free_access_token` localStorage ключ; ключът е неутрален или е конфигурация.
- UI текстове/branding, които споменават QA4Free в core, са неутрализирани или конфигурируеми.

## Dev Tasks
- [ ] Инвентаризация: `qa4free` срещания в FE/BE (code + env + docs).
- [ ] Премахване/замяна на hardcoded defaults с env/config.
- [ ] Update на тестове, които разчитат на QA4Free конкретни стойности.

## Notes
- Целта не е пълно ребрандиране на UI/UX в този story, а премахване на твърди зависимости, които пречат на extraction.
