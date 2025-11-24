# STORY-MVP-WIKI-LANGUAGE-SWITCH – Смяна на език за Wiki списък и статии

_Забележка: Това story не е част от WS-1, а от EPIC-WIKI-PUBLIC (MVP разширение на публичната Wiki и мултиезичността)._ 

## Summary
Като **гост** искам да мога да превключвам езика (напр. BG/EN) на Wiki съдържанието чрез language switcher в header-а, за да чета едни и същи статии на предпочитания от мен език, когато има налични езикови версии.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.1 FR-WIKI-4.
- MVP feature list – `docs/architecture/mvp-feature-list.md` §1.2 (Екран „Wiki статия“ – превключване на език).
- UX Design – `docs/ux/qa4free-ux-design.md` (глобален header language switcher + SCR-WIKI-LST/SCR-WIKI-ART).
- User Flows – `docs/ux/flows/qa4free-user-flows.md` (FLOW-WIKI-BROWSE – смяна на езика през header).
- DB модел – `docs/architecture/db-model.md` (езикови версии в `WikiArticleVersion`).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-WIKI-PUBLIC, EPIC-CROSS-I18N).

## Acceptance Criteria
- В header-а на всички публични екрани (вкл. `/wiki`, `/wiki/[slug]`) има language switcher (напр. BG/EN), в синхрон с UX Design.
- На `/wiki`:
  - изборът на език ограничава списъка до статии/езикови версии на избрания език;
  - промяната на езика води до обновяване на списъка без счупване на основния WS-1 flow.
- На `/wiki/[slug]`:
  - при статия с налични няколко езикови версии потребителят може да превключва езика чрез global language switcher-а и да види съдържанието на същата статия на друг език (когато такава версия съществува);
  - ако статията няма версия на избрания език:
    - или се показва оригиналният език с подходящо пояснение;
    - или се показва 404/Not available for this language – конкретният вариант се уточнява в UX/flows и се документира.
- Публичните екрани продължават да показват само статии със статус `Active` (в синхрон с FR-WIKI-5 и WS-1 stories).
- Поведението на language switcher-а е последователно:
  - изборът на език се отразява както на Wiki, така и на други екрани, които поддържат мултиезичност в MVP (в синхрон с EPIC-CROSS-I18N).

## Dev Tasks
- [ ] **Frontend**
  - [ ] Имплементиране/актуализиране на global language switcher в header-а според UX Design.
  - [ ] Въвеждане на механизъм за съхранение на избрания език (URL, cookie, local storage или i18n контекст) по договорка със System Architecture.
  - [ ] Адаптиране на `/wiki` и `/wiki/[slug]` да използват избрания език при извличане и визуализация на съдържание.
- [ ] **Backend**
  - [ ] При нужда – разширяване на `GET /api/wiki/articles` и/или `GET /api/wiki/articles/{slug}` с параметър за език, така че да връщат коректната езикова версия според DB модела и OpenAPI.
  - [ ] Тестове за различни комбинации: статии с една езикова версия, с няколко версии, без версия на избрания език.
- [ ] **Тестове**
  - [ ] Ръчно тестване на основния flow: `/wiki` → смяна на език → избор на статия → `/wiki/[slug]` → смяна на език.
  - [ ] (По избор) FE/интеграционни тестове за language switcher поведение.

## Notes
- В първия WS-1 vertical езикът може да остане фиксиран (напр. BG), както е описано в `docs/delivery/walking-skeleton.md` §2.3.1; това story дефинира следващата стъпка към пълното FR-WIKI-4 поведение.
- Story-то е cross-cutting за EPIC-WIKI-PUBLIC и EPIC-CROSS-I18N и трябва да се планира заедно с общата i18n стратегия на приложението.
- При наличие на page-level language filter на `/wiki` (виж `STORY-MVP-WIKI-SEARCH-FILTER`) глобалният language switcher задава предпочитания език на интерфейса и началния език за Wiki съдържанието, а филтърът на страницата може допълнително да стеснява резултатите; конкретното поведение при конфликт се уточнява в UX/flows.
