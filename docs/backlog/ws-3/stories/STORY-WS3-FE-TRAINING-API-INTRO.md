# STORY-WS3-FE-TRAINING-API-INTRO – FE екран за Training API + линк към Swagger

## Summary
Като **QA, който иска да учи API/integration тестване**, искам **страница „API Demo / Training API“ в UI-то**, която обяснява Training API, дава линк към Swagger UI и предлага примерни сценарии за тестване.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.4 (FR-API-DEMO-1..2).
- MVP feature list – `docs/architecture/mvp-feature-list.md` §4.1–4.2 (Swagger UI + упражнения).
- UX Design – `docs/ux/qa4free-ux-design.md` (екран за API Demo / Training API).
- User Flows – `docs/ux/flows/qa4free-user-flows.md` (навигиране към API Demo от основните екрани).
- Traceability – `docs/backlog/WS-PRACTICAL-ENV-traceability.md` (FR-API-DEMO-1..2).

## Acceptance Criteria
- Съществува публична страница (напр. `/practice/api-demo`), достъпна за гост и логнат потребител.
- Страницата съдържа:
  - кратко описание на Training API и целта му (demo за QA упражнения);
  - ясно видим бутон/линк към Swagger UI на Training API, с коректен URL;
  - списък с 3–5 примерни сценарии за тестване (ping, echo – позитивни и негативни случаи).
- Навигацията съдържа връзка към API Demo страницата (директно или през общо меню „Практическа среда“).
- Страницата не прави директни API извиквания към Training API в WS-3 (фокусът е върху документацията и примерите); директни примери могат да бъдат добавени в бъдещи WS.

## Dev Tasks
- [ ] Дефиниране на route (напр. `/practice/api-demo`) в Next.js приложението.
- [ ] Имплементация на копирайт/структура според UX документа (заглавия, секции, списък със сценарии).
- [ ] Добавяне на бутон/линк към Swagger UI на Training API.
- [ ] Интеграция с основното навигационно меню.
- [ ] FE тест, който проверява, че страницата се рендерира и линкът към Swagger има очаквания href.

## Notes
- Тази story зависи от `STORY-WS3-BE-TRAINING-API-SWAGGER` (за да има реален Swagger URL).
- В по-късни WS/API stories страницата може да бъде обогатена с live примерни заявки, code snippets и др.
