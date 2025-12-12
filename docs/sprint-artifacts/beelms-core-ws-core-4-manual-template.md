# beelms core – WS-CORE-4 Manual Template (Prototype, Iteration 1)

_Роля: Tech Lead / DX. Цел: ръчно повторяем процес за създаване на нов beelms core проект,
стъпващ на текущото `qa-4-free` repo._

Този документ описва **ръчен (manual) scaffold процес**, който по‑късно ще бъде автоматизиран от
`npx create-beelms-app`. Той е част от Итерация 1 на WS-CORE-4 и ползва съществуващите:

- NestJS backend – папка `be/`
- Next.js frontend – папка `fe/`
- Docker среда и seed-ове – описани в `be/README.md` и свързаните Docker файлове

> Забележка: тук не променяме съществуващия код, а описваме как да се използва като **template**.

---

## 1. Примерен сценарий – създаване на нов проект `my-lms`

### 1.1. Подготовка на работната директория

1. Увери се, че имаш локален clone на `qa-4-free` и че `be`/`fe` се билдват и тестовете минават.
2. В директорията, в която искаш да държиш новия проект, създай папка:
   - `my-lms/`

Структурата в края на процеса ще изглежда логически така:

```text
my-lms/
  api/           # NestJS backend, базиран на be/ от qa-4-free
  web/           # (по избор) Next.js frontend, базиран на fe/ от qa-4-free
  docker/        # docker-compose и свързани конфигурации
  env/           # .env.example файлове за различни среди
  README.md      # инструкции за стартиране
```

### 1.2. Backend scaffold (api/)

Идеята е да използваме текущия `be/` като **изходен шаблон** за `api/` в новия проект.
Практически стъпки (ръчно):

1. Копирай папката `be/` от `qa-4-free` в `my-lms/api/`.
2. В `my-lms/api/`:
   - актуализирай `package.json` (name, description), ако е нужно;
   - провери `.env` конфигурациите и връзката към DB според новата инстанция;
   - при нужда почисти QA4Free‑специфични модули, но **запазвай core модулите** (Auth, Wiki, Admin).
3. Увери се, че командите за билд/тест работят самостоятелно в `my-lms/api/`.

На този етап целта е **да имаме работещ NestJS backend**, съвместим с архитектурата на beelms core,
дори да съдържа повече функционалност от чисто минималния scope.

### 1.3. Frontend scaffold (web/) – по избор

Ако искаш full‑stack template:

1. Копирай папката `fe/` от `qa-4-free` в `my-lms/web/`.
2. В `my-lms/web/`:
   - актуализирай `package.json` (name, description), ако е нужно;
   - провери `NEXT_PUBLIC_API_BASE_URL` да сочи към новия backend (`my-lms/api` stack);
   - при нужда премахни QA4Free‑специфични страници, които няма да ползваш като част от core template.

> Ако искаш само backend‑only вариант (`api-only` template), можеш да пропуснеш тази стъпка.

### 1.4. Docker и среди

1. В новия проект създай папка `docker/` и копирай базовите Docker Compose файлове от `qa-4-free`
   (или техен подмножество), които стартират:
   - API (NestJS);
   - PostgreSQL;
   - по избор web (Next.js).
2. В `env/` добави примерни `.env.example` файлове за `api` и `web`, базирани на текущите `.env`
   от `qa-4-free`, адаптирани за новия проект (напр. различни DB имена, секрети и т.н.).
3. Добави кратки инструкции в `my-lms/README.md`:

```md
## Quick start (Docker)

- Копирай `.env.example` файловете в реални `.env` и обнови стойностите.
- Стартирай:

```bash
cd docker
docker compose up -d
```

- Backend API: http://localhost:3000/api
- Frontend Web (ако е включен): http://localhost:3001
```

---

## 2. Как този процес се връзва с WS-CORE-1..3

При ръчно създаден `my-lms/` проект по горните стъпки:

- **WS-CORE-1 (Wiki)**:
  - API: `/api/wiki/articles`, `/api/wiki/articles/:slug` са налични от `api/` (копираният be/);
  - FE: `/wiki`, `/wiki/[slug]` са налични от `web/` (копираният fe/), ако използваш full‑stack
    template.
- **WS-CORE-2 (Auth + Wiki)**:
  - API: `/api/auth/register`, `/api/auth/login`, `/api/users/me`;
  - FE: `/auth/login`, `/auth/register`, header login state.
- **WS-CORE-3 (Admin)**:
  - API: `/api/admin/metrics/overview`, `/api/admin/users`, `/api/admin/wiki/articles` и др.;
  - FE: `/admin`, `/admin/wiki`, `/admin/users`, `/admin/metrics`, `/admin/activity`.

С други думи, ръчният scaffold създава проект, в който WS-CORE-1..3 са **налични по дизайн**, при
условие че seed‑овете и env настройките са коректни.

---

## 3. Какво ще автоматизира бъдещото CLI

Когато `npx create-beelms-app` бъде реализирано, то ще автоматизира горните ръчни стъпки:

- ще създава папката `my-lms/` с желаната структура;
- ще копира/генерира нужните файлове за `api/`, `web/`, `docker/`, `env/`;
- ще попълва базови конфигурации спрямо избран template (`api-only` или `full-stack`).

Текущият документ служи като **канонично описание** на процеса за Итерация 1 – това, което CLI ще
трябва да репликира. Докато CLI не е налично, този документ позволява ръчно, но повторяемо
създаване на нов beelms core проект.
