# STORY-WS6-FE-ADMIN-WIKI-EDIT-PAGE – FE екран за редакция на Wiki статия в Admin зоната

Status: Planned

## Summary
Като **администратор**, искам **екран в Admin зоната за редакция на Wiki статия**, така че да мога да променям заглавие, език, съдържание и статус на статията през удобен UI, стъпвайки върху Admin Wiki API-то и версионирането от WS-6 BE stories.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.1 (FR-WIKI) и §4.6 (FR-ADMIN-1..2 – Admin Wiki управление).
- MVP feature list – `docs/architecture/mvp-feature-list.md` §5.1–5.2 (Admin Wiki съдържание и версии).
- System Architecture – `docs/architecture/system-architecture.md` (Admin Portal, Wiki versions).
- UX Design – `docs/ux/qa4free-ux-design.md` (Admin Wiki взаимодействия – когато бъдат допълнени).
- WS-1/WS-4 – public Wiki + Admin Wiki read-only.
- WS-6 epic – `docs/backlog/ws-6/epics/EPIC-WS6-ADMIN-WIKI-EDIT-VERSIONS.md`.

## Acceptance Criteria
- В Admin зоната съществува страница за редакция на Wiki статия (напр. `/admin/wiki/[id]` или `/admin/wiki/edit/[id]`):
  - достъпна само за потребители с admin роля (в синхрон с Admin guard-овете в layout-а);
  - при директен достъп без валиден JWT или с non-admin роля показва подходящо 401/403 поведение.
- Екранът съдържа форма с основните полета на статията:
  - заглавие (title);
  - език (language) – dropdown със списък от поддържани езици;
  - съдържание (content) – textarea или прост markdown/plain text input;
  - статус (status) – dropdown (draft/active/inactive).
- При първоначално зареждане екранът:
  - извлича текущата статия от Admin Wiki API (напр. `GET /api/admin/wiki/articles/{id}` или реюз на съществуващ endpoint);
  - показва състояния loading/error, когато е уместно (напр. "Зареждане..." и ясно съобщение при грешка).
- При натискане на **"Запази"**:
  - UI-то вика BE endpoint-а за редакция (`PUT /api/admin/wiki/articles/{id}`) с актуалните стойности;
  - при успех показва потвърждение (toast/inline съобщение) и обновява формата с последните данни;
  - при валидационна грешка показва ясно съобщение/съобщения до съответните полета;
  - при мрежова/неочаквана грешка показва генерализирано съобщение за грешка.
- Има навигационен елемент "Назад към списъка" (линк към `/admin/wiki`).
- Основното поведение е покрито с поне един FE тест:
  - рендер на формата с началните стойности;
  - успешен submit (mock-нат fetch) → показва съобщение за успех;
  - handling на грешка (mock 400/500) → показва съобщение за грешка.

## Dev Tasks
- [ ] Дефиниране/уточняване на route за Admin Wiki edit страницата в Next.js приложението (напр. `/admin/wiki/[id]/edit` или подобна структура).
- [ ] Имплементация на клиентския компонент за формата:
  - [ ] Извличане на данните за статията от Admin Wiki API при mount;
  - [ ] Управление на локално състояние (формови полета, loading/error флагове);
  - [ ] Submit логика, която вика `PUT /api/admin/wiki/articles/{id}` с новите стойности.
- [ ] Интеграция с Admin layout-а и навигацията (линк "Редактирай" от списъка `/admin/wiki`, когато това бъде добавено).
- [ ] FE тест(ове) с React Testing Library:
  - [ ] рендер на страницата в admin контекст с mock-нат fetch за първоначално зареждане;
  - [ ] сценарий за успешен save (mock 200) и проверка за съобщение за успех;
  - [ ] сценарий за грешка (mock 400/500) и проверка за съобщение за грешка.

## Notes
- В WS-6 целта е **минимален, но реален** edit UI – без сложен markdown editor, autosave или preview; те могат да бъдат добавени в бъдещи WS/epics.
- UI копито (етикети, помощни текстове) трябва да е съгласувано с UX документа и с публичния Wiki UI, за да поддържа консистентно преживяване за администраторите.
