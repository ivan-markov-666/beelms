---
stepsCompleted: []
inputDocuments:
  - docs/product/product-brief.md
  - docs/product/prd.md
  - docs/analysis/research/technical-self-hosted-lms-architecture-research-2025-12-10.md
workflowType: 'create-ux-design'
lastStep: 1
---

# UX Design Specification – beelms core

**Author:** Master  
**Date:** 2025-12-10

---

## 1. Контекст и цели

beelms core е opinionated рамка за изграждане на хибридни LMS системи с wiki характер. Тази UX спецификация описва **референтен UX** за типична инстанция върху beelms (публично wiki, курсове, базово оценяване и admin панел), който:

- служи като отправна точка за конкретни продукти;
- пази нещата **прости** и съвместими с Lean Tier 0 (single VPS, ограничени ресурси);
- отразява ролите, сценариите и ограниченията от Product Brief, PRD, brainstorm и technical research.

Фокусът е върху:

- информационна архитектура и основна навигация;
- ключови UX потоци за основни роли;
- шаблони на екрани (wireframe ниво, не пиксел-дизайн);
- насоки за визуален стил, достъпност и responsive поведение.

---

## 2. Роли и основни UX персони

Използваме същите роли като в PRD, със следните UX акценти:

- **Гост (нерегистриран потребител)**
  - Основни нужди: бързо запознаване с wiki съдържание и налични курсове; лесна регистрация.
  - Основни екрани: Home, Wiki List, Wiki Article, Course Catalog, Course Detail, Login, Register.

- **Регистриран потребител (учещ се)**
  - Нужди: достъп до записаните курсове, ясен прогрес.
  - Екрани: My Courses, Course Detail (с прогрес), Tasks/Quizzes, Profile.

- **Teacher**
  - Нужди: създаване и управление на собствени курсове и задания, но с прост интерфейс.
  - Екрани: Teacher Dashboard, Course Editor, Task/Quiz Editor.

- **Content Author**
  - Нужди: комфортно писане и редактиране на wiki статии, превключване на езици, качване на изображения.
  - Екрани: Wiki Article Editor, Media Library.

- **Администратор**
  - Нужди: високо ниво на контрол и видимост, без претрупан UI.
  - Екрани: Admin Dashboard, Admin Wiki Management, Admin Users, Admin Settings (feature toggles, legal страници).

- **Monitoring**
  - Нужди: достъп до метрики и агрегирани отчети без достъп до лични данни.
  - Екрани: Metrics Dashboard (read-only), Reports.

---

## 3. Информационна архитектура и навигация

### 3.1. Основна навигация (public/learner)

Горна навигация (desktop):

- Лого + име на инстанцията.
- **Wiki** – списък със статии.
- **Courses** – каталог с курсове.
- **About**, **Contact** (или в footer, според размер на навигацията).
- Десен край:
  - **Login / Register** (за гост);
  - **My Courses**, avatar (за логнат потребител).

Footer (винаги видим):

- линкове към **Privacy/GDPR**, **Terms of Use**, **About**, **Contact**;
- copyright/brand.

### 3.2. Навигация за администратори и power users

Admin навигацията не се смесва с публичната – достъпна е след логин, чрез:

- линк „Admin" в user менюто (avatar dropdown) или отделен subdomain `/admin`;
- лява странична навигация (sidebar) с:
  - Dashboard
  - Wiki
  - Courses
  - Users
  - Settings (feature toggles, интеграции, legal страници)
  - Metrics

Teacher/Author могат да имат подобен, но **ограничен** sidebar (само техните курсове/статии).

---

## 4. Основни UX потоци

### 4.1. Гост → Регистрация → Първи курс

1. Гост отваря **Home** или landing страница.
2. Вижда кратко обяснение + link към **Wiki** и **Courses**.
3. Преглежда Wiki или Courses; при опит за запис в курс се появява CTA „Register to enroll".
4. На **Register** формата:
   - минимални полета (email, password, confirm password);
   - линк към Terms/Privacy (checkbox за съгласие).
5. След успешна регистрация:
   - автоматичен login и redirect към **Course Detail** или **My Courses**.

### 4.2. Регистриран потребител → My Courses → Прогрес

1. Потребителят кликва **My Courses** в навигацията.
2. Вижда списък с курсове:
   - заглавие, кратко описание, прогрес bar, статус (Not Started/In Progress/Completed).
3. При избор на курс се отваря **Course Detail**, със структура:
   - секция с обща информация (описание, цели);
   - списък от модули/уроци (статии, тестове, задачи);
   - CTA „Continue" към следващия елемент.
4. След завършване на урок/тест, системата маркира съответния елемент като завършен и актуализира прогрес бара.

### 4.3. Content Author → Създаване/редакция на статия

1. Author отваря **Wiki** секцията за автори.
2. Вижда списък „My Articles" с филтри по статус (Draft/Active/Inactive).
3. При „New Article" се отваря редактор:
   - title поле;
   - language selector;
   - markdown редактор с live preview;
   - блок за качване на изображения.
4. Записването предлага:
   - Save as Draft;
   - Publish (ако има достатъчно права или преминава през review).

### 4.4. Teacher → Създаване на курс

1. Teacher отваря **Courses → My Courses**.
2. Натиска „Create Course".
3. Стъпково wizard UX:
   - Стъпка 1: Основна информация (име, категория, кратко описание, език).
   - Стъпка 2: Добавяне на модули
     - избор на съществуващи статии;
     - добавяне на нов урок/тест placeholder.
   - Стъпка 3: Настройки (free/paid флаг, видимост).
4. След създаване, курсът се появява в каталога според правата и feature toggles.

### 4.5. Admin → Управление на потребители и настройки

1. Admin влиза в **Admin Dashboard**.
2. Вижда quick stats (брой потребители, активни курсове, най-посещавани статии).
3. В **Users**:
   - таблица с търсене/филтри;
   - действия: Activate/Deactivate, промяна на роли.
4. В **Settings**:
   - включване/изключване на модули (wiki public, courses, auth);
   - настройки за интеграции (email, Redis, RabbitMQ, monitoring);
   - редакция на съдържанието на GDPR/Terms страници.

---

## 5. Шаблони на екрани (wireframe ниво)

### 5.1. Home / Landing

- Header с основна навигация.
- Hero секция:
  - кратко описание на платформата/инстанцията;
  - двa основни CTA: „Browse Wiki" и „Browse Courses";
  - secondary CTA „Sign up".
- Секции „Popular Articles", „Featured Courses".
- Footer с legal линкове.

### 5.2. Wiki List

- Лява колона (desktop): филтри по категория, език.
- Централна колона: списък със статии (заглавие, кратък excerpt, badges за език и статус).
- Search bar отгоре.

### 5.3. Wiki Article

- Breadcrumbs (Home → Wiki → Category → Article).
- Заглавие, мета (последно обновяване, език).
- Основно съдържание (markdown → HTML, с code blocks).
- Десен sidebar (по избор): related articles, линк към свързани курсове.
- Действия: Share, Print.

### 5.4. Course Catalog

- Карти по курс:
  - име, кратко описание, категория, ниво (Beginner/Intermediate/Advanced);
  - badge free/paid;
  - CTA „View Details".
- Филтри по категория, ниво, език.

### 5.5. Course Detail

- Header с име на курса и CTA „Enroll" или „Continue".
- Табове/секции:
  - Overview (описание, цели);
  - Curriculum (списък с модули: уроци, тестове, задачи);
  - Requirements, Target audience.
- Прогрес бар за записани потребители.

### 5.8. Auth екрани

- **Login**: email, password, link към Forgot Password, линк към Register.
- **Register**: минимални полета, чекбокс за Terms/Privacy.
- **Forgot/Reset Password**: изчистени съобщения за успех/грешка, не издават информация за съществуване на акаунт.

### 5.9. Admin Dashboard

- Cards с основни метрики (регистрирани потребители, активни курсове, най-посещавани статии).
- Бързи линкове към основни admin секции.

---

## 6. Визуален стил и достъпност

- **Цветове**: зелено/червено като основни акценти (от Product Brief), но:
  - използват се с достатъчен контраст спрямо фона (WCAG препоръки);
  - червеното се използва предимно за предупредителни/критични състояния.
- **Типография**: четлив sans-serif шрифт, размер 16px базово, line-height ≥ 1.5.
- **Достъпност**:
  - ясно фокус състояние за интерактивни елементи;
  - ARIA labels, alt текст за изображения;
  - избягване на color-only индикации (икони, текстови labels).

---

## 7. Responsive поведение

- **Desktop (≥ 1024px)**: пълна навигация с текстови линкове, sidebar-и за admin/author.
- **Tablet (768–1023px)**: част от sidebar-ите се колапсират в икони/accordion; навигацията може да се съкрати.
- **Mobile (< 768px)**:
  - burger меню за основната навигация;
  - списъците (Wiki, Courses) стават едноколонни;
  - admin UI е достъпен, но по-ограничен (фокус върху най-честите задачи).

---

## 8. Отворени UX въпроси и non-goals

- До каква степен референтният frontend (Next.js) трябва да предлага готови **visual themes** и докъде се очаква инстанциите да си правят свои дизайни.
- Как да се балансира сложността на Admin UI при добавяне на повече модули (exams, advanced metrics) – вероятно ще са нужни отделни „sections" и progressive disclosure.
- Не целим в хоризонт 6–12 месеца:
  - сложни drag-and-drop layout билдъри;
  - визуални course builders с canvas тип UI;
  - сложни мобилни приложения – мобилната поддръжка е чрез responsive web.

Тази UX спецификация служи като основа – конкретни инстанции могат да стъпват върху нея и да добавят свои уникални UX решения, без да нарушават общия модел за навигация, роли и потоци.
