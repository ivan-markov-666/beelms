# WS-4 Admin Wiki – Implementation Order of User Stories

_Роля: Tech Lead / Analyst. Цел: ясен ред за имплементация на WS-4 Admin Wiki walking skeleton (Admin shell + Admin Wiki list)._ 

## 1. Обхват

Тази последователност покрива:
- WS-4 vertical за Admin Wiki skeleton (BE admin wiki list endpoint + FE admin shell + FE admin wiki list страница).
- Минимален, но реален vertical през BE (admin wiki list endpoint) и FE (Admin зона + Admin Wiki list страница).

## 2. Препоръчителен ред за имплементация

### WS-4 – Admin Wiki walking skeleton (BE → FE)

1. **STORY-WS4-BE-ADMIN-WIKI-LIST-MINIMAL**  
   Минимален admin Wiki list endpoint (read-only), достъпен само за администратори, връщащ основните полета за статиите (slug, title, status, updated).

2. **STORY-WS4-FE-ADMIN-SHELL**  
   FE Admin shell (layout + guard + навигация) с route `/admin`, защитен за admin роля, и вътрешна навигация, която включва линк към `/admin/wiki`.

3. **STORY-WS4-FE-ADMIN-WIKI-LIST-PAGE**  
   FE Admin страница `/admin/wiki`, която използва Admin shell-а и admin Wiki list endpoint-а, за да визуализира read-only таблица със статии (Slug, Title, Status, Updated), с линкове към публичния `/wiki/[slug]`.

## 3. Бележки

- Този WS-4 skeleton стъпва върху вече реализираните Wiki/Auth vertical-и от WS-1 и WS-2 и не променя техния обхват.
- Админ endpoint-ът за Wiki list (WS-4 BE story) е prerequisite за пълноценна имплементация и тестове на FE Admin Wiki list страницата.
- Admin shell-ът (WS-4 FE story) може да бъде разработван паралелно с BE endpoint-а, но препоръчителната последователност за един човек/малък екип е BE → FE shell → FE list страница.
- Traceability към PRD/MVP/UX за Admin Wiki се поддържа основно в `EPIC-WS4-ADMIN-WIKI.md` и свързаните stories.
