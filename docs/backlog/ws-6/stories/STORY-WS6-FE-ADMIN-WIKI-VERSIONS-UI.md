# STORY-WS6-FE-ADMIN-WIKI-VERSIONS-UI – FE UI за история на версиите и rollback действие

Status: Done

## Summary
Като **администратор**, искам **UI в Admin зоната, който показва историята на версиите за Wiki статия и позволява rollback към избрана версия**, за да мога да виждам как се е променяло съдържанието и бързо да възстановявам по-стари варианти при нужда.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.6 (FR-ADMIN-2 – история на версии и rollback).
- MVP feature list – `docs/architecture/mvp-feature-list.md` §5.2 (управление на Wiki версии).
- System Architecture – `docs/architecture/system-architecture.md` (управление на версиите на Wiki съдържанието).
- DB модел – `docs/architecture/db-model.md` (ентитет `WikiArticleVersion`).
- OpenAPI – `docs/architecture/openapi.yaml` (Admin Wiki versions endpoints).
- WS-6 epic – `docs/backlog/ws-6/epics/EPIC-WS6-ADMIN-WIKI-EDIT-VERSIONS.md`.

## Acceptance Criteria
- В Admin Wiki edit flow-а съществува UI за история на версиите за дадена статия, например:
  - таб/панел „Версии“ в екрана за редакция;
  - или отделна страница/section (в зависимост от UX дизайна).
- UI-то показва списък от версии (данни от `GET /api/admin/wiki/articles/{id}/versions`), включително поне:
  - номер/идентификатор на версия (`version`/`id`);
  - език (`language`);
  - заглавие (`title`);
  - дата на създаване (`createdAt`);
  - създател (`createdBy`), ако е наличен.
- За всяка версия има ясно показано действие **"Върни тази версия"** (rollback):
  - при клик се показва кратко потвърждение (confirm диалог);
  - при потвърждение UI-то вика `POST /api/admin/wiki/articles/{id}/versions/{versionId}/restore`;
  - при успех обновява текущата статия и/или презарежда списъка с версии.
- При успешен rollback UI-то показва съобщение за успех (напр. "Статията беше върната към избраната версия").
- При грешка (404/400/500) UI-то показва ясно съобщение за грешка, без да оставя страницата в неконсистентно състояние.
- Има поне един FE тест, който покрива базовото поведение на списъка с версии и rollback действието (с mock-нати fetch заявки).

## Dev Tasks
- [x] Дизайн/структуриране на Versions секцията в Admin Wiki edit UI (таб, sidebar или отделна страница), съобразено с UX документа.
- [x] Имплементация на компонент за списък с версии:
  - [x] fetch към `GET /api/admin/wiki/articles/{id}/versions` при зареждане;
  - [x] състояния loading/empty/error за списъка;
  - [x] визуализация на основните полета за всяка версия.
- [x] Имплементация на rollback действие:
  - [x] confirm диалог/прост `window.confirm` за потвърждение;
  - [x] извикване на `POST /api/admin/wiki/articles/{id}/versions/{versionId}/restore`;
  - [x] обновяване на текущото съдържание/формата при успех;
  - [x] показване на съобщения за успех/грешка.
- [x] FE тест(ове) с React Testing Library:
  - [x] рендер на списъка с mock-нат отговор от versions endpoint-а;
  - [x] проверка, че бутон/линк за rollback присъства за всяка версия;
  - [x] сценарий за успешен rollback (mock 200) и показване на съобщение за успех;
  - [x] сценарий за грешка (mock 404/500) и показване на съобщение за грешка.

## Notes
- Тази story силно зависи от `STORY-WS6-BE-ADMIN-WIKI-VERSIONS-LIST-ROLLBACK` – UI-то трябва да стъпва върху стабилен BE.
- В WS-6 се фокусираме върху **минимален, но използваем** UI за версии; по-богати функции (diff изглед, филтри по език/диапазон от дати и др.) могат да бъдат добавени в бъдещи WS/epics.
