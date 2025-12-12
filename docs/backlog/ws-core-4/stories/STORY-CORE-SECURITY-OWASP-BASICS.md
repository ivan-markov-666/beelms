# STORY-CORE-SECURITY-OWASP-BASICS – OWASP hardening (Helmet + CSP)

## Summary
Като **оператор**, искам базово OWASP hardening на API-то (security headers + CSP + request limits), за да намалим риска от common web атаки.

## Links to BMAD artifacts
- `docs/backlog/beelms-core-epics-and-stories.md` §4.11 (EPIC-CORE-CROSS-SECURITY)

## Scope (MVP)
- Global HTTP security headers via Helmet.
- Content-Security-Policy (CSP).
- Request body size limits.

## Acceptance Criteria
- API отговорите съдържат security headers (минимум):
  - `content-security-policy`
  - `x-content-type-options`
  - `referrer-policy`
- CSP е активен и не чупи `wiki/media` ресурси, които се зареждат от frontend origin.
- E2E тест проверява наличието на ключовите headers.

## Notes / Constraints
- Helmet defaults (COEP/CORP) могат да блокират cross-origin resource loads. За MVP: конфигурираме така, че да не чупи frontend integration.

## Dev Tasks
- [ ] Add `helmet` dependency.
- [ ] Configure Helmet in `be/src/main.ts` with CSP.
- [ ] Configure JSON request body size limit.
- [ ] Add e2e test that asserts headers exist.

## Test Plan (local)
- `cd be`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
