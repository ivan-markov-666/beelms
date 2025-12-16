# Admin Wiki API – примерни заявки

Този документ съдържа примерни `curl` заявки и JSON payload-и за основните Admin Wiki endpoint-и.

Всички URL-и са спрямо базов BE URL за dev среда:

- Base URL: `http://localhost:3000/api`
- Всички admin endpoint-и изискват Bearer JWT токен с `role = 'admin'`.

## 1. Списък със статии – GET /admin/wiki/articles

Връща списък от `AdminWikiArticleListItem` (id, slug, title, status, updatedAt), който FE `/admin/wiki` използва за табличния изглед.

```bash
curl -X GET \
  "http://localhost:3000/api/admin/wiki/articles" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Accept: application/json"
```

Примерен отговор (съкратен):

```json
[
  {
    "id": "c1b7d4b4-...",
    "slug": "getting-started",
    "title": "Getting started with the platform",
    "status": "active",
    "updatedAt": "2025-01-10T10:15:00.000Z"
  },
  {
    "id": "f9a2e901-...",
    "slug": "manual-testing-intro",
    "title": "Въведение в Manual Testing",
    "status": "draft",
    "updatedAt": "2025-01-08T09:00:00.000Z"
  }
]
```

Поддържани query параметри:

- `q` – търсене по заглавие/slug
- `lang` – филтър по език, напр. `bg`, `en`

```bash
curl -X GET \
  "http://localhost:3000/api/admin/wiki/articles?q=Manual&lang=bg" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## 2. Създаване на статия – POST /admin/wiki/articles

Използва се от страницата `/admin/wiki/create`. Създава един запис в `wiki_articles` и по една версия в `wiki_article_versions` за всеки език.

### Примерна заявка

```bash
curl -X POST \
  "http://localhost:3000/api/admin/wiki/articles" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "manual-testing-intro",
    "status": "draft",
    "contents": [
      {
        "language": "bg",
        "title": "Въведение в Manual Testing",
        "content": "Manual testing е процесът на ръчна проверка на софтуер..."
      },
      {
        "language": "en",
        "title": "Introduction to Manual Testing",
        "content": "Manual testing is the process of manually verifying software..."
      }
    ]
  }'
```

### Примерен успешен отговор

```json
{
  "id": "c1b7d4b4-...",
  "slug": "manual-testing-intro",
  "language": "bg",
  "title": "Въведение в Manual Testing",
  "content": "Manual testing е процесът на ръчна проверка на софтуер...",
  "status": "draft",
  "updatedAt": "2025-01-10T10:15:00.000Z"
}
```

Забележки:

- `slug` трябва да е уникален – при дубликат BE връща `400 Bad Request`.
- Първият елемент в `contents[]` се използва като „основен“ за върнатия detail.

---

## 3. Редакция на съдържание – PUT /admin/wiki/articles/{id}

Използва се от страницата `/admin/wiki/[slug]/edit` при запис на промените.

```bash
curl -X PUT \
  "http://localhost:3000/api/admin/wiki/articles/<ARTICLE_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "bg",
    "title": "Обновено заглавие BG",
    "content": "Обновено съдържание на статията",
    "status": "active"
  }'
```

- При успех BE:
  - създава **нова версия** в `wiki_article_versions` за този език с увеличен `versionNumber`;
  - актуализира `status` в `wiki_articles`;
  - връща актуален `WikiArticleDetailDto` (с последната версия).

---

## 4. Промяна на статус – PATCH /admin/wiki/articles/{id}/status

Този endpoint се ползва от списъка `/admin/wiki` за бутоните **Activate/Deactivate**.

```bash
curl -X PATCH \
  "http://localhost:3000/api/admin/wiki/articles/<ARTICLE_ID>/status" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "inactive" }'
```

- Успех: `204 No Content` (само колоната `status` се променя).
- Грешки:
  - `400` – невалиден статус;
  - `404` – липсваща статия.

---

## 5. История на версиите – GET /admin/wiki/articles/{id}/versions

Дава списък от `AdminWikiArticleVersion` за дадена статия.

```bash
curl -X GET \
  "http://localhost:3000/api/admin/wiki/articles/<ARTICLE_ID>/versions" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Accept: application/json"
```

Примерен отговор:

```json
[
  {
    "id": "v1",
    "version": 1,
    "language": "bg",
    "title": "Първа версия",
    "createdAt": "2025-01-01T09:00:00.000Z",
    "createdBy": "admin-id"
  },
  {
    "id": "v2",
    "version": 2,
    "language": "bg",
    "title": "Втора версия",
    "createdAt": "2025-01-05T11:30:00.000Z",
    "createdBy": "admin-id"
  }
]
```

Този списък се използва от таблицата с версии в `/admin/wiki/[slug]/edit`.

---

## 6. Rollback към версия – POST /admin/wiki/articles/{id}/versions/{versionId}/restore

Създава **нова версия**, базирана на избраната историческа версия.

```bash
curl -X POST \
  "http://localhost:3000/api/admin/wiki/articles/<ARTICLE_ID>/versions/<VERSION_ID>/restore" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json"
```

Примерен отговор (съкратен):

```json
{
  "id": "<ARTICLE_ID>",
  "slug": "manual-testing-intro",
  "language": "bg",
  "title": "Rollback title",
  "content": "Rollback content",
  "status": "active",
  "updatedAt": "2025-01-10T12:00:00.000Z"
}
```

- В БД се добавя нов запис в `wiki_article_versions` с `version_number = max + 1` за съответния език.
- Съдържанието (title/content) идва от избраната историческа версия.

---

## 7. Изображения към статия – /admin/wiki/articles/{id}/media

Тези endpoint-и се използват от Admin Wiki UI (напр. `/admin/wiki/create`, `/admin/wiki/[slug]/edit`) за качване и управление на изображения, които после се вграждат в markdown съдържанието.

- Файловете се съхраняват в локална файлова система под `<MEDIA_ROOT>/wiki/<article_slug>/<filename>`.
- Публичният URL, който се връща в `url`, е директно използваем в markdown:
  - например: `![alt текст](/wiki/media/manual-testing-intro/diagram-1.png)`.

### 7.1. Списък с изображения за статия – GET /admin/wiki/articles/{id}/media

Връща масив от `WikiMediaItem { filename, url }` за дадена статия.

Примерна заявка (замени `<ARTICLE_ID>` и `<ACCESS_TOKEN>`):

```bash
curl -X GET \
  "http://localhost:3000/api/admin/wiki/articles/<ARTICLE_ID>/media" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Accept: application/json"
```

Примерен отговор:

```json
[
  {
    "filename": "diagram-1-1733480000000.png",
    "url": "/wiki/media/manual-testing-intro/diagram-1-1733480000000.png"
  }
]
```

### 7.2. Качване на ново изображение – POST /admin/wiki/articles/{id}/media

Качва един файл (`multipart/form-data`, поле `file`).

Примерна заявка:

```bash
curl -X POST \
  "http://localhost:3000/api/admin/wiki/articles/<ARTICLE_ID>/media" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Accept: application/json" \
  -F "file=@/пълен/път/до/image.png"
```

Примерен 201 отговор:

```json
{
  "filename": "image-1733480000000.png",
  "url": "/wiki/media/manual-testing-intro/image-1733480000000.png"
}
```

Бележки:

- Поддържат се само файлове с `mimetype`, започващ с `image/`.
- Файлове по-големи от ~5MB се отхвърлят с `400`.
- Името на файла се нормализира (lowercase, safe символи) и се добавя timestamp, за да се избегнат колизии.

### 7.3. Изтриване на изображение – DELETE /admin/wiki/articles/{id}/media/{filename}

Трие вече качено изображение за дадена статия.

Примерна заявка:

```bash
curl -X DELETE \
  "http://localhost:3000/api/admin/wiki/articles/<ARTICLE_ID>/media/<FILENAME>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

- Успех: `204 No Content`.
- Грешки:
  - `404` – статията или файлът не са намерени.

---

Този документ е синхронизиран с `docs/architecture/openapi.yaml` и с реалната NestJS имплементация в `be/src/wiki`. При промяна на API-то първо трябва да се актуализира OpenAPI, а после и примерите тук.
