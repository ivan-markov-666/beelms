# Гайдлайн за многоезично съдържание (i18n)

Този документ описва как ще предоставяме идентично съдържание на различни езици както във Front-End (React) така и в Back-End (NestJS) + база данни.

## 1. Поддържани езици
| Код | Име | Роля |
|-----|------|------|
| `bg` | Български | Default / fallback |
| `en` | English   | Първи вторичен |
| `es` | Spanish   | (roadmap) |

## 2. Обхват
1. **UI низове** (менюта, бутони, валидации)
2. **Курс съдържание** (заглавия, описания, markdown уроци, тестове)
3. **Имейл шаблони**
4. **Системни съобщения от API** (ValidationPipe, Exceptions)

## 3. Технологичен стек
- **Front-End (React):** [`react-i18next`](https://react.i18next.com/) + `i18next-browser-languagedetector`
- **Back-End (NestJS):** [`nestjs-i18n`](https://github.com/toonvanstrijp/nestjs-i18n) + JSON файлове в `apps/api/src/i18n`
- **DB:** Нови таблици/колони за преводи. Пример: `courses` + `course_translations` (course_id, lang, title, description, content_md)

## 4. Архитектурни решения
1. **Fallback logic**
   - FE: `i18next` fallbackLng=`bg`
   - BE: `Accept-Language` header → cookie → default `bg`
2. **Namespace орг.**
   - `common`, `auth`, `dashboard`, `course`, ... за по-малки JSON
3. **Dynamic loading** на JSON чрез `import()` за по-малки bundle-и.
4. **CI check** за липсващи ключове: `i18next-scanner` + GitHub Action.
5. **Versioning**: преводните JSON файлове се версионират заедно с кода; миграциите добавят празни редове.

## 5. Промени в схемата на данните
```mermaid
erDiagram
    Course ||--o{ CourseTranslation : has
    Course {
        string id PK
        string slug
        string default_lang "bg"
    }
    CourseTranslation {
        int id PK
        string course_id FK
        string lang (index)
        string title
        text description
        text content_md
    }
```

## 6. API контракти
- Всички GET крайни точки за курсове приемат опционален `lang` query или `Accept-Language` header.
- Ако липсва превод → връщаме default_lang версия + `"Content-Language: bg"` header.
- POST/PUT за преводи изискват `lang` поле.

## 7. FE имплементация стъпки
1. Създай `src/i18n/index.ts` с конфигурация.
2. Изнеси UI низове в `public/locales/<lang>/<namespace>.json`.
3. Добави LanguageSwitcher компонент.
4. Wrap `App` в `<I18nextProvider>`.

## 8. Roadmap задачи (Jira)
- **FE-45**: Настройка `react-i18next`
- **BE-32**: `nestjs-i18n` middleware
- **DB-12**: Миграция за `course_translations`
- **OPS-9**: CI check за липсващи ключове

## 9. Добри практики
- Използвай `t('key', { defaultValue: '...' })` – пази контекст.
- Не включвай HTML в JSON ключовете (освен ако не е необходимо).
- Кратките ключове се групират по feature (`course.title`).
- Използвай [Crowdin] или Google Sheet за преводачи (post-MVP).

---
Последна редакция: {{date}}
