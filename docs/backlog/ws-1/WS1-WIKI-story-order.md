# WS1 Wiki – Implementation Order of User Stories

_Роля: Tech Lead / Analyst. Цел: ясен ред за имплементация на WS-1 Wiki walking skeleton + свързаните MVP Wiki разширения._

## 1. Обхват

Тази последователност покрива:
- WS-1 Wiki BE/FE stories (walking skeleton WS-1 от `docs/delivery/walking-skeleton.md`).
- MVP Wiki stories, които разширяват FR-WIKI-2/3/4 от PRD.

## 2. Препоръчителен ред за имплементация

### WS-1 – Wiki walking skeleton (BE → FE)

1. **STORY-WS1-BE-WIKI-DB-SEED**  
   Миграции и начални данни за `WikiArticle` / `WikiArticleVersion`.

2. **STORY-WS1-BE-WIKI-LIST-ENDPOINT**  
   `GET /api/wiki/articles` – списък от активни статии за `/wiki`.

3. **STORY-WS1-BE-WIKI-ARTICLE-ENDPOINT**  
   `GET /api/wiki/articles/{slug}` – детайл за статия за `/wiki/[slug]`.

4. **STORY-WS1-FE-WIKI-LIST**  
   Next.js страница `/wiki`, списък със статии, използващ `GET /api/wiki/articles`.

5. **STORY-WS1-FE-WIKI-ARTICLE**  
   Next.js страница `/wiki/[slug]`, показваща съдържанието на статията чрез `GET /api/wiki/articles/{slug}`.

6. **STORY-WS1-FE-WIKI-STATES**  
   UX състояния **loading / empty / error / 404** за `/wiki` и `/wiki/[slug]`, стъпващи на коректни 200/404/5xx от BE.

### MVP Wiki разширения (след стабилен WS-1)

7. **STORY-WS1-FE-WIKI-COMPONENTS**  
   Споделени FE компоненти за Wiki (`/wiki`, `/wiki/[slug]`) – layout, back линкове, meta, базови състояния loading/error/404.

8. **STORY-MVP-WIKI-UI-REFINEMENT**  
   Визуално изравняване на `/wiki` и `/wiki/[slug]` към UX дизайна (wireframes, spacing, типография, състояния), стъпвайки върху общите Wiki компоненти.

9. **STORY-MVP-WIKI-SEARCH-FILTER**  
   Търсене и филтриране по език на `/wiki` + разширение на `GET /api/wiki/articles` с `q` и `lang`.

10. **STORY-MVP-WIKI-LIST-PAGINATION**  
   Пагинация на списъка със статии на `/wiki`.

11. **STORY-MVP-WIKI-LANGUAGE-SWITCH**  
   Global language switcher в header-а и поведение на `/wiki` и `/wiki/[slug]` при смяна на езика.

12. **STORY-MVP-WIKI-ARTICLE-ACTIONS**  
   Действия „Сподели“ и „Принтирай“ върху `/wiki/[slug]`.

### Cross-cutting мултиезичност (след Wiki stories)

13. **STORY-MVP-CROSS-I18N-FE-FOUNDATION**  
   Основи на мултиезичността във FE (BG/EN) – глобалният header language switcher влияе и на общия UI (layout/nav), стъпвайки върху поведението от `STORY-MVP-WIKI-LANGUAGE-SWITCH` и `EPIC-CROSS-I18N`.

---

## 3. Бележки

- Stories 1–6 реализират walking skeleton **WS-1 – Guest → Wiki List → Wiki Article**.
- Stories 7–12 допълват пълния обхват на **FR-WIKI-1/2/3/4** от PRD върху стабилния WS-1 vertical.
- За WS-1 (stories 1–6) езикът на интерфейса и Wiki съдържанието може да бъде фиксиран (напр. BG), както е описано в `docs/delivery/walking-skeleton.md` – пълната multi-language логика и глобалният language switcher за Wiki се реализират в `STORY-MVP-WIKI-LANGUAGE-SWITCH`.
- FR-WIKI-2 (търсене и филтър по език), FR-WIKI-3 (действия „Сподели“/„Принтирай“) и FR-WIKI-4 (превключване на език) се покриват основно от MVP stories 9–12 (`STORY-MVP-WIKI-SEARCH-FILTER`, `STORY-MVP-WIKI-LIST-PAGINATION`, `STORY-MVP-WIKI-LANGUAGE-SWITCH`, `STORY-MVP-WIKI-ARTICLE-ACTIONS`) и не са част от базовия WS-1 vertical.
