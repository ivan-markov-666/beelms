# EPIC-WS1-WIKI-FE – Публична Wiki навигация (Guest → Wiki List → Wiki Article – Frontend)

## Summary
Този epic обхваща frontend частта на walking skeleton WS-1: гост потребител отваря `/wiki`, вижда списък със статии и от там навигира към конкретна статия на `/wiki/[slug]`. Реализира се минимален, но реален UX върху Next.js, стъпващ върху съществуващите UX/flows и design system.

## Scope (какво покрива този epic)
- Next.js страници `/wiki` и `/wiki/[slug]`.
- Използване на споделения layout компонент (header + footer) според UX документа.
- Базови преизползваеми UI компоненти (бутони, линкове, съобщения за грешки/успех) според `docs/ux/design-system.md`.
- Състояния за списък и детайл: loading / empty / error / 404.
- Този epic **не** покрива (out of scope):
  - Административен интерфейс за създаване/редакция на Wiki съдържание.
  - Разширена навигация (търсене, филтри, категории/тагове) отвъд базовия списък със статии.
  - SEO оптимизации, analytics и A/B експерименти за Wiki страниците.
  - Локализация и смяна на език на интерфейса извън минималното, нужно за WS-1.
 
## Notes

- WS-1 покрива минималния read-only flow (Guest → `/wiki` → `/wiki/[slug]`). Пълното поведение по FR-WIKI-2/3/4 (търсене/филтри, езиков switch, действия „Сподели“ и „Принтирай“) се реализира в допълнителни MVP stories като `STORY-MVP-WIKI-SEARCH-FILTER`, `STORY-MVP-WIKI-LANGUAGE-SWITCH` и `STORY-MVP-WIKI-ARTICLE-ACTIONS`.

## Related BMAD artifacts
- Product Brief – `docs/product/product-brief.md` (Wiki като централно хранилище на знания).
- PRD – `docs/product/prd.md` §4.1 FR-WIKI-* (Публична Wiki).
- MVP feature list – `docs/architecture/mvp-feature-list.md` §1 (SCR-WIKI-LST, SCR-WIKI-ART).
- UX Design – `docs/ux/qa4free-ux-design.md` (екрани SCR-WIKI-LST и SCR-WIKI-ART, глобален layout).
- User Flows – `docs/ux/flows/qa4free-user-flows.md` (FLOW-WIKI-BROWSE, FLOW-WIKI-NOT-FOUND).
- Walking skeleton – `docs/delivery/walking-skeleton.md` §2 WS-1.

## Child user stories
- [ ] STORY-WS1-FE-WIKI-LIST – Публичен списък със Wiki статии (/wiki).
- [ ] STORY-WS1-FE-WIKI-ARTICLE – Преглед на единична Wiki статия (/wiki/[slug]).
- [ ] STORY-WS1-FE-WIKI-STATES – UX състояния (loading/empty/error/404) за Wiki страниците.

## Risks / Assumptions
- **Risks:**
  - Зависимост от backend ендпойнтите за Wiki (`GET /api/wiki/articles` и `GET /api/wiki/articles/{slug}`) – закъснения или промени могат да блокират или забавят FE имплементацията.
  - Възможни разминавания между UX дизайна и това, което е реалистично да се реализира в рамките на WS-1.
- **Assumptions:**
  - Backend ендпойнтите за Wiki ще бъдат налични и стабилни според OpenAPI спецификацията преди или по време на разработката на FE.
  - За WS-1 е достатъчен минимален, read-only browsing UX (без създаване/редакция/изтриване на статии от frontend).
  - Базовият design system и layout компоненти вече съществуват и могат да се използват директно.

## Definition of Done (Epic)
- Всички child stories по-горе са изпълнени и затворени.
- Страниците `/wiki` и `/wiki/[slug]` визуално и поведенчески съответстват на UX/flows документите за основните сценарии.
- Реализираното поведение за Wiki страниците съответства на релевантните секции в PRD за публичната Wiki.
- Използва се споделен layout компонент и базови UI компоненти от design system-а (без дублиран HTML/стилове ad-hoc).
- Ръчно са проверени основните сценарии от FLOW-WIKI-BROWSE и FLOW-WIKI-NOT-FOUND.
- Налични са поне базови FE/интеграционни тестове или описан ясен мануален чеклист в story-тата.
- Няма отворени критични (P0/P1) дефекти, свързани с този epic.
