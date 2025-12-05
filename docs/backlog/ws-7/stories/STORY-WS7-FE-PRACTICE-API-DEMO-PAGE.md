# STORY-WS7-FE-PRACTICE-API-DEMO-PAGE – Practice API demo страница

Status: Done

## Summary
Като **потребител/курсист** искам **Practice API demo страница**, която обяснява и демонстрира Training API (ping/echo), за да мога лесно да се ориентирам как да правя HTTP заявки и да ги използвам в упражнения (Postman, автоматизирани тестове и др.).

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.4 (FR-API-DEMO-1..3 – Training API + Swagger UI).  
- MVP feature list – `docs/architecture/mvp-feature-list.md` §4.1–4.2 (минимален Training API).  
- System Architecture – `docs/architecture/system-architecture.md` (Training API, Practice UI).  
- EPIC-WS7 – `docs/backlog/ws-7/epics/EPIC-WS7-PRACTICE-ENV-TASKS.md`.

## Acceptance Criteria
- Съществува страница (напр. `/practice/api-demo`), достъпна без специални роли.
- Страницата съдържа:
  - кратко текстово обяснение какво представлява Training API и за какво се използва;
  - описание на основните endpoints (за WS-7 – поне `GET /api/training/ping` и `POST /api/training/echo`).
- Страницата показва **примерни заявки**, например:
  - примерен `curl` за `GET /api/training/ping` и очаквания JSON отговор;
  - примерен `curl`/JSON за `POST /api/training/echo` и пример какво връща сървърът.
- По желание (ако е лесно в рамките на WS-7):
  - формички в UI, с които потребителят може да изпрати реални заявки към Training API директно от страницата (напр. бутон "Изпрати ping" и текстово поле за `echo` payload);
  - визуализация на отговора в UI.
- Линк/бутон към Swagger UI или друга API документация (ако Training API е описан и публикуван там).
- Страницата поддържа минимум BG/EN за основните заглавия/етикети.
- Има поне един FE тест, който проверява рендера на основните секции (описание, примери, линкове).

## Dev Tasks
- [x] Дефиниране на route `/practice/api-demo` в FE и включването му в навигацията (напр. под секция "Practice").
- [x] Имплементация на статично/полустатично съдържание, което описва Training API и показва примерни заявки.
- [x] (По избор) Добавяне на интерактивни елементи (бутон за ping, форма за echo) и wiring към реалния Training API.
- [x] Линк към Swagger UI / API документацията, ако е налична.
- [x] FE тестове за рендер на основните секции и линкове.

## Notes
- Целта на тази страница в WS-7 е предимно **образователна** – да дава бърз старт как да се използва Training API.
- В бъдещи WS/epics може да бъде разширена с по-сложни примери, интеграция с реални задачи и др.
