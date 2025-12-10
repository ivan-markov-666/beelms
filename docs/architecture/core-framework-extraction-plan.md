---
# Core Framework Extraction Plan (QA4Free → beelms core framework)

## 1. Контекст и цели

Този документ описва как текущият проект **QA4Free** ще бъде рефакториран до **реизползваем core framework beelms** (wiki + admin + training платформа), който може да се:

- ползва като основа за други проекти;
- публикува публично в GitHub;
- инсталира/стартира лесно (в бъдеще и чрез `npx`).

Целта е да разделим:

- **Core функционалност** – остава в рамката (generic wiki + admin) и става част от **beelms**;
- **QA4Free-специфично** – изнася се в отделен слой/примерен проект.


## 2. Какво остава в Core (високо ниво)

### Backend (NestJS)

- Модел за wiki статии, версии и медия:
  - entities: Article, ArticleVersion, Media.
- Admin API за статии:
  - CRUD за статии и версии;
  - статуси `draft/active/inactive`;
  - autosave за чернови;
  - медия upload/list/delete.
- Public API за wiki:
  - списък от статии с филтри;
  - детайл по `slug` + `lang`.

### Frontend (Next.js)

- Public wiki:
  - списък, търсене, филтри по език;
  - детайлна страница със markdown + Mermaid.
- Admin wiki:
  - списък статии + статуси;
  - create (по slug) → redirect към edit;
  - edit страница с език/статус/заглавие/subtitle/content;
  - live preview (WikiMarkdown + Mermaid);
  - версии, сравнение, rollback;
  - медия upload, list, delete;
  - защита от изтриване на активна версия.

### Инфраструктура

- Docker setup за FE/BE + media volume.
- Базов CI/CD скелет (ако добавим по-нататък).


## 3. Какво се премахва от Core (QA4Free-специфично)

### 3.1 Backend

- **Seed данни за Wiki**
  - Файл: `be/src/seed/wiki.seed.ts`.
  - Действие: 
    - Премахване от core OR преместване в отделна папка `examples/qa4free/seed/`.

- **Тестове, обвързани с конкретно съдържание**
  - Файл: `be/src/wiki/wiki.service.spec.ts` (частите, които тестват конкретни статии/slug-ове и текстове за manual testing).
  - Действие:
    - Ре-писане на тестовете да работят с generics (примерни slug-ове), или преместване в примерен модул.

- **DB default параметри с `qa4free`**
  - Файлове: `be/src/app.module.ts`, `be/src/seed/wiki.seed.ts` – default `DB_USER`, `DB_PASSWORD`, `DB_NAME` са `qa4free`.
  - Действие:
    - В core: премахване на тези default стойности или замяна с неутрални (`app_user`, `app_db`) и/или изцяло чрез env.

### 3.2 Frontend

- **QA4Free „маркетингови“/продуктови страници**
  - `fe/src/app/about/page.tsx` – съдържание за QA4Free като продукт.
  - Други страници, които говорят директно за QA4Free (ако има такива).
  - Действие:
    - Изваждане в примерен проект (`examples/qa4free-fe`) или отделен app segment.

- **QA4Free-конкретни компоненти/линкове в навигацията**
  - `fe/src/app/_components/header-nav.tsx` – елементи, които сочат към QA4Free-специфични страници/секции.
  - Действие:
    - Навигацията в core да остане минимална (напр. Home, Wiki, Admin);
    - QA4Free линковете да се добавят в примерния проект.

- **Страници/съдържание за конкретни training сценарии**
  - Всякакви статични секции, които описват конкретни QA курсове, тренировки и т.н., ако са в FE кода, а не в wiki съдържанието.
  - Действие:
    - Преместване в примерна инстанция.

- **FE тестове, които очакват QA4Free текстове/структури**
  - `fe/src/app/_components/__tests__/header-nav.test.tsx` – очаквания за конкретни линкове/етикети.
  - `fe/src/app/admin/__tests__/admin-dashboard-page.test.tsx` – ако проверява QA4Free-специфични текстове.
  - `fe/src/app/admin/wiki/__tests__/admin-wiki-page.test.tsx`, `admin-wiki-edit-page.test.tsx` – части, които тестват QA4Free копи/seed, а не generics.
  - Действие:
    - Тестовете в core да използват общи текстове ("Wiki Admin", "Article"), без QA4Free име.

### 3.3 Документация / UX / backlog

Тези файлове са ценни, но са **product documents** за QA4Free, не за общ framework:

- `docs/product/product-brief.md`
- `docs/ux/qa4free-ux-prototypes.md`
- `docs/ux/qa4free-ux-design.md`
- `docs/ux/flows/qa4free-user-flows.md`
- Част от `docs/backlog/**` където историите са конкретно за QA4Free.

**Действие:**

- Преместване в подпапка `docs/qa4free/` или отделно repo за продукта;
- В core репото да останат само general architecture/docs.

### 3.4 Инфраструктура

- QA4Free специфични имена в Docker/конфигурация:
  - В `docker-compose.yml` – имена на services/volumes, ако са брандирани с `qa4free`.
  - В `.env` примери – домейни/URL-и, в които пише QA4Free.

**Действие:**

- Имената на services да станат неутрални (`web`, `api`, `db` и т.н.);
- QA4Free домейните да се преместят в example config.


## 4. Какво се преименува (остава в Core, но се обезличава)

### 4.1 Auth/Storage

- **LocalStorage token key**
  - Текущо: `qa4free_access_token` (използва се в FE admin страници).
  - Ново (пример): `admin_access_token` или `app_access_token`.

**Файлове (примерни места):**

- `fe/src/app/admin/wiki/[slug]/edit/page.tsx`
- `fe/src/app/admin/wiki/create/page.tsx`
- `fe/src/app/admin/users/page.tsx`
- `fe/src/app/auth/login/page.tsx`

### 4.2 UI текстове и брандинг

- **Заглавие/лого в навигация**
  - `fe/src/app/_components/header-nav.tsx` – текстове и aria-label, съдържащи `QA4Free`.
  - Да станат неутрални: "Learning Wiki", "QA Training Platform" или бъдещото име на рамката.

- **Meta заглавия/описания**
  - Layout-и и страници, които имат `QA4Free` в `<title>` или `description`.
  - Да се формулират като описание на рамка, а QA4Free да се споменава само в example docs.

- **I18n съобщения**
  - `fe/src/i18n/messages.ts` – ключове/стойности със `QA4Free` (напр. `registerSubtitle`, `legalFooterDisclaimer`, `accountDeletedHint`).
  - Да се заменят с неутрални формулировки ("портал", "платформа" и т.н.).

### 4.3 README / package metadata

- Root `README.md`, `fe/README.md`, `be/README.md`:
  - В момента представят проекта като QA4Free.
  - Трябва да описват **framework-а**, а QA4Free да е показан като *примерна инсталация*.

- `package.json` (FE/BE):
  - `name`, `description`, евентуално `repository` да отразяват новото framework име.

- `.bmad/bmm/config.yaml`:
  - `project_name: qa-4-free` – при изваждане в ново repo, стойността трябва да съответства на името на framework проекта.

### 4.4 Email домейн при изтриване на акаунт

- Текущо: при GDPR изтриване email-ът се сменя на `deleted+<id>@deleted.qa4free.invalid`.
- Файлове:
  - `be/src/auth/account.service.ts`
  - `be/src/auth/account.service.spec.ts`
- Действие:
  - Смяна на домейна с неутрален (напр. `deleted.example.invalid`) или изваждане в конфигурация.


## 5. Checklist по стъпки

### Стъпка 1 – Изваждане на QA4Free специфики

- [ ] **BE:** Премахни/изнеси `be/src/seed/wiki.seed.ts` от core.
- [ ] **BE:** Преработи `wiki.service.spec.ts` да не зависи от конкретни QA статии (или премести QA4Free вариант в примерен модул).
- [ ] **BE:** Обезличи DB default креденшъли със стойности `qa4free` в `be/src/app.module.ts` и `be/src/seed/wiki.seed.ts`.
- [ ] **FE:** Извади `about`, `contact` и legal страниците (`/legal/privacy`, `/legal/terms`) и други QA4Free-маркетингови страници в примерен проект.
- [ ] **FE:** Почисти навигацията (`header-nav`) от QA4Free‑специфични линкове – да останат само generic секции.
- [ ] **Docs:** Премести QA4Free product/UX/backlog документи в `docs/qa4free/` или друг проект.
- [ ] **Infra:** Прегледай `docker-compose.yml` и `.env*` за QA4Free-брандирани имена и ги премести в примерна конфигурация.

### Стъпка 2 – Обезличаване (rename/generalize)

- [ ] Смени localStorage ключа `qa4free_access_token` в целия FE → напр. `admin_access_token`.
- [ ] Смени email домейна за изтрити акаунти от `deleted.qa4free.invalid` към неутрален (напр. `deleted.example.invalid`) и обнови тестовете.
- [ ] Обнови всички UI текстове, където се показва "QA4Free" → неутрален бранд на рамката.
- [ ] Обнови `i18n/messages.ts` за да премахнеш QA4Free от преводите.
- [ ] Обнови meta `<title>`/`description` за публичните страници.
- [ ] Обнови `README` файловете да говорят за framework + примерна инстанция QA4Free.
- [ ] Коригирай `package.json` имена/описания да съответстват на framework-a.

### Стъпка 3 – Примерна инстанция "QA4Free"

- [ ] Създай папка/репо `examples/qa4free` (или подобно), която:
  - [ ] Добавя обратно QA4Free специфичните документи и страници.
  - [ ] Ползва core framework като dependency (или monorepo пакет).
  - [ ] Държи seed данните за wiki, свързани с manual testing.

### Стъпка 4 – Подготовка за `npx` (по-късно)

*(само като маркери, без изпълнение сега)*

- [ ] Определи структура на template-a (cookiecutter/репо skeleton).
- [ ] Реши имената на npm пакета и CLI командата.
- [ ] Подготви минимален скрипт, който:
  - клонира/копира core шаблона;
  - инициализира env файлове;
  - по желание добавя примерни QA4Free данни.


## 6. Бележки

- Настоящият документ е **план**, не изпълнена миграция.
- При реалното отделяне ще трябва:
  - да се прегледат всички `qa4free` срещания в кода (`rg qa4free`);
  - да се валидира, че core билдът минава и без QA4Free конкретика;
  - да се добави кратка документация за това как се създава нов проект върху рамката.
