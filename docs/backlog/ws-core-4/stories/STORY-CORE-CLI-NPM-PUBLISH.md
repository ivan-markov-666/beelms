# STORY-CORE-CLI-NPM-PUBLISH – Publish-ready CLI package (create-beelms-app)

## Summary
Като **developer**, искам **CLI-то `create-beelms-app` да може да се използва извън това repo (npm/npx)**, за да **scaffold-ва нов beelms core проект без да зависи от локалния monorepo**.

## Links to BMAD artifacts
- Backlog index – `docs/backlog/beelms-core-epics-and-stories.md` §4.7 (EPIC-CORE-DX-CLI-INFRA)
- WS-CORE-4 design – `docs/sprint-artifacts/beelms-core-ws-core-4-cli-design.md`

## Acceptance Criteria
- CLI пакетът може да бъде използван **извън** `qa-4-free` repo (напр. чрез `npm pack` + `npx <tarball>`), без да разчита на наличието на `be/` и `fe/` директории.
- CLI продължава да поддържа `--api-only` / `--no-web`.
- CLI bundle-ва/включва нужните template файлове в npm пакета (api/web templates), така че scaffold-ът да е self-contained.
- Има “publish-ready” конфигурация в `tools/create-beelms-app/package.json`:
  - `bin` работи коректно
  - пакетът включва само нужните файлове (напр. чрез `files` или `.npmignore`)
  - може да се изпълни `npm pack` и полученият tarball да работи като CLI
- Има описан **локален test plan** за валидиране без GitHub Actions.

## Dev Tasks
- [ ] Добавяне на механизъм за sync/bundle на template-ите към `tools/create-beelms-app` (напр. `templates/` директория + prepack скрипт).
- [ ] Промяна на CLI кода да чете templates от bundled път (с fallback за dev режим в repo).
- [ ] Настройка на `package.json` за publish-ready поведение (`files`, `bin`, versioning и т.н.).
- [ ] Smoke/pack тест: `npm pack` + `npx` изпълнение на tarball-а в temp директория.

## Test Plan (local)
- 1) В `tools/create-beelms-app`:
  - `npm ci`
  - `npm pack`
- 2) В произволна празна папка:
  - `.tgz` файлът се създава в текущата директория при `npm pack` (напр. `tools/create-beelms-app/create-beelms-app-0.1.0.tgz`).
  - **Важно (Windows / npm exec):** ако тестовата папка е *под* директория, която съдържа `package.json`, `npx` може да резолвира `file:../...` спрямо най-близкия parent `package.json`, а не спрямо текущата директория.
  - Препоръчан вариант:
    - използвай **абсолютен път** към `.tgz`:
      - `npx --yes --package "D:\\Projects\\qa-4-free\\tools\\create-beelms-app\\create-beelms-app-0.1.0.tgz" create-beelms-app my-lms --api-only`
    - или тествай от папка **извън** repo-то (напр. `D:\\tmp\\beelms-pack-test`).
- 3) Проверка, че `my-lms/api`, `my-lms/docker`, `my-lms/env` са създадени.
- 4) (Optional) Docker smoke:
  - `cd my-lms/docker`
  - `docker compose up --build -d`
  - `docker compose exec api npm run test:regression:local`

## Notes
- GitHub Actions са disabled (billing lock), така че валидираме локално чрез `npm pack` и smoke.
- Не целим “реално публикуване” в npm registry в този story, ако има организационни/акаунт ограничения; целта е пакетът да е publish-ready и проверим чрез tarball.
