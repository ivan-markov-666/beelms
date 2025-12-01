# EPIC-WS3-PRACTICAL-UI-DEMO – Practical UI Demo (Sandbox UI страници)

Status: Done

## Summary
Този epic обхваща frontend частта на WS-3 walking skeleton за **Practical Environment – UI Demo**: Next.js страници с богата комбинация от HTML елементи, reset на състоянието и ясно описани примерни задачи за manual и UI automation тестване.

## Scope (какво покрива този epic)
- Нов публичен FE екран (или малък набор от екрани), напр. `/practice/ui-demo`.
- Комбинация от UI елементи за упражнения (FR-UI-DEMO-1):
  - бутони (primary/secondary, enabled/disabled);
  - текстови полета (валидни/невалидни стойности, различни плейсхолдъри);
  - dropdown / select;
  - чекбоксове, радио бутони, toggles;
  - списъци/таблици, при които действията променят състояние.
- Описание на целта на екрана и примерни задачи (FR-UI-DEMO-2):
  - текстова секция с 3–5 задачи за manual/UI automation тестване;
  - задачи, които използват реалните елементи на екрана.
- Възможност за **reset на състоянието** (FR-UI-DEMO-3):
  - бутон „Reset“, който връща всички елементи в начално състояние;
  - reset е чисто FE логика (без BE зависимости в WS-3).
- Навигация към UI Demo екрана от основния layout (header/nav), в синхрон с UX документа.

Out of scope за този epic (ще се покрият в бъдещи WS/epics):
- Задачи с BE-състояние или сложна стейт машина.
- Tracking на напредък/score върху UI задачите (част от бъдещи EPIC-EXAMS / EPIC-PRACTICE-TASKS).

## Related BMAD artifacts
- Product Brief – `docs/product/product-brief.md` (§5.1, практическа среда).
- PRD – `docs/product/prd.md` (§4.3 FR-UI-DEMO-1..3).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§3 Практическа среда – UI демо).
- System Architecture – `docs/architecture/system-architecture.md` (секция „Практическа среда – UI Demo“).
- UX Design – `docs/ux/qa4free-ux-design.md` (екрани за Practical Env UI Demo – когато бъдат допълнени).
- User Flows – `docs/ux/flows/qa4free-user-flows.md` (flows за навигация към Practical Env).
- Traceability – `docs/backlog/WS-PRACTICAL-ENV-traceability.md` (FR-UI-DEMO).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-PRACTICE-UI-DEMO).

## Child user stories
- [x] STORY-WS3-FE-UI-DEMO-PAGE – Екран с UI елементи и reset за упражнения.
- [x] STORY-WS3-FE-UI-DEMO-TASKS – Текстови примерни задачи и UX copy за упражненията.

## Risks / Assumptions
- **Risks:**
  - Прекалено сложен UI може да затрудни начинаещи потребители и да намали обучителния ефект.
  - Липса на консистентност с design system-а може да доведе до разминаване между Practical Env и останалата част от продукта.
- **Assumptions:**
  - Има базов design system (бутони, форми, съобщения), описан в `docs/ux/design-system.md`.
  - Практическата среда в WS-3 не изисква backend state; достатъчни са чисто FE взаимодействия.

## Definition of Done (Epic)
- Достъпна е поне една страница `/practice/ui-demo` с богата комбинация от HTML елементи за упражнения.
- Съществува ясен текстов блок с примерни задачи за manual/UI automation тестване.
- Бутон „Reset“ връща UI в начално състояние (forms, селекции, таблици).
- Навигацията към UI Demo страницата е интегрирана в основния layout и описана в UX документа.
- Основните поведения са покрити с поне базови FE тестове или ръчен чеклист.
- Няма отворени P0/P1 дефекти за WS-3 Practical UI Demo вертикала.
