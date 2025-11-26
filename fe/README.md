This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## WS-1 Wiki integration

For the WS-1 walking skeleton, the `/wiki` page in this Next.js app depends on the backend Wiki API:

- `GET http://localhost:3000/api/wiki/articles`

For the MVP Wiki search and language filter (`STORY-MVP-WIKI-SEARCH-FILTER`), the `/wiki` page also:

- exposes a search input and language dropdown (BG/EN);
- forwards the selected filters to the backend as `q` (search query) and `lang` (language) query parameters.

For the MVP Wiki list pagination (`STORY-MVP-WIKI-LIST-PAGINATION`), the `/wiki` page:

- forwards `page` and `pageSize` query parameters to the backend;
- uses a fixed `pageSize = 20` (see `PAGE_SIZE` constant in `src/app/wiki/page.tsx`);
- shows pagination controls (Previous/Next + "Страница N") when there is more than one page or when you navigate to a page > 1.

Useful manual test URLs (assuming FE is running on `http://localhost:3001`):

- `http://localhost:3001/wiki` – first page, default filters;
- `http://localhost:3001/wiki?page=2` – out-of-range page with empty result set;
- `http://localhost:3001/wiki?q=Начало&lang=bg&page=2` – pagination combined with search and language filter.

To see real Wiki data on `/wiki`:

1. Start the backend and database (see `be/README.md`), then apply migrations and the Wiki seed:
   - `docker compose up --build`
   - `docker compose exec api npm run migration:run`
   - `docker compose exec api npm run seed:wiki`
2. Start the frontend:

```bash
cd fe
npm install
npm run dev -- -p 3001
```

3. Open `http://localhost:3001/wiki` in your browser.

### Wiki FE tests

This project includes basic tests for the Wiki list and article pages, built on shared Wiki components in `src/app/wiki/_components`.

To run them:

```bash
cd fe
npm install
npm test
```

### Language switcher and global i18n roadmap

- The global header `LanguageSwitcher` (BG/EN) controls the `lang` query parameter for all public pages.
- The `/wiki` and `/wiki/[slug]` pages already consume this `lang` parameter and forward it to the backend Wiki API (see `STORY-MVP-WIKI-LANGUAGE-SWITCH`).
- Future work for making other UI screens multi-language is tracked in:
  - `docs/architecture/epic-cross-i18n.md` – mini tech-spec for global language behaviour;
  - `docs/backlog/ws-1/stories/STORY-MVP-CROSS-I18N-FE-FOUNDATION.md` – FE i18n foundation and layout/nav translations.
