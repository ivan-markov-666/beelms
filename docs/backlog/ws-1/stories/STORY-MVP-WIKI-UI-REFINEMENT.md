# STORY-MVP-WIKI-UI-REFINEMENT – Визуално изравняване на Wiki FE към UX дизайна

Status: Done

## Summary
Като **UX/продукт екип** искаме публичните Wiki екрани `/wiki` (SCR-WIKI-LST) и `/wiki/[slug]` (SCR-WIKI-ART) да следват по-точно UX дизайна и текстовите wireframes в `docs/ux/qa4free-ux-design.md`, така че потребителят да вижда консистентен, изчистен и използваем интерфейс, готов за по-широки MVP/production тестове.

## Links to BMAD artifacts
- UX Design – `docs/ux/qa4free-ux-design.md` (§2 – Глобален layout и навигация; §3 – SCR-WIKI-LST, SCR-WIKI-ART).
- PRD – `docs/product/prd.md` (§4.1 FR-WIKI-*).
- WS-1 story order – `docs/backlog/ws-1/WS1-WIKI-story-order.md`.
- FE Wiki list – `docs/backlog/ws-1/stories/STORY-WS1-FE-WIKI-LIST.md`.
- FE Wiki article – `docs/backlog/ws-1/stories/STORY-WS1-FE-WIKI-ARTICLE.md` (планирано/за добавяне).
- Tech story за споделени Wiki компоненти – `docs/backlog/ws-1/stories/STORY-WS1-FE-WIKI-COMPONENTS.md`.

## Acceptance Criteria
- Страниците `/wiki` и `/wiki/[slug]` използват общия layout shell (header/footer), описан в UX документа (§2.1 и §2.4), в рамките на наличния Next.js layout.
- Визуалната структура на `/wiki` (SCR-WIKI-LST) съответства на wireframe-а:
  - ясно заглавие и контекст за Wiki;
  - списък със статии в една колона с разумни отстояния (mobile-first), със заглавие, език и дата на последна редакция;
  - hover/active състояния за линковете към `/wiki/[slug]` в съответствие с базовия дизайн system.
- Визуалната структура на `/wiki/[slug]` (SCR-WIKI-ART) съответства на wireframe-а:
  - ясно заглавие на статията и подзаглавие/контекст, ако е описано;
  - четливо съдържание (типография, отстояния, ширина на реда);
  - добре позициониран back линк към `/wiki` („← Назад към Wiki“) според UX указанията;
  - показване на езика и датата в стил, описан/подразбран в UX design system.
- Състоянията `loading`, `error` и `404` за `/wiki` и `/wiki/[slug]` са визуално консистентни помежду си и с общия стил на QA4Free (цветове, шрифтове, тон на съобщенията).
- Mobile/regponsive поведението на Wiki екраните отговаря на UX правила от §2.4 „Wiki (mobile)“ – една колона, подходящи отстояния, без хоризонтален скрол в основния текст.

## Dev Tasks
- [x] Преглед на UX документа `docs/ux/qa4free-ux-design.md` за секциите, свързани с Wiki (SCR-WIKI-LST, SCR-WIKI-ART) и глобалния layout.
- [x] Актуализиране на FE компонентите за `/wiki` и `/wiki/[slug]` (вкл. споделените Wiki компоненти от `STORY-WS1-FE-WIKI-COMPONENTS`), така че да следват по-точно описания UX (типография, spacing, цветове, поведение на линковете и състоянията).
- [x] Преглед и корекция на `loading`, `error` и `not-found` състоянията за двете страници, така че да са визуално консистентни, без да се променя функционалният им обхват.
- [x] Тестване на desktop и mobile изгледи (ръчно, в браузър) за основните сценарии: списък със статии, празен списък, 404 статия, грешка при зареждане.
- [ ] (По избор) Малки корекции по copy/текстове на български, за да са по-близо до UX/Microcopy указанията, ако има такива в UX документа.

## Notes
- Това е **MVP/UX refinement story**, стъпващо върху вече завършен WS-1 vertical за Wiki и споделените Wiki FE компоненти; не добавя нова функционалност, а подобрява визуалното качество и консистентността.
- Детайлното поведение на езиковия превключвател и търсене/филтриране по език за Wiki се покрива от отделни MVP stories (`STORY-MVP-WIKI-SEARCH-FILTER`, `STORY-MVP-WIKI-LANGUAGE-SWITCH`) и не е част от това story.
