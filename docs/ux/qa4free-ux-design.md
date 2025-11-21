# QA4Free – UX Design (MVP)

_Роля: UX Designer. Фаза: BMAD Phase 2 – Prototypes. Този документ описва основния UX за MVP версията на QA4Free (навигация, основни екрани и текстови wireframes за Auth частта)._ 

## 1. Обхват и цели

- Да дефинира **основните екрани** за MVP (Wiki, Auth, Практическа среда UI/API, Admin).
- Да опише **глобалния layout и навигация**, върху които ще стъпят wireframes и реалната имплементация.
- Да даде **текстови wireframes** (структура на екрани), които по-късно могат да се визуализират в Excalidraw файловете:
  - `docs/ux/wireframes/*.excalidraw`
  - `docs/ux/flows/*.excalidraw`

Свързани документи:
- Development workflow – `docs/architecture/development-workflow.md` (Фаза 2: Прототипи)
- Product Brief – `docs/product/product-brief.md`
- PRD – `docs/product/prd.md`
- System Architecture – `docs/architecture/system-architecture.md`
- UX Color Theme Visualizer (BMAD артефакт) – `docs/ux/ux-color-themes.html`
- UX Design Direction Showcase (BMAD артефакт) – `docs/ux/ux-design-directions.html`

---

## 2. Глобален layout и навигация

### 2.1. Основен layout shell

Всички основни екрани (освен специални като reset линк от имейл) споделят общ layout shell:

- **Header (top bar)**
  - Logo / име на продукта „QA4Free“ (кликаемо, води към Wiki или Home).
  - Основна навигация (главно меню).
  - Област за автентикация (Login/Register или User меню).
  - Превключвател на език (например BG / EN).
- **Main content area**
  - Съдържанието на конкретния екран (Wiki, Auth, Sandbox, Admin и др.).
- **Footer**
  - Линкове към: About, Privacy/GDPR, Contact.

Layout-ът трябва да бъде **responsive** (desktop / tablet / mobile), с адаптация на менюто (например burger меню на мобилни устройства).

### 2.2. Header – основни елементи и навигация

Примерно основно меню за **гост** (нерегистриран потребител):

- **Logo / QA4Free** – води към начална страница (може да е Wiki List).
- **Wiki** – списък със статии (`/wiki`).
- **Practical UI** – линк към Sandbox UI (`/practice/ui`).
- **Training API** – линк към страница със Swagger/OpenAPI за Training API (`/practice/api`).
- **Login / Register** – бутони или линкове за достъп до Auth екрани.
- **Language switcher** – BG / EN (dropdown или toggle).

Превключването на езика се случва централизирано през **Language switcher** в header-а; в самите Wiki статии няма отделен списък с езици както в оригиналната Wikipedia.

Примерно меню за **регистриран потребител**:

- **Wiki**
- **Practical UI**
- **Training API**
- **My Account / Profile** – dropdown с:
  - „Profile“ (акаунт / настройки)
  - „Logout“
- **Language switcher**

Примерно меню за **администратор** (след login):

- **Wiki**
- **Practical UI**
- **Training API**
- **Admin** (dropdown или отделен item с под-линкове към Admin секциите)
- **My Account / Profile**
- **Language switcher**

### 2.3. Основни навигационни пътеки (high level)

- **Гост**
  - Влиза на Wiki или Home → може да преглежда Wiki и Practical UI → насочва се към Login/Register, ако иска да ползва акаунт или Admin.
- **Регистриран потребител**
  - Влиза през Login → вижда Wiki, Practical UI, Training API и своя профил.
- **Администратор**
  - Влиза през Login → вижда Wiki, Practical UI, Training API, плюс Admin секция с административни екрани.

### 2.4. Responsive / Mobile layout правила

Тези правила важат за всички екрани, освен ако изрично не е указано друго в съответната секция.

- **Breakpoints (ориентировъчни):**
  - Mobile: `< 768px` ширина.
  - Tablet: `768–1024px`.
  - Desktop: `>= 1024px`.
- **Header (mobile):**
  - Логото остана видимо горе вляво.
  - Основното меню (Wiki, Practical UI, Training API, Admin, My Account/Login/Register) се скрива зад hamburger бутон.
  - Language switcher може да бъде:
    - или в основния header до burger бутона;
    - или вътре в отвореното мобилно меню.
- **Main content (общо):**
  - Всички основни контейнери използват `width: 100%` (с малък вътрешен padding), вместо твърди `max-width` стойности.
  - Вертикалните отстояния между секции се запазват, но хоризонталните margin-и се минимизират.
  - Формите се подреждат в една колона; елементите, които на desktop са в две колони (напр. Complex Form в Sandbox UI), се „разлистват“ вертикално.
- **Таблици и сложни елементи (Admin, Table CRUD):**
  - Таблиците могат да се скролват хоризонтално (responsive таблици), вместо да се опитват да се свият прекомерно.
  - Където е възможно, колоните се минимизират (кратки заглавия, икони вместо текст в Actions).
- **Auth (mobile):**
  - Login / Register / Forgot / Reset / Account формите заемат почти цялата ширина (с вътрешен padding), подредени в една колона.
  - Primary бутоните (Login, Register, Change password и др.) са с ширина ~100% от формата.
  - Линковете („Forgot password?“, „Back to login“, „Already have an account?“) се подреждат вертикално под бутона, с достатъчно разстояние за лесно натискане.
  - Съобщения за грешка/успех се показват веднага под съответното поле или над формата, без да изместват критични елементи извън екрана.
- **Sandbox UI (mobile):**
  - Лявата навигация по групи елементи става
    - или collapsible панел над content-а (бутон „Elements“ / „Sections“, който при tap отваря списък с категории);
    - или horizontal scroll меню (tabs) над content-а.
  - При отваряне на навигацията съдържанието се измества надолу, за да не бъде закрито.
  - Контентът винаги заема цялата ширина под навигацията и се скролва вертикално.
- **Wiki (mobile):**
  - Search input и language filter се подреждат вертикално (search отгоре, филтър отдолу) при много тесни екрани.
  - Списъкът със статии се показва като една колона.
- **Admin (mobile):**
  - Навигацията между Admin под-секциите може да се реализира като tabs или dropdown над съдържанието.
  - Таблиците са със scroll и опростени колони; най-важните полета (Title/Email/Status) са видими без хоризонтален скрол.
  - Действията по ред (Edit/View/Activate/Deactivate) могат да се комбинират в compact „More“/kebab меню за по-добра използваемост.
- **Training API (mobile):**
  - Описателният текст над Swagger UI може да е по-кратък (1–2 реда), за да не избута интерфейса прекалено надолу.
  - Swagger UI блокът се скролва вертикално; хоризонтален скрол е позволен вътре в самия панел при нужда.
  - Линкът „Open in new tab“ (ако е наличен) стои непосредствено над или под Swagger UI, така че да е лесно достъпен за потребители, които предпочитат пълноекранен изглед.

---

## 3. Списък с основни екрани (MVP)

Таблицата по-долу описва основните екрани за MVP от UX гледна точка.

| ID           | Екран                         | Примерен route            | Роля/достъп            | Описание |
|--------------|------------------------------|---------------------------|------------------------|----------|
| SCR-HOME     | Home / Landing (по избор)    | `/`                       | Гост, Потребител, Админ | Кратко обяснение какво е QA4Free и линкове към Wiki и Практическата среда. Може да се слее с Wiki List. |
| SCR-WIKI-LST | Wiki List                    | `/wiki`                   | Гост, Потребител, Админ | Списък със статии, търсене/филтри по език. |
| SCR-WIKI-ART | Wiki Article                 | `/wiki/[slug]`           | Гост, Потребител, Админ | Една статия с превключване на език и основна информация. |
| SCR-LOGIN    | Login                        | `/auth/login`            | Гост                   | Екран за вход с имейл и парола. |
| SCR-REGISTER | Register                     | `/auth/register`         | Гост                   | Регистрация на нов потребител. |
| SCR-FORGOT   | Forgot Password (request)    | `/auth/forgot-password`  | Гост                   | Форма за заявка за смяна на парола. |
| SCR-RESET    | Reset Password (link)        | `/auth/reset-password`   | Гост (по токен)        | Страница за въвеждане на нова парола чрез линк от имейл. |
| SCR-ACCOUNT  | Account / Profile            | `/account`               | Потребител, Админ      | Преглед на акаунт, GDPR действия (export, delete/deactivate). |
| SCR-SBX-UI   | Sandbox UI (Practical UI)    | `/practice/ui`           | Гост, Потребител, Админ | Страница с богати UI елементи за manual/UI automation упражнения. |
| SCR-SBX-API  | Training API (Swagger UI)    | `/practice/api`          | Гост, Потребител, Админ | Достъп до Swagger/OpenAPI на Training API за API/integration упражнения. |
| SCR-ADMIN-DB | Admin Dashboard              | `/admin`                 | Админ                  | Основно табло с най-важните метрики и линкове към под-секции. |
| SCR-ADMIN-WK | Admin Wiki Management        | `/admin/wiki`            | Админ                  | Управление на Wiki статии (създаване, редакция, деактивиране). |
| SCR-ADMIN-WV | Admin Wiki Versions/History  | `/admin/wiki/[id]/versions` | Админ              | Преглед на история на версии, diff и връщане на предишни версии. |
| SCR-ADMIN-US | Admin Users                  | `/admin/users`           | Админ                  | Списък с потребители, активиране/деактивиране на акаунти. |
| SCR-ADMIN-MT | Admin Metrics Overview       | `/admin/metrics`         | Админ                  | Базови метрики за употреба на системата. |
| SCR-ABOUT    | About / За платформата       | `/about`                 | Гост, Потребител, Админ | Информационна страница за QA4Free – защо е създаден и каква е целта на сайта. |
| SCR-PRIVACY  | Privacy & GDPR               | `/privacy-gdpr`          | Гост, Потребител, Админ | Страница с политика за поверителност и GDPR права на потребителя. |
| SCR-CONTACT  | Contact                      | `/contact`               | Гост, Потребител, Админ | Страница с информация как да се свържеш с екипа (имейл за контакт и др.). |

---

## 4. Auth екрани – текстови wireframes

Тази секция описва структурата на основните Auth екрани. Целта е да има яснота **кои елементи и състояния** са нужни, преди да правим визуални wireframes.

### 4.0. Layout спецификация (desktop)

Тук се описва базовият **desktop layout** за всички Auth екрани. Реалната имплементация може да използва Tailwind CSS / flex / grid, но следните принципи трябва да се спазват:

- **Frame / viewport (desktop):**
  - Ширина: ~1440 px.
  - Височина: ~900 px.
- **Header (top bar):**
  - Височина: ~80 px.
  - Позиция: най-отгоре, пълна ширина (0,0 → 1440,80).
  - Вътрешно разположение:
    - Ляво: зона за Logo / „QA4Free“.
    - Център: основно меню (Wiki, Practical UI, Training API).
    - Дясно: Auth зона (Login/Register или My Account/Logout) + language switcher.
- **Main content area:**
  - Позиция: под header-а, с вертикален margin ~40–60 px.
  - Контейнер: max-width ~480–600 px, подравнен по хоризонтала с `margin: 0 auto` (центриран блок).
  - Подредба вътре:
    - Заглавие (H1) отгоре.
    - Кратко описание (по избор) под заглавието.
    - Форма (label + input-и + бутони) под описанието.
    - Линкове (Forgot password?, Back to login, Already have an account? и т.н.) под формата.
- **Footer:**
  - Височина: ~60 px.
  - Позиция: в долната част на екрана, пълна ширина.
  - Съдържание: текстови линкове „About | Privacy/GDPR | Contact“.

Всички Auth екрани (Login, Register, Forgot, Reset, Account) използват **един и същ shell** (header + footer + центриран main контейнер). Разликата е единствено в съдържанието на формата и линковете вътре в main областта.

### 4.1. Login (`SCR-LOGIN`)

**Цел:** Потребителят да влезе със своя имейл и парола.

**Структура:**
- Заглавие: „Login“ / „Вход“.
- Кратък текст/описание (по избор).
- Форма:
  - Поле „Email“.
  - Поле „Password“ (скрит текст, toggle за показване по избор).
  - Checkbox „Remember me“ (по избор).
  - Бутон „Login“ (primary, зелен).
- Линкове:
  - „Forgot password?“ – води към SCR-FORGOT.
  - Линк „Don’t have an account? Register“ – води към SCR-REGISTER.

**Състояния:**
- Успех → redirect към целева страница (напр. Wiki или предишна страница).
- Грешка (invalid credentials) → ясно съобщение до полетата.
- Validation errors (празни полета, invalid email format) → inline грешки.

### 4.2. Register (`SCR-REGISTER`)

**Цел:** Създаване на нов акаунт.

**Структура:**
- Заглавие: „Register“ / „Регистрация“.
- Форма:
  - Поле „Email“.
  - Поле „Password“.
  - Поле „Confirm password“.
  - (По избор) Checkbox за съгласие с правила/Privacy.
  - Бутон „Register“ (primary, зелен).
- Линкове:
  - „Already have an account? Login“ – води към SCR-LOGIN.

**Състояния:**
- Успех → може да изисква потвърждение по имейл или директен вход (в зависимост от по-късно решение).
- Грешки:
  - Email вече зает.
  - Weak password (ако има такива правила).
  - Password и Confirm не съвпадат.

### 4.3. Forgot Password (`SCR-FORGOT`)

**Цел:** Потребителят да заяви смяна на паролата.

**Структура:**
- Заглавие: „Forgot password“.
- Обяснителен текст: че ще бъде изпратен имейл с линк.
- Форма:
  - Поле „Email“.
  - Бутон „Send reset link“.
- Линк „Back to login“ – връща към SCR-LOGIN.

**Състояния:**
- Успех → съобщение, че ако имейлът съществува, е изпратен линк (без да издаваме дали имейлът е регистриран).
- Грешки → invalid email формат.

### 4.4. Reset Password (`SCR-RESET`)

**Цел:** Въвеждане на нова парола чрез линк от имейл.

**Структура:**
- Заглавие: „Reset password“.
- Текст, който напомня, че страницата е достъпна по защитен линк.
- Форма:
  - Поле „New password“.
  - Поле „Confirm new password“.
  - Бутон „Change password“.

**Състояния:**
- Успех → съобщение за успешна смяна + линк към Login.
- Грешки:
  - Изтекъл/невалиден токен.
  - Password и Confirm не съвпадат.

### 4.5. Account / Profile (`SCR-ACCOUNT`)

**Цел:** Потребителят да управлява своя акаунт и GDPR действията.

**Структура:**
- Заглавие: „My Account“ / „Профил“.
- Секции:
  1. **Профилна информация**
     - Имейл (read-only или editable, според бъдещо решение).
     - Дата на регистрация.
  2. **GDPR – Data export**
     - Кратко обяснение какво включва експортът.
     - Бутон „Export my data“.
  3. **GDPR – Delete / Deactivate account**
     - Обяснение какво се случва при изтриване/деактивиране.
     - Бутон „Delete my account“ или „Deactivate account“.
     - Потвърждение (modal/диалог) с ясно предупреждение.

**Състояния:**
- Успешен export → съобщение, че данните ще бъдат изпратени/подготвени.
- Успешно изтриване/деактивиране → logout + обяснителен екран.

**Micro-flows (GDPR действия):**
- **Data export:**
  1. Потребителят отваря `SCR-ACCOUNT`.
  2. В секцията „GDPR – Data export“ натиска бутона „Export my data“.
  3. Системата показва потвърждение/feedback, че заявката е приета (може да отнеме време), без да сменя екрана.
  4. При нужда потребителят получава линк/файл по имейл (реалната имплементация може да се уточни допълнително).
- **Delete / Deactivate account:**
  1. Потребителят отваря `SCR-ACCOUNT`.
  2. В секцията „GDPR – Delete / Deactivate account“ натиска бутона „Delete my account“ или „Deactivate account“.
  3. Появява се потвърждаващ диалог (modal) с ясно предупреждение.
  4. При потвърждение системата деактивира/изтрива акаунта, прави logout и показва обяснителен екран (напр. „Your account has been deleted“ + линк към Home/Wiki).

---

## 5. Sandbox UI – страници и елементи

Sandbox UI е отделен модул за упражнения по UI автоматизация. Потребителят стига до него чрез линка **Practical UI** в главното меню.

### 5.0. Layout спецификация (desktop)

- **Глобален shell:** Използва същия header/footer като останалите екрани (описан в §2 и §4.0).
- **Основен layout на `/practice/ui`:**
  - Централен container с max-width ~1200 px, хоризонтално центриран.
  - Две основни колони:
    - Лява колона (навигaция по групи елементи) – фиксирана ширина ~260–300 px.
    - Дясна колона (content зона на избраната страница) – заема останалата ширина.
- **Навигация (лява колона):**
  - Вертикален списък/меню с линкове „Text Box“, „Check Box“, „Radio Button“, …, „Complex Form (Registration)“, „Table CRUD & Pagination“.
  - Активният елемент е ясно маркиран (фон/бордер).
- **Content зона (дясна колона):**
  - Заглавие на страницата (H1/H2) отгоре.
  - Кратко описание под заглавието.
  - Демонстрационните елементи (inputs, бутони, таблица и др.) са подредени в блок с разумни отстояния.
  - За по-сложни страници:
    - Complex Form – формата може да е в една колона (mobile-first), но на desktop e допустимо да се групира в 2 колони.
    - Table CRUD – малка форма за добавяне отгоре, таблица под нея, пагинация в долната част на таблицата (дясно подравнена).

### 5.1. Навигация в Sandbox UI модула

- Route за модула: `/practice/ui`.
- При влизане в `/practice/ui` потребителят вижда:
  - лява странична навигация (или хоризонтални табове) с групи UI елементи;
  - основна област, в която се зарежда избраната страница с елементи.
- Тази вътрешна навигация (групи Text Box, Check Box и т.н.) се появява **само** в рамките на Sandbox UI модула – не е част от глобалния header.

Примерни групи в навигацията:

- Text Box
- Check Box
- Radio Button
- Buttons
- Links
- Broken Links / Images
- Upload / Download
- Dynamic Properties
- Browser Windows
- Alerts
- Frames
- Nested Frames
- Modal Dialogs
- Accordion
- Auto Complete
- Date Picker
- Slider
- Progress Bar
- Tabs
- Tool Tips
- Menu
- Select Menu
- Sortable
- Selectable
- Resizable
- Droppable
- Draggable
- Complex Form (Registration)
- Table CRUD & Pagination

Всяка група е отделна страница в модула, достъпна през тази вътрешна навигация.

### 5.2. Страница „Text Box elements“

**Цел:** Да предостави няколко различни текстови полета за упражнения по селектиране, въвеждане и проверка на стойности.

**Основно съдържание:**
- Заглавие: „Text Box elements“.
- Кратко описание на страницата.
- Група от текстови елементи, всеки с ясен label и идентификатор.

**Елементи:**
1. **Input text element (empty)**
   - Едноредово текстово поле.
   - Placeholder: „Enter text here…“.
   - Няма предварително попълнена стойност.

2. **Input text element with prefilled text**
   - Едноредово текстово поле.
   - Placeholder (по избор) + предварително попълнена стойност (напр. „John Doe“).

3. **Text area**
   - Многоредово текстово поле с placeholder (напр. „Enter multi-line text…“).

4. **Password input**
   - Поле тип „password“, скриващо въведените символи.

5. **Disabled input**
   - Едноредово поле, визуално показано, но не може да се редактира.

6. **Read-only input**
   - Едноредово поле с фиксирана стойност (например „Read-only value“), което не може да се променя, но може да се селектира/копира.

7. **Number input**
   - Поле за въвеждане на числа с up/down стрелки.

8. **Search input**
   - Текстово поле с икона „лупа“ и placeholder „Search…“.

По желание страницата може да съдържа бутон „Reset“, който връща всички полета в начално състояние.

### 5.3. Други страници с UI елементи

За всяка от останалите групи (Check Box, Radio Button, Buttons и т.н.) има **отделна страница**, която съдържа няколко представителни елемента от съответния тип, включително различни състояния (checked/unchecked, enabled/disabled, active/hover и др.).

Примери (концептуално):

- **Check Box** – списък от checkbox-и с различни labels, някои предварително отметнати, някои disabled.
- **Radio Button** – групи от radio бутони, където само един може да е избран.
- **Buttons** – primary/secondary/danger бутони, различни размери и състояния (normal, hover, disabled, loading).
- **Links / Broken Links / Images** – линкове, които водят към валидни страници, и такива, които водят до 404; изображения с валиден и счупен src.
- **Upload / Download** – поле за качване на файл, бутон за сваляне на примерен файл.
- **Dynamic Properties** – елементи, които променят свои атрибути (цвят, текст, visibility) след определено време или действие.
- **Browser Windows, Alerts, Frames, Nested Frames, Modal Dialogs** – елементи, които отварят нов прозорец/таб, JS alert/confirm/prompt, страници с iframes и вложени iframes, модални прозорци.
- **Accordion, Tabs, Menu, Select Menu** – колапсващи секции, табове, навигационни менюта и dropdown-и.
- **Auto Complete, Date Picker, Slider, Progress Bar, Tool Tips** – input-и с autocomplete, избор на дата, плъзгач, индикатор за прогрес, подсказки при hover.
- **Sortable, Selectable, Resizable, Droppable, Draggable** – елементи, които могат да бъдат влачени, пускани в drop зони, сортирани или селектирани.

Точният набор от елементи ще се доуточни в дизайн системата, но целта е всяка страница да дава достатъчно разнообразие за упражнения по селектиране и взаимодействие.

### 5.4. Сложна форма за регистрация

**Цел:** Да предостави по-сложен сценарий за автоматизация – попълване на комплексна форма и проверка на трансформирани данни.

**Примерен route:** `/practice/ui/complex-registration` (или таб „Complex Form (Registration)“).

**Структура на страницата:**
- Заглавие: „Complex Registration Form“.
- Описание: обяснява, че след натискане на бутона системата ще покаже въведените данни в различен формат.
- Форма с полета, например:
  - First Name
  - Last Name
  - Email
  - Date of Birth (Date Picker, въвеждане във формат `dd/mm/yyyy`, напр. `21/06/2020`)
  - Country (Select Menu)
  - (По избор) други полета – Phone, Address, др.
- Бутон „Register“.

**Поведение след submit:**
- Под формата (или на отделен панел) се показва секция „Registration result“, която визуализира въведените данни, но **с променен формат**, например:
  - Показва **Full Name** вместо отделни First/Last (напр. „John Doe“).
  - Показва Birth Date във формат „21 June 2020“ вместо `21/06/2020`.
  - Може да показва и комбинирана информация (напр. „John Doe, Country: Germany“).

Тази страница е предназначена за сложни проверки (верификация на формати, комбинирани стойности, състояние преди/след submit).

### 5.5. Страница „Таблица с CRUD и пагинация“

**Цел:** Да предостави комплексен пример с таблица, в която потребителят може да добавя, редактира, изтрива записи и да тества пагинация.

**Примерен route:** `/practice/ui/table-crud` (или таб „Table CRUD & Pagination“).

**Структура на страницата:**
- Заглавие: „Table with CRUD and pagination“.
- Кратко обяснение на функционалността.
- Контроли за добавяне на нов запис:
  - Малка форма над таблицата (напр. колони „Name“, „Email“, „Role“ или подобни).
  - Бутон „Add row“.
- Таблица с колони (примерно):
  - ID
  - Name
  - Email
  - Actions (Edit, Delete)

**Поведение:**
- **Добавяне:**
  - Попълване на формата + „Add row“ → нов ред се появява в таблицата.
- **Редактиране:**
  - Бутон „Edit“ за всеки ред → позволява промяна на полетата (inline или в отделна форма/модал), след което се запазват.
- **Изтриване:**
  - Бутон „Delete“ за всеки ред → редът се премахва от таблицата (по избор с потвърждение).
- **Пагинация:**
  - Таблицата показва максимум **10 записа на страница**.
  - При опит за добавяне на 11-ти запис се появява **втора страница** („Page 2“).
  - Навигация между страниците (напр. „Previous / Next“ или номера на страници).

Тази страница е насочена към по-напреднали упражнения по автоматизация: управление на състояние, проверка на таблици, пагинация, CRUD.

---

## 6. Training API – страница със Swagger UI

**Цел:** Да предостави на потребителя (QA) лесен достъп до Training API през Swagger/OpenAPI интерфейс за упражнения по API/integration тестване.

**Примерен route:** `/practice/api` (`SCR-SBX-API`).

### 6.0. Layout спецификация (desktop)

- Използва глобалния header/footer.
- Main content container:
  - max-width ~960–1200 px, центриран.
  - Вертикални отстояния подобни на Auth/Wiki екраните.
- Подредба вътре в main:
  - Заглавие „Training API“.
  - Кратък описателен текст (1–3 реда) под заглавието.
  - Под него – голям блок/панел, в който е вграден Swagger UI (заема цялата ширина на контейнера и по-голямата част от височината).
  - (По избор) Линк „Open in new tab“ под или над Swagger панела, подравнен вдясно.

**Структура:**
- Заглавие: „Training API“.
- Кратко описание:
  - обяснява, че това е demo API само за упражнения;
  - насочва към основните ендпойнти (`GET /api/training/ping`, `POST /api/training/echo`).
- Основна зона със **Swagger UI**:
  - вграден Swagger компонент, който зарежда OpenAPI спецификацията за Training API;
  - потребителят може да разглежда ресурсите, да въвежда примерни стойности и да изпраща заявки директно от Swagger интерфейса.
- (По избор) Линк „Open in new tab“, който отваря Swagger UI в отделен прозорец.

Няма допълнителна логика на страницата – фокусът е върху самия Swagger UI и тестването на ендпойнтите.

---

## 7. Wiki екрани – текстови wireframes

### 7.0. Layout спецификация (desktop)

- **Home / Landing (`/` – SCR-HOME):**
  - Може да използва същия layout като Wiki List (`/wiki`), но с
    - по-видим заглавен блок (hero) отгоре с кратко обяснение „какво е QA4Free“;
    - акцентирани линкове към Wiki и Практическата среда.
  - Алтернативно, може да бъде просто redirect към `/wiki`, ако не искаме отделна начална страница за MVP.
- **Wiki List (`/wiki`):**
  - Main container с max-width ~960–1200 px, центриран.
  - Отгоре:
    - Заглавие „Wiki“.
    - Кратко въведение.
  - Под заглавието – хоризонтален ред за **search + филтри**:
    - Ляво: search input („Search…“).
    - Дясно: dropdown за език (Language filter).
  - Под search/filters – списък със статии (list или grid) с равномерни вертикални отстояния.
  - Пагинация в долната част на списъка (подравнена центрирано или вдясно).
- **Wiki Article (`/wiki/[slug]`):**
  - Breadcrumbs/линк „Back to Wiki list“ в горната част, под header-а.
  - Content колона с max-width ~720–800 px, центрирана.
  - Вътре: заглавие (H1), мета информация (език, дата), основен текст, по избор related articles в долната част.

### 7.1. Wiki List (`SCR-WIKI-LST`)

**Цел:** Потребителят да може бързо да открива и филтрира Wiki съдържание.

**Структура на екрана:**
- Заглавие: „Wiki“ или „Wiki Articles“.
- Кратко въведение (по избор) за предназначението на Wiki.
- Лента за търсене и филтри:
  - Поле „Search“ за търсене по заглавие/ключова дума.
  - Филтър по език (например dropdown с BG / EN / DE), който контролира кои статии се показват в списъка.
- Списък със статии (list или grid):
  - Заглавие на статията (кликаемо, води към `SCR-WIKI-ART`).
  - Кратко резюме/описание (първите няколко реда от съдържанието или отделно кратко поле).
  - Мета информация: език, дата на последна редакция.
- Пагинация (ако има повече статии):
  - номера на страници или „Previous / Next“ бутони.

**Състояния:**
- Нормално състояние с резултати.
- „No results“ – когато търсенето/филтрите не връщат статии (ясно съобщение + опция за изчистване на филтрите).
- Loading state (при зареждане/филтриране).

### 7.2. Wiki Article (`SCR-WIKI-ART`)

**Цел:** Показва съдържанието на избрана Wiki статия на текущо избрания език.

**Структура на екрана:**
- Breadcrumbs или линк „Back to Wiki list“.
- Заглавие на статията (H1).
- Мета секция:
  - език на статията;
  - дата на последна редакция;
  - (по избор) автор/редактор.
- Основно съдържание на статията (форматиран текст, подзаглавия, списъци, връзки).
- (По избор) секция „Related articles“ – линкове към други статии по темата.

**Езици:**
- Показваният език на статията се определя от **Language switcher-а в header-а**.
- Ако статията съществува на избрания език, се зарежда съответната езикова версия (същия `slug`, различен езиков код).
- Ако за избрания език няма версия на статията, не се прави автоматичен fallback към друг език – може да се покаже ясно съобщение или да се върне потребителят към Wiki List.

**Състояния:**
- Нормално състояние – статията е намерена и се показва съдържание.
- Not found – статия с даден `slug` не съществува → екран за грешка/404 с линк обратно към Wiki List.

---

## 8. Admin екрани – текстови wireframes

### 8.0. Layout спецификация (desktop)

- **Общ shell:** Използва глобалния header/footer; след login администраторът има видима „Admin“ опция в навигацията.
- **Admin Dashboard (`/admin`):**
  - Main container с max-width ~1200 px, центриран.
  - Заглавие „Admin Dashboard“ отгоре.
  - Под него – решетка от KPI карти (напр. 3 колони на desktop), с равномерни отстояния.
  - Под картите – секция „Quick actions / navigation“ с бутони/линкове към Wiki, Users, Metrics.
- **Admin списъчни екрани (Wiki, Users, Metrics):**
  - Заглавие на съответната секция (напр. „Admin – Wiki Management“).
  - Под него – ред с филтри/търсене.
  - Под филтрите – таблица на цялата ширина на контейнера.
  - Действията (Edit, View versions, Activate/Deactivate) са в най-дясната колона „Actions“.
  - Пагинация в долната част под таблицата.

### 8.1. Admin Dashboard (`SCR-ADMIN-DB`)

**Цел:** Да даде на администратора бърз преглед на състоянието на системата и достъп до ключовите админ секции.

**Структура на екрана:**
- Заглавие: „Admin Dashboard“.
- Breadcrumbs или индикатор, че потребителят е в Admin зона.
- Секция с KPI карти (cards), например:
  - „Registered users“ – общ брой регистрирани потребители.
  - „Wiki articles“ – общ брой активни статии.
  - „Top article (by views)“ – заглавие + брой преглеждания.
- Секция „Quick actions“ / „Admin navigation“:
  - Линкове/бутони към Admin Wiki, Admin Users, Admin Metrics.
- (По избор) Секция с последни събития (например „Last edited articles“, „Recently deactivated users“).

**Състояния:**
- Нормално – показва се актуална информация.
- Loading / error – ясно състояние, когато данните не могат да се заредят.

### 8.2. Admin Wiki Management (`SCR-ADMIN-WK`)

**Цел:** Управление на Wiki съдържанието – създаване, редакция, деактивиране/скриване на статии.

**Структура на екрана:**
- Заглавие: „Admin – Wiki Management“.
- Филтри и търсене:
  - Search по заглавие/slug.
  - Филтър по език.
  - Филтър по статус (Active / Inactive).
- Таблица със статии:
  - Колони: Title, Slug, Language(s), Status (Active/Inactive), Last updated, Actions.
- Бутон „Create new article“ (води към екран/форма за създаване или отваря модал).

**Действия (Actions):**
- Edit – редакция на избраната статия (заглавие, съдържание, езици и т.н.).
- View versions/history – линк към `SCR-ADMIN-WV` за конкретната статия.
- Deactivate / Activate – промяна на статуса, без твърдо изтриване.

**Състояния:**
- Списък с резултати.
- „No articles found“ при празен резултат.

### 8.3. Admin Wiki Versions / History (`SCR-ADMIN-WV`)

**Цел:** Да позволи на администратора да преглежда и управлява версиите на дадена Wiki статия.

**Структура на екрана:**
- Заглавие: „Wiki versions – [Article Title]“.
- Линк „Back to Wiki Management“.
- Таблица със списък на версиите:
  - Колони: Version ID, Created at (дата/час), Author, Status (Active / Old), Comments/Description (по избор).
- Контроли за избор на две версии за сравнение (checkbox-и или radio бутони в две колони).
- Секция „Diff / Compare“:
  - Показва разликите между избраните две версии (напр. highlight-нати текстови промени).

**Действия:**
- View – преглед на конкретна версия в read-only режим.
- Restore – прави избраната версия „активна“ текуща версия.
- Delete (за стари версии, без да се трие активната) – по избор с потвърждение.

### 8.4. Admin Users (`SCR-ADMIN-US`)

**Цел:** Администраторът да може да вижда и управлява потребителските акаунти.

**Структура на екрана:**
- Заглавие: „Admin – Users“.
- Филтри/търсене:
  - Search по имейл.
  - Филтър по статус (Active / Deactivated).
- Таблица с потребители:
  - Колони: Email, Registration date, Status, Role (User/Admin), Actions.

**Действия:**
- View – преглед на базова информация за потребителя (по избор).
- Activate / Deactivate – смяна на статуса на акаунта (с потвърждение при деактивиране).

**Състояния:**
- Нормален списък.
- „No users found“ при празен резултат.

### 8.5. Admin Metrics Overview (`SCR-ADMIN-MT`)

**Цел:** Да визуализира базови метрики за употреба на системата.

**Структура на екрана:**
- Заглавие: „Admin – Metrics“.
- Основни блокове/карти:
  - Брой регистрирани потребители (с евентуална графика във времето).
  - Най-преглеждани Wiki страници (топ N списък).
  - (По избор) Графики за посещения по дни/седмици.

Този екран може да бъде достъпен директно от Admin Dashboard и/или през навигация в Admin зоната.

---

## 9. Excalidraw wireframes – файлове и структура

Wireframes за основните екрани ще бъдат съхранени като Excalidraw файлове в `docs/ux/wireframes/`.

### 9.1. Auth wireframes

- Файл: `docs/ux/wireframes/auth-wireframes.excalidraw`
- Съдържание (отделни frames в Excalidraw):
  - Login (`SCR-LOGIN`)
  - Register (`SCR-REGISTER`)
  - Forgot Password (`SCR-FORGOT`)
  - Reset Password (`SCR-RESET`)
  - Account / Profile (`SCR-ACCOUNT`)

### 9.2. Wiki wireframes

- Файл: `docs/ux/wireframes/wiki-wireframes.excalidraw`
- Frames:
  - Wiki List (`SCR-WIKI-LST`)
  - Wiki Article (`SCR-WIKI-ART`)

### 9.3. Practical Environment (Sandbox UI + Training API) wireframes

- Файл: `docs/ux/wireframes/practical-env-wireframes.excalidraw`
- Frames (примерни):
  - Sandbox UI – Text Box elements (`SCR-SBX-UI` – Text Box страница)
  - Sandbox UI – други групи елементи (Check Box, Radio Button, Buttons, Links, Broken Links/Images и др.)
  - Sandbox UI – Complex Registration Form
  - Sandbox UI – Table CRUD & Pagination
  - Training API – Swagger UI страница (`SCR-SBX-API`)

### 9.4. Admin wireframes

- Файл: `docs/ux/wireframes/admin-wireframes.excalidraw`
- Frames:
  - Admin Dashboard (`SCR-ADMIN-DB`)
  - Admin Wiki Management (`SCR-ADMIN-WK`)
  - Admin Wiki Versions / History (`SCR-ADMIN-WV`)
  - Admin Users (`SCR-ADMIN-US`)
  - Admin Metrics Overview (`SCR-ADMIN-MT`)

---

Следващи стъпки за UX:
- Реално изчертаване на Excalidraw wireframes за основните екрани (Auth, Wiki, Sandbox UI, Training API, Admin) според описанията в този документ.
- Описване на ключови user flows за MVP (login, forgot/reset, достъп до Sandbox UI и Training API, основни Admin сценарии).
- Дефиниране на базова дизайн система (цветове, бутони, форми) в `docs/ux/design-system.md`.
