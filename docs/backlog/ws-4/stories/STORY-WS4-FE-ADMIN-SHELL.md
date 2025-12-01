# STORY-WS4-FE-ADMIN-SHELL – Admin layout, guard и базова навигация

Status: Done

## Summary
Като **администратор**, искам **базов Admin shell (layout + навигация)**, за да мога да влизам в отделна Admin зона на UI-то и да достъпвам admin страници като Admin Wiki List.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` (Admin UX изисквания).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (Admin/Back office skeleton).
- UX Design – `docs/ux/qa4free-ux-design.md` (Admin layout, когато бъде достъпен).
- User Flows – `docs/ux/flows/qa4free-user-flows.md` (Admin login → Admin dashboard).

## Acceptance Criteria
- Съществува route `/admin`, който:
  - показва отделен Admin layout (header/sidebar или прост header с „Admin“ индикатор);
  - е достъпен само за логнат admin потребител.
- Потребител без валиден токен (`qa4free_access_token`):
  - при опит да отвори `/admin` бива пренасочен към `/auth/login`.
- Non-admin потребител (логнат, но без admin роля):
  - ако отвори `/admin`, вижда страница „Access denied“ (HTTP 403 стил) без допълнителен redirect.
- Администраторът, когато е в Admin shell:
  - вижда линк към Admin Wiki List (напр. `/admin/wiki`) в Admin навигацията (header/sidebar в горната част на страницата);
  - индикатор, че се намира в Admin зона (заглавие „Admin“ или подобно).
- В глобалната навигация:
  - Admin линк/бутон (който води към `/admin`) се показва само за admin потребител и не се вижда за non-admin.

## Dev Tasks
- [x] Имплементация на Admin layout компонент (shared, ако е нужно).
- [x] Добавяне на маршрути `/admin` и (placeholder) `/admin/wiki` в Next.js app-а.
- [x] FE guard логика:
  - [x] използва данните от WS-2 Auth (token/role) за да определи дали потребителят е admin;
  - [x] при липса на валиден токен – redirect към `/auth/login`;
  - [x] при логнат, но non-admin профил – рендър на страница „Access denied“ (HTTP 403 стил) без допълнителен redirect.
- [x] Интеграция с глобалната навигация:
  - [x] Admin линк/бутон се показва само за admin потребител (напр. в профил менюто).
- [x] FE тестове:
  - [x] рендер на `/admin` за admin потребител;
  - [x] проверка, че потребител без валиден токен се пренасочва към `/auth/login`;
  - [x] проверка, че non-admin вижда страница „Access denied“ (HTTP 403 стил) и няма достъп до съдържанието на Admin зоната;
  - [x] проверка, че Admin навигацията съдържа линк към `/admin/wiki` за admin и че Admin линк/бутон не се визуализира за non-admin в глобалната навигация.

## Notes
- Тази story зависи от WS-2 Auth & Profile (login и роли).
- Admin shell-ът в WS-4 е минимален и може да бъде разширен с допълнителни секции в бъдещи WS.
- При липса на валиден токен (`qa4free_access_token`) потребителят се пренасочва към `/auth/login`; при валиден, но non-admin профил се показва страница „Access denied“ (HTTP 403 стил) без допълнителен redirect.
