---
lesson: system-overview
title: "Системен обзор"
objective: "Да даде бърз преглед на архитектурата и основните компоненти."
duration: "8 мин"
---

## 1. Архитектура

BeeLMS има три основни слоя:

1. **Frontend (fe/)** – Next.js 15 приложение (App Router). Съдържа админ UI, публичния каталог,
   Wiki и курсовете. Стартира се на `http://localhost:3001` в dev.
2. **Backend (be/)** – NestJS API на `http://localhost:3000/api`. Носи authentication, courses,
   wiki, admin settings и OAuth интеграции.
3. **PostgreSQL** – `instance_config`, `users`, `courses`, `wiki_articles` и т.н. По подразбиране
   `beelms`/`beelms`/`beelms` (виж `docker-compose.yml`).

```
Next.js FE  <--->  NestJS API  <--->  PostgreSQL
```

### Основни директории
- `fe/src/app` – страници и компоненти.
- `be/src/auth` – OAuth услуги, JWT guard, admin guard.
- `be/src/settings` – InstanceConfig, admin controller, миграции.
- `docs/` – продуктови и технически спецификации + този курс.

## 2. Dev setup (кратко)

1. **База**: `docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db`
2. **Backend**: `npm --prefix be install` (първия път), после `npm --prefix be run start:dev`
3. **Frontend**: `npm --prefix fe install`, `npm --prefix fe run dev -- -p 3001`

> Подробности: виж README секция „Dev setup“.

## 3. InstanceConfig и SettingsService

- Таблицата `instance_config` държи глобални настройки (branding, features, languages,
  social_credentials).
- `SettingsService` осигурява `getOrCreateInstanceConfig()`, merge логика и API за admin panel.
- Новият JSONB `social_credentials` пази OAuth client ID/secret/redirect per provider.

## 4. Пътища за документация

- Техническо описание: `docs/architecture` (OpenAPI, диаграми).
- Продуктови stories: `docs/stories/` (Story AUTH-5, WIKI-POST-1 и т.н.).
- Този курс: `docs/courses/system-intro/*` – използвай като living documentation.

## 5. Следващ урок

Продължи с `02-instance-config.md`, за да видиш подробно как админ настройките пишат в DB и
как се обработват PATCH заявките.
