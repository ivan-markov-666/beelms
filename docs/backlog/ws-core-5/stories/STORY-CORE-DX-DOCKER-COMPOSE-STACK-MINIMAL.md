# STORY-CORE-DX-DOCKER-COMPOSE-STACK-MINIMAL – Minimal docker-compose stack (db + api)

Status: Planned

## Summary
Като **developer**, искам минимален docker-compose стек (db + api) с неутрално naming и конфигурация, за да мога да стартирам beelms core локално като generic instance.

## Links to BMAD artifacts
- EPIC – `docs/backlog/ws-core-5/epics/EPIC-WS-CORE-5-NEUTRAL-INSTANCE-READINESS.md`

## Acceptance Criteria
- `docker compose up --build` стартира поне `db` и `api`.
- Compose имената (services/volumes/networks) са неутрални (без `qa4free`).
- `api` може да се свърже към `db` чрез env.

## Dev Tasks
- [ ] Review/Update на docker-compose файла.
- [ ] Проверка на ports, healthchecks и локален smoke test.
