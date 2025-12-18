# beelms – Модел на базата данни (ER диаграма)

_Роля: Architect. Фаза: BMAD Solutioning. Концептуален модел на данните (ER) за базата._

Този документ описва концептуалния модел на данните за beelms (ER диаграма + текстови описания), базиран на:
- Product Brief – `docs/product/product-brief.md`
- PRD – `docs/product/prd.md`
- MVP feature list – `docs/architecture/mvp-feature-list.md`
- System architecture – `docs/architecture/beelms-core-architecture.md`
- OpenAPI спецификация – `docs/architecture/openapi.yaml`

Целта е да даде ясен модел за реализацията на базата данни (PostgreSQL) преди детайлни migration-и и ORM модели.

## 1. Основни ентитети

- **User** – регистриран потребител на платформата.
- **WikiArticle** – логическа статия в Wiki (по един slug, независимо от езиците и версиите).
- **WikiArticleVersion** – конкретна езикова версия на статия в определен момент.
- **GdprRequest** – заявка свързана с права по GDPR (изтриване, експорт и т.н.).
- **Course** – курс (title/description/language/status).
- **CourseModuleItem** – елемент в програмата на курс (wiki/task/quiz) с ред.
- **CourseEnrollment** – записване на потребител в курс + базов статус/прогрес.
- **CourseTask** – задача, която е част от курс.
- **CourseTaskCompletion** – маркиране на задача като изпълнена от даден потребител.
- **Quiz** – quiz (MCQ) към курс.
- **QuizAttempt** – опит (attempt) за quiz + резултат.

Този базов модел може да бъде разширяван по-късно (напр. с по-детайлни логове за метрики, нотификации и др.), без да нарушава текущия MVP.

## 2. ER диаграма (Mermaid)

```mermaid
erDiagram
    USER ||--o{ GDPR_REQUEST : "има заявки"
    USER ||--o{ COURSE_ENROLLMENT : "има enrollments"
    COURSE ||--o{ COURSE_ENROLLMENT : "има записани потребители"
    COURSE ||--o{ COURSE_MODULE_ITEM : "има програма"
    WIKI_ARTICLE ||--o{ COURSE_MODULE_ITEM : "използва се в курс"
    COURSE ||--o{ COURSE_TASK : "има задачи"
    COURSE_TASK ||--o{ COURSE_TASK_COMPLETION : "има completions"
    USER ||--o{ COURSE_TASK_COMPLETION : "completes"
    COURSE ||--o{ QUIZ : "има quizzes"
    QUIZ ||--o{ QUIZ_ATTEMPT : "има attempts"
    USER ||--o{ QUIZ_ATTEMPT : "attempts"

    USER {
        uuid id PK
        string email
        string password_hash
        string role        "user | admin | teacher | author | monitoring"
        string status      "active | inactive | deleted"
        timestamp created_at
        timestamp updated_at
        timestamp last_login_at
    }

    WIKI_ARTICLE {
        uuid id PK
        string slug           "уникален идентификатор в URL"
        string status         "draft | active | inactive"
        string visibility     "public | course_only"
        string tags           "array of English tags"
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

    COURSE {
        uuid id PK
        string title
        string description
        string language      "напр. bg, en"
        string status        "draft | active | inactive"
        boolean is_paid      "free vs paid"
        timestamp created_at
        timestamp updated_at
    }

    COURSE_ENROLLMENT {
        uuid id PK
        uuid course_id FK
        uuid user_id FK
        string status        "not_started | in_progress | completed"
        timestamp enrolled_at
        timestamp updated_at
    }

    COURSE_MODULE_ITEM {
        uuid id PK
        uuid course_id FK
        string item_type     "wiki | task | quiz"
        int order
        uuid wiki_article_id FK
        uuid task_id FK
        uuid quiz_id FK
    }

    COURSE_TASK {
        uuid id PK
        uuid course_id FK
        string title
        text description
        int order
    }

    COURSE_TASK_COMPLETION {
        uuid id PK
        uuid course_id FK
        uuid task_id FK
        uuid user_id FK
        timestamp completed_at
    }

    QUIZ {
        uuid id PK
        uuid course_id FK
        string title
        int passing_score
        json questions_json
        timestamp created_at
        timestamp updated_at
    }

    QUIZ_ATTEMPT {
        uuid id PK
        uuid quiz_id FK
        uuid course_id FK
        uuid user_id FK
        json answers_json
        int score
        int max_score
        boolean passed
        timestamp submitted_at
    }
```

## 3. Описания на ентитетите

### 3.1. User

Представя регистриран потребител на платформата.

- Един user може да има много `GdprRequest` записи.
- Потребителите с `role = 'admin'` имат достъп до admin панела и управлението на Wiki/потребители.
- Допълнителните роли (`teacher`, `author`, `monitoring`) се използват за ограничаване/разделяне на достъпа до създаване на съдържание и до агрегирани метрики (детайли в Product Brief/PRD).

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

### 3.4. Course и CourseModuleItem

- `Course` моделира course catalog + Course Detail.
- `CourseModuleItem` описва програмата на курса (модули) и позволява курсът да комбинира:
  - `wiki` елементи (връзка към Wiki съдържание);
  - `task` елементи (практически задачи);
  - `quiz` елементи (оценяване).

### 3.5. CourseEnrollment (My Courses)

- `CourseEnrollment` пази записването на потребител в курс и базов статус на прогрес.
- За MVP стойности като `progressPercent` могат да бъдат изчислявани динамично на база completions/attempts.

### 3.6. CourseTask и CourseTaskCompletion

- `CourseTask` пази описанието на задачата.
- `CourseTaskCompletion` пази маркирането на задача като изпълнена от конкретен потребител.

### 3.7. Quiz и QuizAttempt

- `Quiz` пази quiz дефиниция (MVP: въпроси/опции могат да се съхраняват като JSON).
- `QuizAttempt` пази submit-натите отговори и резултата (score/pass) за конкретен потребител.

## 4. Забележки за имплементация

- Този модел е **концептуален** и може да бъде адаптиран при реалното проектиране на схемата (напр. допълнителни индекси, помощни таблици, audit логове).
- Метриките за MVP могат да се изчисляват динамично върху `User` и агрегирани логове за заявки.
