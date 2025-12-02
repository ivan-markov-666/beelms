# WS-6 Admin Wiki Edit & Versions – Implementation Order of User Stories

_Роля: Tech Lead / Analyst. Цел: ясен ред за имплементация на WS-6 Admin Wiki Edit & Versions vertical._

## 1. Обхват

Тази последователност покрива:
- WS-6 vertical за **Admin Wiki редакция и версии** (BE edit endpoint + BE versions list/rollback + FE edit страница + FE versions UI).
- Минимален, но реален vertical през BE (edit + версии) и FE (Admin edit UI + история на версиите), стъпващ върху вече реализираните Wiki/Auth/Admin vertical-и от WS-1, WS-2, WS-4 и WS-5.

## 2. Препоръчителен ред за имплементация

### WS-6 – Admin Wiki Edit & Versions walking skeleton (BE → FE)

1. **STORY-WS6-BE-ADMIN-WIKI-EDIT-MINIMAL**  
   Минимален Admin Wiki edit endpoint (`PUT /api/admin/wiki/articles/{id}`), guard-нат за admin роля, който обновява основната статия и създава нов запис в `WikiArticleVersion` при всяка успешна редакция.

2. **STORY-WS6-BE-ADMIN-WIKI-VERSIONS-LIST-ROLLBACK**  
   Admin Wiki versions endpoints: `GET /api/admin/wiki/articles/{id}/versions` за списък с версии и `POST /api/admin/wiki/articles/{id}/versions/{versionId}/restore` за rollback към избрана версия (третиран като нова версия), guard-на-ти за admin роля.

3. **STORY-WS6-FE-ADMIN-WIKI-EDIT-PAGE**  
   FE екран за редакция на Wiki статия в Admin зоната (напр. `/admin/wiki/[id]/edit`), който стъпва върху BE edit endpoint-а, показва форма с основните полета (title, language, content, status), поддържа loading/error състояния и има работещ save flow с визуален feedback.

4. **STORY-WS6-FE-ADMIN-WIKI-VERSIONS-UI**  
   FE UI за историята на версиите в Admin edit flow-а: списък от версии (номер/id, език, заглавие, дата, създател) на база `GET /api/admin/wiki/articles/{id}/versions` и действие "Върни тази версия", което вика `POST /api/admin/wiki/articles/{id}/versions/{versionId}/restore` и обновява текущото съдържание.

## 3. Бележки

- Този WS-6 vertical стъпва върху:
  - публичния Wiki vertical от WS-1 (публично четене на статии и версии);
  - Auth/Profile vertical от WS-2 (JWT и роли, включително admin);
  - Admin Wiki read-only skeleton от WS-4 (`/admin`, `/admin/wiki`);
  - Admin Users & Metrics vertical от WS-5 (утвърдени Admin guard-ове и Admin shell).
- BE edit endpoint-ът (WS-6 BE story 1) е prerequisite за пълноценна имплементация и тестове на FE edit страницата.
- BE versions list/rollback endpoint-ите (WS-6 BE story 2) са prerequisite за пълноценна имплементация и тестове на FE Versions UI.
- FE edit страницата (WS-6 FE story 3) и FE Versions UI (WS-6 FE story 4) могат да се разработват паралелно след стабилизиране на BE vertical-а, но препоръчителната последователност за един човек/малък екип е BE edit → BE versions/rollback → FE edit page → FE versions UI.
- Traceability към PRD/MVP/UX за Admin Wiki edit & versions се поддържа основно в `EPIC-WS6-ADMIN-WIKI-EDIT-VERSIONS.md` и свързаните WS-6 stories.
