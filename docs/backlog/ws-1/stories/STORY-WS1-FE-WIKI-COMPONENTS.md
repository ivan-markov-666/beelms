# STORY-WS1-FE-WIKI-COMPONENTS – Споделени FE компоненти за Wiki (/wiki, /wiki/[slug])

Status: Draft

## Summary
Като **delivery екип** искаме страниците `/wiki` и `/wiki/[slug]` да стъпват върху споделени FE компоненти (layout, back линкове, meta за статия, състояния loading/error/404), за да намалим дублирания код, да улесним бъдещи промени по UX дизайна и да стабилизираме тестовете.

## Links to BMAD artifacts
- WS-1 story order – `docs/backlog/ws-1/WS1-WIKI-story-order.md`.
- FE Wiki list – `docs/backlog/ws-1/stories/STORY-WS1-FE-WIKI-LIST.md`.
- FE Wiki article – `docs/backlog/ws-1/stories/STORY-WS1-FE-WIKI-ARTICLE.md` (планирано/за добавяне).
- UX Design – `docs/ux/qa4free-ux-design.md` (екрани SCR-WIKI-LST и SCR-WIKI-ART).

## Acceptance Criteria
- Съществува малка библиотека от споделени Wiki компоненти (напр. в `fe/src/app/wiki/_components/`), които се използват **еднакво** от:
  - страницата `/wiki`;
  - страницата `/wiki/[slug]` (вкл. нейните `loading`, `error`, `not-found`).
- Общите части (layout, back линк „← Назад към Wiki“, типография за заглавие/подзаглавие, визуални състояния) не са дублирани ръчно в page компонентите.
- Wiki страниците продължават да покриват Acceptance Criteria от `STORY-WS1-FE-WIKI-LIST` и `STORY-WS1-FE-WIKI-ARTICLE` (функционално поведение и основни състояния).
- Съществува поне базов набор от FE тестове, които потвърждават, че споделените компоненти рендерират коректно (и че WS-1 флоу Guest → /wiki → /wiki/[slug] продължава да работи след рефактора).

## Dev Tasks
- [ ] Дефиниране на малка FE структура за Wiki компоненти (напр. `fe/src/app/wiki/_components/`):
  - wrapper/layout компонент за основното Wiki съдържание (ширина, падинги, spacing);
  - `WikiBackLink` компонент за линка „← Назад към Wiki“;
  - компоненти за wiki meta (език, дата на последна редакция);
  - базови компоненти/функции за състояния `loading`, `error`, `not-found`, които могат да се ползват и от `/wiki`, и от `/wiki/[slug]`.
- [ ] Рефактор на `/wiki` да използва новите компоненти без промяна в behavior-а и текстовете.
- [ ] Рефактор на `/wiki/[slug]` (вкл. `loading.tsx`, `error.tsx`, `not-found.tsx`) да използва новите компоненти без промяна в behavior-а и текстовете.
- [ ] Актуализиране/допълване на съществуващите FE тестове (`wiki-page.test.tsx`, `wiki-article-page.test.tsx`) да отразяват новата компонентна структура, като се уверим, че WS-1 флоу остава зелен.
- [ ] (По избор) Добавяне на малки unit тестове за отделни компоненти, ако имат собствена логика (напр. формат на датата, избор на текст за различни състояния).

## Notes
- Това е **tech/refactor story**, което стъпва върху вече работещ WS-1 vertical; не трябва да променя функционалния обхват на Wiki, а само вътрешната структура на FE кода.
- Детайлното визуално изравняване по UX дизайна (spacing, цветове, икони и др.) може да бъде разширено в отделно MVP/UX story, след като споделените компоненти са налични.
