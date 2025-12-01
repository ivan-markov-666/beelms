# EPIC-WS4-ADMIN-WIKI – Admin skeleton за Wiki (read-only)

Status: Planned

## Summary
Този epic дефинира WS-4 walking skeleton за **Admin зона върху Wiki**: минимален admin login flow, базов admin shell и read-only списък с Wiki статии, за да валидираме end-to-end потока Admin → Admin Dashboard → Admin Wiki List.

## Scope (какво покрива този epic)
- Минимална Admin зона в UI-то:
  - публичен `/admin/login` (или reuse на съществуващия login с admin креденшъли);
  - защитен `/admin` shell (layout + навигация за admin);
  - read-only `/admin/wiki` страница със списък от Wiki статии.
- Свързване с WS-2 Auth:
  - използване на вече имплементирания Auth/Account backend и FE guard-ове;
  - разграничаване на admin потребители (чрез роли/claim от WS-2, без да се въвежда нов auth механизъм).
- Бекенд поддръжка за admin Wiki списък:
  - BE endpoint за администраторски списък на Wiki статии (разширява WS-1 Wiki API);
  - включва полета, нужни за basic admin преглед (slug, title, status, updatedAt).
- Няма промяна на съдържание (read-only в WS-4).

Out of scope (за бъдещи WS/epics):
- Admin CRUD върху Wiki (create/update/delete).
- Управление на потребители/роли през UI.
- По-сложен Admin Dashboard с метрики.

## Related BMAD artifacts
- Product Brief – `docs/product/product-brief.md` (секция за Admin/back office).
- PRD – `docs/product/prd.md` (FR-ADMIN-* изисквания за администраторски достъп и Wiki управление).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (Admin / Back office части).
- System Architecture – `docs/architecture/system-architecture.md` (компоненти за Admin, роли и Wiki).
- UX Design – `docs/ux/qa4free-ux-design.md` (Admin login, Admin shell, Admin Wiki list – когато бъдат допълнени).
- User Flows – `docs/ux/flows/qa4free-user-flows.md` (Admin login → Admin Wiki flow).
- Traceability – `docs/backlog/WS-ADMIN-traceability.md` (когато бъде създаден).

## Child user stories
- [ ] STORY-WS4-BE-ADMIN-WIKI-LIST-MINIMAL – Минимален Admin endpoint за Wiki list (read-only).
- [ ] STORY-WS4-FE-ADMIN-SHELL – Admin layout, защитен достъп и базова навигация.
- [ ] STORY-WS4-FE-ADMIN-WIKI-LIST-PAGE – FE страница `/admin/wiki` със списък от статии.

## Risks / Assumptions
- **Risks:**
  - Неправилно разграничаване между admin и non-admin достъп може да отвори security дупки.
  - Прекалено богат Admin UI в WS-4 може да раздуе skeleton-а и да забави delivery.
- **Assumptions:**
  - WS-2 Auth & Profile е вече наличен и предоставя механизъм за роли/claims или поне за различни test users.
  - Wiki API от WS-1 е стабилен и може да бъде разширен с admin-oriented endpoint или филтър.

## Definition of Done (Epic)
- Съществува Admin зона с:
  - защитен `/admin` shell;
  - `/admin/wiki` read-only списък със статии.
- Admin потребител (от WS-2) може да:
  - се логне и да влезе в `/admin`;
  - види базова информация за Wiki статиите (slug, title, status, updatedAt).
- Non-admin потребител няма достъп до `/admin` и `/admin/wiki`.
- Основните сценарии са покрити с поне:
  - 1–2 BE теста за admin Wiki endpoint-а;
  - 1–2 FE теста за admin guard и рендер на списъка.
- Няма P0/P1 дефекти по WS-4 Admin skeleton вертикала.
