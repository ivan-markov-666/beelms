# EPIC-CROSS-I18N – Mini Tech Spec (Global Language Behaviour)

## 1. Цели и обхват

- **Цел:** Единен механизъм за избор на език (BG/EN) през global `LanguageSwitcher` в header-а, който:
  - задава единен `lang` за цялото приложение;
  - се използва както от Wiki, така и от всички други екрани, които поддържат мултиезичност в MVP.
- **Обхват на този mini-spec:**
  - уточнява централизираното поведение на езиковия изборник;
  - описва как другите FE модули трябва да „слушат“ за `lang` и да го използват за преводими стрингове;
  - дефинира поетапен rollout план за EPIC-CROSS-I18N.
- **Необхванати (future work / извън MVP на този slice):**
  - пълна мултиезичност на всички backoffice/admin екрани;
  - превод на email template-и и системни нотификации;
  - сложни fallback-и по локал/регион (напр. `en-GB`, `en-US`).

---

## 2. Текущо състояние (MVP Wiki Language Switch)

### 2.1. Frontend

- **Next.js app router, глобален layout**:
  - `RootLayout` съдържа `LanguageSwitcher` в header-а и е споделен за всички публични екрани.
- **`LanguageSwitcher` компонент:**
  - работи в client component (`"use client"`);
  - чете `lang` от `useSearchParams()` и го нормализира чрез `normalizeLang` (`"en"` → `"en"`, всичко останало → `"bg"`);
  - при промяна:
    - обновява `lang` в URL-а за текущия `pathname` чрез `router.push(nextUrl)`;
    - ако пътят е `/wiki`, премахва `page` от query-то (reset към страница 1);
    - на други пътища запазва всички останали query параметри.
- **Wiki list `/wiki`:**
  - чете `lang` от `searchParams` и го подава към `GET /api/wiki/articles?lang=...`;
  - списъкът и UI филтрите са синхронизирани с текущия `lang` в URL-а.
- **Wiki article `/wiki/[slug]`:**
  - чете `lang` от `searchParams` и го подава към `GET /api/wiki/articles/{slug}?lang=...`;
  - ако няма версия на този език, backend връща `404` → FE показва 404 страница (избран е вариантът „Not available for this language“).
- **Други екрани (Login, Practice UI, и т.н.):**
  - виждат същия глобален header с LanguageSwitcher-а;
  - навигацията в header-а вече използва FE i18n речниците за линковете „Wiki“ и „Вход“/`"Sign in"` според избрания език, но останалите UI текстове по екрани все още са основно на BG и предстои да се мигрират към i18n слоя.

### 2.2. Backend

- **Wiki API** вече поддържа `lang` (спрямо OpenAPI и имплементацията):
  - `GET /api/wiki/articles?lang=` за списъка;
  - `GET /api/wiki/articles/{slug}?lang=` за статията.
- **Други API-та** към момента са ефективно моноезични от гледна точка на UI (връщат бизнес данни, не текстови ресурси за превод).

---

## 3. Основни решения за глобална мултиезичност

### 3.1. Единен източник на истина за езика

- **Езикът на приложението** се представя чрез типизиран `SupportedLang`:
  - `SupportedLang = "bg" | "en"` (разширим към повече езици в бъдеще);
  - нормализиран чрез централизирана функция `normalizeLang(raw) → SupportedLang`.
- **Първичен носител на езика в MVP:**
  - `lang` query параметър в URL-а (`?lang=bg` или `?lang=en`);
  - поведението е вече реализирано от глобалния `LanguageSwitcher`.

### 3.2. Роля на `LanguageSwitcher` в header-а

- **Единствено място за избор на език** в публичния интерфейс:
  - няма отделни language selector-и по екрани (напр. вътре в Wiki статиите).
- **Поведение:**
  - при избор на нов език:
    - актуализира `lang` параметъра в URL-а за текущия route;
    - запазва останалите query параметри (филтри, контекст), с изключение на специални случаи като `/wiki` (където ресетва `page`);
    - това поведение е **еднакво** за всички екрани.
- **Отговорност на отделните екрани:** да интерпретират `lang` и да го прилагат за:
  - зареждане на съдържание (пример: Wiki статии, бъдещи мултиезични ресурси);
  - избор на преводими UI стрингове (бутон „Вход“ vs. „Log in“ и т.н.).

### 3.3. Fallback стратегия

- **Wiki статии `/wiki/[slug]`:**
  - ако няма версия на избрания език → 404 (както вече е имплементирано и договорено);
  - алтернативният UX вариант „показваме оригиналния език с пояснение“ остава потенциално future enhancement.
- **Общи UI текстове (навигация, бутони и др.):**
  - базов fallback: ако за даден ключ липсва превод за избрания език, показваме стойността за default езика (`bg`);
  - **няма** отделно UX съобщение за всеки липсващ превод (за да не се шуми излишно), но такива случаи се третират като dev дефект.

### 3.4. Персистиране на предпочитания език

- **Краткосрочно (MVP Wiki slice – вече реализирано):**
  - езикът е видим само през URL-а (`?lang=`);
  - state се запазва при навигиране по link-ове, които съхраняват `lang` (или чрез глобалния switcher).
- **Следваща стъпка за EPIC-CROSS-I18N:**
  - при смяна на езика global switcher-ът записва стойността и в cookie, напр. `ui_lang=bg|en`;
  - при директен достъп без `?lang=` (напр. bookmark към `/practice/ui`) FE/BE използват cookie-то, за да изберат начален език;
  - при конфликт между URL и cookie – **URL има приоритет** (по-прозрачен за потребителя и за поддръжка).

---

## 4. Техническа архитектура за FE i18n

### 4.1. I18n конфигурация и типове

- Добавяне на малък i18n слой във FE (без тежка външна библиотека за MVP):
  - `src/i18n/config.ts` – дефинира:
    - `export const SUPPORTED_LANGS = ["bg", "en"] as const;`
    - `export type SupportedLang = (typeof SUPPORTED_LANGS)[number];`
    - `export const DEFAULT_LANG: SupportedLang = "bg";`
    - `export function normalizeLang(raw: string | null | undefined): SupportedLang { ... }` (споделена логика с `LanguageSwitcher`).

### 4.2. Каталози с преводими стрингове

- `src/i18n/messages.ts` – централен речник с UI текстове:
  - структура тип:
    - `messages = { bg: { nav: { wiki: "Wiki", practice: "Практика" }, auth: {...}, ... }, en: { ... } }`;
  - разделяне по домейни (nav, auth, wiki, practice, common) за четимост.
- Използване чрез helper функция, напр.:
  - `export function t(lang: SupportedLang, path: string): string` или по-типизиран вариант с TS generics.

### 4.3. Достъп до текущия език в компонентите

- **Server components (страници):**
  - продължават да четат `searchParams.lang` и да го нормализират локално;
  - при нужда от UI текстове използват `t(lang, "...")` директно.
- **Client components (навигация, бутони и др.):**
  - могат да използват hook, който чете езика от URL (чрез `useSearchParams`) и го нормализира:
    - `useCurrentLang()` → връща `SupportedLang`;
  - алтернативно (future): context, който да съхранява `lang`, и да се инициализира от server component-а.

### 4.4. HTML `lang` атрибут

- **Текущо:** `<html lang="en">` е статично.
- **Future за EPIC-CROSS-I18N:**
  - когато въведем cookie `ui_lang`, можем на server-side (в layout или middleware) да:
    - прочетем езика от cookie/URL;
    - зададем `<html lang="bg" | "en">` според избрания език.

---

## 5. Поетапен rollout план (примерни stories)

### Фаза 1 – Завършване на Wiki slice (Done)

- `STORY-MVP-WIKI-LANGUAGE-SWITCH` (FE):
  - глобален header `LanguageSwitcher` (dropdown BG/EN);
  - `/wiki` и `/wiki/[slug]` ползват `lang` за филтриране/зареждане на съдържанието;
  - 404 при липсваща езикова версия на статията;
  - unit тестове за `LanguageSwitcher`, `/wiki` и `/wiki/[slug]`.

### Фаза 2 – I18n foundation + общ layout/nav (BG/EN)

**Story: `STORY-MVP-CROSS-I18N-FE-FOUNDATION` (обединено foundation + layout/nav)**

- Dev задачи (FE):
  - добавяне на `src/i18n/config.ts` и `src/i18n/messages.ts`;
  - въвеждане на `SupportedLang` + `normalizeLang` като централен helper;
  - имплементация на `useCurrentLang()` hook за client компоненти;
  - smoke тестове за i18n helper-ите;
  - адаптиране на основния публичен layout shell и навигацията да използват i18n речниците вместо твърди BG стрингове;
  - осигуряване, че при различни стойности на `?lang=` (BG/EN) навигацията показва коректните преводи за основните менюта (Wiki, Practical UI, Training API, Login/Register, Account и др.).

### Фаза 3 – Превод на ключови екрани (примерен ред)

- Story за Auth екрани (`/login`, `/register`):
  - форм labels, бутони, error messages → през i18n речника.
- Story за Practice / Sandbox UI:
  - основни заглавия, подсказки и бутонни текстове.
- При нужда – отделно story за public landing / home.

### Фаза 4 – Персистиране на езика и SSR подобрения

**Ново story: `STORY-MVP-CROSS-I18N-PERSISTENCE`**

- При промяна на езика през header-а:
  - записване на `ui_lang` cookie;
  - синхронизация между URL и cookie (URL има приоритет).
- При първоначален достъп без `?lang=`:
  - ако има `ui_lang` cookie → използваме него за начален език;
  - иначе fallback `bg`.
- (По желание) middleware / server-side logic за задаване на `<html lang=...>`.

---

## 6. Тестове и документация

- **Автоматизирани тестове:**
  - unit тестове за i18n helper-ите (`normalizeLang`, `useCurrentLang`, `t`);
  - компоненти, които ползват преводи, да имат поне smoke тест (проверка, че показват правилния текст за BG/EN).
- **Manual QA сценарии:**
  - смяна на езика през header-а на различни екрани (Wiki, Login, Practice) и проверка на текстовете;
  - поведение при директен линк с `?lang=en` vs. без `lang` с налично `ui_lang` cookie;
  - проверка на 404 при `/wiki/[slug]?lang=en` без EN версия.
- **Документация:**
  - кратко резюме във `fe/README.md` за това, че:
    - `LanguageSwitcher` задава глобален `lang` параметър;
    - всички нови публични екрани трябва да използват i18n helper-ите и да уважават избрания език.
