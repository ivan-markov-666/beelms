# beelms – Модел на базата данни (ER диаграма)

_Роля: Architect. Фаза: BMAD Solutioning. Концептуален модел на данните (ER) за базата._

Този документ описва концептуалния модел на данните за beelms (ER диаграма + текстови описания), базиран на:
- Product Brief – `docs/product/product-brief.md`
- PRD – `docs/product/prd.md`
- MVP feature list – `docs/architecture/mvp-feature-list.md`
- System architecture – `docs/architecture/system-architecture.md`
- OpenAPI спецификация – `docs/architecture/openapi.yaml`

Целта е да даде ясен модел за реализацията на базата данни (PostgreSQL) преди детайлни migration-и и ORM модели.

## 1. Основни ентитети

- **User** – регистриран потребител на платформата.
- **WikiArticle** – логическа статия в Wiki (по един slug, независимо от езиците и версиите).
- **WikiArticleVersion** – конкретна езикова версия на статия в определен момент.
- **GdprRequest** – заявка свързана с права по GDPR (изтриване, експорт и т.н.).

Този базов модел може да бъде разширяван по-късно (напр. с по-детайлни логове за метрики, нотификации и др.), без да нарушава текущия MVP.

## 2. ER диаграма (Mermaid)

```mermaid
erDiagram
    USER ||--o{ GDPR_REQUEST : "има заявки"

    USER {
        uuid id PK
        string email
        string password_hash
        string role        "user | admin"
        string status      "active | inactive | deleted"
        timestamp created_at
        timestamp updated_at
        timestamp last_login_at
    }

    WIKI_ARTICLE ||--o{ WIKI_ARTICLE_VERSION : "има версии"

    WIKI_ARTICLE {
        uuid id PK
        string slug           "уникален идентификатор в URL"
        string status         "draft | active | inactive"
        timestamp created_at
        timestamp updated_at
    }

    WIKI_ARTICLE_VERSION {
        uuid id PK
        uuid article_id FK
        string language       "напр. bg, en"
        string title
        text content
        int version_number
        uuid created_by_user_id FK
        text change_summary
        boolean is_published
        timestamp created_at
    }

    GDPR_REQUEST {
        uuid id PK
        uuid user_id FK
        string type          "erasure | export | access | rectification"
        string status        "pending | processing | completed | rejected"
        timestamp requested_at
        timestamp processed_at
    }
```

## 3. Описания на ентитетите

### 3.1. User

Представя регистриран потребител на платформата.

- Един user може да има много `GdprRequest` записи.
- Потребителите с `role = 'admin'` имат достъп до admin панела и управлението на Wiki/потребители.

### 3.2. WikiArticle и WikiArticleVersion

Моделът разделя логическата статия от нейните езикови и исторически версии.

- `WikiArticle.slug` се използва в публичните URL и в API (`/api/wiki/articles/{slug}`).
- `WikiArticle.status` указва състоянието на статията: `draft` (чернова, не се вижда публично), `active` (показва се в публичната Wiki) или `inactive` (скрита/деактивирана, но запазена в системата).
- Всяка статия има една или повече версии (`WikiArticleVersion`).
- Версиите са по език (`language`) и номер на версия (`version_number`).
- Admin панелът работи основно с версиите (създаване, редакция, rollback).

#### 3.2.1. Admin Wiki потоци върху модела

- **Списък /admin/wiki**
  - използва `WikiArticle` + последната версия по `created_at` за избрания език, за да показва `title`, `status` и `updatedAt`.
- **Създаване на статия (/admin/wiki/create, POST /api/admin/wiki/articles)**
  - създава един запис в `WIKI_ARTICLE` (slug + status);
  - за всеки избран език създава по един запис в `WIKI_ARTICLE_VERSION` с `version_number = 1`;
  - `is_published = true` само когато `status = 'active'`.
- **Редакция на съдържание (/admin/wiki/[slug]/edit, PUT /api/admin/wiki/articles/{id})**
  - не променя съществуващите записи, а добавя **нова версия** в `WIKI_ARTICLE_VERSION` със `version_number = max+1` за дадения език;
  - актуализира `status` на `WIKI_ARTICLE` (draft/active/inactive) и флага `is_published` на новата версия.
- **Промяна на статус само (PATCH /api/admin/wiki/articles/{id}/status)**
  - актуализира само колоната `status` в `WIKI_ARTICLE` без да създава нова версия.
- **История и rollback**
  - `GET /api/admin/wiki/articles/{id}/versions` чете всички редове от `WIKI_ARTICLE_VERSION` за даден `article_id`;
  - `POST /api/admin/wiki/articles/{id}/versions/{versionId}/restore` създава **нова** версия, базирана на съдържанието на избраната историческа версия ("rollback"), с увеличен `version_number`.

### 3.3. GdprRequest

- Всеки запис представлява заявка от потребител за право по GDPR.
- Полетата `type` и `status` се използват за обработка и одит.
- При успешна обработка на заявка за изтриване данните на потребителя могат да бъдат анонимизирани/изтрити според архитектурните решения.

## 4. Забележки за имплементация

- Този модел е **концептуален** и може да бъде адаптиран при реалното проектиране на схемата (напр. допълнителни индекси, помощни таблици, audit логове).
- Метриките за MVP могат да се изчисляват динамично върху `User` и агрегирани логове за заявки.
