# STORY-WS4-FE-ADMIN-WIKI-LIST-PAGE – Admin страница със списък от Wiki статии (read-only)

Status: Done

## Summary
Като **администратор**, искам **страница `/admin/wiki` със списък от Wiki статии**, за да мога бързо да преглеждам наличното съдържание (slug, заглавие, статус, последна редакция) в администраторски контекст.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` (Admin / Wiki управление).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (Admin Wiki list).
- EPIC – `docs/backlog/ws-4/epics/EPIC-WS4-ADMIN-WIKI.md`.
- BE story – `STORY-WS4-BE-ADMIN-WIKI-LIST-MINIMAL`.
- WS-1 Wiki stories – за публичния Wiki list и article.

## Acceptance Criteria
- Съществува страница `/admin/wiki`:
  - използва Admin shell от `STORY-WS4-FE-ADMIN-SHELL`;
  - показва таблица/списък от статии с колони: `Slug`, `Title`, `Status`, `Updated`.
- Данните се зареждат от admin BE endpoint-а (не от публичния Wiki list).
- Статусите са визуално разграничени (напр. с цвят/текст „Active“, „Draft“, „Archived“).
- Всяка статия има линк към публичния `/wiki/[slug]` (open in new tab).
- При грешка от BE се показва ясно съобщение за грешка (минимално съобщение, не е нужно сложен error UI в WS-4).

## Dev Tasks
- [x] Имплементация на `/admin/wiki` страница като част от Admin layout-а.
- [x] Извикване на admin Wiki list endpoint-а от BE със съответните креденшъли (reuse на Auth token от WS-2).
- [x] Рендер на таблица с описаните колони.
- [x] Добавяне на линк към публичния `/wiki/[slug]` за всяка статия.
- [x] FE тестове (React Testing Library):
  - [x] mock на admin endpoint-а;
  - [x] проверка, че таблицата се рендерира с очакваните колони;
  - [x] проверка, че се визуализира поне една статия при успешен отговор.

## Notes
- Тази story зависи от:
  - `STORY-WS4-BE-ADMIN-WIKI-LIST-MINIMAL` (admin endpoint);
  - `STORY-WS4-FE-ADMIN-SHELL` (admin layout и guard).
- В бъдещи WS може да бъде разширена с филтри, търсене, bulk actions, CRUD и др.
