# Development Workflow за QA4Free (MVP)

Този документ описва на високо ниво процеса на разработка на QA4Free, базиран на
`idea/02.developmentProcess.md` и съобразен с BMAD артефактите.

## 1. Фази на разработка

### Фаза 1: Документация (1–2 седмици)

Цел: да има достатъчно яснота **какво** правим (продукт) и **как** ще го реализираме (архитектура).

Основни задачи:
- [ ] Системна архитектура – `docs/architecture/system-architecture.md`
- [ ] API документация (OpenAPI/Swagger спецификация за основните услуги) – файл `docs/architecture/openapi.yaml`
- [ ] Product Brief – `docs/product/product-brief.md`
- [ ] PRD – `docs/product/prd.md` (стъпва върху Product Brief, `docs/architecture/mvp-feature-list.md` и системната архитектура)
- [ ] MVP feature list по екрани/модули – `docs/architecture/mvp-feature-list.md`
- [ ] Модел на базата данни (ER диаграма + описания) – `docs/architecture/db-model.md`
- [ ] Технически изисквания / нефункционални изисквания (перфоманс, сигурност, GDPR и др.) – вече описани в `docs/product/product-brief.md` §6, `docs/product/prd.md` §5 и секциите за GDPR/сигурност/технологичен стек в `docs/architecture/system-architecture.md`

### Фаза 2: Прототипи (около 1 седмица)

Цел: да се валидират UX и основните потоци преди сериозна имплементация.

Основни задачи:
- [ ] Обобщаващ UX дизайн документ – `docs/ux/qa4free-ux-design.md` (описва основните екрани, навигацията, текстовите wireframes и плана за wireframes/flows/design system).
- [ ] (по избор) Визуални wireframes за основните екрани (Wiki, Login, Практическа среда UI/API, Admin).
  - файлове: `docs/ux/wireframes/*.excalidraw` (напр. `wiki-wireframes.excalidraw`, `auth-wireframes.excalidraw`, `practical-env-wireframes.excalidraw`, `admin-wireframes.excalidraw`)
- [ ] Описание на потребителските потоци (flows) за ключови сценарии.
  - (по избор) диаграми: `docs/ux/flows/*.excalidraw`
  - (задължително) текстово обобщение: `docs/ux/flows/qa4free-user-flows.md`
- [ ] Базова дизайн система (цветове, бутони, форми), съобразена с идеята за зелено/червено.
  - документ: `docs/ux/design-system.md`

### Фаза 3: Разработка на MVP (4–6 седмици)

Цел: да реализираме MVP функционалностите от `docs/architecture/mvp-feature-list.md`.
 
 Основни задачи:
 - [ ] Дефиниране и документиране на walking skeleton-и за MVP (вертикални slice-ове през FE+API+DB), започвайки с WS-1 – Guest → Wiki List → Wiki Article – `docs/delivery/walking-skeleton.md`
 - [ ] Разбиване на walking skeleton-ите в backlog (epics → user stories → tasks) и създаване/поддръжка на issues в tracker-а
 - [ ] Настройка на средата за разработка
  - локална среда (Docker Compose за всички услуги – frontend, backend, PostgreSQL, Redis и др.)
  - базова структура на репото (frontend + backend)
- [ ] Имплементация на ядрото
  - базови модули за автентикация (регистрация, вход, забравена парола)
  - Wiki модули (преглед на статии, езикови версии)
  - Практическа среда (UI демо + demo REST API)
- [ ] Интеграции
  - свързване на FE с BE (API gateway, REST)
  - интеграция със системата за изпращане на имейли
- [ ] Първоначално тестване
  - базови unit и integration тестове
  - ръчно тестване на ключовите UX потоци

### Фаза 4: Инфраструктура и стабилизиране (1–2 седмици)

Цел: MVP да може да се деплойне надеждно в продукционна среда.

 Основни задачи:
 - [ ] Настройка на VPS (Docker, reverse proxy, TLS)
   - деплой на всички компоненти (frontend, backend услуги, PostgreSQL, Redis, RabbitMQ и др.) като отделни Docker контейнери чрез Docker Compose върху една VPS машина
 - [ ] CI/CD пайплайн (build, тестове, деплой)
 - [ ] Test Plan за MVP – документ `docs/delivery/test-plan.md` (обхват, видове тестове, smoke/regression сценарии за основните потоци)
 - [ ] Release Plan за MVP – документ `docs/delivery/release-plan.md` (критерии за release, стъпки за деплой и rollback, версияция)
 - [ ] Мониторинг и логване (Winston, Prometheus/Grafana, Sentry)
 - [ ] Backup стратегия (бекапи на базата данни, периодичност, ретенция)

## 2. Свързани документи и артефакти

- `idea/02.developmentProcess.md` – първоначален (исторически) план за процеса.
- `docs/product/product-brief.md` – продуктова визия и MVP от бизнес гледна точка (Analyst/PM).
- `docs/product/prd.md` – продуктови изисквания за MVP (PM, BMAD PRD).
- `docs/architecture/system-architecture.md` – техническа архитектура и нефункционални изисквания (Architect).
- `docs/architecture/mvp-feature-list.md` – MVP по екрани/модули, мост между PRD и backlog (PM/Architect).
- `docs/architecture/db-model.md` – модел на базата данни (ER диаграма) (Architect).
- `docs/delivery/walking-skeleton.md` – walking skeleton-и за MVP (Delivery, Tech Lead/Architect).
- (в бъдеще) `docs/delivery/test-plan.md`, `docs/delivery/release-plan.md` – планове за тестване и издаване на софтуер.

## 3. Забележки

- Времевите рамки (седмици) са ориентировъчни и могат да се преразглеждат.
- Фазите могат леко да се припокриват (напр. прототипиране паралелно с част от документацията).
- Документът описва **high-level workflow**; детайлните задачи ще се управляват през backlog (issues/epics).
