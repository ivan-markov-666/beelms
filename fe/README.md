This is the frontend of the **beelms** framework (BeeLMS example instance), built as a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

### 1.2. Екран „Wiki статия“

- Действия върху статията:
  - бутон „Сподели“ – използва Web Share API, когато е налично, за споделяне на URL адреса на статията, а при липсваща поддръжка пада обратно към копиране на линка в клипборда (или показване на URL в alert);
  - бутон „Принтирай“ – отваря стандартния print диалог на браузъра за текущата статия.

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

#### 1.2.1. Markdown-related Jest mocks

The Wiki FE tests run in a Jest/Node environment, while some markdown-related dependencies
(`react-markdown`, `remark-gfm`, `rehype-raw`) are ESM-only packages.

To keep the tests simple and stable, we mock these modules in Jest:

- Jest config: `fe/jest.config.cjs`
  - `moduleNameMapper` maps `react-markdown`, `remark-gfm` and `rehype-raw` to local mocks.
- Mocks live in `fe/test/__mocks__/`:
  - `react-markdown.tsx` – renders children inside a simple wrapper component;
  - `remark-gfm.ts`, `rehype-raw.ts` – no-op plugin mocks.

This way the tests focus on the Wiki UI behaviour (props, links, text, actions), without
depending on the full markdown/mermaid rendering pipeline.

### Language switcher and global i18n roadmap

- The global header `LanguageSwitcher` (BG/EN) controls the `lang` query parameter for all public pages.
- The `/wiki` and `/wiki/[slug]` pages already consume this `lang` parameter and forward it to the backend Wiki API (see `STORY-MVP-WIKI-LANGUAGE-SWITCH`), and the public header navigation uses the shared FE i18n helpers to render the Wiki/Login labels in BG/EN.
- The Auth screens (`/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`) also use the same FE i18n helpers: all labels, buttons and error/success messages are rendered in BG/EN according to the active `lang` parameter in the URL.
- Additional work for making other UI screens multi-language is documented in:
  - `docs/architecture/epic-cross-i18n.md` – mini tech-spec for global language behaviour;
  - `docs/backlog/ws-2/stories/STORY-MVP-CROSS-I18N-FE-FOUNDATION.md` – FE i18n foundation and layout/nav translations.

## WS-2 Auth & Profile integration

For the WS-2 Auth/Profile walking skeleton, the frontend depends on the Auth and Account API provided by the backend (see `be/README.md`):

- `POST /api/auth/register` and `POST /api/auth/login` for registration and login.
- `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` for the forgot/reset password flow.
- `GET /api/users/me`, `PATCH /api/users/me`, `POST /api/users/me/change-password`,
  `DELETE /api/users/me` and `POST /api/users/me/export` for the `/profile` page.

The `/auth/login`, `/auth/register` and `/profile` routes in this app expect a running backend on `http://localhost:3000/api`. On successful login, the JWT access token is stored in `localStorage` under the key `beelms_access_token`, which is then used by `/profile` to guard access and call the protected account endpoints.

Basic manual flow (assuming the backend and database are running as described in `be/README.md`):

1. Open `http://localhost:3001/auth/register` and create an account.
2. Login via `http://localhost:3001/auth/login`.
3. Navigate to `http://localhost:3001/profile` to view/update email, change password, export data, delete the account and log out.

### WS-2 Forgot/Reset password flow

The `/auth/forgot-password` and `/auth/reset-password` routes implement the UI for requesting and completing a password reset:

- `/auth/forgot-password` shows a form with email and a simple anti-bot checkbox (placeholder for a real CAPTCHA). On submit it calls `POST /api/auth/forgot-password` and, on success, always shows a generic message ("Ако има акаунт с този имейл, ще изпратим инструкции за смяна на паролата.") without revealing whether the email exists.
- `/auth/reset-password?token=...` shows a form for entering a new password and confirmation. On submit it calls `POST /api/auth/reset-password` with the token and the new password, shows a success message and then redirects back to `/auth/login` after a short delay.
- When the reset link is invalid or expired, the page shows an error message and offers a link back to `/auth/forgot-password` so the user can request a new link.

To test the full forgot/reset flow end-to-end in development:

1. Ensure the backend is running with the Auth Forgot/Reset API enabled (see `be/README.md` and `STORY-WS2-BE-AUTH-FORGOT-RESET`).
2. Open `http://localhost:3001/auth/forgot-password`, enter the email of an existing account, tick the anti-bot checkbox and submit the form.
3. In the backend logs (dev environment), copy the password reset link that is logged for that email.
4. Open the copied link in the browser (it will point to `/auth/reset-password?token=...` on the FE), enter a new password and submit.
5. Verify that you can log in with the new password via `http://localhost:3001/auth/login` and that the old password no longer works.

### WS-2 Email verification flow (registration and change email)

The email verification UX is implemented on top of the BE email verification API:

- After successful registration on `/auth/register`, the page:
  - calls `POST /api/auth/register`;
  - shows a success message instructing the user to check their email and confirm the address via a verification link;
  - redirects to `/auth/login`, where the user can log in with their credentials even if the email is not yet verified (MVP behaviour).
- The `/auth/verify-email?token=...` page:
  - reads the `token` query parameter and calls `POST /api/auth/verify-email`;
  - on success shows a confirmation message and a CTA button:
    - "Към профила" when a JWT access token is present in `localStorage`;
    - "Към страницата за вход" otherwise;
  - when the verification token is invalid or expired (`400`), shows a specific error message and a button back to `/auth/login` so the user can request a new link from their account;
  - when the backend returns `429` (the 3-per-24h email change verification limit has been reached), shows a limit-reached message and guides the user to open their profile to see more details about when the limit will reset;
  - on server/network errors shows a generic error message with a button back to the home page.
- When the user changes their email from `/profile`:
  - the UI sends `PATCH /api/users/me` with the new email address;
  - shows a message that a verification email has been sent to the new address and that the change will take effect after confirmation via the verification link (handled again by `/auth/verify-email`);
  - when the 3-per-24h limit is reached, the `/profile` page uses `emailChangeLimitReached` and `emailChangeLimitResetAt` from `GET /api/users/me` to show a clear warning and an approximate time when the limit will reset.

## WS-4 Admin shell & navigation

For the WS-4 Admin skeleton, the frontend provides a minimal Admin area that depends on the backend Auth/Profile API (including the `role` field from `GET /api/users/me`).

- The `/admin` route uses a dedicated Admin layout and is **guarded on the client side**:
  - when there is **no** `beelms_access_token` in `localStorage`, the user is redirected to `/auth/login`;
  - when a token is present but `GET /api/users/me` returns a non-admin role, the page renders a simple "Access denied" (403-style) message without further redirects;
  - only when `role === "admin"` does the Admin shell render its children.
- Inside the Admin shell, the header navigation includes:
  - a link to the Admin home (`/admin`);
  - a link to the Admin Wiki list (`/admin/wiki`), which renders a read-only list of Wiki articles for administrators.
- In the global header navigation (`HeaderNav`):
  - the **Admin** link (pointing to `/admin`) is shown **only** for authenticated users whose profile role is `admin`;
  - guests and non-admin users never see the Admin link in the global navigation.

The `/admin/wiki` page:

- calls the protected backend endpoint `GET /api/admin/wiki/articles` using the stored `beelms_access_token`;
- renders a table with `Slug`, `Title`, `Status` and `Updated` columns;
- visually distinguishes article statuses (e.g. Active, Draft, Archived) via colored badges;
- links each article slug to the public `/wiki/[slug]` page (opened in a new tab);
- shows a clear error message when the Admin Wiki list cannot be loaded.

## WS-6 Admin Wiki edit page

For WS-6, the Admin Wiki area adds a minimal but real edit UI for Wiki articles:

- the `/admin/wiki` list includes a **"Редактирай"** link for each article, which points to `/admin/wiki/[slug]/edit`;
- the edit page is available only to authenticated admin users (guarded by the same Admin layout and `beelms_access_token` logic as the rest of `/admin`);
- on the edit page, admins can change:
  - `language` (dropdown: `bg` / `en`);
  - `title` (text input);
  - `content` (textarea);
  - `status` (dropdown: `draft` / `active` / `inactive`);
- on first load, the page fetches the current article details from the public Wiki API (`GET /api/wiki/articles/{slug}`) with `cache: "no-store"`;
- on save, it calls the protected Admin Wiki endpoint `PUT /api/admin/wiki/articles/{id}` with the updated values and:
  - shows a success message and updates the form with the latest data on `200 OK`;
  - shows a specific message for `400` validation errors;
  - shows a generic error message for network/server errors.

### Admin Wiki versions UI

On the same `/admin/wiki/[slug]/edit` page, WS-6 also provides a minimal versions UI:

- below the edit form there is a **"Версии на статията"** table backed by `GET /api/admin/wiki/articles/{id}/versions` (using the stored `beelms_access_token`);
- each row shows:
  - `version` (e.g. `v1`, `v2`);
  - `language`;
  - `title`;
  - `createdAt` (formatted as local date/time);
  - `createdBy` (or `—` when missing);
- for every version there is a **"Върни"** action which:
  - asks for confirmation with a simple `window.confirm` dialog;
  - on confirm calls `POST /api/admin/wiki/articles/{id}/versions/{versionId}/restore` with the admin JWT;
  - on success shows "Статията беше върната към избраната версия.", updates the edit form with the restored article and refreshes the versions list;
  - on 400/404/500 shows a clear error message without да оставя страницата в неконсистентно състояние.

Useful manual test URLs (assuming FE on `http://localhost:3001` and BE on `http://localhost:3000`):

- `http://localhost:3001/admin/wiki` – Admin Wiki list (requires admin user);
- `http://localhost:3001/admin/wiki/getting-started/edit` – edit page for the seeded "getting-started" article.
