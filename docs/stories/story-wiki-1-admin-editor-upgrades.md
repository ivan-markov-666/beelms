# STORY-WIKI-ADMIN-1: Admin Wiki Editor Upgrades (Safe Deletes + Mermaid Preview + Rich Editor)

_BMAD Story Spec | EPIC: EPIC-CORE-ADMIN | Status: ✅ Implemented_

---

## 1. Goal

Подобрения по Admin Wiki редактора, насочени към:

- безопасно управление на версиите (без риск да се изтрие „текущата“ активна версия)
- Mermaid диаграми в live preview и публичната wiki
- Rich text editor режим с toggle Markdown ↔ Rich editor, като изходният формат остава Markdown

---

## 2. Non-Goals

- Пълен WYSIWYG editor, който да съхранява HTML в базата (съхранението е Markdown)
- Advanced Mermaid editor UI (генератор, autocomplete, validation)
- Визуално управление на версии извън admin edit страницата

---

## 3. Acceptance Criteria

### 3.1 Safe Version Deletion

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Админът НЕ може да изтрие „текущата“ (latest) версия за даден език | ✅ |
| AC-2 | Админът НЕ може да изтрие последната останала версия на статията | ✅ |
| AC-3 | UI блокира delete действията за неделийтабъл версия (disabled бутони/checkbox) | ✅ |
| AC-4 | API връща 400 при опит за изтриване на неделийтабъл версия | ✅ |

### 3.2 Mermaid in Preview + Public Wiki

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | В Admin edit има preview секция, която рендерира Markdown „както в публичната Wiki“ | ✅ |
| AC-6 | Mermaid fenced code blocks (```mermaid) се рендерират като диаграми в preview | ✅ |
| AC-7 | Mermaid диаграмите се рендерират и в публичните wiki страници | ✅ |

### 3.3 Rich Editor Toggle (Markdown ↔ Rich)

| # | Criterion | Status |
|---|-----------|--------|
| AC-8 | Admin edit страницата има избор на режим „Markdown“ / „Rich text“ за `content` | ✅ |
| AC-9 | Rich editor поддържа базови форматирания (bold/italic/underline/strike), списъци | ✅ |
| AC-10 | Rich editor поддържа таблици | ✅ |
| AC-11 | Rich editor поддържа Mermaid insert (във вид на fenced code block с language=mermaid) | ✅ |
| AC-12 | Rich editor сериализира обратно към Markdown при промени | ✅ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- **Delete version endpoint**
  - `be/src/wiki/admin-wiki.controller.ts`
    - `DELETE /admin/wiki/articles/:id/versions/:versionId`
- **Deletion safety logic**
  - `be/src/wiki/wiki.service.ts`
    - `adminDeleteArticleVersion()`
    - Блокира:
      - latest версия за езика ("Cannot delete the current active version of this article")
      - последна версия ("Cannot delete the last remaining version of this article")

### 4.2 Frontend

- **Admin edit page (toggle modes + preview + version delete UI)**
  - `fe/src/app/admin/wiki/[slug]/edit/page.tsx`
    - `contentEditorMode` с бутони "Markdown" / "Rich text"
    - Preview секция с `WikiMarkdown`
    - Version deletion UI (disabled за latest per-language)
- **Rich editor implementation**
  - `fe/src/app/admin/wiki/_components/wiki-rich-editor.tsx`
    - TipTap extensions за таблици, underline, link, image
    - Mermaid insert: code block with language=mermaid
    - HTML → Markdown conversion via `turndown` (+ gfm plugins)
- **Markdown rendering (incl. Mermaid)**
  - `fe/src/app/wiki/_components/wiki-markdown.tsx`
    - custom code renderer: `language-mermaid` → `MermaidDiagram`

---

## 5. Notes / Edge Cases

- Bulk delete в UI изпраща последователни `DELETE` заявки; backend ще върне 400 за недопустимите версии и UI показва обобщена грешка ("Някои версии не можаха...") и reload на списъка.

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-19 | Cascade | Documented current implementation from `todo.txt` backlog items |
