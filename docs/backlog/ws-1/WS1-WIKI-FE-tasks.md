# WS-1 Wiki – Frontend Tasks

Свързан epic: `EPIC-WS1-WIKI-FE.md`  
Свързани stories:
- `STORY-WS1-FE-WIKI-LIST`
- `STORY-WS1-FE-WIKI-ARTICLE`
- `STORY-WS1-FE-WIKI-STATES`

Референция: `docs/sprint-artifacts/WS1-wiki-demo-checklist.md`

---

## WS1-FE-01 – Страница `/wiki` (списък със статии)
- Story: `STORY-WS1-FE-WIKI-LIST`
- Цел: гост потребителят да вижда списък от статии на `/wiki`.

**Checklist:**
- [ ] Имплементирана е страница `/wiki` в Next.js.
- [ ] Използван е общият layout (header/footer) според UX/design.
- [ ] Страницата извиква `GET /api/wiki/articles` и визуализира списъка (заглавие, език, кратка информация).
- [ ] Всяка статия има линк към `/wiki/[slug]`.

---

## WS1-FE-02 – Страница `/wiki/[slug]` (детайл на статия)
- Story: `STORY-WS1-FE-WIKI-ARTICLE`
- Цел: гост потребителят да вижда съдържанието на конкретна статия.

**Checklist:**
- [ ] Имплементирана е страница `/wiki/[slug]` в Next.js.
- [ ] Използван е същият общ layout.
- [ ] Страницата извиква `GET /api/wiki/articles/{slug}` и показва заглавие, език, съдържание и мета информация според story-то.
- [ ] Има навигация назад към `/wiki` (бутон/линк „Назад към Wiki“ или еквивалент).

---

## WS1-FE-03 – UX състояния за `/wiki` (loading/empty/error)
- Stories: `STORY-WS1-FE-WIKI-LIST`, `STORY-WS1-FE-WIKI-STATES`
- Цел: предвидимо поведение на списъчната страница при различни състояния.

**Checklist:**
- [ ] Показва се ясен loading state, докато данните се зареждат.
- [ ] При празен списък (0 статии) се показва friendly empty state съобщение.
- [ ] При грешка от API се показва error message, в тон с UX/PRD.

---

## WS1-FE-04 – UX състояния за `/wiki/[slug]` (loading/error/404)
- Stories: `STORY-WS1-FE-WIKI-ARTICLE`, `STORY-WS1-FE-WIKI-STATES`
- Цел: предвидимо поведение на детайлната страница при различни състояния.

**Checklist:**
- [ ] Показва се loading state при зареждане на статията.
- [ ] При 404 от BE се показва UX за „статията не е намерена“ в синхрон с FLOW-WIKI-NOT-FOUND.
- [ ] При 5xx или друга грешка се показва общ error state, без да се изтича чувствителна информация.

---

## WS1-FE-05 – FE тестове и покриване на WS1 чеклиста
- Stories: всички WS-1 FE stories.
- Цел: да се потвърди, че FE частта покрива описаните acceptance criteria и WS1 чеклиста.

**Checklist:**
- [ ] Ръчно са минати сценариите от `WS1-wiki-demo-checklist.md` за FE (списък, детайл, състояния).
- [ ] (по избор) Добавени са базови FE/интеграционни тестове за основните Wiki екрани.
- [ ] Няма известни P0/P1 дефекти, свързани с Wiki FE WS-1.
