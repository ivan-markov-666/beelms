# STORY-WS8-FE-ADMIN-USERS-PAGE – Admin Users страница (WS-8 реализация)

Status: Planned

_Забележка: Това WS-8 FE story реализира на практика обхвата на `STORY-WS5-FE-ADMIN-USERS-PAGE` в рамките на WS-8. Canonical acceptance criteria остават в WS-5 story файла._

## Summary

Като **администратор** искам **страница `/admin/users`** с таблица с потребители и възможност за активиране/деактивиране, за да управлявам достъпа до платформата.

WS-8 осигурява реална FE интеграция към Admin Users API от WS-8 BE story-то и вписва страницата в съществуващия Admin shell.

## Links to BMAD artifacts

- PRD – `docs/product/prd.md` (FR-ADMIN-* – управление на потребители).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§5.3 Управление на потребители).
- Conceptual Epic – `docs/backlog/ws-5/epics/EPIC-WS5-ADMIN-USERS-METRICS.md`.
- WS-5 canonical story – `docs/backlog/ws-5/stories/STORY-WS5-FE-ADMIN-USERS-PAGE.md`.
- WS-8 Epic – `docs/backlog/ws-8/epics/EPIC-WS8-ADMIN-USERS-METRICS.md`.

## Acceptance Criteria (WS-8 перспектива)

- WS-8 story-то се счита успешно, когато behavior-ът и UI-то на `/admin/users` покриват всички Acceptance Criteria от `STORY-WS5-FE-ADMIN-USERS-PAGE`.
- Страницата използва реалния Admin Users API, имплементиран по `STORY-WS8-BE-ADMIN-USERS-LIST`.

## Dev Tasks (WS-8)

- [ ] Имплементиране на страница `/admin/users` в съществуващия Admin shell/layout.
- [ ] Извикване на `GET /api/admin/users` с поддръжка на странициране и филтър по email.
- [ ] Имплементиране на toggle за `active` (използвайки `PATCH /api/admin/users/{id}`) с визуален feedback и обработка на грешки.
- [ ] FE тестове (таблица, филтър, toggle, guard-ване за admin).
- [ ] Ръчно тестване на основните сценарии в комбинация с BE.

## Notes

- Parent Epic: `EPIC-WS8-ADMIN-USERS-METRICS`.
- Свързано WS-8 BE story: `STORY-WS8-BE-ADMIN-USERS-LIST`.
- Canonical UX/acceptance детайли са в WS-5 story файла.
