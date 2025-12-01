# STORY-WS3-FE-UI-DEMO-PAGE – Екран с UI елементи и reset за упражнения

Status: Done

## Summary
Като **начинаещ или напреднал QA**, искам **екран „UI Demo“ с различни UI елементи и бутон за reset**, за да мога да упражнявам manual и UI automation тестване върху реалистичен, но безопасен интерфейс.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.3 (FR-UI-DEMO-1..3).
- MVP feature list – `docs/architecture/mvp-feature-list.md` §3.1 (Екран с UI елементи за упражнения).
- System Architecture – `docs/architecture/system-architecture.md` (Практическа среда – UI Demo).
- UX Design – `docs/ux/qa4free-ux-design.md` (секция за Practical UI Demo, когато бъде допълнена).
- User Flows – `docs/ux/flows/qa4free-user-flows.md` (навигиране до Practical Env UI Demo).
- Walking skeleton – `docs/delivery/walking-skeleton.md` (WS-3 Practical Env skeleton – когато бъде актуализиран).
- Traceability – `docs/backlog/WS-PRACTICAL-ENV-traceability.md` (FR-UI-DEMO-1).

## Acceptance Criteria
- Съществува публична страница (напр. `/practice/ui-demo`), достъпна за гост и логнат потребител.
- Страницата съдържа комбинация от UI елементи (минимум):
  - поне 3 различни бутона (primary/secondary/disabled);
  - поне едно текстово поле с валидация и съобщения за грешка;
  - поне един dropdown/select с няколко опции;
  - поне един чекбокс и група от радио бутони;
  - малка таблица/списък, върху който действията на потребителя променят видимото състояние (напр. филтър/маркиране).
- Има ясно обозначен бутон **„Reset“**, който:
  - изчиства всички въведени стойности в формите;
  - връща селекциите в начално състояние;
  - връща таблици/списъци в дефолтен изглед.
- Страницата използва съществуващия layout (header/footer) и базови UI компоненти (бутони, полета, съобщения), в синхрон с `design-system.md`.
- Състоянията loading/error не са нужни в WS-3 (няма BE зависимости), но при бъдещо разширение екранът може лесно да бъде свързан с API.

## Dev Tasks
- [x] Дефиниране на route (напр. `/practice/ui-demo`) в Next.js приложението.
- [x] Имплементация на UI с подбрани HTML/React компоненти според PRD/MVP изискванията.
- [x] Имплементация на reset логика, която връща UI в начално състояние без page reload.
- [x] Интеграция с главния layout и навигация (линк в header/nav към UI Demo страницата).
- [x] FE тестове (React Testing Library или екв.) за основните поведения (рендер, взаимодействие, reset).

## Notes
- Тази story може да бъде разширявана с допълнителни елементи в бъдещи WS, но в WS-3 целта е **минимален, но богат** набор за упражнения.
- Конкретните текстове и етикети на елементите трябва да са достатъчно ясни за QA упражнения, без да изискват допълнителни обяснения извън екрана.
