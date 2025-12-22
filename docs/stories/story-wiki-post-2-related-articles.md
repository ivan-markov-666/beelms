# WIKI-POST-2: Свързани Wiki статии (Related articles)

_BMAD Story Spec | EPIC: POST-MVP-WIKI | Status: ✅ Implemented_

---

## 1. Цел

Да се показва блок **„Свързани статии“** под публичните Wiki статии, за да се улесни навигацията и откриването на релевантно съдържание.

Подход: **автоматично свързване по общи `tags`**.

---

## 2. Non-goals

- Ръчно подреждане/пинове на свързани статии
- Админ UI за „връзки“ тип граф (many-to-many relations таблица)
- Сложно ранжиране/персонализация

---

## 3. Acceptance Criteria

### 3.1 Backend API

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Има публичен endpoint `GET /api/wiki/articles/:slug/related?lang=&limit=` | ✅ |
| AC-2 | Връща само `active` + `public` статии, различни от текущата | ✅ |
| AC-3 | Ранжира по брой общи тагове (overlap), после по `updatedAt` | ✅ |
| AC-4 | Връща заглавие/език на най-подходящата публикувана версия (prefer `lang`, иначе `bg`) | ✅ |

### 3.2 Frontend

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | Публичната wiki статия рендерира блок „Свързани статии“ при налични резултати | ✅ |
| AC-6 | SSR fetch към BE, без клиентско „премигване“ | ✅ |
| AC-7 | i18n ключ за заглавието (BG/EN/DE) | ✅ |

### 3.3 Admin

| # | Criterion | Status |
|---|-----------|--------|
| AC-8 | Admin edit позволява редакция на `tags` (comma-separated), праща `tags` към BE при save | ✅ |
| AC-9 | Admin create позволява опционално задаване на `tags` | ✅ |

### 3.4 Тестове

| # | Criterion | Status |
|---|-----------|--------|
| AC-10 | FE тестовете за wiki article page отчитат допълнителния `fetch` (related) | ✅ |

---

## 4. Имплементация (къде е в кода)

### Backend

- DTO: `be/src/wiki/dto/wiki-related-article.dto.ts`
- Service: `WikiService.getRelatedArticlesBySlug(...)` (query по `tags && :tags` + ранжиране)
- Controller: `WikiController.getRelatedArticles(...)`

### Frontend

- Компонент: `fe/src/app/wiki/_components/wiki-related-articles.tsx`
- SSR интеграция: `fe/src/app/wiki/[slug]/page.tsx` (добавен `fetchWikiRelatedArticles`)
- i18n: `fe/src/i18n/messages.ts` (`wiki.relatedArticlesTitle`)

### Admin

- Edit: `fe/src/app/admin/wiki/[slug]/edit/page.tsx` (tags поле + parse/format + submit)
- Create: `fe/src/app/admin/wiki/create/page.tsx` (tags поле + submit)

---

## 5. Бележки

- `tags` са на ниво статия и се споделят между езиковите версии.
- Ако текущата статия няма тагове → endpoint връща празен списък.
- Ако кандидат статия няма публикувана версия → пропуска се.

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | Cascade | Реализирано WIKI-POST-2: BE endpoint + FE блок + admin tags UI + i18n |
