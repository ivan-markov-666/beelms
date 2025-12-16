Ще ти подготвя изчерпателен checklist: за всеки FE unit test файл ще има точно една Jest команда (от папка `fe`). Ще ги групирам по модул (auth, admin, wiki, i18n, и т.н.), за да може да ги минаваме подред. Сега ще извлека пълния списък тестови файлове от `fe/src` и ще обновя вътрешния TODO план.



Ето пълен checklist с команди за **всеки** FE unit тест файл.  
Предполага се, че си в папка `fe`:

```bash
cd C:\path\to\repo\fe
```

Ползвам `npm`. Ако искаш `pnpm`, просто замени `npm` с `pnpm`.

---

### i18n

- **i18n – config.test.ts**  - pass
  Команда:  
  ```bash
  npm test -- src/i18n/__tests__/config.test.ts --runInBand
  ```

- **i18n – t.test.ts**  - pass
  Команда:  
  ```bash
  npm test -- src/i18n/__tests__/t.test.ts --runInBand
  ```

---

### Wiki – страници

- **wiki – wiki-page.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/wiki/__tests__/wiki-page.test.tsx --runInBand
  ```

- **wiki – wiki-article-page.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/wiki/__tests__/wiki-article-page.test.tsx --runInBand
  ```

---

### Wiki – компоненти

- **wiki components – language-switcher.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/wiki/_components/__tests__/language-switcher.test.tsx --runInBand
  ```

- **wiki components – wiki-article-actions.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/wiki/_components/__tests__/wiki-article-actions.test.tsx --runInBand
  ```

---

### Auth

- **auth – login-page.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/auth/__tests__/login-page.test.tsx --runInBand
  ```

- **auth – register-page.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/auth/__tests__/register-page.test.tsx --runInBand
  ```

- **auth – forgot-password-page.test.tsx**   - pass
  Команда:  
  ```bash
  npm test -- src/app/auth/__tests__/forgot-password-page.test.tsx --runInBand
  ```

- **auth – reset-password-page.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/auth/__tests__/reset-password-page.test.tsx --runInBand
  ```

- **auth – verify-email-page.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/auth/__tests__/verify-email-page.test.tsx --runInBand
  ```

- **auth – profile-page.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/auth/__tests__/profile-page.test.tsx --runInBand
  ```

---

### Admin – layout & dashboard

- **admin – admin-layout.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/admin/__tests__/admin-layout.test.tsx --runInBand
  ```

- **admin – admin-dashboard-page.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/admin/__tests__/admin-dashboard-page.test.tsx --runInBand
  ```

---

### Admin – users

- **admin users – admin-users-page.test.tsx** - pass  
  Команда:  
  ```bash
  npm test -- src/app/admin/users/__tests__/admin-users-page.test.tsx --runInBand
  ```

---

### Admin – wiki

- **admin wiki – admin-wiki-page.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/admin/wiki/__tests__/admin-wiki-page.test.tsx --runInBand
  ```

- **admin wiki – admin-wiki-edit-page.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/admin/wiki/__tests__/admin-wiki-edit-page.test.tsx --runInBand
  ```

---

### Legal

- **legal – legal-pages.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/legal/__tests__/legal-pages.test.tsx --runInBand
  ```

---

### Споделени компоненти

- **components – header-nav.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/_components/__tests__/header-nav.test.tsx --runInBand
  ```

- **components – site-footer.test.tsx**  - pass
  Команда:  
  ```bash
  npm test -- src/app/_components/__tests__/site-footer.test.tsx --runInBand
  ```

---

Можеш да ги ползваш като checklist:

1. Пускаш първата команда.  
2. Ако тестът „гърми“, копираш грешката тук → ще го оправяме заедно.  
3. Когато стане зелен, минаваш на следващия ред от списъка.

Кажи ми с кой тест искаш да започнем (или просто пусни командата и ми дай изхода).