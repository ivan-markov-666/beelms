# STORY-MVP-WIKI-SEARCH-FILTER – Търсене и филтриране по език в Wiki списъка

Status: Draft

_Забележка: Това story не е част от WS-1, а от EPIC-WIKI-PUBLIC (MVP разширение на публичната Wiki)._ 

## Summary
Като **гост** искам на страницата `/wiki` да мога да търся по заглавие/ключова дума и да филтрирам по език (напр. BG/EN), за да намирам бързо релевантни Wiki статии.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.1 FR-WIKI-2.
- MVP feature list – `docs/architecture/mvp-feature-list.md` §1.1 (Начален екран / Списък със статии).
- UX Design – `docs/ux/qa4free-ux-design.md` (SCR-WIKI-LST – Search + Language filter).
- User Flows – `docs/ux/flows/qa4free-user-flows.md` (FLOW-WIKI-BROWSE – стъпка 2).
- System Architecture – `docs/architecture/system-architecture.md` (Wiki услуга).
- Walking skeleton – `docs/delivery/walking-skeleton.md` §2 (WS-1 – разширение върху базовия списък).

## Acceptance Criteria
- На страницата `/wiki` има:
  - видимо поле за търсене по заглавие/ключова дума;
  - контрол за филтриране по език (напр. dropdown BG/EN).
- Комбинацията от Search + Language filter определя кои статии се показват в списъка:
  - при празно търсене и „Всички езици“ се показва базовият списък на активните статии;
  - при попълнено търсене се показват само активни статии, чиито заглавие/ключови думи съответстват на заявката;
  - при избран език се показват само статии/езикови версии на този език.
- При липса на резултати:
  - API връща `200 OK` с празен масив;
  - `/wiki` показва ясeн „No results“ / „Няма намерени статии“ state, в синхрон с UX дизайна и `STORY-WS1-FE-WIKI-STATES`.
- Търсенето и филтрите не нарушават основния WS-1 flow:
  - от `/wiki` все още може да се навигира към `/wiki/[slug]` за всяка статия в резултатите;
  - връщането „Back to Wiki“ от детайлната страница запазва или разумно ресетва текущите филтри (решението е описано в UX/flows).

## Dev Tasks
- [ ] **Frontend (Next.js)**
  - [ ] Добавяне на Search поле и Language filter UI в `SCR-WIKI-LST` (`/wiki`), със стилове от design system-а.
  - [ ] Имплементиране на логика за прилагане на Search + Language filter към извикването на API (`GET /api/wiki/articles`), включително encode-ване на заявката в query параметри.
  - [ ] Имплементиране на „no results“ state (визуално и текстово), координирано с `STORY-WS1-FE-WIKI-STATES`.
  - [ ] Ръчно тестване на комбинации: без филтри, само език, само търсене, език + търсене, без резултати.
- [ ] **Backend (NestJS API)**
  - [ ] Разширяване на `GET /api/wiki/articles` да приема опционални query параметри за търсене и език, в синхрон с OpenAPI спецификацията.
  - [ ] Имплементиране на филтриране върху активните статии по подадените критерии (full-text/ILIKE върху заглавие/ключови думи, филтър по език/езикова версия).
  - [ ] Тестове за API поведението: без филтри, само език, само търсене, без резултати.
- [ ] **Тестове**
  - [ ] Базови FE/интеграционни тестове (или ръчен чеклист) за Search + Language filter на `/wiki`.
  - [ ] BE unit/integration тестове за новото филтриране в `WikiService`/репозиториото.

## Notes
- Parent Epic: `EPIC-WIKI-PUBLIC` (разширение на FR-WIKI-2 – търсене и филтър по език).
- Това story надгражда WS-1 и е част от по-широкия `EPIC-WIKI-PUBLIC` (виж `docs/backlog/MCP-EPIC-map.md`), но може да бъде планирано и изпълнено в отделен sprint след завършен базов WS-1 flow.
- Детайлите за точния формат на query параметрите се синхронизират с OpenAPI (`docs/architecture/openapi.yaml`) и UX/Dev решението за „запазване на филтри при навигация“.
- Language filter-ът на `/wiki` се разглежда като **локален филтър на екрана**, докато глобалният language switcher в header-а (виж `STORY-MVP-WIKI-LANGUAGE-SWITCH`) определя предпочитания език на интерфейса и началния набор от статии; конкретното поведение при комбинация от двата механизма се уточнява в UX/flows.
