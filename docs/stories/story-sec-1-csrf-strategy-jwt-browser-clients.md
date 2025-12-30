# STORY-SEC-1: CSRF strategy for JWT + browser clients

_BMAD Story Spec | EPIC: EPIC-CROSS-SECURITY | Status: 🟡 Planned_

---

## 1. Goal

Да дефинираме и документираме **ясна CSRF стратегия** за BeeLMS, така че FR-CROSS-4 (CSRF/XSS/SQLi/brute force) да има конкретно техническо решение за текущия auth модел.

Контекст:
- FE ползва Bearer token (access token) в `Authorization` header.
- Не разчитаме на cookie-based session authentication за protected API calls.

---

## 2. Decision

### 2.1 Primary approach (MVP)

- **CSRF protection е N/A за protected endpoints**, защото удостоверяването е чрез Bearer token в `Authorization` header, който **не се изпраща автоматично от браузъра** към third-party origin.
- Оставаме с CORS + `Authorization` header + JWT guard като основен механизъм.

### 2.2 When CSRF becomes required

CSRF става релевантен, ако преминем към:
- cookie-based auth (HttpOnly session cookies / refresh cookies), или
- включим `credentials: "include"` за cross-site cookies, или
- добавим state-changing публични endpoints, които не изискват token.

В този случай ще имплементираме една от опциите:
- **Double-submit cookie** (CSRF token cookie + header)
- **Synchronizer token pattern** (server-issued token)

---

## 3. Acceptance Criteria

### 3.1 Documentation

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | В `docs/product/prd.md` и `docs/architecture/mvp-feature-list.md` е ясно описано какво означава CSRF защита в контекста на Bearer tokens | 🟡 |
| AC-2 | Има кратка section/решение в `docs/architecture/beelms-core-architecture.md` (Auth & Security) за CSRF | 🟡 |
| AC-3 | Има “trigger conditions” списък кога CSRF трябва да се имплементира (cookie auth / credentials include / etc.) | 🟡 |

### 3.2 Runtime safeguards (MVP)

| # | Criterion | Status |
|---|-----------|--------|
| AC-4 | CORS е конфигуриран да позволява само trusted FE origin-и (не wildcard) | ✅ |
| AC-5 | State-changing endpoints изискват JWT, освен изрично публичните (напр. `/auth/*`, `/analytics/track`) | ✅ |

---

## 4. Technical Implementation (Where)

### Backend

- CORS config: `be/src/main.ts`
- Security headers: helmet middleware (`be/src/main.ts`)
- Auth: `JwtAuthGuard` и guards по контролери

### Frontend

- Token transport: `Authorization: Bearer ...` в `fetch` calls

---

## 5. Notes

- Това story не добавя нов функционален код; то formalizes decision и минимизира drift спрямо PRD.
