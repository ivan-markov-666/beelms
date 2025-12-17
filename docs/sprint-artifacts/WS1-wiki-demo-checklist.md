# WS-1 – Wiki Demo & Test Checklist

## Demo flow

- [ ] Отваряне на `/wiki` като гост.
- [ ] Зареждане на списък със статии (само `Active`).
- [ ] Отваряне на статия `/wiki/[slug]`.
- [ ] Смяна на `lang` (ако е налично) и валидиране на поведението.

## API checks

- [ ] `GET /api/wiki/articles` връща 200.
- [ ] `GET /api/wiki/articles/{slug}` връща 200 за валиден slug.
- [ ] 404 за невалиден slug.

## Data/DB checks

- [ ] DB е инициализирана (migrations + seed) и има поне 2–3 статии.
