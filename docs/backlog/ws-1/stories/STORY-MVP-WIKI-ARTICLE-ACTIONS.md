# STORY-MVP-WIKI-ARTICLE-ACTIONS – Действия „Сподели“ и „Принтирай“ за Wiki статия

_Забележка: Това story не е част от WS-1, а от EPIC-WIKI-PUBLIC (MVP разширение на публичната Wiki)._ 

## Summary
Като **гост** искам на страницата `/wiki/[slug]` да имам удобни действия „Сподели“ и „Принтирай“, за да мога лесно да споделям и отпечатвам съдържанието на Wiki статията.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.1 FR-WIKI-3.
- MVP feature list – `docs/architecture/mvp-feature-list.md` §1.2 (действия „Сподели“ и „Принтирай“).
- UX Design – `docs/ux/qa4free-ux-design.md` (SCR-WIKI-ART – article actions).
- User Flows – `docs/ux/flows/qa4free-user-flows.md` (FLOW-WIKI-BROWSE – четене на статия).
- Walking skeleton – `docs/delivery/walking-skeleton.md` §2 (WS-1 – разширение върху базовия article екран).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-WIKI-PUBLIC).

## Acceptance Criteria
- На `/wiki/[slug]` при валидна и активна статия се визуализират ясно разграничени действия:
  - бутон/линк „Сподели“;
  - бутон/линк „Принтирай“.
- „Сподели“:
  - на поддържани браузъри използва Web Share API (ако е налично) за споделяне на URL адреса на статията;
  - при липса на Web Share API (desktop браузъри и др.) предоставя fallback (напр. копиране на URL в клипборда и кратко съобщение „Линкът е копиран“).
- „Принтирай“:
  - отваря стандартния print диалог на браузъра за текущата статия (съдържанието е форматирано така, че да е четимо на хартия – без излишни UI елементи като навигация, ако това е описано в UX/design system).
- Действията:
  - не изискват login (работят за гост потребители);
  - не разкриват чувствителна техническа информация;
  - се държат адекватно и на mobile (бутоните са достъпни и лесни за натискане).

## Dev Tasks
- [ ] Имплементиране на UI за „Сподели“ и „Принтирай“ на `/wiki/[slug]` с използване на компоненти от design system-а.
- [ ] Добавяне на логика за Web Share API + fallback сценарий за „Сподели“.
- [ ] Настройване на подходящ print stylesheet или layout поведение, така че съдържанието на статията да се отпечатва четимо.
- [ ] Ръчно тестване на:
  - desktop браузър (Share fallback + Print диалог);
  - mobile браузър с Web Share API (ако е налично).
- [ ] (По избор) Snapshot/DOM тестове за наличието на action бутоните при активна статия.

## Notes
- Parent Epic: `EPIC-WIKI-PUBLIC` (разширение на FR-WIKI-3 – действия „Сподели“ и „Принтирай“).
- Това story надгражда `STORY-WS1-FE-WIKI-ARTICLE` (основна страница на статията) и може да се реализира в по-късен sprint след стабилизиране на базовия WS-1 flow.
- Поведението и текстовете на бутоните трябва да са в синхрон с tone-of-voice и UX насоките в `docs/ux/qa4free-ux-design.md`.
