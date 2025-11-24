# QA4Free – UX Prototypes & Wireframes (MVP)

_Роля: UX Designer / Analyst. Фаза: BMAD Phase 2 – Prototypes. Този документ служи като индекс на UX прототипите (wireframes и потоци) за MVP версията на QA4Free._

## 1. Обхват и свързани документи

Този документ стъпва върху вече наличните UX и продуктови артефакти:

- `docs/ux/qa4free-ux-design.md` – обобщаващ UX дизайн документ (основни екрани, навигация, текстови wireframes).
- `docs/ux/flows/qa4free-user-flows.md` – текстово описание на ключовите потребителски потоци (FLOW-*).
- `docs/ux/design-system.md` – базова дизайн система (цветове, бутони, форми).
- `docs/product/product-brief.md` – продуктови цели и нефункционални изисквания.
- `docs/product/prd.md` – детайлни функционални изисквания (FR-*).
- `docs/architecture/system-architecture.md` и `docs/architecture/mvp-feature-list.md` – системен контекст и списък с MVP функционалности.
- `docs/architecture/development-workflow.md` – BMAD development workflow (Фаза 2: Прототипи).

Целта на този файл е да осигури **traceability** между:

- дефинираните UX екрани (SCR-*) и реалните wireframes;
- дефинираните потоци (FLOW-*) и съответните UX артефакти (текст + диаграми).

---

## 2. Екрани (SCR-*) и визуални wireframes

Таблицата по-долу свързва основните MVP екрани (SCR-*) от `docs/ux/qa4free-ux-design.md` с реалните HTML wireframes в `docs/ux/wireframes/**/*.html`.

> Забележка: В BMAD чеклиста първоначално са примерни `*.excalidraw` файлове. В този проект **каноничният визуален артефакт за wireframes са HTML прототипите** в `docs/ux/wireframes/`.

| SCR ID        | Екран                         | Основен route / контекст     | HTML wireframe(и) |
|--------------|------------------------------|------------------------------|-------------------|
| SCR-HOME     | Home / Landing               | `/`                          | `docs/ux/wireframes/Home-Landing/home.html` |
| SCR-WIKI-LST | Wiki List                    | `/wiki`                      | `docs/ux/wireframes/WikiScreens/wiki-list.html` |
| SCR-WIKI-ART | Wiki Article                 | `/wiki/[slug]`               | `docs/ux/wireframes/WikiScreens/wiki-article.html` |
| SCR-LOGIN    | Login                        | `/auth/login`                | `docs/ux/wireframes/AuthenticationScreens/login.html` |
| SCR-REGISTER | Register                     | `/auth/register`             | `docs/ux/wireframes/AuthenticationScreens/register.html` |
| SCR-FORGOT   | Forgot Password (request)    | `/auth/forgot-password`      | `docs/ux/wireframes/AuthenticationScreens/forgot-password.html` |
| SCR-RESET    | Reset Password (link)        | `/auth/reset-password`       | `docs/ux/wireframes/AuthenticationScreens/reset-password.html` |
| SCR-ACCOUNT  | Account / Profile            | `/account`                   | `docs/ux/wireframes/AuthenticationScreens/account-profile.html`, `docs/ux/wireframes/AuthenticationScreens/account-deleted.html` |
| SCR-SBX-UI   | Sandbox UI (Practical UI)    | `/practice/ui`               | `docs/ux/wireframes/Sandbox/*.html` (множество страници за отделните UI групи) |
| SCR-SBX-API  | Training API (Swagger UI)    | `/practice/api`              | `docs/ux/wireframes/Sandbox/sandbox-training-api.html` |
| SCR-ADMIN-DB | Admin Dashboard              | `/admin`                     | `docs/ux/wireframes/AdminScreens/admin-dashboard.html` |
| SCR-ADMIN-WK | Admin Wiki Management        | `/admin/wiki`                | `docs/ux/wireframes/AdminScreens/admin-wiki.html` |
| SCR-ADMIN-WE | Admin Wiki Edit/Create       | `/admin/wiki/new`, `/admin/wiki/[id]/edit` | `docs/ux/wireframes/AdminScreens/admin-wiki-create.html`, `admin-wiki-edit.html` |
| SCR-ADMIN-WV | Admin Wiki Versions/History  | `/admin/wiki/[id]/versions`  | `docs/ux/wireframes/AdminScreens/admin-wiki-versions.html` |
| SCR-ADMIN-US | Admin Users                  | `/admin/users`               | `docs/ux/wireframes/AdminScreens/admin-users.html` |
| SCR-ADMIN-MT | Admin Metrics Overview       | `/admin/metrics`             | `docs/ux/wireframes/AdminScreens/admin-metrics.html` |
| SCR-ABOUT    | About / За платформата       | `/about`                     | `docs/ux/wireframes/Others/about.html` |
| SCR-PRIVACY  | Privacy & GDPR               | `/privacy-gdpr`              | `docs/ux/wireframes/Others/privacy-gdpr.html` |
| SCR-CONTACT  | Contact                      | `/contact`                   | `docs/ux/wireframes/Others/contact.html` |
| (LEG-TERMS)  | Terms of Use                 | `/terms-of-use`              | `docs/ux/wireframes/Others/terms-of-use.html` |

Допълнителни бележки:

- Детайлното поведение на всяка страница (полета, състояния, micro-flows) е описано в `docs/ux/qa4free-ux-design.md`.
- HTML wireframes използват Tailwind CSS и споделен layout (`index.html`, `layout.js`, `sandbox-nav.js`), което ги прави **по-близо до реалната имплементация**, но те остават прототипен артефакт за BMAD Фаза 2.

---

## 3. Sandbox UI – разбивка по UX страници

Sandbox UI (`SCR-SBX-UI`) е реализиран като множество специализирани wireframe страници за различни групи UI елементи.

Примери за mapping (неизчерпателно изброяване):

- Text inputs: `docs/ux/wireframes/Sandbox/sandbox-textbox.html`
- Checkboxes и radio бутони: `docs/ux/wireframes/Sandbox/sandbox-checkbox-radio.html`
- Buttons: `docs/ux/wireframes/Sandbox/sandbox-buttons.html`
- Links / Broken links / Images: `docs/ux/wireframes/Sandbox/sandbox-links.html`
- Modal dialogs: `docs/ux/wireframes/Sandbox/sandbox-modals.html`
- Frames / Nested frames: `docs/ux/wireframes/Sandbox/sandbox-frames.html`, `sandbox-nested-frames.html`
- Accordion, Tabs, Menu: `docs/ux/wireframes/Sandbox/sandbox-accordion.html`, `sandbox-tabs.html`, `sandbox-menu.html`
- Draggable / Droppable / Sortable / Selectable / Resizable: съответните `sandbox-*.html` файлове в папка `Sandbox/`
- Complex Form (Registration): `docs/ux/wireframes/Sandbox/sandbox-complex-form.html`
- Table CRUD & Pagination: `docs/ux/wireframes/Sandbox/sandbox-table-crud.html`
- Training API: `docs/ux/wireframes/Sandbox/sandbox-training-api.html`

Точният списък от файлове в `Sandbox/` служи като **каталог на упражненията за UI автоматизация**, стъпващ върху описанията в `docs/ux/qa4free-ux-design.md` §5.

---

## 4. Потоци (FLOW-*) и визуални диаграми

Този раздел свързва ключовите потоци (FLOW-*) от `docs/ux/flows/qa4free-user-flows.md` с наличните UX артефакти.

> Забележка: В BMAD чеклиста визуалните flow диаграми (`docs/ux/flows/*.excalidraw`) са отбелязани като **"по избор"**. В момента проектът използва **текстовия документ** като основен източник. Този раздел въвежда място, където по-късно могат да се добавят и визуални диаграми.

| FLOW ID                     | Сценарий                                     | Текстово описание                         | Визуална диаграма |
|----------------------------|----------------------------------------------|-------------------------------------------|-------------------|
| FLOW-AUTH-LOGIN-TO-WIKI    | Login → Wiki List                            | `docs/ux/flows/qa4free-user-flows.md` §2  | _(по избор)_      |
| FLOW-AUTH-LOGIN-TO-SBX-UI  | Header → Sandbox UI                          | `docs/ux/flows/qa4free-user-flows.md` §2  | _(по избор)_      |
| FLOW-AUTH-FORGOT-RESET     | Forgot password → Reset password             | `docs/ux/flows/qa4free-user-flows.md` §2  | _(по избор)_      |
| FLOW-WIKI-BROWSE           | Wiki List → Wiki Article                     | `docs/ux/flows/qa4free-user-flows.md` §3  | _(по избор)_      |
| FLOW-WIKI-NOT-FOUND        | Invalid slug → 404/Not found                 | `docs/ux/flows/qa4free-user-flows.md` §3  | _(по избор)_      |
| FLOW-SBX-UI-BROWSE-CATEGORIES | Навигация в Sandbox UI между категории   | `docs/ux/flows/qa4free-user-flows.md` §4  | _(по избор)_      |
| FLOW-SBX-UI-COMPLEX-REGISTRATION | Complex Registration Form              | `docs/ux/flows/qa4free-user-flows.md` §4  | _(по избор)_      |
| FLOW-SBX-UI-TABLE-CRUD     | Table CRUD & Pagination                       | `docs/ux/flows/qa4free-user-flows.md` §4  | _(по избор)_      |
| FLOW-TRAINING-API-SWAGGER  | Отваряне и ползване на Training API (Swagger) | `docs/ux/flows/qa4free-user-flows.md` §4  | _(по избор)_      |
| FLOW-ADMIN-LOGIN-TO-DASHBOARD | Admin login → Admin Dashboard            | `docs/ux/flows/qa4free-user-flows.md` §5  | _(по избор)_      |
| FLOW-ADMIN-MANAGE-WIKI     | Управление на Wiki статии и версии           | `docs/ux/flows/qa4free-user-flows.md` §5  | _(по избор)_      |
| FLOW-ADMIN-MANAGE-USERS    | Активиране/деактивиране на потребители       | `docs/ux/flows/qa4free-user-flows.md` §5  | _(по избор)_      |

Ако в бъдеще бъдат създадени визуални flow диаграми (например в Excalidraw формат), те могат да бъдат добавени в отделна колона, например:

- `docs/ux/flows/FLOW-AUTH-LOGIN-TO-WIKI.excalidraw`
- `docs/ux/flows/FLOW-SBX-UI-BROWSE-CATEGORIES.excalidraw`

---

## 5. Как да се използва този документ в BMAD контекста

- **UX Designer / Analyst** използват този файл като:
  - индекс на екрани и wireframes при ревюта и планиране на подобрения;
  - място за добавяне на нови SCR/FLOW записи, когато MVP бъде разширяван.
- **Developers** използват таблиците, за да намерят бързо съответния HTML wireframe за даден екран или сценарий.
- **QA / Test Designers** стъпват на FLOW таблицата за дизайн на end-to-end тестове и smoke сценарии.
- **Delivery / BMAD гледна точка:** този документ показва, че Фаза 2 – Прототипи има:
  - ясно дефинирани UX екрани (SCR-*),
  - реални визуални wireframes (HTML) за основните екрани,
  - текстово описани ключови потоци (FLOW-*), с място за бъдещи визуални диаграми.

Така BMAD изискванията за UX прототипи в `docs/architecture/development-workflow.md` са проследими и централизирани в един артефакт.
