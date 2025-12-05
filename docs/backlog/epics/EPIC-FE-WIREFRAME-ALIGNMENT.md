# EPIC-FE-WIREFRAME-ALIGNMENT – Оеднаквяване на FE/BE спрямо UX wireframe-ите

## Summary
Този epic има за цел да оеднакви реалната FE имплементация (Next.js приложение) и публичните BE API-та с одобрените UX wireframe-и за публичната част на QA4Free. Целта е:
- всеки основен публичен екран (Landing, Wiki, Practical UI, Training API, Authentication, About/Contact и др.)
- да казва същото нещо, да решава същия проблем и да следва същата структура като съответния wireframe,
като същевременно запазваме текущите MVP функционалности и i18n поведение.

## Scope (какво покрива този epic)
- Оеднаквяване на **Landing / Home** страницата (`/`) спрямо `docs/ux/wireframes/Home-Landing/home.html`.
- Оеднаквяване на **public header & navigation** (QA4Free лого, Wiki / Practical UI / Training API / Admin, Login/Registration, Language switcher) спрямо общия layout в `docs/ux/wireframes` (`layout.js`).
- Оеднаквяване на **public footer** (legal/информационни линкове) спрямо `layout.js`, като се използват реалните MVP Legal страници (`/legal/privacy`, `/legal/terms`).
- Анализ и постепенно оеднаквяване на останалите публични екрани:
  - Wiki list / article екрани.
  - Practical UI (UI demo) и свързаните sandbox екрани (напр. Table CRUD).
  - Training API / API demo екран.
  - Authentication екрани (login / register).
  - Информационни екрани (About, Contact) – ако са описани в wireframe-ите.

Извън обхвата (за този epic):
- Промени по админ панела и admin-specific екрани (те вече са обхванати от WS-5/WS-8 epics).
- Дълбоки функционални промени по BE API-тата, освен ако не е нужно за синхронизацията с UI.

## Related BMAD artifacts
- Product Brief – `docs/product/product-brief.md` (визия за публичната част и целеви потребители).
- PRD – `docs/product/prd.md` (FR/NFR за публичните екрани и практическата среда).
- MVP feature list – `docs/architecture/mvp-feature-list.md` (Public Wiki, Practical UI, Training API, Legal, Authentication).
- UX Design – `docs/ux/qa4free-ux-design.md` (high-level изглед на публичните екрани и навигация).
- UX Wireframes – `docs/ux/wireframes/**/*` (конкретните wireframe-и за Home, Wiki, Sandbox, Training API, Auth, About/Contact и др.).
- User Flows – `docs/ux/flows/qa4free-user-flows.md` (end-to-end потоци през публичните екрани).
- Walking skeleton – `docs/delivery/walking-skeleton.md` + WS-epics за публичната част (WS-1 Wiki, WS-3 Practical UI/API Demo, WS-2 Auth и др.).

## Child user stories
- [ ] STORY-FE-WF-HOME-LANDING – Оеднаквяване на Home/Landing страницата (`/`) спрямо `Home-Landing/home.html`.
- [ ] STORY-FE-WF-HEADER – Оеднаквяване на публичния header (лого, навигация, login/registration, language switcher) спрямо `layout.js`.
- [ ] STORY-FE-WF-FOOTER – Оеднаквяване на footer-а (legal/info линкове) спрямо `layout.js`, използвайки реалните Legal страници.
- [ ] STORY-FE-WF-WIKI – Съпоставка Wiki wireframe-и vs реален Wiki FE и адаптация където е нужно.
- [ ] STORY-FE-WF-PRACTICAL-UI – Съпоставка Practical UI wireframe-и (вкл. Table CRUD) vs реален UI demo и добавяне/разделяне на екрани, ако е необходимо.
- [ ] STORY-FE-WF-TRAINING-API – Съпоставка Training API / API demo wireframe vs реален `/practice/api-demo` екран.
- [ ] STORY-FE-WF-AUTH – Съпоставка Login/Register wireframe-и vs реалните `/auth/login` и `/auth/register` страници.
- [ ] STORY-FE-WF-ABOUT-CONTACT – Имплементация на About/Contact екрани (ако са описани в wireframe-и) и вързване във footer-а.

## Risks / Assumptions
- Риск: Някои wireframe-и може да са по-стари от текущата реализация (FE може да е изпреварил дизайна или обратно). Нужно е внимателно продуктово решение при разминаване.
- Риск: Прекалено стриктно копиране на wireframe-ите може да влоши UX или да влезе в конфликт с вече валидирани MVP потоци.
- Допускане: Wireframe-ите в `docs/ux/wireframes` са одобрен референтен източник за визуален и структурен дизайн на публичните екрани.
- Допускане: Основните маршрути и API-та, използвани в момента (Wiki, Practical UI/API, Auth), ще останат стабилни и няма да се сменят драстично.

## Definition of Done (Epic)
- Всички child stories по-горе са изпълнени и маркирани като Done.
- Основните публични екрани (Home, Wiki, Practical UI, Training API, Auth, About/Contact) са визуално и структурно съпоставими с техните wireframe-и.
- Навигацията (header + footer) е консистентна на всички публични страници и съответства на UX design/wireframes.
- Всички промени са покрити с поне базови component/page тестове (където е приложимо) и регресионно са минати основните публични потоци.
- Няма отворени критични дефекти, свързани с разминаване между wireframe-и и реален FE/BE за публичната част.
