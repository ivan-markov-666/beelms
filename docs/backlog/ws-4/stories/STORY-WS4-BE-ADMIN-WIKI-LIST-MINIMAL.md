# STORY-WS4-BE-ADMIN-WIKI-LIST-MINIMAL – Минимален admin endpoint за Wiki list (read-only)

Status: Planned

## Summary
Като **администратор**, искам **admin endpoint за списък с Wiki статии**, за да мога да виждам всички статии (вкл. inactive/draft) в администраторския интерфейс.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` (Admin / Wiki управление).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (Admin/Back office).
- System Architecture – `docs/architecture/system-architecture.md` (Admin и Wiki компоненти).
- Wiki API – `docs/architecture/openapi.yaml` (разширение на Wiki списъка).

## Acceptance Criteria
- Съществува защитен endpoint (напр. `GET /api/admin/wiki/articles`), който:
  - връща списък от статии с полета `id`, `slug`, `title`, `status`, `updatedAt`;
  - включва и не-published статии (draft/inactive), ако такива има в модела.
- Endpoint-ът е достъпен само за администраторски контекст (роли/claims, съвместими с WS-2 Auth).
- Връща резултатите сортирани по `updatedAt` (desc) или друг договорен критерий.
- Има базово филтриране/пагинация (може да ползва съществуващата Wiki логика, ако е налична).

## Dev Tasks
- [ ] Добавяне на admin-facing метод в Wiki service / нов Admin Wiki service (според архитектурата).
- [ ] Добавяне на BE route/controller за `GET /api/admin/wiki/articles`.
- [ ] Ограничаване на достъпа до endpoint-а само за потребители с admin роля (reuse на WS-2 guard/interceptor).
- [ ] Unit тестове за service слоя (филтриране, сортиране).
- [ ] E2E тест, който:
  - [ ] симулира admin потребител;
  - [ ] извиква `GET /api/admin/wiki/articles` и проверява, че връща очакваните полета и статуси.

## Notes
- Това е read-only story – никакви промени по съдържанието на статиите.
- Може да преизползва съществуващи DTO/response модели от публичния Wiki list, разширени със `status`.
