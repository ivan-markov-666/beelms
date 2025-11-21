# QA4Free – Design System (MVP)

_Роля: UX Designer / UI Developer. Фаза: BMAD Phase 2 – Prototypes. Този документ дефинира базова дизайн система за MVP версията на QA4Free._

## 1. Обхват

- Основни цветове (зелено/червено) + неутрални.
- Типография (основен шрифт и размери).
- Базови UI компоненти: бутони, текстови полета, линкове, съобщения за грешки/успех.
- Прилага се за основните екрани: Auth, Wiki, Sandbox UI, Training API, Admin.

---

## 2. Цветова палитра

QA4Free използва Tailwind CSS, затова палитрата стъпва върху Tailwind цветове.

### 2.1. Основни цветове

- **Primary Green** – основен акцент (бутон „Login“, „Register“, primary actions)
  - Пример: Tailwind `green-500` / HEX `#22C55E`.
- **Danger Red** – действия за изтриване/деактивиране, съобщения за грешки
  - Пример: Tailwind `red-500` / HEX `#EF4444`.

### 2.2. Неутрални цветове

- **Text Primary** – основен текст: почти черно / тъмно сиво
  - Пример: `#111827` (Tailwind `gray-900`).
- **Text Secondary** – вторичен текст / описания
  - Пример: `#4B5563` (Tailwind `gray-600`).
- **Background** – основен фон
  - Пример: `#F9FAFB` (Tailwind `gray-50`).
- **Surface** – панели, карти, модали
  - Пример: `#FFFFFF`.
- **Border** – рамки на полета, разделители
  - Пример: `#E5E7EB` (Tailwind `gray-200`).

---

## 3. Типография

- **Основен шрифт:** Sans-serif, съвместим с Tailwind по подразбиране (напр. `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `sans-serif`).

### 3.1. Размери и стилове

- **H1 (Page title)** – ~24–30px, bold
- **H2 (Section title)** – ~20–24px, semi-bold
- **Body** – ~14–16px, normal
- **Caption / helper text** – ~12–14px, normal, Text Secondary

Използването на шрифтове трябва да бъде консистентно на всички екрани (Auth, Wiki, Admin и т.н.).

---

## 4. Бутони

### 4.1. Primary Button

- Използване:
  - основни действия: „Login“, „Register“, „Save“, „Add row“, „Execute“ (в Training API страницата, ако е собствен бутон).
- Визия:
  - Фон: Primary Green.
  - Текст: бял (`#FFFFFF`).
  - Border: none или в същия цвят.
  - Hover: по-тъмен зелен (напр. `green-600`).
  - Disabled: по-светъл зелен + намален контраст.

### 4.2. Secondary Button

- Използване:
  - второстепенни действия: „Cancel“, „Back to list“.
- Визия:
  - Фон: Surface (`#FFFFFF`).
  - Текст: Text Primary.
  - Border: неутрален Border цвят.
  - Hover: леко засилен фон (напр. `gray-50`).

### 4.3. Danger Button

- Използване:
  - Destructive действия: „Delete“, „Deactivate account“, „Delete version“.
- Визия:
  - Фон: Danger Red.
  - Текст: бял.
  - Hover: по-тъмен червен (напр. `red-600`).

---

## 5. Текстови полета и формулярни елементи

### 5.1. Input (text/email/password/number)

- Фон: Surface.
- Border: неутрален Border цвят.
- Radius: леко закръгляне (напр. `rounded-md`).
- Focus state: border в Primary Green + лека сянка.
- Placeholder: Text Secondary, по-светъл от основния текст.

Състояния:
- Normal – описан по-горе.
- Disabled – по-светъл фон, курсорът показва, че не е интерактивно.
- Read-only – изглежда като normal, но не приема въвеждане.
- Error – червен border (Danger Red), съобщение под полето.

### 5.2. Textarea

- Същите правила като за input, но с по-голяма височина и възможност за resize (по дизайн решение може да е fixed или resizable).

### 5.3. Checkbox и Radio

- Използват Primary Green за отметката/избраното състояние.
- Label текст – Body размер, Text Primary.
- Състояния: checked/unchecked, disabled.

---

## 6. Линкове и съобщения

### 6.1. Линкове

- Цвят: синьо или Primary Green (по избор, но трябва да е консистентно).
- Underline при hover.

Примери:
- „Forgot password?“
- „Back to Wiki list“
- „Open in new tab“ (Training API)

### 6.2. Съобщения за грешки и успех

- **Error message**
  - Текст: Danger Red.
  - Може да включва икона за грешка.
  - Позиция: под съответното поле или в горната част на формата.
- **Success message**
  - Текст: в по-спокоен зелен или неутрален цвят.
  - Използва се напр. след успешна смяна на парола.

---

## 7. Прилагане към основните екрани

- **Auth екрани** (Login, Register, Forgot/Reset, Account):
  - Използват primary бутони за основни действия.
  - Формите следват стандарта за input-и и съобщения.
- **Wiki**:
  - Чист layout с фокус върху четимостта на текста (Body + H1/H2).
  - Линковете към статии са ясно разграничени (цвят/underline).
- **Sandbox UI**:
  - Използва същите базови стилове, но с по-голямо разнообразие от елементи за упражнения.
- **Training API**:
  - Страницата около Swagger UI е в тон с останалия сайт (заглавие, описателен текст, линкове).
- **Admin**:
  - KPI карти, таблици и филтри използват същата неутрална палитра и компоненти.

---

Тази дизайн система е базова и покрива MVP. В бъдещи фази може да бъде разширена с допълнителни компоненти (таблици, модали, tooltips и др.) и да се изнесе в споделена UI библиотека.
