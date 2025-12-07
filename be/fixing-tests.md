Ще превключим към backend тестовете в `be/` и ще ти извадя чеклист както за FE: списък с всички тестови файлове + точните команди как да ги пускаш един по един. За целта ще погледна [be/package.json](cci:1://file:///d:/Projects/qa-4-free/fe/src/app/_components/__tests__/header-nav.test.tsx:124:6-129:8), за да видя как се стартират тестовете, и ще изровя всички `*.spec.ts`/`*.test.ts` файлове в `be/test`. После ще ти върна структуриран списък.




Да, да минем към `be` тестовете и да ги правим по същия „checklist“ модел.

Ще приемам, че **си в папка** `d:\Projects\qa-4-free\be`.

---

## 1. Unit / service tests (Jest, `src/*.spec.ts`)

Команди (пускат се с `npm test -- <pattern>`):

- **App controller – app.controller.spec.ts**  - pass
  ```bash
  npm test -- src/app.controller.spec.ts
  ```

- **Tasks – tasks.service.spec.ts**  - pass
  ```bash
  npm test -- src/tasks/tasks.service.spec.ts
  ```

- **Auth – auth.service.spec.ts**  - pass
  ```bash
  npm test -- src/auth/auth.service.spec.ts
  ```

- **Auth – account.service.spec.ts** - pass 
  ```bash
  npm test -- src/auth/account.service.spec.ts
  ```

- **Auth – admin-users.service.spec.ts**  - pass
  ```bash
  npm test -- src/auth/admin-users.service.spec.ts
  ```

- **Auth – admin-metrics.service.spec.ts**  - pass
  ```bash
  npm test -- src/auth/admin-metrics.service.spec.ts
  ```

- **Auth – jwt-auth.guard.spec.ts**  - pass
  ```bash
  npm test -- src/auth/jwt-auth.guard.spec.ts
  ```

- **Wiki – wiki.service.spec.ts**  - pass
  ```bash
  npm test -- src/wiki/wiki.service.spec.ts
  ```

- **Training – training.service.spec.ts**  - pass
  ```bash
  npm test -- src/training/training.service.spec.ts
  ```

Може да добавиш `--runInBand` ако искаш всичко да върви строго последователно:

```bash
npm test -- src/auth/auth.service.spec.ts --runInBand
```

---

## 2. E2E тестове (Jest, `test/*.e2e-spec.ts`)

Тези минават през `npm run test:e2e` (Jest с [test/jest-e2e.json](cci:7://file:///d:/Projects/qa-4-free/be/test/jest-e2e.json:0:0-0:0)):

- **Core – app.e2e-spec.ts**  - pass
  ```bash
  npm run test:e2e -- test/app.e2e-spec.ts
  ```

- **Auth – auth.e2e-spec.ts**  - pass 
  ```bash
  npm run test:e2e -- test/auth.e2e-spec.ts
  ```

- **Account – account.e2e-spec.ts**  - pass 
  ```bash
  npm run test:e2e -- test/account.e2e-spec.ts
  ```

- **Tasks – tasks.e2e-spec.ts**  - pass 
  ```bash
  npm run test:e2e -- test/tasks.e2e-spec.ts
  ```

- **Admin metrics – admin-metrics.e2e-spec.ts**  - pass 
  ```bash
  npm run test:e2e -- test/admin-metrics.e2e-spec.ts
  ```

- **Admin users – admin-users.e2e-spec.ts**  - pass 
  ```bash
  npm run test:e2e -- test/admin-users.e2e-spec.ts
  ```

- **Admin wiki – list – admin-wiki-list.e2e-spec.ts**  - pass 
  ```bash
  npm run test:e2e -- test/admin-wiki-list.e2e-spec.ts
  ```

- **Admin wiki – edit – admin-wiki-edit.e2e-spec.ts**  - pass 
  ```bash
  npm run test:e2e -- test/admin-wiki-edit.e2e-spec.ts
  ```

- **Admin wiki – versions – admin-wiki-versions.e2e-spec.ts** - pass  
  ```bash
  npm run test:e2e -- test/admin-wiki-versions.e2e-spec.ts
  ```

- **Wiki – list – wiki-list.e2e-spec.ts**  - pass
  ```bash
  npm run test:e2e -- test/wiki-list.e2e-spec.ts
  ```

- **Wiki – article – wiki-article.e2e-spec.ts**  - pass 
  ```bash
  npm run test:e2e -- test/wiki-article.e2e-spec.ts
  ```

- **Wiki – db smoke – wiki-db.e2e-spec.ts**   - pass
  ```bash
  npm run test:e2e -- test/wiki-db.e2e-spec.ts
  ```

- **Training API – training-api.e2e-spec.ts**  - pass
  ```bash
  npm run test:e2e -- test/training-api.e2e-spec.ts
  ```

---

## Как да продължим

- Използвай този списък като **нов checklist** за `be` (можеш да го копираш в нова секция под FE тестовете).  
- Пускаш първия тест, ако „гърми“:
  - копираш Jest грешката тук и ще го оправяме по същия подход, както за FE.
- Когато стане зелен – отбелязваш `pass` и минаваме на следващия.

Кажи с кой тест искаш да започнем – примерно `auth.service.spec.ts` или някой от e2e (`auth.e2e-spec.ts`).