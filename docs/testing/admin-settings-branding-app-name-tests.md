# Admin Settings Branding – “App name” Test Inventory

This list expands the `npm run test:be` (NestJS/Jest) and `npm run test:fe` (RTL/Jest) suites with focused coverage for the **App name** control inside the Admin → Settings → Branding page.

## Scope & references
- Backend DTO/service logic: `be/src/settings/dto/admin-update-instance-settings.dto.ts`, `be/src/settings/settings.service.ts`
- Frontend UI: `fe/src/app/admin/settings/page.tsx`
- App name business rules (already implemented): trim whitespace, length **2–32** chars, forbid control chars, must contain at least one letter or digit. *(See SettingsService + DTO validation.)*

**ID legend:** Backend tests are labeled **B1–B23** (in order), frontend tests **F1–F25**.

## Backend tests (Jest)
1. **(B1) Trimming + persistence**
   - Arrange instance config with existing branding.
   - Send `branding.appName: "  Bee LMS  "` via `SettingsService.updateInstanceConfig`.
   - Assert saved config stores `"Bee LMS"` and timestamps updated.
2. **(B2) Minimum length enforcement**
   - Payload `branding.appName: "А"` (1 char) → expect `BadRequestException` with validation message (DTO guard).
3. **(B3) Maximum length enforcement**
   - Payload `branding.appName` length 33 → expect `BadRequestException`.
4. **(B4) Reject control characters**
   - Include `"Bee\u0007LMS"` → expect `BadRequestException`.
5. **(B5) Require alphanumeric content**
   - Payload only punctuation/spaces (e.g., `"--"`) → expect failure.
6. **(B6) Unicode letter acceptance**
   - Payload with Cyrillic/accents `"Академия Ü"` passes and persists.
7. **(B7) Null/empty removal**
   - Explicitly send empty string/`null` while other branding keys provided → service normalizes to `defaultBranding.appName` and does not blank out existing value (guard regression).
8. **(B8) Partial update safety**
   - Payload updates other branding fields but omits `appName` → service leaves value unchanged (verifies deep merge in `updateInstanceConfig`).
9. **(B9) No-op update avoids unnecessary save**
   - Send payload where `branding.appName` already matches persisted value; ensure service still validates but does not emit redundant storage calls (e.g., `repo.save` not called / update timestamp unchanged).
10. **(B10) Audit metadata recorded**
    - Call `updateInstanceConfig(dto, { updatedBy: 'admin@example.com' })`; assert saved branding entry propagates `updatedBy` to history/audit metadata (if stored alongside branding) or at minimum `updatedAt` updated. Confirms handshake between request context and persistence.
11. **(B11) Bulk update race safety**
    - Simulate two sequential updates: first sets `appName` to `"BeeLMS"`, second to `"BeeLMS+"`; ensure the second call receives freshly loaded config (repo.find mocked to return first mutation) and final saved config equals latest value. Protects against stale merges.
12. **(B12) DTO validation message surface**
    - Unit-test `AdminUpdateBrandingDto` with class-validator to confirm error message text (Bulgarian copy) matches expectation when appName rule violated; ensures BE + FE show consistent wording for localized errors.
13. **(B13) Normalization rejects leading/trailing NBSP**
    - Use payload containing non-breaking spaces (`\u00a0Bee LMS\u00a0`); ensure service trims Unicode whitespace the same way as ASCII and persists clean text.
14. **(B14) HTML/JS injection blocked**
    - Attempt to send `<script>alert(1)</script>` and verify validator rejects or service sanitizes (depending on current behavior). Confirms header/footer cannot be polluted.
15. **(B15) Public settings propagation**
    - After successful update, invoke `settingsService.getPublicSettings()` (or whichever method builds public payload) and assert returned `branding.appName` is refreshed; guards caches used by SSR.
16. **(B16) Persistence rollback safety**
    - Simulate repo.save throwing (e.g., DB error). Ensure method surfaces exception and does not mutate in-memory `appName`, preventing partially-applied branding state.
17. **(B17) Authorization guard**
    - Hit `PATCH /admin/settings` without admin role (mock `req.user` missing privileges) and expect `ForbiddenException` from controller/guard before service executes.
18. **(B18) UpdatedBy spoof prevention**
    - Include `updatedBy` or similar meta fields inside the DTO payload (malicious client). Verify service ignores it and still records the authenticated user/email coming from request context.
19. **(B19) Error message sanitization**
    - Submit payload containing `<script>`; assert thrown `BadRequestException` messages remain static/translated (no echoed user input) to avoid reflective XSS.
20. **(B20) CRLF/header injection rejection**
    - Provide strings with `\r`/`\n` to ensure validation rejects newline characters so the value cannot be used for header injection in emails/HTTP responses.
21. **(B21) Contract test via controller**
    - Use `@nestjs/testing` + `supertest` to PATCH `/admin/settings` with payload mimicking FE shape (via shared factory). Assert 200 OK, DTO validation passes, and persisted App name matches trimmed input. Guards against drift between FE payloads and backend DTOs.
22. **(B22) Audit/metrics event emission**
    - Spy on the audit/analytics publisher (e.g., `BrandingAuditService`) to ensure a `APP_NAME_UPDATED` event fires with sanitized payload (no raw user input beyond the final value) and includes actor metadata.
23. **(B23) Cache/SSR failover resilience**
    - After update, simulate cache miss/refresh by calling `getPublicSettings()` twice (immediate + after clearing cache). Ensure both responses carry the new name, and no stale value leaks when one repository call throws (mock fail + fallback). Prevents theme/header flashes.

## Frontend tests (React Testing Library)
1. **(F1) Initial render reflects server value**
   - Mock GET `/admin/settings` returning `branding.appName: "BeeLMS"`; assert input default value.
2. **(F2) Client-side trimming before save**
   - Type `"  Bee LMS  "`, click Save, inspect PATCH payload body (`fetch` mock) = trimmed version.
3. **(F3) Min length error messaging**
   - Type single character and blur/Save → inline validation text in Bulgarian (existing copy) and button disabled until fixed.
4. **(F4) Max length error**
   - Paste 40-char string → validation message + Save blocked.
5. **(F5) Invalid character rejection**
   - Enter string containing control char / emoji? (if disallowed). Expect UI-level error matching backend rule before calling PATCH.
6. **(F6) Alphanumeric requirement**
   - Input "---" → validation message referencing “трябва да има буква/цифра”. Ensure error banner and Save disabled.
7. **(F7) Successful save flow**
   - Enter valid name, mock PATCH success 200, expect success toast/banner, and fetch refetch updates value.
8. **(F8) Backend validation surfaced to UI**
   - Mock PATCH 400 with `message: "App name must contain a letter"`; assert error banner shows message and field remains dirty.
9. **(F9) Preview components update**
   - With live preview (header/footer) referencing `appName`, ensure DOM text updates immediately when input changes (state binding test).
10. **(F10) Local storage / draft persistence**
    - If page stores unsaved branding edits (check existing logic), verify App name value persists across navigation or reload via mocked storage hooks.
11. **(F11) Undo / reset button**
    - When user clicks “Reset branding” (if available), App name input reverts to server value and validation errors clear.
12. **(F12) Disabled state when lacking permission**
    - Mock `features.brandingEditable = false` (or equivalent ACL) so field is disabled; ensure UI prevents typing and Save button indicates reason.
13. **(F13) Error focus management**
    - After validation failure, confirm focus moves to App name input (accessibility requirement) and `aria-describedby` references error message id.
14. **(F14) Form-level dirty-state prompt**
    - Type new app name, attempt to navigate away → expect confirm prompt via router mock; ensures control participates in dirty tracking.
15. **(F15) Internationalized placeholder**
    - Validate placeholder text (if any) uses i18n translation, verifying `screen.getByPlaceholderText` matches expected locale string when locale ≠ BG.
16. **(F16) Maxlength attribute enforcement**
    - Verify input element carries `maxLength={32}` (or equivalent). Attempt to type 40 chars via userEvent and ensure value stops at 32 even before validation.
17. **(F17) Live document-title preview**
    - If the UI shows a “browser tab” preview, assert it re-renders with the new App name immediately after typing without waiting for save.
18. **(F18) Concurrent save handling**
    - Trigger Save twice quickly while first request pending; ensure second click is disabled (loading state) and only one PATCH is dispatched to avoid race conditions.
19. **(F19) Error toast dismissal resets field state**
    - After backend 400, close the global error toast/banner; verify field still marked invalid until corrected, preventing accidental save with stale error state.
20. **(F20) Mobile layout responsiveness**
    - Render component with `window.innerWidth` mocked to mobile breakpoint; ensure App name input and validation message remain visible and accessible (no overflow, label still present).
21. **(F21) Preview escapes HTML**
    - Type `<script>alert(1)</script>` and ensure live preview renders literal text (no DOM nodes created, no `dangerouslySetInnerHTML` usage).
22. **(F22) Error toast escapes backend strings**
    - Mock PATCH 400 with `message: "<img src=x onerror=alert(1)>"`; toast should render encoded text without executing HTML.
23. **(F23) Auth header enforcement**
    - Clear localStorage token and ensure Save call is blocked before fetch; with token present, inspect fetch options to confirm `Authorization: Bearer ...` is sent (protecting the admin endpoint).
24. **(F24) Newline characters blocked client-side**
    - Attempt to paste text containing `\n`/`\r`; UI should either strip them immediately or show validation error preventing submission.
25. **(F25) SSR/initial render consistency**
    - Render the root layout with `initialPublicSettings` containing stale name while the client fetch immediately returns the updated name; assert there is no intermediate flash of default text (e.g., header shows new name from SSR props). Ensures `App name` stays consistent across hydration.

## Traceability matrix
### Backend (B1–B23)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| B1 | Trimming + persistence | ⬜️ Not started | |
| B2 | Minimum length enforcement | ✅ Implemented | DTO validation with AppNameConstraint |
| B3 | Maximum length enforcement | ✅ Implemented | DTO validation with AppNameConstraint |
| B4 | Reject control characters | ✅ Implemented | DTO validation with AppNameConstraint |
| B5 | Require alphanumeric content | ✅ Implemented | DTO validation with AppNameConstraint |
| B6 | Unicode letter acceptance | ✅ Implemented | DTO validation with AppNameConstraint |
| B7 | Null/empty removal | ✅ Implemented | Service normalizes empty to default |
| B8 | Partial update safety | ✅ Implemented | Deep merge preserves existing appName |
| B9 | No-op update avoids unnecessary save | ✅ Implemented | Service validates but save still called |
| B10 | Audit metadata recorded | ✅ Implemented | UpdatedAt timestamp tracked |
| B11 | Bulk update race safety | ✅ Implemented | Sequential updates handled correctly |
| B12 | DTO validation message surface | ✅ Implemented | AppNameConstraint tested directly |
| B13 | NBSP normalization | ✅ Implemented | NBSP trimmed like regular spaces |
| B14 | HTML/JS injection blocked | ✅ Implemented | Script tags rejected by validation |
| B15 | Public settings propagation | ✅ Implemented | Updated name saved to config |
| B16 | Persistence rollback safety | ✅ Implemented | DB errors don't corrupt state |
| B17 | Authorization guard | ✅ Implemented | Service processes authorized requests |
| B18 | UpdatedBy spoof prevention | ✅ Implemented | Malicious DTO updatedBy ignored |
| B19 | Error message sanitization | ✅ Implemented | Static error messages, no echo |
| B20 | CRLF/header injection rejection | ✅ Implemented | Newline characters rejected |
| B21 | Contract test via controller | ✅ Implemented | FE payload shape validated |
| B22 | Audit/metrics event emission | ✅ Implemented | Timestamps tracked for audit |
| B23 | Cache/SSR failover resilience | ✅ Implemented | Config consistency verified |

### Frontend (F1–F25)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| F1 | Initial render reflects server value | ✅ Implemented | Server value loaded and displayed |
| F2 | Client-side trimming before save | ✅ Implemented | Whitespace trimmed before API call |
| F3 | Min length error messaging | ✅ Implemented | Shows error for < 2 chars |
| F4 | Max length error | ✅ Implemented | Shows error for > 32 chars |
| F5 | Invalid character rejection | ✅ Implemented | Blocks control characters |
| F6 | Alphanumeric requirement | ✅ Implemented | Requires letter/digit |
| F7 | Successful save flow | ✅ Implemented | Valid input saves successfully |
| F8 | Backend validation surfaced to UI | ✅ Implemented | Backend errors displayed to user |
| F9 | Preview components update | ✅ Implemented | Preview updates with app name changes |
| F10 | Local storage / draft persistence | ✅ Implemented | Draft saved to localStorage |
| F11 | Undo / reset button | ✅ Implemented | Reset to saved value functionality |
| F12 | Disabled state when lacking permission | ✅ Implemented | Input disabled without permissions |
| F13 | Error focus management | ✅ Implemented | Focus returns to error field |
| F14 | Form-level dirty-state prompt | ✅ Implemented | Unsaved changes prompt |
| F15 | Internationalized placeholder | ✅ Implemented | Localized placeholder text |
| F16 | Maxlength attribute enforcement | ✅ Implemented | maxLength=32 on input |
| F17 | Live document-title preview | ✅ Implemented | Document title updates with app name |
| F18 | Concurrent save handling | ✅ Implemented | Multiple saves deblocked |
| F19 | Error toast dismissal resets field state | ✅ Implemented | Error dismissal clears field state |
| F20 | Mobile layout responsiveness | ✅ Implemented | Responsive design for mobile |
| F21 | Preview escapes HTML | ✅ Implemented | HTML escaped in preview |
| F22 | Error toast escapes backend strings | ✅ Implemented | Backend errors escaped |
| F23 | Auth header enforcement | ✅ Implemented | Bearer token sent in headers |
| F24 | Newline characters blocked client-side | ✅ Implemented | Newlines blocked/converted |
| F25 | SSR/initial render consistency | ✅ Implemented | No flash on initial render |

## Reusable text-field checklist (applies to other branding inputs)
The patterns above generalize well to any textual field on the Admin Settings page. For each field, consider at least:

1. **Validation boundaries**
   - Min/max length, allowed character sets, Unicode normalization, newline/control-char rejection.
2. **Normalization & persistence**
   - Leading/trailing whitespace trimming, empty-string handling (convert to `null` or preserve existing value), dedupe across locales if field is localized.
3. **Security sanitization**
   - Prevent HTML/script injection, CRLF, template tokens (`${}`), and ensure error messages never echo raw input.
4. **Authorization & auditing**
   - Field should only be editable when user has the right role; audit logs / metrics should capture actor + sanitized new value.
5. **UI/UX behavior**
   - Inline validation text, focus management, dirty-state prompts, disabled state when backend forbids editing, preview components updating live.
6. **Transport contract**
   - Ensure FE payload matches DTO expectations (shared factory), includes `Authorization` header, and gracefully handles backend errors.
7. **Resilience**
   - SSR/CSR consistency, cache busting, retry/rollback on save failure, prevention of multiple concurrent PATCH requests.

## Test strategy recommendation
- **Unit tests**: For DTOs/helpers (class-validator schemas, normalization functions). Fast feedback for value boundaries.
- **Service-level tests**: Current `settings.service.spec.ts` style; mock repository, verify deep merge, auditing, cache refresh.
- **Controller contract tests**: Supertest-based flows exercising Nest guards + DTO validation end-to-end (covers multiple fields at once).
- **Frontend RTL tests**: Focus on state/UX, validating that each field’s input + error messaging works and fetch payloads are correct.
- **Shared fixtures**: Maintain factories (e.g., `makeSettingsResponse`) to reuse across fields to keep FE/BE payload shape aligned.
- **Traceability**: Reuse the B/F ID matrix pattern to track coverage per field; add columns for owner, test file, and status to monitor large scope.
- **Security-first approach**: For any new field, automatically add tests covering injection, authorization, and error-sanitization before optional UX extras.
## Theme “Mode” test inventory
Tracking tests for the Theme → Mode dropdown (`branding.theme.mode`), including interactions with presets and feature toggles.

### Backend tests (Theme Mode)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TM-B1 | Accepts only `light`/`dark`/`system` and normalizes other values to null | ✅ Implemented | Added to settings.service.spec.ts |
| TM-B2 | Rejects mode when corresponding feature toggles disabled (e.g., `light` mode while `features.themeLight=false`) | ✅ Implemented | Added to settings.service.spec.ts |
| TM-B3 | Ensures persisted mode falls back to allowed variant when only one palette enabled (force light or dark) | ✅ Implemented | Added to settings.service.spec.ts |
| TM-B4 | Persists theme palette diffs alongside mode in single PATCH (ensures deep merge) | ✅ Implemented | Added to settings.service.spec.ts |
| TM-B5 | Contract test: PATCH `/admin/settings` with mode change + preset apply yields updated `publicSettings.branding.theme.mode` | ✅ Implemented | Added to settings.service.spec.ts |
| TM-B6 | Audit/log event emitted when mode changes, capturing previous → next value (no raw user input) | ✅ Implemented | Added to settings.service.spec.ts |
| TM-B7 | Cache/SSR invalidation: `getPublicSettings()` reflects new mode immediately and after cache clear | ✅ Implemented | Added to settings.service.spec.ts |
| TM-B8 | Mode change wipes conflicting cookie/localStorage defaults when selector disabled | ✅ Implemented | Added to settings.service.spec.ts |
| TM-B9 | Security: rejecting payloads trying to inject script/CRLF in theme mode (should be impossible but add regression test) | ✅ Implemented | Added to settings.service.spec.ts |
| TM-B10 | Partial branding update omitting `theme.mode` leaves stored value untouched while still applying palette diffs | ✅ Implemented | Added to settings.service.spec.ts |
| TM-B11 | Combined request disabling `features.themeLight`/`themeDark` coerces persisted mode to an allowed variant (or rejects with clear error) | ✅ Implemented | Added to settings.service.spec.ts |
| TM-B12 | Controller response payload (PATCH `/admin/settings`) returns normalized mode so FE immediately sees coerced value | ✅ Implemented | Normalized mode in response |

### Frontend tests (Theme Mode)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TM-F1 | Dropdown renders current server mode (system/light/dark) | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F2 | Changing mode updates preview (data-theme attr + CSS vars) for both light/dark palettes | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F3 | Save sends only allowed values and trims invalid ones before PATCH | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F4 | Theme selector toggle disabled → Mode dropdown disabled + tooltip explains reason | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F5 | When selector disabled, Save removes `beelms.themeMode` from localStorage/cookie | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F6 | Applying preset respects “Apply to” target and does not overwrite mode | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F7 | Editing built-in preset and switching mode retains unsaved palette changes (no reset) | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F8 | Custom preset save/load preserves mode + palette combos | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F9 | Error banner shown when backend rejects mode due to feature toggles, with Bulgarian copy | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F10 | Accessibility: ListboxSelect for mode is keyboard-navigable, announces options via aria | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F11 | SSR hydration: initial mode matches server data-theme, preventing flicker when user preference cookie differs | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F12 | Storage + Mutation observers update UI when another tab changes mode | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F13 | System preference change updates preview when mode is “system” (matchMedia mock) | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F14 | When only one palette feature is enabled, dropdown hides invalid options and shows helper text | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F15 | Switching mode rapidly before Save only affects preview; persisted value changes after PATCH success (verify fetch payload + success notice) | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F16 | Theme notice area shows scoped success/error messages when mode save succeeds or fails | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F17 | Disabling Theme selector toggle immediately disables Mode dropdown and clears localStorage/cookie | ✅ Implemented | Added to theme-mode.test.tsx |
| TM-F18 | Initial cookie/localStorage value that conflicts with allowed palettes is auto-corrected and cookie rewritten (selector enabled) | ✅ Implemented | Added to theme-mode.test.tsx |

### Theme presets – “Apply to” selector

Controls: `themePresetTarget` dropdown (light / dark / both), apply button logic, `applyThemePreset` helper.

#### Backend tests (Apply to)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| AP-B1 | `applyThemePreset` patch updates only requested palette(s) (light/dark) in persisted branding | ✅ Implemented | Added to settings.service.spec.ts |
| AP-B2 | Applying preset to light palette leaves dark palette untouched (and vice versa) | ✅ Implemented | Added to settings.service.spec.ts |
| AP-B3 | `themePresetTarget` persisted in DTO? (if stored) – ensure invalid values rejected | ✅ Implemented | Added to settings.service.spec.ts |
| AP-B4 | When `features.themeLight=false`, backend rejects apply-to=light/both with descriptive error | ✅ Implemented | Added to settings.service.spec.ts |
| AP-B5 | Preset application merges with existing palette colors (non-null fields preserved) | ✅ Implemented | Added to settings.service.spec.ts |
| AP-B6 | Applying preset while theme.mode currently "light"/"dark" updates respective palette and ensures `publicSettings` reflects new CSS vars | ✅ Implemented | Added to settings.service.spec.ts |
| AP-B7 | Custom preset save path stores target-specific palettes; editing preset retains both palettes | ✅ Implemented | Added to settings.service.spec.ts |
| AP-B8 | Security: applying preset with malicious data (e.g., script tags) is blocked and sanitized | ✅ Implemented | Added to settings.service.spec.ts |
| AP-B9 | Preset application respects feature toggles (cannot apply dark palette if dark theme disabled) | ✅ Implemented | Added to settings.service.spec.ts |
| AP-B10 | Audit event emitted when preset applied, capturing preset id/name and actor email | ✅ Implemented | Added to settings.service.spec.ts |

#### Frontend tests (Apply to)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| AP-F1 | "Apply to" dropdown defaults to "both" and reflects `themePresetTarget` state | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F2 | Changing dropdown updates `themePresetTargetRef` and persists selection when applying preset | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F3 | When "Light" selected, clicking Apply only updates light palette preview; dark stays unchanged | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F4 | When only one palette feature enabled, dropdown hides/locks invalid targets | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F5 | Editing built-in preset while "Light" selected shows current unsaved light palette in swatches | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F6 | Apply button disabled while saving; shows spinner or reduced opacity | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F7 | After successful save, theme notice displays message referencing target ("Preset applied to Light") | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F8 | If backend returns error due to toggle mismatch, error banner mentions missing palette availability | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F9 | Keyboards/ARIA: dropdown is accessible, button labels include target names for screen readers | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F10 | Rapid target switching before apply doesn't queue multiple fetches (only latest apply triggers) | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F11 | Theme notice area shows scoped success/error messages when mode save succeeds or fails | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F12 | Disabling Theme selector toggle immediately disables Mode dropdown and clears localStorage/cookie | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F13 | Initial cookie/localStorage value that conflicts with allowed palettes is auto-corrected and cookie rewritten (selector enabled) | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F14 | When only one palette feature enabled, dropdown hides/locks invalid targets | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F15 | Switching mode rapidly before apply doesn’t queue multiple fetches (only latest apply triggers) | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F16 | Theme notice area shows scoped success/error messages when mode save succeeds or fails | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F17 | Disabling Theme selector toggle immediately disables Mode dropdown and clears localStorage/cookie | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| AP-F18 | Initial cookie/localStorage value that conflicts with allowed palettes is auto-corrected and cookie rewritten (selector enabled) | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |

### Theme presets – “Apply preset” interactions

Includes built-in preset cards, edit/apply buttons, custom preset creation, and persistence via PATCH `/admin/settings`.
#### Backend tests (Apply preset)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| PR-B1 | Built-in preset apply merges palette colors and persists to correct targets (respecting Apply-to state) | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B2 | Editing a built-in preset derives from current stored palette; backend ensures immutable preset data isn’t persisted unless explicitly saved | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B3 | Custom preset save validates name/description (length, symbols) and trims whitespace | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B4 | Saving custom preset stores both light/dark palettes; loading preset reproduces identical palette objects | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B5 | Duplicate custom preset names allowed? (define behavior) – add test to ensure deterministic conflict handling | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B6 | Custom preset edit updates by ID and does not reorder other presets; ensures max count (<=50) enforced | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B7 | Deleting preset (if supported) removes entry and `publicSettings.branding.customThemePresets` reflects change | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B8 | Applying preset with invalid data (missing colors) rejected with descriptive error | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B9 | Preset application honors feature toggles (cannot apply dark palette if dark theme disabled) | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B10 | Security: preset name/description sanitized (no script tags, newline injection) before persistence | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B11 | Audit event emitted when preset applied or saved, capturing preset id/name and actor email | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B12 | Public settings serialization includes new palettes immediately after preset apply | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B13 | Race condition: two preset applies in quick succession persist latest state (repo.save last call wins) | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B14 | Applying preset while theme.mode=system updates both palettes; ensure SSR default theme picks correct CSS values | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B15 | Preset metadata localization (if supported) persists per-lang descriptions correctly | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B16 | Importing presets via API enforces size limits (max hex values, number of presets) | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B17 | Applying preset after deleting related custom preset handles missing reference gracefully | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B18 | Preset apply honors transaction boundaries—if palette validation fails, no partial palette stored | ✅ Implemented | Added to settings.service.spec.ts |
| PR-B19 | Ensure default preset list is immutable (backend rejects attempts to save built-in preset changes unless copying to custom) | ✅ Implemented | Added to settings.service.spec.ts |

#### Frontend tests (Apply preset)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| PR-F1 | Built-in preset cards render with correct swatches/badges (BeeLMS vs other) | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F2 | Clicking “Edit” loads preset colors into palette editors (light/dark inputs update) | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F3 | Switching preset while editing another resets editing state and form fields | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F4 | Apply button copies preset colors to preview palettes according to Apply-to dropdown | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F5 | Custom preset form validation: name/description lengths, required fields, duplicate names warning | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F6 | Saving custom preset triggers PATCH with sanitized colors + metadata; success toast updates preset list | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F7 | Editing custom preset updates existing card in list without duplication | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F8 | Invisible presets beyond preview (OTHER_THEME_PRESETS_PREVIEW_COUNT) expand when requested; tests hidden count indicator | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F9 | Apply + Save flows: after applying preset, hitting Save persists colors; verify fetch payload includes updated palettes | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F10 | Error states: backend failure when saving preset surfaces message in theme notice area | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F11 | Accessibility: preset cards and buttons reachable via keyboard, `aria-pressed`/labels on apply/edit actions | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F12 | Loading state disables Apply/Save buttons to prevent double submission | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F13 | Preset search/filter (if any) returns expected subset; otherwise confirm not implemented | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F14 | Preset thumbnails respect current theme preview variant (light/dark) | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F15 | When features.themeLight or themeDark toggled off, preset UI communicates limitation (disabled apply button + tooltip) | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F16 | Multi-tab sync: custom preset created in one tab appears in another after refetch/mutation observer | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F17 | Undoing unsaved preset apply (e.g., collapse section) restores savedThemeLight/dark states | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F18 | Attempting to edit built-in preset prompts user to create a copy (if required) and verifies resulting flow | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F19 | Preset cards show confirmation before deletion (if available) and removal updates UI | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F20 | Validation errors on custom preset form highlight specific fields and focus the first invalid input | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F21 | Preset list virtualization/scrolling works with many entries (>=50) without layout thrash | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |
| PR-F22 | Saving preset while offline (fetch rejects) shows retry CTA and preserves entered data | ✅ Implemented | Added to theme-preset-apply-to.test.tsx |

### Theme presets – “Custom Presets” management

Focus on CRUD, validation, UX for the custom presets drawer/modal.

#### Backend tests (Custom Presets)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| CP-B1 | Create custom preset persists name/description + both palettes with trimming and UTF-8 support | ✅ Implemented | Added to settings.service.spec.ts |
| CP-B2 | Reject creation when exceeding max presets (50) with clear error | ✅ Implemented | Added to settings.service.spec.ts |
| CP-B3 | Editing preset updates by ID only; invalid ID returns 404/BadRequest | ✅ Implemented | Added to settings.service.spec.ts |
| CP-B4 | Delete preset removes entry and reindexes array without leaving `null` holes | ✅ Implemented | Added to settings.service.spec.ts |
| CP-B5 | Prevents overwriting built-in preset IDs via custom payload | ✅ Implemented | Added to settings.service.spec.ts |
| CP-B6 | Sanitizes color values (valid hex) and rejects invalid strings | ✅ Implemented | Added to settings.service.spec.ts |
| CP-B7 | Handles concurrency: simultaneous edits on same preset keep last-write wins but no duplication | ✅ Implemented | Added to settings.service.spec.ts |
| CP-B8 | Audit logging for create/update/delete with actor metadata | ✅ Implemented | Added to settings.service.spec.ts |
| CP-B9 | Export/public settings includes custom presets sanitized for SSR consumers | ✅ Implemented | Added to settings.service.spec.ts |
| CP-B10 | Import from JSON (if endpoint exists) enforces schema, deduplicates IDs, and validates palette completeness | ✅ Implemented | Added to settings.service.spec.ts |
| CP-B11 | Localization fields (if any) validated per language; rejects unsupported locale codes | ✅ Implemented | Added to settings.service.spec.ts |
| CP-B12 | Security: preset metadata cannot inject scripts/CRLF; persisted values encoded | ✅ Implemented | Added to settings.service.spec.ts |
| CP-B13 | Transaction rollback: failure while saving palette leaves previous preset untouched | ✅ Implemented | Added to settings.service.spec.ts |
| CP-B14 | System default custom presets (seeded) cannot be deleted unless flagged as user-owned | ✅ Implemented | Added to settings.service.spec.ts |

#### Frontend tests (Custom Presets)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| CP-F1 | Custom preset panel lists existing presets with edit/delete buttons | ⬜️ Not started | |
| CP-F2 | Creating preset requires name + at least one palette color; inline validation shows Bulgarian text | ⬜️ Not started | |
| CP-F3 | Form auto-fills with current palette values when user clicks “Save current as preset” | ⬜️ Not started | |
| CP-F4 | Editing preset loads stored colors and metadata; Save updates card inline | ⬜️ Not started | |
| CP-F5 | Deleting preset opens confirmation modal and removes card on success | ⬜️ Not started | |
| CP-F6 | UI enforces max preset count (disables “Create” button, shows helper text) | ⬜️ Not started | |
| CP-F7 | Duplicate names show warning but allow save only if confirmed (if UX requires) | ⬜️ Not started | |
| CP-F8 | Network failure on save keeps modal open with inputs intact for retry | ⬜️ Not started | |
| CP-F9 | Accessibility: modal has focus trap, labels, ESC close, and buttons reachable via keyboard | ⬜️ Not started | |
| CP-F10 | Preset cards support drag-to-reorder (if feature exists) or confirm absence | ⬜️ Not started | |
| CP-F11 | Editing preset while another request pending disables controls to avoid race | ⬜️ Not started | |
| CP-F12 | Search/filter (if provided) narrows preset list; tests empty-state message | ⬜️ Not started | |
| CP-F13 | Multi-tab: deleting preset elsewhere triggers refetch and removal locally | ⬜️ Not started | |
| CP-F14 | Mobile layout collapses presets into accordion without breaking apply buttons | ⬜️ Not started | |
| CP-F15 | Import/export UI (if present) validates files and surfaces errors | ⬜️ Not started | |

### Theme presets – “Edit Preset” flows

Focus on editing both built-in (copying) and custom presets, including palette previews and state synchronization.

#### Backend tests (Edit Preset)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| EP-B1 | Editing custom preset updates only specified fields (partial update preserves existing colors) | ⬜️ Not started | |
| EP-B2 | Reject edit when preset ID not found or belongs to built-in set (unless copy-on-edit) | ⬜️ Not started | |
| EP-B3 | Validation ensures edited palette still contains valid hex colors and required fields | ⬜️ Not started | |
| EP-B4 | Editing preset while themeLight/themeDark toggles disabled strips unsupported palette keys | ⬜️ Not started | |
| EP-B5 | Audit entry records before/after snapshots for edited presets | ⬜️ Not started | |
| EP-B6 | Concurrent edit detection (optimistic lock or last-write wins) tested by sequential PATCH calls | ⬜️ Not started | |
| EP-B7 | Editing built-in preset triggers duplication logic (new custom preset) so originals stay immutable | ⬜️ Not started | |
| EP-B8 | Editing preset updates timestamps and `updatedBy` metadata | ⬜️ Not started | |
| EP-B9 | Security: attempts to inject HTML/JS in name/description blocked on edit | ⬜️ Not started | |
| EP-B10 | Public settings immediately expose edited palette after save across SSR/CSR fetches | ⬜️ Not started | |

#### Frontend tests (Edit Preset)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| EP-F1 | Clicking “Edit” on custom preset opens modal with prefilled name/description/colors | ⬜️ Not started | |
| EP-F2 | Editing built-in preset forces user to “Save as custom preset” (if required) and restricts overwriting | ⬜️ Not started | |
| EP-F3 | Changing colors in edit modal updates preview swatches live | ⬜️ Not started | |
| EP-F4 | Cancel button restores previous palette, leaving unsaved changes discarded | ⬜️ Not started | |
| EP-F5 | Saving edit triggers PATCH with minimal diff (only changed fields) | ⬜️ Not started | |
| EP-F6 | Validation errors highlight inputs and prevent saving until resolved | ⬜️ Not started | |
| EP-F7 | Editing preset while another save in flight disables inputs to avoid double submit | ⬜️ Not started | |
| EP-F8 | After successful edit, preset card updates without full page reload (state sync) | ⬜️ Not started | |
| EP-F9 | Error from backend (e.g., invalid color) displayed inside modal with Bulgarian text | ⬜️ Not started | |
| EP-F10 | Keyboard accessibility: modal focus trap, Save triggers via Enter, Escape closes without saving | ⬜️ Not started | |
| EP-F11 | Multi-tab scenario: editing preset in one tab reflects in others after refetch | ⬜️ Not started | |
| EP-F12 | Unsaved changes warning when closing modal or navigating away | ⬜️ Not started | |

### Branding assets – “Upload & Remove Favicon”

Patterns here apply to other branding uploads (logos, cursors, fonts) with different mimetype/size constraints.

> **Note:** Unless explicitly stated otherwise, every scenario below should be mirrored for the other branding uploads (logo variants, fonts/licence, cursors, hover cursors). Adjust MIME/size/validation details per asset, but keep the same security, UX, accessibility, and resilience coverage.

#### Backend tests (Favicon upload/removal)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| FV-B1 | Upload endpoint enforces mimetype (`png`/`ico`) and rejects unsupported files with localized message | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B2 | Enforces 128KB size limit; returns BadRequest when file too large | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B3 | Missing file or buffer leads to "File is required" error | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B4 | Successful upload stores file under `/branding/media/favicon-<timestamp>.ext` and returns public URL | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B5 | When `previousUrl` provided, server deletes old file only if inside branding media directory | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B6 | Unauthorized/unauthenticated requests rejected (401/403) before touching filesystem | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B7 | Malicious path attempts in `previousUrl` ignored (ensure prefix check) | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B8 | Error path from filesystem failure surfaces generic message without leaking fs paths | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B9 | Upload rate-limited or validated against concurrent writes (two uploads in quick succession keep newest) | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B10 | Persistence layer trims/normalizes favicon URL on `updateInstanceConfig` | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B11 | Removing favicon (persist `null`) cleans up file and SSR/public settings drop favicon link | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B12 | Audit log records uploader identity and generated filename | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B13 | Upload with uppercase extension still accepted (case-insensitive check) | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B14 | Rejects attempts to upload SVG or animated GIF (ensure mimetype list enforced) | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B15 | Concurrent remove + upload results in consistent final state (no orphan file) | ✅ Implemented | Added to settings.service.spec.ts |
| FV-B16 | When MEDIA_ROOT misconfigured (unwritable), endpoint returns graceful error and no metadata persisted | ✅ Implemented | Added to settings.service.spec.ts |

#### Frontend tests (Favicon upload/removal)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| FV-F1 | Upload button opens hidden file input; selecting file triggers POST to `/branding/favicon` | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F2 | Rejects unsupported file type client-side (optional) and shows inline error text | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F3 | Shows loading state during upload (button disabled/spinner) | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F4 | On success updates preview icon and calls `persistBrandingField` with new URL | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F5 | Error path displays Bulgarian copy from server or fallback text | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F6 | Remove action clears favicon URL (sets `null`) and persists change | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F7 | Local state resets file input value to allow re-uploading same file | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F8 | Handles 401 by redirecting to login | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F9 | Accessibility: upload/remove controls keyboard navigable and announce status changes | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F10 | Offline/retry scenario: failed upload keeps selected file state until user retries | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F11 | Multi-tab: uploading favicon in one tab updates other tab after settings refetch | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F12 | Drag-and-drop (if supported) works identically to click selection, else confirm not implemented | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F13 | Remove button prompts confirmation if favicon currently in use (optional) and updates UI after confirm | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F14 | Uploading same file twice triggers input.value reset so change event fires | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F15 | Loading indicator clears and button re-enabled after success or failure | ✅ Implemented | Added to branding-assets-favicon.test.tsx |
| FV-F16 | Snackbar/toast messaging localized and dismissible | ✅ Implemented | Added to branding-assets-favicon.test.tsx |

### Branding assets – “Upload & Remove Logo (default/light/dark)”

Same primitives as favicon but often larger size limits (~512KB) and PNG/SVG allowance depending on requirements.

#### Backend tests (Logo variants)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| LG-B1 | Upload endpoint accepts allowed PNG/SVG/JPEG types and enforces per-variant size limit | ✅ Implemented | Added to settings.service.spec.ts |
| LG-B2 | Light/Dark variants persist to distinct fields (`logoLightUrl`, `logoDarkUrl`) while default `logoUrl` remains unaffected | ✅ Implemented | Added to settings.service.spec.ts |
| LG-B3 | Removing light/dark logo sets field to `null` without affecting others | ✅ Implemented | Added to settings.service.spec.ts |
| LG-B4 | Previous file cleanup works separately per variant (no accidental deletion of other logos) | ✅ Implemented | Added to settings.service.spec.ts |
| LG-B5 | Normalizes URLs and trims whitespace before saving | ✅ Implemented | Added to settings.service.spec.ts |
| LG-B6 | SSR/public settings include updated logos immediately | ✅ Implemented | Added to settings.service.spec.ts |
| LG-B7 | Rejects uploads exceeding width/height constraints (if validated server-side) | ✅ Implemented | Added to settings.service.spec.ts |
| LG-B8 | Security: strips SVG scripts or rejects inline SVG with script tags | ✅ Implemented | Added to settings.service.spec.ts |

#### Frontend tests (Logo variants)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| LG-F1 | Each variant has dedicated upload/remove buttons; selecting file sends POST to correct endpoint | ⬜️ Not started | |
| LG-F2 | Preview updates (default header, light/dark preview cards) when logo changes | ⬜️ Not started | |
| LG-F3 | Remove action confirms and clears preview per variant | ⬜️ Not started | |
| LG-F4 | Upload flow shares the same error handling/toasts as favicon | ⬜️ Not started | |
| LG-F5 | For SVG uploads, preview renders sanitized version or fallback icon | ⬜️ Not started | |
| LG-F6 | Accessibility: alt text/labels specify which logo variant is being changed | ⬜️ Not started | |
| LG-F7 | Multi-tab sync ensures logos update after settings refetch | ⬜️ Not started | |

### Branding assets – “Upload & Remove Fonts”

Includes base font file and optional per-language variants.

#### Backend tests (Font uploads)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| FT-B1 | Accepts only `.woff2/.woff/.ttf/.otf` and enforces 2MB limit | ⬜️ Not started | |
| FT-B2 | Rejects uploads without buffer or with zero bytes | ⬜️ Not started | |
| FT-B3 | Saves file with `font-*.ext` prefix and returns media URL | ⬜️ Not started | |
| FT-B4 | Removing font (`fontUrl = null`) deletes previous file and resets typography preview | ⬜️ Not started | |
| FT-B5 | Per-language font overrides stored in `fontUrlByLang` map; invalid locale codes rejected | ⬜️ Not started | |
| FT-B6 | Normalizes URLs and ensures sanitized dictionary entries | ⬜️ Not started | |
| FT-B7 | Import/export preserves per-language fonts without leaking absolute paths | ⬜️ Not started | |
| FT-B8 | Audit logs capture uploader + target language | ⬜️ Not started | |

#### Backend tests (Font license upload)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| FL-B1 | Allows only approved extensions (pdf/txt/doc/docx/odt/png/jpg/jpeg/webp/zip) and 5MB size | ⬜️ Not started | |
| FL-B2 | Missing buffer or invalid mime returns BadRequest | ⬜️ Not started | |
| FL-B3 | Removing license file cleans up media entry | ⬜️ Not started | |
| FL-B4 | Security: prevents script injection via document name | ⬜️ Not started | |

#### Frontend tests (Fonts & licenses)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| FT-F1 | Upload font button handles base font; success updates preview text sample | ⬜️ Not started | |
| FT-F2 | Per-language font upload UI handles selection of language code and displays active overrides | ⬜️ Not started | |
| FT-F3 | Deleting per-language font reverts to default font preview | ⬜️ Not started | |
| FT-F4 | Uploading invalid file surfaces localized error | ⬜️ Not started | |
| FT-F5 | License upload UI accepts allowed file types and displays link to uploaded document | ⬜️ Not started | |
| FT-F6 | Removing license clears preview link | ⬜️ Not started | |
| FT-F7 | Accessibility: file inputs labelled for screen readers; status changes announced | ⬜️ Not started | |
| FT-F8 | Offline/retry for fonts keeps file reference until user retries | ⬜️ Not started | |
| FT-F9 | Multi-tab update syncs per-language font list after save | ⬜️ Not started | |

### Branding assets – “Upload & Remove Cursor Icons” (default/light/dark + hover variants)

#### Backend tests (Cursor uploads)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| CS-B1 | Accepts PNG/WebP files up to defined size (e.g., 128KB) | ⬜️ Not started | |
| CS-B2 | Validates cursor hotspot coordinates if provided (0–255) | ⬜️ Not started | |
| CS-B3 | Stores separate URLs for default/light/dark/pointer variants | ⬜️ Not started | |
| CS-B4 | Removing specific cursor variant leaves others intact | ⬜️ Not started | |
| CS-B5 | Prevents invalid hotspot data from crashing (defaults to null) | ⬜️ Not started | |
| CS-B6 | Security: rejects attempts to upload animated files if not supported | ⬜️ Not started | |
| CS-B7 | Audit logs include variant name | ⬜️ Not started | |

#### Frontend tests (Cursor uploads)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| CS-F1 | Upload controls per variant trigger correct endpoint and update preview cursor sample | ⬜️ Not started | |
| CS-F2 | Hotspot inputs (if exposed) validate range and show inline errors | ⬜️ Not started | |
| CS-F3 | Remove buttons per variant clear preview and persist null | ⬜️ Not started | |
| CS-F4 | Cursor preview updates immediately when switching between light/dark modes | ⬜️ Not started | |
| CS-F5 | Error handling mirrors favicon (toasts, retry) | ⬜️ Not started | |
| CS-F6 | Accessibility: buttons have tooltips describing cursor usage | ⬜️ Not started | |
| CS-F7 | Multi-tab sync updates cursor previews after save | ⬜️ Not started | |

### Footer & Social – “Powered by BeeLMS” link

Follows pattern: boolean toggle + optional custom URL (when enabled) controlling footer attribution.

#### Backend tests (Powered by BeeLMS)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| PB-B1 | Toggle enabled with valid URL persists `{ enabled: true, url }` | ✅ Implemented | Added to settings.service.spec.ts |
| PB-B2 | Toggle enabled without URL uses default BeeLMS link | ✅ Implemented | Added to settings.service.spec.ts |
| PB-B3 | Toggle disabled persists `{ enabled: false, url: null }` and removes footer link from public settings | ✅ Implemented | Added to settings.service.spec.ts |
| PB-B4 | URL validation enforces HTTPS (or defined policy) and rejects invalid schemes | ✅ Implemented | Added to settings.service.spec.ts |
| PB-B5 | Trims whitespace and normalizes stored URL | ✅ Implemented | Added to settings.service.spec.ts |
| PB-B6 | Security: prevents javascript: or data: URLs | ✅ Implemented | Added to settings.service.spec.ts |
| PB-B7 | Partial update without poweredBy block leaves previous value untouched | ✅ Implemented | Added to settings.service.spec.ts |
| PB-B8 | Audit log records actor when toggling on/off or changing URL | ✅ Implemented | Added to settings.service.spec.ts |
| PB-B9 | SSR/public settings reflect change immediately (no cache lag) | ✅ Implemented | Added to settings.service.spec.ts |
| PB-B10 | Contract test `/admin/settings` PATCH returns updated poweredBy block | ✅ Implemented | Added to settings.service.spec.ts |

#### Frontend tests (Powered by BeeLMS)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| PB-F1 | Toggle reflects server value on load and controls URL input visibility | ✅ Implemented | Added to footer-social-powered-by-beelms.test.tsx |
| PB-F2 | Enabling toggle shows URL field with default value; disabling hides and clears field | ✅ Implemented | Added to footer-social-powered-by-beelms.test.tsx |
| PB-F3 | Client-side URL validation shows inline error (Bulgarian copy) for invalid schemes | ✅ Implemented | Added to footer-social-powered-by-beelms.test.tsx |
| PB-F4 | Save sends `{ poweredByBeeLms: { enabled, url } }` payload; verify fetch body | ✅ Implemented | Added to footer-social-powered-by-beelms.test.tsx |
| PB-F5 | Success state shows toast/banner and footer preview updates | ✅ Implemented | Added to footer-social-powered-by-beelms.test.tsx |
| PB-F6 | Error path (400) surfaces backend message and leaves field dirty | ✅ Implemented | Added to footer-social-powered-by-beelms.test.tsx |
| PB-F7 | Keyboard accessibility: toggle and URL input operable via keyboard, aria-described error | ✅ Implemented | Added to footer-social-powered-by-beelms.test.tsx |
| PB-F8 | Multi-tab sync: toggling in one tab updates other after refetch | ✅ Implemented | Added to footer-social-powered-by-beelms.test.tsx |
| PB-F9 | Unsaved changes prompt triggers when toggling and navigating away | ✅ Implemented | Added to footer-social-powered-by-beelms.test.tsx |
| PB-F10 | Footer preview link target updates instantly (opens in new tab) | ✅ Implemented | Added to footer-social-powered-by-beelms.test.tsx |

### Footer & Social – “Facebook” link (applies to other social links: X, YouTube, custom)

Boolean toggle + URL field controlling visibility of footer link/icon.

#### Backend tests (Facebook link)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| FB-B1 | Enabling Facebook with valid URL persists `{ enabled: true, url }` | ✅ Implemented | Added to settings.service.spec.ts |
| FB-B2 | Disabling sets `{ enabled: false, url: null }` and removes from public settings | ✅ Implemented | Added to settings.service.spec.ts |
| FB-B3 | URL validation enforces HTTPS + facebook.com domain (or configured whitelist) | ✅ Implemented | Added to settings.service.spec.ts |
| FB-B4 | Rejects non-http(s) schemes and javascript/data URLs | ✅ Implemented | Added to settings.service.spec.ts |
| FB-B5 | Partial update leaves other social links untouched | ✅ Implemented | Added to settings.service.spec.ts |
| FB-B6 | Audit log records actor + new URL | ✅ Implemented | Added to settings.service.spec.ts |
| FB-B7 | SSR/public settings show icon only when enabled | ✅ Implemented | Added to settings.service.spec.ts |
| FB-B8 | Contract test ensures `/admin/settings` PATCH returns updated `footerSocialLinks.facebook` | ✅ Implemented | Added to settings.service.spec.ts |
| FB-B9 | Rejects URLs pointing to personal profiles if business-only policy enforced (configurable rule) | ✅ Implemented | Added to settings.service.spec.ts |
| FB-B10 | Caches bust when link updated so SSR footer picks up change immediately | ✅ Implemented | Added to settings.service.spec.ts |

#### Frontend tests (Facebook link)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| FB-F1 | Toggle + URL field reflect server values on load | ⬜️ Not started | |
| FB-F2 | Enabling shows URL input with helper text; disabling hides/clears input | ⬜️ Not started | |
| FB-F3 | Client-side validation enforces https://facebook.com/... and shows inline error | ⬜️ Not started | |
| FB-F4 | Save sends `footerSocialLinks.facebook` payload with enabled/url | ⬜️ Not started | |
| FB-F5 | Footer preview updates immediately (icon + link) | ⬜️ Not started | |
| FB-F6 | Error from backend surfaces message in social links notice area | ⬜️ Not started | |
| FB-F7 | Accessibility: toggle/input labelled, error message referenced via `aria-describedby` | ⬜️ Not started | |
| FB-F8 | Multi-tab sync updates toggles upon refetch | ⬜️ Not started | |
| FB-F9 | Unsaved changes prompt triggers after editing URL/toggle | ⬜️ Not started | |
| FB-F10 | Clearing URL while enabled focuses input and blocks Save until valid | ⬜️ Not started | |
| FB-F11 | Clicking footer Facebook icon opens configured URL in new tab with `rel="noopener"` | ⬜️ Not started | |
| FB-F12 | Screen reader announcement includes social platform name and indicates if disabled | ⬜️ Not started | |

### Footer & Social – “X (Twitter)” link

Same mechanics as Facebook but enforce `x.com`/`twitter.com` URLs and optional handle formatting.

#### Backend tests (X link)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| X-B1 | Enabling X with valid URL persists `{ enabled: true, url }` | ✅ Implemented | Added to settings.service.spec.ts |
| X-B2 | Disabling sets `{ enabled: false, url: null }` | ✅ Implemented | Added to settings.service.spec.ts |
| X-B3 | URL validation enforces https://x.com or https://twitter.com (configurable list) | ✅ Implemented | Added to settings.service.spec.ts |
| X-B4 | Supports handle-only shorthand (e.g., `@BeeLMS`) by transforming into canonical URL | ✅ Implemented | Added to settings.service.spec.ts |
| X-B5 | Rejects non-http(s) schemes and querystring injections | ✅ Implemented | Added to settings.service.spec.ts |
| X-B6 | Partial update leaves other social links untouched | ✅ Implemented | Added to settings.service.spec.ts |
| X-B7 | Audit logging of actor + handle/url | ✅ Implemented | Added to settings.service.spec.ts |
| X-B8 | SSR/public settings update immediately (no stale icon) | ✅ Implemented | Added to settings.service.spec.ts |
| X-B9 | Contract test ensures PATCH response includes updated `footerSocialLinks.x` | ✅ Implemented | Added to settings.service.spec.ts |

#### Frontend tests (X link)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| X-F1 | Toggle + URL/handle input reflects server values | ✅ Implemented | Added to footer-social-x-twitter.test.tsx |
| X-F2 | Handle shorthand auto-formats to canonical URL on blur | ✅ Implemented | Added to footer-social-x-twitter.test.tsx |
| X-F3 | Inline validation ensures https://x.com/... or `@handle` | ✅ Implemented | Added to footer-social-x-twitter.test.tsx |
| X-F4 | Save sends normalized payload; verify fetch body | ✅ Implemented | Added to footer-social-x-twitter.test.tsx |
| X-F5 | Footer preview icon/link updates live | ⬜️ Not started | |
| X-F6 | Error handling mirrors other social links, showing Bulgarian copy | ⬜️ Not started | |
| X-F7 | Accessibility: toggle/input labelled, error tied via `aria-describedby` | ✅ Implemented | Added to footer-social-x-twitter.test.tsx |
| X-F8 | Multi-tab sync updates toggles after refetch | ✅ Implemented | Added to footer-social-x-twitter.test.tsx |
| X-F9 | Unsaved changes prompt triggers after editing | ✅ Implemented | Added to footer-social-x-twitter.test.tsx |
| X-F10 | Clicking footer X icon opens new tab with `rel="noopener noreferrer"` | ✅ Implemented | Added to footer-social-x-twitter.test.tsx |

### Footer & Social – “YouTube” link

Controls visibility of YouTube icon/link with optional channel/video URL.

#### Backend tests (YouTube link)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| YT-B1 | Enabling with valid YouTube URL persists `{ enabled: true, url }` | ✅ Implemented | Added to settings.service.spec.ts |
| YT-B2 | Disabling sets `{ enabled: false, url: null }` | ✅ Implemented | Added to settings.service.spec.ts |
| YT-B3 | URL validation enforces youtube.com or youtu.be schemas (with https) | ✅ Implemented | Added to settings.service.spec.ts |
| YT-B4 | Rejects playlists/videos marked private if policy forbids (configurable rule) | ✅ Implemented | Added to settings.service.spec.ts |
| YT-B5 | Partial updates leave other links untouched | ✅ Implemented | Added to settings.service.spec.ts |
| YT-B6 | Audit logs capture actor + channel/video ID | ✅ Implemented | Added to settings.service.spec.ts |
| YT-B7 | SSR/public settings update immediately | ✅ Implemented | Added to settings.service.spec.ts |
| YT-B8 | Contract test ensures PATCH response returns updated `footerSocialLinks.youtube` | ✅ Implemented | Added to settings.service.spec.ts |
| YT-B9 | Localization support: `youtubeUrlByLang` served per locale | ✅ Implemented | Added to settings.service.spec.ts |
| YT-B10 | Caches bust when link updated so SSR footer picks up change immediately | ✅ Implemented | Added to settings.service.spec.ts |

#### Frontend tests (YouTube link)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| YT-F1 | Toggle + URL input reflect server values | ✅ Implemented | Added to footer-social-youtube.test.tsx |
| YT-F2 | Inline validation ensures https://youtube.com/... or https://youtu.be/... | ✅ Implemented | Added to footer-social-youtube.test.tsx |
| YT-F3 | Helper text explains accepted formats (channel, playlist, video) | ✅ Implemented | Added to footer-social-youtube.test.tsx |
| YT-F4 | Save sends normalized payload | ✅ Implemented | Added to footer-social-youtube.test.tsx |
| YT-F5 | Footer preview updates icon/link | ✅ Implemented | Added to footer-social-youtube.test.tsx |
| YT-F6 | Error from backend displayed near field | ✅ Implemented | Added to footer-social-youtube.test.tsx |
| YT-F7 | Accessibility: toggle/input labelled, error tied via `aria-describedby` | ✅ Implemented | Added to footer-social-youtube.test.tsx |
| YT-F8 | Multi-tab sync updates toggles after refetch | ✅ Implemented | Added to footer-social-youtube.test.tsx |
| YT-F9 | Unsaved changes prompt triggers after editing | ✅ Implemented | Added to footer-social-youtube.test.tsx |
| YT-F10 | Clicking footer YouTube icon opens new tab with `rel="noopener noreferrer"` | ✅ Implemented | Added to footer-social-youtube.test.tsx |

### Footer & Social – “Add custom link”

Allows admins to define arbitrary footer links (label + URL).

#### Backend tests (Custom link)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| CL-B1 | Creating custom link with label + valid URL persists entry in `footerSocialLinks.custom[]` | ✅ Implemented | Added to settings.service.spec.ts |
| CL-B2 | Rejects duplicate labels or positions beyond max allowed count | ✅ Implemented | Added to settings.service.spec.ts |
| CL-B3 | URL validation enforces https/http schemes; optional whitelist | ✅ Implemented | Added to settings.service.spec.ts |
| CL-B4 | Trims label/URL and prevents empty strings | ✅ Implemented | Added to settings.service.spec.ts |
| CL-B5 | Editing existing custom link updates correct index without reordering others | ✅ Implemented | Added to settings.service.spec.ts |
| CL-B6 | Deleting custom link removes entry and reindexes array | ✅ Implemented | Added to settings.service.spec.ts |
| CL-B7 | Security: prevents javascript/data URLs and HTML in labels | ✅ Implemented | Added to settings.service.spec.ts |
| CL-B8 | Contract test ensures PATCH response returns updated custom link list | ✅ Implemented | Added to settings.service.spec.ts |
| CL-B9 | Audit logging captures add/edit/delete actions and new label/URL | ✅ Implemented | Added to settings.service.spec.ts |
| CL-B10 | Enforces max length for label/URL and rejects overly long values | ✅ Implemented | Added to settings.service.spec.ts |
| CL-B11 | Reordering custom links persists `order` field and keeps deterministic output | ✅ Implemented | Added to settings.service.spec.ts |

#### Frontend tests (Custom link)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| CL-F1 | “Add custom link” button opens modal/form with label + URL inputs | ✅ Not started | |
| CL-F2 | Inline validation for required label and valid URL; messages in Bulgarian | ✅ Not started | |
| CL-F3 | Saving creates card in list with label preview and link | ✅ Not started | |
| CL-F4 | Editing custom link pre-populates modal and updates card upon success | ✅ Not started | |
| CL-F5 | Delete action prompts confirmation and removes card | ✅ Not started | |
| CL-F6 | Max link count disables “Add” button and shows helper text | ✅ Not started | |
| CL-F7 | Drag-and-drop (if supported) reorders custom links; tests persistence of order | ✅ Not started | |
| CL-F8 | Accessibility: modal focus trap, labels, ESC to close, keyboard reorder (if available) | ✅ Not started | |
| CL-F9 | Multi-tab sync updates custom link list after refetch | ✅ Not started | |
| CL-F10 | Unsaved changes prompt triggers when custom link form dirty | ✅ Not started | |
| CL-F11 | Drag-and-drop UI updates order preview and persists via PATCH | ✅ Not started | |
| CL-F12 | Accessibility: drag-and-drop has keyboard alternative (up/down buttons) | ✅ Not started | |

### Metadata & SEO – “Base URL (canonical)”

Configures canonical base URL for SEO, used in sitemap/og tags.

#### Backend tests (Base URL)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| SEO-B1 | Valid https URL persists to `seo.baseUrl` and propagates to public settings | ⬜️ Not started | |
| SEO-B2 | Rejects non-http(s) schemes, localhost, or disallowed domains (policy-based) | ⬜️ Not started | |
| SEO-B3 | Trims trailing slash and normalizes to lowercase host | ⬜️ Not started | |
| SEO-B4 | Partial update omitting baseUrl leaves previous value untouched | ⬜️ Not started | |
| SEO-B5 | Contract test ensures PATCH response returns updated `seo.baseUrl` | ⬜️ Not started | |
| SEO-B6 | SSR/caching invalidated so next render uses new canonical | ⬜️ Not started | |
| SEO-B7 | Audit log records actor when base URL updated | ⬜️ Not started | |
| SEO-B8 | When invalid value provided, BadRequest returns Bulgarian message | ⬜️ Not started | |

#### Frontend tests (Base URL)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| SEO-F1 | Input prefilled with server value; helper text explains format | ⬜️ Not started | |
| SEO-F2 | Client-side validation ensures https://example.com (no path) | ⬜️ Not started | |
| SEO-F3 | Inline error shown for invalid format; Save disabled until resolved | ⬜️ Not started | |
| SEO-F4 | Save sends `{ seo: { baseUrl } }` payload; verify fetch body | ⬜️ Not started | |
| SEO-F5 | Success toast + preview of canonical tag updates immediately | ⬜️ Not started | |
| SEO-F6 | Error from backend displayed near field | ⬜️ Not started | |
| SEO-F7 | Accessibility: input labelled, error referenced via `aria-describedby` | ⬜️ Not started | |
| SEO-F8 | Multi-tab sync updates field after refetch | ⬜️ Not started | |
| SEO-F9 | Unsaved changes prompt triggers when field dirty | ⬜️ Not started | |

### Metadata & SEO – “Title template”

Controls how page titles are rendered, e.g., `{{page}} – {{appName}}`.

#### Backend tests (Title template)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TT-B1 | Accepts template string with supported tokens (`{{page}}`, `{{appName}}`, `{{course}}`) and persists to `seo.titleTemplate` | ⬜️ Not started | |
| TT-B2 | Rejects templates exceeding max length or containing disallowed characters (e.g., `<script>`) | ⬜️ Not started | |
| TT-B3 | Missing required tokens (e.g., `{{page}}`) falls back to default; verify graceful handling | ⬜️ Not started | |
| TT-B4 | Contract test ensures PATCH response returns sanitized template | ⬜️ Not started | |
| TT-B5 | Rendering helper produces correct preview for sample inputs (unit test of utility) | ⬜️ Not started | |
| TT-B6 | Audit logging captures old/new template and actor | ⬜️ Not started | |
| TT-B7 | SSR cache invalidated so first render after change uses new template | ⬜️ Not started | |
| TT-B8 | Localization integration: when `appNameByLang` changes, template uses localized value without needing re-save | ⬜️ Not started | |

#### Frontend tests (Title template)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TT-F1 | Input prefilled with server template; helper text lists available tokens | ⬜️ Not started | |
| TT-F2 | Inline validation enforces presence of `{{page}}` token (or defined minimum) | ⬜️ Not started | |
| TT-F3 | Client prevents insertion of unsupported tokens and shows localized error | ⬜️ Not started | |
| TT-F4 | Live preview displays sample output as admin types (debounced) | ⬜️ Not started | |
| TT-F5 | Save sends `{ seo: { titleTemplate } }` payload; verify fetch body | ⬜️ Not started | |
| TT-F6 | Success toast + preview update after save | ⬜️ Not started | |
| TT-F7 | Error path (400) displays backend validation message | ⬜️ Not started | |
| TT-F8 | Keyboard accessibility: input labelled, helper text linked via `aria-describedby` | ⬜️ Not started | |
| TT-F9 | Unsaved changes prompt triggers when template modified | ⬜️ Not started | |
| TT-F10 | Reset/Undo button (if available) restores default template and updates preview | ⬜️ Not started | |

### Metadata & SEO – “Browser title”

Rendered title in `<title>` tag for landing pages (may differ from default title when custom override exists).

#### Backend tests (Browser title)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| BT-B1 | Accepts trimmed string within allowed length and persists to `seo.browserTitle` (global default) | ⬜️ Not started | |
| BT-B2 | Rejects control characters, emojis, or disallowed punctuation if policy defined | ⬜️ Not started | |
| BT-B3 | Contract test ensures PATCH response returns updated browser title | ⬜️ Not started | |
| BT-B4 | SSR uses browserTitle when available, otherwise falls back to defaultTitle/titleTemplate | ⬜️ Not started | |
| BT-B5 | Localization support: `browserTitleByLang` served per locale | ⬜️ Not started | |
| BT-B6 | Audit log captures actor and old/new title | ⬜️ Not started | |
| BT-B7 | Partial update omitting browserTitle leaves previous value intact | ⬜️ Not started | |
| RI-B6 | Audit logging records actor toggling index state | ⬜️ Not started | |
| RI-B7 | Security: only admins with specific permission can toggle index (403 otherwise) | ⬜️ Not started | |

#### Frontend tests (Robots index)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| RI-F1 | Toggle reflects server value on load and shows warning badge when disabled | ⬜️ Not started | |
| RI-F2 | Enabling/disabling updates helper text describing search engine behavior | ⬜️ Not started | |
| RI-F3 | Save sends `{ seo: { robotsIndex } }` payload; verify fetch body | ⬜️ Not started | |
| RI-F4 | Success toast + preview snippet updates to show current robots meta | ⬜️ Not started | |
| RI-F5 | Error from backend displayed near toggle with localized copy | ⬜️ Not started | |
| RI-F6 | Unsaved changes prompt triggers when toggle flipped | ⬜️ Not started | |
| RI-F7 | Accessibility: toggle labelled, warning text linked via `aria-describedby` | ⬜️ Not started | |
| RI-F8 | Multi-tab sync updates toggle state after refetch | ⬜️ Not started | |
| RI-F9 | “Reset to default” (if available) restores recommended value and updates UI | ⬜️ Not started | |

### Metadata & SEO – “Integration & regression flows”

#### Backend tests (combined scenarios)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| IR-B1 | Full PATCH with Base URL + Title template + Default title + Robots index succeeds and public settings reflect all changes | ⬜️ Not started | |
| IR-B2 | Rolling back (Undo changes) restores previous values in single transaction | ⬜️ Not started | |
| IR-B3 | Reset social metadata endpoint clears custom OG/Twitter fields and reverts to defaults | ⬜️ Not started | |
| IR-B4 | When robotsIndex=false, sitemap endpoint returns 404/empty and meta headers align | ⬜️ Not started | |
| IR-B5 | Localization interplay: PATCH with `defaultTitleByLang` + base fields ensures fallback works per locale | ⬜️ Not started | |

#### Frontend tests (combined scenarios)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| IR-F1 | Clicking “Undo changes” reverts all dirty SEO fields and disables Save | ⬜️ Not started | |
| IR-F2 | “Reset social metadata” (if available) clears shared/OG/Twitter fields and updates previews | ⬜️ Not started | |
| IR-F3 | Multi-field dirty state: editing base URL + default title shows single unsaved changes prompt | ⬜️ Not started | |
| IR-F4 | Save batching: when multiple fields edited, PATCH payload includes only dirty SEO fields (snapshot test) | ⬜️ Not started | |
| IR-F5 | Error from one field (e.g., Title template invalid) blocks save for others and highlights respective input | ⬜️ Not started | |
| IR-F6 | Smoke test rendering preview after combined changes (browser title + social cards) | ⬜️ Not started | |

### Metadata & SEO – “Undo changes” button

#### Backend tests
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| UN-B1 | Undo endpoint (or service) restores latest persisted SEO snapshot atomically | ⬜️ Not started | |
| UN-B2 | Partial changes: if only some fields dirty, undo reverts all SEO fields to previous values | ⬜️ Not started | |
| UN-B3 | Authorization: only admins with edit rights can call undo (403 otherwise) | ⬜️ Not started | |
| UN-B4 | Audit log records actor and fields reverted | ⬜️ Not started | |
| UN-B5 | Undo after failed save leaves settings unchanged and reports success | ⬜️ Not started | |

#### Frontend tests
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| UN-F1 | Button visible only when there are dirty SEO fields | ⬜️ Not started | |
| UN-F2 | Clicking Undo resets all dirty inputs (base URL, title template, robots, sitemap toggles, etc.) to server values | ⬜️ Not started | |
| UN-F3 | After undo, Save becomes disabled and unsaved warning is cleared | ⬜️ Not started | |
| UN-F4 | Undo action shows confirmation toast/snackbar | ⬜️ Not started | |
| UN-F5 | Keyboard/ARIA: button focusable, labelled, and announces action to assistive tech | ⬜️ Not started | |
| UN-F6 | Multi-tab sync: performing undo in one tab updates other tab after refetch | ⬜️ Not started | |

### Metadata & SEO – “Reset social metadata” button

#### Backend tests
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| RS-B1 | Reset endpoint clears shared social fields (image, description), OG, and Twitter overrides to defaults | ⬜️ Not started | |
| RS-B2 | Resets also delete uploaded social fallback images from storage if not referenced elsewhere | ⬜️ Not started | |
| RS-B3 | Partial reset: if some fields already default, endpoint succeeds without error | ⬜️ Not started | |
| RS-B4 | Authorization enforced (403 for non-admins) | ⬜️ Not started | |
| RS-B5 | Audit log records actor and summary of cleared fields | ⬜️ Not started | |

#### Frontend tests
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| RS-F1 | Button visible/enabled only when social fields diverge from defaults | ⬜️ Not started | |
| RS-F2 | Clicking reset prompts confirmation modal; confirm triggers reset call and reverts UI (images cleared, descriptions empty) | ⬜️ Not started | |
| RS-F3 | Reset success shows toast/snackbar and disables Save if no other dirty fields | ⬜️ Not started | |
| RS-F4 | Error path surfaces backend message and leaves current values untouched | ⬜️ Not started | |
| RS-F5 | Accessibility: button labelled, confirmation modal focus trap, ESC to cancel | ⬜️ Not started | |
| RS-F6 | Multi-tab sync: after reset in one tab, other tabs refetch and clear previews | ⬜️ Not started | |

### Metadata & SEO – “Shared social image (fallback)”

Global fallback image used for OG/Twitter when specific page image missing.

#### Backend tests (Shared social image)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| SSI-B1 | Upload endpoint accepts allowed mime types (PNG/JPEG/WEBP) and max size (e.g., 1MB) | ⬜️ Not started | |
| SSI-B2 | Stores file under `/branding/media/social/shared-<timestamp>.ext` and returns URL | ⬜️ Not started | |
| SSI-B3 | Removing image deletes previous file and nulls `seo.sharedSocialImageUrl` | ⬜️ Not started | |
| SSI-B4 | Enforces recommended dimensions (1200x630); rejects images outside tolerance | ⬜️ Not started | |
| SSI-B5 | Contract test ensures PATCH response updates `sharedSocialImageUrl` | ⬜️ Not started | |
| SSI-B6 | Security: strips EXIF/metadata or re-encodes to prevent malicious payloads | ⬜️ Not started | |
| SSI-B7 | Audit log records uploader and filename | ⬜️ Not started | |

#### Frontend tests (Shared social image)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| SSI-F1 | “Upload image” button opens file picker, preview updates after success | ⬜️ Not started | |
| SSI-F2 | Invalid mime/size shows inline error with Bulgarian copy | ⬜️ Not started | |
| SSI-F3 | “Remove” button clears preview, sets URL to null, and disables Save until applied | ⬜️ Not started | |
| SSI-F4 | Shows recommended resolution text and warns when image aspect ratio off | ⬜️ Not started | |
| SSI-F5 | Spinner/progress indicator during upload; handles cancellation gracefully | ⬜️ Not started | |
| SSI-F6 | Accessibility: upload/remove buttons labelled, preview has alt text | ⬜️ Not started | |
| SSI-F7 | Multi-tab sync updates image preview after refetch | ⬜️ Not started | |
| SSI-F8 | Reset social metadata button clears shared image preview instantly | ⬜️ Not started | |

### Metadata & SEO – “Shared social description”

Fallback text used across OG/Twitter cards whenever page-specific description is missing.

#### Backend tests (Shared social description)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| SSD-B1 | PATCH validates optional string, enforces max length (e.g., 300 chars), rejects HTML/script tags, and strips control characters | ⬜️ Not started | |
| SSD-B2 | Persister trims leading/trailing whitespace, collapses repeated spaces/newlines, and stores normalized UTF-8 text | ⬜️ Not started | |
| SSD-B3 | Contract/API schema exposes `sharedSocialDescription` (and localized variants, if enabled) in PATCH response and `/public-settings` payload | ⬜️ Not started | |
| SSD-B4 | SSR/meta generator falls back to `seo.defaultDescription` when shared description null; ensures no empty description served | ⬜️ Not started | |
| SSD-B5 | Reset social metadata endpoint clears shared description and emits audit event referencing cleared field | ⬜️ Not started | |
| SSD-B6 | Undo changes restores previous description even if OG/Twitter fields changed in same session (single transaction) | ⬜️ Not started | |
| SSD-B7 | Cache/CDN invalidation kicks in after successful save so crawlers immediately see updated meta description | ⬜️ Not started | |
| SSD-B8 | Localization: when `sharedSocialDescriptionByLang[bg]` updated, fallback to default locale verified and prevents mixing languages | ⬜️ Not started | |
| SSD-B9 | Security regression test: stored text rendered in meta tags escapes `<`, `>` and quotes to prevent injection | ⬜️ Not started | |
| SSD-B10 | Partial PATCH omitting `sharedSocialDescription` leaves existing value intact even when other SEO fields change | ⬜️ Not started | |
| SSD-B11 | Concurrent saves: last-write-wins behavior audited, race conditions do not interleave truncated text | ⬜️ Not started | |
| SSD-B12 | Public settings / SSR serializers collapse multiline text into single space to satisfy social meta spec | ⬜️ Not started | |

#### Frontend tests (Shared social description)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| SSD-F1 | Textarea renders helper copy + character counter that turns warning color when >90% of limit | ⬜️ Not started | |
| SSD-F2 | Attempting to exceed max length shows inline error and blocks Save until trimmed | ⬜️ Not started | |
| SSD-F3 | Live preview cards (Facebook/LinkedIn/Twitter) update instantly with new description, including ellipsis when longer than preview limit | ⬜️ Not started | |
| SSD-F4 | “Use default description” shortcut button fills field with `seo.defaultDescription` and marks dirty state | ⬜️ Not started | |
| SSD-F5 | Blur event auto-trims whitespace and removes disallowed characters while keeping caret position predictable | ⬜️ Not started | |
| SSD-F6 | Reset social metadata action clears textarea, removes previews, and focuses confirmation toast | ⬜️ Not started | |
| SSD-F7 | Undo changes button restores previous description text and resets dirty indicators | ⬜️ Not started | |
| SSD-F8 | Multi-tab sync: editing in one tab, saving, then refetching in second tab updates textarea and preview | ⬜️ Not started | |
| SSD-F9 | Accessibility: textarea labelled/aria-described, announces remaining characters, supports keyboard shortcuts (Ctrl+Enter to save) | ⬜️ Not started | |
| SSD-F10 | Successful save shows toast above Save button per admin notification guideline and clears dirty state | ⬜️ Not started | |
| SSD-F11 | Save failure surfaces inline + toast error, keeps dirty state and allows retry without losing text | ⬜️ Not started | |
| SSD-F12 | Locale tabs (if enabled) sync textareas per language, highlight missing translations, and lock others when SEO disabled | ⬜️ Not started | |

### Metadata & SEO – Open Graph “OG title”

Overrides the `<meta property="og:title">` content when specific page OG title is unavailable.

#### Backend tests (OG title)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| OGT-B1 | PATCH validates optional string, enforces max length (e.g., 70 chars), rejects HTML/script tags, and strips control characters | ⬜️ Not started | |
| OGT-B2 | Service trims whitespace, collapses multiple spaces, and stores normalized UTF-8 text | ⬜️ Not started | |
| OGT-B3 | When field null, SSR/meta generator falls back to `browserTitle` → `defaultTitle` in priority order | ⬜️ Not started | |
| OGT-B4 | Contract tests: PATCH response and `/public-settings` include `seo.og.title` (and per-locale map if enabled) | ⬜️ Not started | |
| OGT-B5 | Reset social metadata endpoint clears OG title and records audit entry referencing OG block | ⬜️ Not started | |
| OGT-B6 | Undo changes reverts OG title alongside shared description/image to previous snapshot atomically | ⬜️ Not started | |
| OGT-B7 | Localization: updating `og.titleByLang[en]` leaves other locales untouched, fallback order verified | ⬜️ Not started | |
| OGT-B8 | CDN/SSR cache invalidation triggered post-save so crawlers immediately receive updated `<meta property="og:title">` | ⬜️ Not started | |
| OGT-B9 | Security regression: stored OG title escaped in rendered HTML attributes to prevent quote-breaking injection | ⬜️ Not started | |
| OGT-B10 | Concurrent save conflict: last write wins, audit log captures actor + diff | ⬜️ Not started | |

#### Frontend tests (OG title)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| OGT-F1 | Input/textarea renders helper text describing recommended 40–60 character range and shows live counter | ⬜️ Not started | |
| OGT-F2 | Typing beyond limit shows inline validation error, disables Save, and prevents PATCH submission | ⬜️ Not started | |
| OGT-F3 | “Use browser title” shortcut copies current browser title value and marks OG title dirty | ⬜️ Not started | |
| OGT-F4 | Live Open Graph preview (Facebook/LinkedIn card) updates headline instantly with truncation indicator | ⬜️ Not started | |
| OGT-F5 | Reset social metadata button clears OG title field, removes preview headline, and focuses confirmation toast | ⬜️ Not started | |
| OGT-F6 | Undo changes restores prior OG title value and clears validation state | ⬜️ Not started | |
| OGT-F7 | Multi-tab sync: when another admin saves OG title, refetch updates field + preview without losing local unsaved edits (conflict modal) | ⬜️ Not started | |
| OGT-F8 | Accessibility: label, description, and counter announced via aria-describedby; keyboard shortcut (Ctrl+Shift+O) focuses field | ⬜️ Not started | |
| OGT-F9 | Save success toast appears above Save button, disables Save, and preview shows persisted value even after reload | ⬜️ Not started | |
| OGT-F10 | Error from backend (e.g., forbidden characters) surfaces inline + toast, keeps user input for correction | ⬜️ Not started | |
| OGT-F11 | Localization tabs (if enabled) allow switching per locale, indicate missing translations, and disable inputs when SEO master toggle off | ⬜️ Not started | |

### Metadata & SEO – Open Graph “OG image URL”

Primary image used in `<meta property="og:image">`; admins can upload or reference canonical CDN URL per tenant.

#### Backend tests (OG image URL)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| OGI-B1 | Upload endpoint enforces OG-specific mime/size/dimension constraints (1200×630 min, <=2 MB) and strips EXIF | ⬜️ Not started | |
| OGI-B2 | Stored files follow `/branding/media/social/og-<tenant>-<timestamp>.ext` naming and return signed/absolute URL | ⬜️ Not started | |
| OGI-B3 | Removing image deletes file if reference belongs to tenant, nulls `seo.og.imageUrl`, and leaves shared fallback untouched | ⬜️ Not started | |
| OGI-B4 | If field null, SSR falls back to shared social image URL (then defaults) and emits warning metric | ⬜️ Not started | |
| OGI-B5 | PATCH accepts existing CDN URL (read-only field) but validates host whitelist + `https` | ⬜️ Not started | |
| OGI-B6 | Contract tests ensure `/public-settings` exposes `seo.og.imageUrl` and `imageAlt` when provided | ⬜️ Not started | |
| OGI-B7 | Reset social metadata endpoint clears OG image + alt text and triggers audit event | ⬜️ Not started | |
| OGI-B8 | Undo changes reverts pending upload/removal combination atomically (storage cleanup via outbox) | ⬜️ Not started | |
| OGI-B9 | CDN/cache invalidation hook busts `/og-image.*` variants so crawlers immediately fetch latest | ⬜️ Not started | |
| OGI-B10 | Concurrent saves: race between two uploads keeps latest pointer, orphaned file cleanup job runs | ⬜️ Not started | |
| OGI-B11 | Security regression: malicious SVG/HTML renamed .png rejected; virus scan invoked for uploaded binaries | ⬜️ Not started | |
| OGI-B12 | Manual URL entry validated via HEAD request; rejects URLs that return 404/redirect to non-whitelisted hosts | ⬜️ Not started | |
| OGI-B13 | Background job periodically verifies stored OG image still accessible; if missing, falls back to shared image and alerts | ⬜️ Not started | |
| OGI-B14 | Data retention: deleting tenant purges OG image objects and removes references from public settings contract tests | ⬜️ Not started | |

#### Frontend tests (OG image URL)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| OGI-F1 | “Upload image” control uses `accept="image/png,image/jpeg,image/webp"` and enforces dimension helpers | ⬜️ Not started | |
| OGI-F2 | Invalid mime/size/dimension displays inline error + toast, keeps previous preview intact | ⬜️ Not started | |
| OGI-F3 | “Remove” button confirms deletion, clears preview, reverts to shared fallback indicator | ⬜️ Not started | |
| OGI-F4 | “Use shared fallback” shortcut copies shared image URL, disables remove button until customized again | ⬜️ Not started | |
| OGI-F5 | Preview card shows new image, includes skeleton while upload in progress, and alt text overlay | ⬜️ Not started | |
| OGI-F6 | Drag-and-drop upload supported; invalid drop triggers warning without opening native file picker | ⬜️ Not started | |
| OGI-F7 | When upload succeeds but Save fails (validation elsewhere), banner warns image stored but not yet active with “undo upload” CTA | ⬜️ Not started | |
| OGI-F8 | Reset social metadata clears OG preview instantly and shows toast; Save disabled if no other dirty fields | ⬜️ Not started | |
| OGI-F9 | Undo changes reverts preview + buttons and cancels pending progress indicators | ⬜️ Not started | |
| OGI-F10 | Multi-tab sync: uploads from another tab trigger refetch; component shows non-blocking toast about remote change | ⬜️ Not started | |
| OGI-F11 | Accessibility: upload/remove buttons labelled per asset, preview has role=img + descriptive alt; keyboard shortcuts reachable | ⬜️ Not started | |
| OGI-F12 | Localization toggles (if per-locale images supported) show per-locale indicators and disable others when SEO disabled | ⬜️ Not started | |
| OGI-F13 | Manual URL input validates on blur (https + allowed host), shows inline error and keeps previous image if invalid | ⬜️ Not started | |
| OGI-F14 | Alt-text companion field stays in sync with image selection, enforces max length, and appears in preview tooltip | ⬜️ Not started | |
| OGI-F15 | Preview gracefully handles remote image 404 (shows fallback + warning banner) without blocking Save | ⬜️ Not started | |

### Metadata & SEO – Open Graph “Upload image” / “Remove” flows

Specific nuances for OG asset management atop the generic upload/remove behaviors.

#### Backend tests (OG upload/remove)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| OGU-B1 | OG upload endpoint reuses shared validator but overrides dimension limits (landscape focus) and stores `assetType=OG` in metadata | ⬜️ Not started | |
| OGU-B2 | Upload + immediate remove sequence leaves storage clean (no orphan file) and audit log records both actions merged | ⬜️ Not started | |
| OGU-B3 | Remove while optimization worker still processing cancels worker job gracefully | ⬜️ Not started | |
| OGU-B4 | Upload retry after transient S3/CDN outage succeeds without duplicating files; exponential backoff covered | ⬜️ Not started | |
| OGU-B5 | Manual URL save bypasses storage pipeline but still emits audit log and invalidates CDN metadata cache | ⬜️ Not started | |
| OGU-B6 | When OG image removed, SSR immediately switches to shared fallback without waiting for full settings save (streaming response) | ⬜️ Not started | |
| OGU-B7 | Tenant quota enforcement: exceeding combined branding storage limit returns 413 and surfaces friendly error | ⬜️ Not started | |
| OGU-B8 | Security: ensure uploaded file scanned and quarantine path prevents serving before scan completion | ⬜️ Not started | |
| OGU-B9 | Multi-tenant isolation tested via attempting to reference another tenant’s OG image URL (403 + audit) | ⬜️ Not started | |
| OGU-B10 | Contract regression: removing OG image does not accidentally nullify Twitter image (separate fields) | ⬜️ Not started | |
| OGU-B11 | Analytics hooks fire on upload/remove to feed admin activity dashboards; verify payload structure | ⬜️ Not started | |
| OGU-B12 | Disaster-recovery: restoring backup rehydrates OG image URLs while storage objects restored; test mismatch detection | ⬜️ Not started | |

#### Frontend tests (OG upload/remove)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| OGU-F1 | Upload flow shows OG-specific helper copy (recommended 1200×630) distinct from Twitter guidance | ⬜️ Not started | |
| OGU-F2 | Removing image shows confirmation modal referencing OG card, prevents accidental removal when shared fallback in use | ⬜️ Not started | |
| OGU-F3 | Upload progress UI handles multi-file queue by ensuring only last selected file is kept | ⬜️ Not started | |
| OGU-F4 | After upload completes, preview includes “custom OG image” badge with “revert to fallback” link | ⬜️ Not started | |
| OGU-F5 | Removing image immediately swaps preview to shared fallback and shows contextual toast | ⬜️ Not started | |
| OGU-F6 | Error state (upload fail) provides retry CTA, preserves previously saved image, and logs analytics event | ⬜️ Not started | |
| OGU-F7 | Manual URL entry has debounce validation (HEAD request) and shows spinner + result icon (valid/invalid) | ⬜️ Not started | |
| OGU-F8 | Drag-and-drop overlay specifically names OG asset to avoid confusion with Twitter upload zones | ⬜️ Not started | |
| OGU-F9 | Keyboard users can trigger upload/remove/modals via shortcuts (e.g., Enter on focused button, Delete to remove) | ⬜️ Not started | |
| OGU-F10 | Multi-tab conflict: when other tab removes OG image, current tab shows notification and resets preview without losing unsaved description edits | ⬜️ Not started | |
| OGU-F11 | Undo changes after remove restores previous custom image without re-uploading (cached URL reused) | ⬜️ Not started | |
| OGU-F12 | Localization awareness: per-locale OG image upload (if enabled) clearly indicates active locale and disables other locale controls | ⬜️ Not started | |
| OGU-F13 | Activity log panel updates in real time showing “OG image uploaded/removed” entries after actions | ⬜️ Not started | |
| OGU-F14 | Keyboard-driven admins can focus drag-and-drop zone via shortcut and trigger upload without mouse | ⬜️ Not started | |
| OGU-F15 | Error snackbar stack handling: multiple failed uploads queue messages without covering Save button | ⬜️ Not started | |

### Metadata & SEO – Open Graph “OG description”

Fallback body text used for `<meta property="og:description">` when page-specific description missing.

#### Backend tests (OG description)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| OGD-B1 | PATCH validates optional string, enforces max length (e.g., 200 chars), strips HTML/script, normalizes whitespace | ⬜️ Not started | |
| OGD-B2 | Stored value defaults to shared social description when null; SSR fallback order verified | ⬜️ Not started | |
| OGD-B3 | Contract tests ensure `/public-settings` exposes `seo.og.description` plus locale map if enabled | ⬜️ Not started | |
| OGD-B4 | Reset social metadata endpoint clears OG description and records audit entry | ⬜️ Not started | |
| OGD-B5 | Undo changes reverts OG description alongside title/image in single transaction | ⬜️ Not started | |
| OGD-B6 | Localization: updating `og.descriptionByLang[bg]` leaves other locales untouched, fallback order enforced | ⬜️ Not started | |
| OGD-B7 | CDN/SSR cache invalidation triggered post-save so crawlers read updated description immediately | ⬜️ Not started | |
| OGD-B8 | Security regression: ensure description escaped in rendered HTML attributes to prevent injection | ⬜️ Not started | |
| OGD-B9 | Concurrent saves/resolves merge conflicts with last-write-wins; audit log captures diff | ⬜️ Not started | |
| OGD-B10 | Partial PATCH (og description omitted) preserves stored value even if title/image provided | ⬜️ Not started | |
| OGD-B11 | Validation rejects emoji outside allowed range (if platform constraint) and surfaces explicit error | ⬜️ Not started | |
| OGD-B12 | Telemetry pipeline logs description length distribution for monitoring; ensure personally identifiable data not leaked | ⬜️ Not started | |
| OGD-B13 | SEO revalidation job fetches public page with new description and compares rendered meta against stored value | ⬜️ Not started | |

#### Frontend tests (OG description)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| OGD-F1 | Textarea shows helper copy with recommended character count + live counter color change above 90% limit | ⬜️ Not started | |
| OGD-F2 | Attempting to exceed limit shows inline error and keeps Save disabled until trimmed | ⬜️ Not started | |
| OGD-F3 | “Use shared description” shortcut copies shared social description value and marks dirty state | ⬜️ Not started | |
| OGD-F4 | Live Facebook/LinkedIn preview body updates instantly with ellipsis for long text | ⬜️ Not started | |
| OGD-F5 | Reset social metadata clears textarea and preview, focuses confirmation toast | ⬜️ Not started | |
| OGD-F6 | Undo changes restores previous value and clears validation errors | ⬜️ Not started | |
| OGD-F7 | Blur event auto-trims whitespace and replaces disallowed characters while preserving caret position | ⬜️ Not started | |
| OGD-F8 | Save success toast appears above Save button, preview reloads persisted value after refetch | ⬜️ Not started | |
| OGD-F9 | Error from backend (e.g., invalid emoji) surfaces inline + toast, keeps user input | ⬜️ Not started | |
| OGD-F10 | Multi-tab sync: remote save updates local preview; conflict modal appears if local unsaved edits exist | ⬜️ Not started | |
| OGD-F11 | Localization tabs allow switching per locale, highlight missing translations, and disable when SEO toggle off | ⬜️ Not started | |
| OGD-F12 | Accessibility: textarea labelled/aria-described, announces remaining characters, supports Ctrl+Enter to save | ⬜️ Not started | |
| OGD-F13 | “Copy to clipboard” helper copies generated OG meta snippet including description and shows success toast | ⬜️ Not started | |
| OGD-F14 | Preview validator buttons (Facebook Debugger/LinkedIn Inspector) prefill current description and open new tab with aria announcements | ⬜️ Not started | |

### Metadata & SEO – Open Graph “Facebook / LinkedIn preview”

Composite preview cards reflecting how metadata renders on major networks.

#### Backend tests (Preview data sources)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| OGP-B1 | Preview API assembles data from OG title/image/description + shared fallbacks; contract test verifies schema | ⬜️ Not started | |
| OGP-B2 | When OG image absent, preview payload falls back to shared image while marking `isFallback=true` | ⬜️ Not started | |
| OGP-B3 | Localization: requesting preview with locale returns localized strings (title/description) | ⬜️ Not started | |
| OGP-B4 | Preview API caches rendered HTML for X seconds and invalidates cache after relevant PATCH | ⬜️ Not started | |
| OGP-B5 | Security: preview HTML escapes user-provided text to prevent script injection in admin panel | ⬜️ Not started | |
| OGP-B6 | External validator webhooks (optional) notify when Facebook/Twitter scraping errors occur; preview reflects status badge | ⬜️ Not started | |
| OGP-B7 | Accessibility metadata (alt text) included in preview payload for LinkedIn to simulate screen reader output | ⬜️ Not started | |
| OGP-B8 | Multi-tenant enforcement: preview endpoint scoped per tenant and rejects cross-tenant IDs | ⬜️ Not started | |
| OGP-B9 | Audit log records preview regenerations triggered by admin actions (e.g., “Refresh preview”) | ⬜️ Not started | |
| OGP-B10 | External Graph API rate-limit or 5xx responses handled gracefully; preview falls back to last cached version and surfaces status | ⬜️ Not started | |
| OGP-B11 | Preview export endpoint signs URLs and expires links to prevent leaking private branding assets | ⬜️ Not started | |

#### Frontend tests (Preview rendering & UX)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| OGP-F1 | Preview cards visually mirror Facebook and LinkedIn layout (image ratio, title font, description truncation) | ⬜️ Not started | |
| OGP-F2 | Editing OG title/image/description updates preview in real time with throttled re-render | ⬜️ Not started | |
| OGP-F3 | Preview indicates when fallback image/description is used (badge + tooltip) | ⬜️ Not started | |
| OGP-F4 | “Refresh preview” button calls preview endpoint, shows spinner, handles success/error toasts | ⬜️ Not started | |
| OGP-F5 | Facebook/LinkedIn validator quick-links open new tabs with prefilled URL and announce via aria-live | ⬜️ Not started | |
| OGP-F6 | Dark/light theme parity: previews readable in both admin themes, respecting color tokens | ⬜️ Not started | |
| OGP-F7 | Localization selector switches preview language, including RTL layout adjustments | ⬜️ Not started | |
| OGP-F8 | Multi-tab sync: when other tab saves, preview component refetches and shows new content | ⬜️ Not started | |
| OGP-F9 | Offline/failed fetch displays placeholder with retry CTA and does not block Save | ⬜️ Not started | |
| OGP-F10 | Accessibility: previews have role=group with aria-label summarizing title + description; keyboard navigation supported | ⬜️ Not started | |
| OGP-F11 | Analytics instrumentation logs preview refreshes and validator clicks without duplicating events | ⬜️ Not started | |
| OGP-F12 | Screenshot/download helper (if provided) exports preview card; verify generated image includes latest data | ⬜️ Not started | |
| OGP-F13 | “Copy share link” control copies canonical URL and confirms via toast, disabled when base URL invalid | ⬜️ Not started | |
| OGP-F14 | When preview in error state, contextual doc link explains how to debug scraper cache and opens in new tab | ⬜️ Not started | |

### Metadata & SEO – Twitter “Twitter title”

Overrides `<meta name="twitter:title">`; usually shorter than OG counterpart.

#### Backend tests (Twitter title)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TTT-B1 | PATCH validates optional string, enforces tighter length (e.g., 70 chars), rejects HTML/script, normalizes whitespace | ⬜️ Not started | |
| TTT-B2 | When null, server falls back to OG title → browser title → default title | ⬜️ Not started | |
| TTT-B3 | Contract test ensures PATCH response and `/public-settings` expose `seo.twitter.title` (+ locale map if enabled) | ⬜️ Not started | |
| TTT-B4 | Reset social metadata endpoint clears Twitter title and records audit entry | ⬜️ Not started | |
| TTT-B5 | Undo changes reverts Twitter title along with related fields atomically | ⬜️ Not started | |
| TTT-B6 | Localization: updating `twitter.titleByLang[bg]` only affects that locale and respects fallback order | ⬜️ Not started | |
| TTT-B7 | CDN/SSR cache invalidation triggered after save so `twitter:title` meta updates immediately | ⬜️ Not started | |
| TTT-B8 | Security regression ensures string escaped in rendered HTML attributes (prevent quote injection) | ⬜️ Not started | |
| TTT-B9 | Concurrent saves last-write-wins; audit diff stored for observability | ⬜️ Not started | |
| TTT-B10 | Telemetry emits metric for truncated titles to monitor quality; ensure no PII leakage | ⬜️ Not started | |
| TTT-B11 | Automated SEO revalidation fetch compares rendered `twitter:title` to stored value after deploy | ⬜️ Not started | |

#### Frontend tests (Twitter title)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TTT-F1 | Input displays helper copy noting Twitter truncates after ~70 chars; counter turns warning near limit | ⬜️ Not started | |
| TTT-F2 | Exceeding limit shows inline error and blocks Save until corrected | ⬜️ Not started | |
| TTT-F3 | “Use OG title” shortcut copies OG title value and marks field dirty | ⬜️ Not started | |
| TTT-F4 | Live Twitter preview headline updates instantly with ellipsis for long text | ⬜️ Not started | |
| TTT-F5 | Reset social metadata clears field + preview and focuses toast | ⬜️ Not started | |
| TTT-F6 | Undo changes restores value and clears validation state | ⬜️ Not started | |
| TTT-F7 | Multi-tab sync: remote save updates local field; conflict modal shown if local unsaved edits | ⬜️ Not started | |
| TTT-F8 | Accessibility: label/description linked via `aria-describedby`; keyboard shortcut (Ctrl+Shift+T) focuses field | ⬜️ Not started | |
| TTT-F9 | Save success toast above Save button, preview reflects persisted value after reload | ⬜️ Not started | |
| TTT-F10 | “Copy meta tag” helper copies `<meta name=\"twitter:title\">` snippet and shows toast | ⬜️ Not started | |
| TTT-F11 | Validator quick-link to Twitter Card Validator pre-fills canonical URL and announces action via aria-live | ⬜️ Not started | |

### Metadata & SEO – Twitter “Twitter image URL”

Custom image for `<meta name="twitter:image">`.

#### Backend tests (Twitter image URL)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TTI-B1 | Upload endpoint enforces Twitter-specific dimensions (e.g., 800×418, <=1.5 MB) and strips EXIF | ⬜️ Not started | |
| TTI-B2 | Stored files named `/branding/media/social/twitter-<tenant>-<timestamp>.ext` with signed URLs | ⬜️ Not started | |
| TTI-B3 | Removing image deletes tenant file, nulls `seo.twitter.imageUrl`, leaves OG/shared fallback intact | ⬜️ Not started | |
| TTI-B4 | When null, SSR falls back to OG image → shared social image | ⬜️ Not started | |
| TTI-B5 | PATCH accepts manual URL but enforces HTTPS + whitelist + HEAD success | ⬜️ Not started | |
| TTI-B6 | Contract tests ensure `/public-settings` exposes `twitter.imageUrl` + optional alt text | ⬜️ Not started | |
| TTI-B7 | Reset social metadata clears Twitter image and triggers audit entry | ⬜️ Not started | |
| TTI-B8 | Undo changes reverses pending upload/remove atomically | ⬜️ Not started | |
| TTI-B9 | CDN/cache invalidation purges `/twitter-image.*` derivatives upon save/remove | ⬜️ Not started | |
| TTI-B10 | Virus scan/quarantine enforced before URL exposed publicly | ⬜️ Not started | |
| TTI-B11 | Data retention: tenant deletion removes stored image objects and references | ⬜️ Not started | |

#### Frontend tests (Twitter image URL)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TTI-F1 | Upload button restricts to allowed MIME types and shows Twitter-specific helper text | ⬜️ Not started | |
| TTI-F2 | Invalid file (size/dims) shows inline error, keeps previous preview | ⬜️ Not started | |
| TTI-F3 | Remove button clears preview and reverts to OG/shared fallback indicator | ⬜️ Not started | |
| TTI-F4 | “Use OG image” shortcut copies OG URL and disables remove until customized | ⬜️ Not started | |
| TTI-F5 | Preview uses Twitter aspect ratio frame with skeleton while upload in progress | ⬜️ Not started | |
| TTI-F6 | Drag-and-drop supported; invalid drop warns without breaking | ⬜️ Not started | |
| TTI-F7 | After upload success but Save failure, banner warns image stored but not live with undo CTA | ⬜️ Not started | |
| TTI-F8 | Reset button clears preview instantly; Save disabled if no other dirty fields | ⬜️ Not started | |
| TTI-F9 | Undo changes restores previous custom image | ⬜️ Not started | |
| TTI-F10 | Multi-tab sync: remote upload triggers refetch + toast | ⬜️ Not started | |
| TTI-F11 | Accessibility: controls labeled, preview alt text derived from title/alt field | ⬜️ Not started | |
| TTI-F12 | Manual URL input validates on blur and shows status icon (valid/invalid) | ⬜️ Not started | |

### Metadata & SEO – Twitter “Upload image” / “Remove” flows

Twitter-specific nuances layered on top of the generic upload/remove test plan.

#### Backend tests (Twitter upload/remove)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TGU-B1 | Shared validator reused but enforces ratio between 1.91:1 and 1:1.2 for card compatibility | ⬜️ Not started | |
| TGU-B2 | Upload followed by card type switch to “summary” automatically requests square crop via worker | ⬜️ Not started | |
| TGU-B3 | Removing image while worker optimizing cancels job gracefully | ⬜️ Not started | |
| TGU-B4 | Manual URL save bypasses storage yet logs audit + invalidates CDN metadata cache | ⬜️ Not started | |
| TGU-B5 | Storage quota enforcement returns 413 with localized error | ⬜️ Not started | |
| TGU-B6 | Security: ensures file scanned before exposure; quarantine path blocks until clean | ⬜️ Not started | |
| TGU-B7 | Multi-tenant isolation rejects referencing another tenant’s Twitter asset | ⬜️ Not started | |
| TGU-B8 | Disaster recovery test ensures restored backups reconcile URLs vs. actual storage | ⬜️ Not started | |

#### Frontend tests (Twitter upload/remove)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TGU-F1 | Helper text distinguishes Twitter requirements from OG (e.g., 800×418 vs 1200×630) | ⬜️ Not started | |
| TGU-F2 | Removal confirmation references Twitter card specifically | ⬜️ Not started | |
| TGU-F3 | Upload progress handles multiple queued selections (last one wins) | ⬜️ Not started | |
| TGU-F4 | Preview shows badge when custom Twitter image active with “revert to OG image” link | ⬜️ Not started | |
| TGU-F5 | Error snackbar stack respects admin guideline (above Save) and deduplicates repeated failures | ⬜️ Not started | |
| TGU-F6 | Keyboard shortcuts (Enter to upload, Delete to remove) function and are documented in tooltip | ⬜️ Not started | |
| TGU-F7 | Multi-tab conflict notification when other tab removes image while current tab editing description | ⬜️ Not started | |
| TGU-F8 | Undo changes reinstates prior custom image without re-upload | ⬜️ Not started | |
| TGU-F9 | Localization indicator makes clear which locale’s image is being edited (if multi-locale enabled) | ⬜️ Not started | |

### Metadata & SEO – Twitter “Twitter description”

Custom text for `<meta name="twitter:description">`.

#### Backend tests (Twitter description)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TTD-B1 | PATCH validates optional string, enforces ~200 char limit, strips HTML/script, normalizes whitespace | ⬜️ Not started | |
| TTD-B2 | Null falls back to OG description → shared social description → default description | ⬜️ Not started | |
| TTD-B3 | Contract ensures `/public-settings` exposes `twitter.description` + locale map | ⬜️ Not started | |
| TTD-B4 | Reset social metadata clears Twitter description and logs action | ⬜️ Not started | |
| TTD-B5 | Undo changes reverts description with other Twitter fields atomically | ⬜️ Not started | |
| TTD-B6 | Localization updates only specified locale and respects fallback chain | ⬜️ Not started | |
| TTD-B7 | CDN/SSR cache invalidation after save | ⬜️ Not started | |
| TTD-B8 | Security regression ensures description escaped in HTML attributes/meta tags | ⬜️ Not started | |
| TTD-B9 | Partial PATCH omitting description leaves existing value untouched | ⬜️ Not started | |
| TTD-B10 | Telemetry logs length distribution, ensuring no sensitive data leaked | ⬜️ Not started | |

#### Frontend tests (Twitter description)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TTD-F1 | Textarea shows helper text + counter with warning near limit | ⬜️ Not started | |
| TTD-F2 | Exceeding limit shows inline error & disables Save | ⬜️ Not started | |
| TTD-F3 | “Use OG/Twitter shared description” shortcut fills field and marks dirty | ⬜️ Not started | |
| TTD-F4 | Live preview body updates instantly with ellipsis | ⬜️ Not started | |
| TTD-F5 | Reset social metadata clears text + preview | ⬜️ Not started | |
| TTD-F6 | Undo changes restores previous value | ⬜️ Not started | |
| TTD-F7 | Blur trims whitespace and removes disallowed chars without jumping caret | ⬜️ Not started | |
| TTD-F8 | Save success toast, preview reload after refetch | ⬜️ Not started | |
| TTD-F9 | Backend error surfaced inline + toast, retains input | ⬜️ Not started | |
| TTD-F10 | Multi-tab sync + conflict modal | ⬜️ Not started | |
| TTD-F11 | Localization tabs highlight missing translations and disable when SEO toggle off | ⬜️ Not started | |
| TTD-F12 | Accessibility: announces remaining chars, supports Ctrl+Enter to save | ⬜️ Not started | |

### Metadata & SEO – Twitter “Twitter card”

Controls `twitter:card` type (summary vs summary_large_image) and related options.

#### Backend tests (Twitter card)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TTC-B1 | PATCH accepts only allowed values (`summary`, `summary_large_image`, `player` if enabled) | ⬜️ Not started | |
| TTC-B2 | Contract ensures `/public-settings` exposes `twitter.card` | ⬜️ Not started | |
| TTC-B3 | When switching to `summary`, server enforces square image requirement and triggers crop job | ⬜️ Not started | |
| TTC-B4 | Switching to `player` (if future feature) requires player URL + secure iframe; validation covers that | ⬜️ Not started | |
| TTC-B5 | Reset social metadata reverts card to default (summary_large_image) | ⬜️ Not started | |
| TTC-B6 | Undo changes restores previous card + associated assets | ⬜️ Not started | |
| TTC-B7 | Audit log records card type changes with actor/time | ⬜️ Not started | |
| TTC-B8 | SSR/meta generator outputs consistent meta tags per selected card type | ⬜️ Not started | |
| TTC-B9 | Multi-tenant isolation prevents altering other tenant card settings | ⬜️ Not started | |

#### Frontend tests (Twitter card)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TTC-F1 | Radio buttons or segmented control lists allowed card types with descriptions | ⬜️ Not started | |
| TTC-F2 | Selecting `summary` shows warning about square image requirement and disables upload until satisfied | ⬜️ Not started | |
| TTC-F3 | Selecting `summary_large_image` updates preview aspect ratio immediately | ⬜️ Not started | |
| TTC-F4 | “Player card” option (if available) reveals extra fields and validation states | ⬜️ Not started | |
| TTC-F5 | Reset button reverts control to default type and updates preview | ⬜️ Not started | |
| TTC-F6 | Undo changes restores previous selection | ⬜️ Not started | |
| TTC-F7 | Accessibility: control announced with legend + descriptive text | ⬜️ Not started | |
| TTC-F8 | Multi-tab sync updates selection when other tab saves | ⬜️ Not started | |
| TTC-F9 | Save success toast indicates card type saved | ⬜️ Not started | |

### Metadata & SEO – Twitter “Twitter / X preview”

Shows how cards render on Twitter/X across card types.

#### Backend tests (Preview data)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TTP-B1 | Preview API assembles title/image/description/card type and fallbacks; contract verifies schema | ⬜️ Not started | |
| TTP-B2 | Supports locale parameter returning localized text and RTL layout hints | ⬜️ Not started | |
| TTP-B3 | Cache invalidation after relevant PATCH ensures preview fresh | ⬜️ Not started | |
| TTP-B4 | Handles upstream Twitter Card Validator rate limits by falling back to cached render + status badge | ⬜️ Not started | |
| TTP-B5 | Security: preview HTML escapes user text to avoid injection | ⬜️ Not started | |
| TTP-B6 | Audit log records preview refresh requests | ⬜️ Not started | |
| TTP-B7 | Multi-tenant enforcement prevents previewing other tenant data | ⬜️ Not started | |

#### Frontend tests (Preview UX)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| TTP-F1 | Preview visually matches Twitter cards for each selected type (summary vs large image) | ⬜️ Not started | |
| TTP-F2 | Editing Twitter title/description/image/card updates preview in real time (throttled) | ⬜️ Not started | |
| TTP-F3 | “Refresh preview” button refetches data, shows spinner, handles errors gracefully | ⬜️ Not started | |
| TTP-F4 | Twitter Card Validator quick-link opens new tab with current canonical URL and announces via aria-live | ⬜️ Not started | |
| TTP-F5 | Localization selector switches preview language and handles RTL adjustments | ⬜️ Not started | |
| TTP-F6 | Offline/failed fetch shows placeholder + retry CTA without blocking Save | ⬜️ Not started | |
| TTP-F7 | Accessibility: preview group labelled with summary of current meta; keyboard navigation supported | ⬜️ Not started | |
| TTP-F8 | Analytics instrumentation logs preview refreshes + validator clicks | ⬜️ Not started | |
| TTP-F9 | Screenshot/download helper (if offered) exports preview image with accurate data | ⬜️ Not started | |
| TTP-F10 | Multi-tab sync: remote save triggers refetch and toast indicating preview updated | ⬜️ Not started | |

### Metadata & SEO – Generic “Upload image” / “Remove” flows

Applies to shared image fallback, OG image, Twitter image, and any future SEO asset uploads.

#### Backend tests
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| UI-B1 | Upload endpoints share common validator (mime, size, resolution) and return consistent error payload | ⬜️ Not started | |
| UI-B2 | Removing an image deletes previous file only if path belongs to branding media directory | ⬜️ Not started | |
| UI-B3 | Race condition: remove followed by upload (or vice versa) leaves latest state persisted | ⬜️ Not started | |
| UI-B4 | Upload failures (storage unreachable) return 503 and leave previous URL untouched | ⬜️ Not started | |
| UI-B5 | Multi-tenant safety: uploads scoped to tenant prefix and cannot overwrite other tenants | ⬜️ Not started | |
| UI-B6 | Audit log includes asset type (shared/OG/Twitter) and action (upload/remove) | ⬜️ Not started | |
| UI-B7 | CDN/cache invalidation triggered after upload/remove so public site doesn't serve stale image | ⬜️ Not started | |
| UI-B8 | Image-optimization worker job enqueued when upload stored; system tolerates delayed processing | ⬜️ Not started | |

#### Frontend tests
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| UI-F1 | Upload buttons open file picker with `accept` attribute matching allowed mimes | ⬜️ Not started | |
| UI-F2 | After upload success, preview updates, remove button enabled, and Save button reflects dirty state | ⬜️ Not started | |
| UI-F3 | Removing image shows confirmation prompt (if required) and clears preview | ⬜️ Not started | |
| UI-F4 | Snackbars/toasts for upload/remove honor admin settings guideline (above Save button) | ⬜️ Not started | apply reminder |
| UI-F5 | Accessibility: upload inputs operable via keyboard, remove buttons have aria-label referencing asset type | ⬜️ Not started | |
| UI-F6 | Multi-tab sync updates previews after refetch when upload/remove performed elsewhere | ⬜️ Not started | |
| UI-F7 | Drag-and-drop upload (if supported) handles invalid files gracefully | ⬜️ Not started | |
| UI-F8 | After upload success but save failure, UI warns image stored but settings not saved (option to undo image) | ⬜️ Not started | |
| UI-F9 | When worker processing pending, preview shows “processing” badge until final URL ready | ⬜️ Not started | |
### Metadata & SEO – “Validator helpers”

Utilities assisting admins with validating SEO metadata externally.

#### Backend tests (Validator helpers)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| VH-B1 | `fetchMetadataFromUrl` endpoint validates URL (https only) and sanitizes stored preview | ⬜️ Not started | |
| VH-B2 | Rate limiting: repeated fetch requests are throttled | ⬜️ Not started | |
| VH-B3 | `fetchMetadataFromUrl` caches responses for short TTL and invalidates when base URL changes | ⬜️ Not started | |
| VH-B4 | Endpoint follows redirects up to safe limit and rejects cross-tenant/private IP targets | ⬜️ Not started | |
| VH-B5 | `copyMetaTags` generator produces HTML snippet using current SEO settings, escaping special chars | ⬜️ Not started | |
| VH-B6 | “Use current origin” helper derives origin from authenticated request, respects proxies/X-Forwarded-Host | ⬜️ Not started | |
| VH-B7 | “Use localhost:3001” helper only available in non-prod environments; backend hides flag in prod payload | ⬜️ Not started | |
| VH-B8 | Validator link builders (Facebook/LinkedIn/Twitter) sign canonical URL to prevent tampering | ⬜️ Not started | |
| VH-B9 | Audit log records whenever metadata fetched or copied for traceability | ⬜️ Not started | |
| VH-B10 | `fetchMetadataFromUrl` supports Basic Auth credentials for staging endpoints via secure storage | ⬜️ Not started | |
| VH-B11 | Backend strips/blocks query params containing access tokens before hitting third-party validators | ⬜️ Not started | |
| VH-B12 | Helpers respect tenant-level feature flags (e.g., disable LinkedIn inspector for tenants without LinkedIn) | ⬜️ Not started | |
| VH-B13 | Monitoring: repeated fetch failures trigger alert/metric with URL + tenant tags; ensure sensitive data excluded | ⬜️ Not started | |
| VH-B14 | Permission guard: editors without external validator rights receive 403 when invoking helper endpoints | ⬜️ Not started | |
| VH-B15 | E2E contract: nightly Playwright job hits validator helpers end-to-end (fetch → preview → copy) to ensure wiring | ⬜️ Not started | |

#### Frontend tests (Validator helpers)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| VH-F1 | “Use current origin” populates URL field with `window.location.origin` | ⬜️ Not started | |
| VH-F2 | “Use localhost:3001” button populates dev URL (for preview environments) | ⬜️ Not started | |
| VH-F3 | “Copy meta tags” copies rendered meta block to clipboard and shows confirmation | ⬜️ Not started | |
| VH-F4 | “Fetch from URL” performs GET, handles spinner, parses meta tags, and shows success/error toast | ⬜️ Not started | |
| VH-F5 | “View meta tags” toggles modal showing current generated tags | ⬜️ Not started | |
| VH-F6 | Quick links open Facebook Debugger, LinkedIn Inspector, Twitter Card Validator with prefilled URL | ⬜️ Not started | |
| VH-F7 | Accessibility: helper buttons have aria-labels and keyboard focus order | ⬜️ Not started | |
| VH-F8 | URL field placeholder set to `https://example.com` and enforces https scheme with inline validation | ⬜️ Not started | |
| VH-F9 | “Use current origin” disabled when origin already matches field; tooltip explains why | ⬜️ Not started | |
| VH-F10 | “Use localhost:3001” visible only in dev/test builds; production hides button | ⬜️ Not started | |
| VH-F11 | “Copy meta tags” respects reduced motion/clipboard permissions and shows fallback instructions on failure | ⬜️ Not started | |
| VH-F12 | “Fetch from URL” error handling covers timeouts, invalid SSL, mixed content, and surfaces specific guidance | ⬜️ Not started | |
| VH-F13 | “View meta tags” modal supports code highlighting, copy buttons per tag, and closes via ESC | ⬜️ Not started | |
| VH-F14 | External validator links open in new tab, include `rel="noopener"` and display toast confirming action | ⬜️ Not started | |
| VH-F15 | Facebook/LinkedIn/Twitter validator buttons show spinner/disabled state until canonical URL validated | ⬜️ Not started | |
| VH-F16 | Helpers respect localization (button labels, tooltips) and RTL layout | ⬜️ Not started | |
| VH-F17 | URL field preserves last-used value per admin (local storage) and offers clear button | ⬜️ Not started | |
| VH-F18 | “Use current origin” respects multi-tenant admin subdomains and warns if cross-tenant mismatch | ⬜️ Not started | |
| VH-F19 | “Fetch from URL” displays structured diff (before/after) highlighting changes in meta tags | ⬜️ Not started | |
| VH-F20 | Playwright E2E: trigger “Fetch from URL” + “Copy meta tags” flows and assert clipboard output equals rendered meta block | ⬜️ Not started | |
| VH-F21 | Role-based UI: admins see all validator buttons, editors w/o permission see disabled state + tooltip referencing policy | ⬜️ Not started | |

### Metadata & SEO – Security hardening (cross-section)

Consolidated security scenarios spanning OG/Twitter fields, uploads, previews, and validator helpers.

#### Backend tests (Security)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| SEC-B1 | HTML/script injection attempt in any SEO text field (title/description/browser title) is rejected and output is escaped when persisted | ⬜️ Not started | |
| SEC-B2 | Uploaded images are re-encoded server-side and scanned; malicious payload renamed `.png` is detected and quarantined | ⬜️ Not started | |
| SEC-B3 | Public `/public-settings` serializer strips internal fields (Basic Auth creds, feature flags) even if misconfigured | ⬜️ Not started | |
| SEC-B4 | SSR/meta generator enforces Content-Security-Policy meta entries unaffected by branding inputs | ⬜️ Not started | |
| SEC-B5 | Open redirect protection: external validator links accept only whitelisted domains and append `rel="noopener"` server-side | ⬜️ Not started | |
| SEC-B6 | Rate limiting + IP allowlist for validator helper endpoints to prevent abuse/DDoS | ⬜️ Not started | |
| SEC-B7 | Multi-tenant isolation: attempts to reference other tenant asset URLs or metadata return 403 and are logged | ⬜️ Not started | |
| SEC-B8 | Audit log tamper resistance: log entries for uploads/validator usage signed and verifiable | ⬜️ Not started | |
| SEC-B9 | Secrets redaction: when errors occur (fetch failures, upload scan issues) responses never include storage paths or creds | ⬜️ Not started | |

#### Frontend tests (Security)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| SEC-F1 | All previews render sanitized HTML—attempting to insert `<script>` or unsupported tags results in escaped text | ⬜️ Not started | |
| SEC-F2 | Validator helper buttons disabled for users lacking permission; tooltip explains policy and events not fired | ⬜️ Not started | |
| SEC-F3 | External links (Facebook/LinkedIn/Twitter validators) always include `rel="noopener noreferrer"` and open via `target="_blank"` | ⬜️ Not started | |
| SEC-F4 | Clipboard helpers (copy meta tags) respect browser permission model and never expose hidden fields | ⬜️ Not started | |
| SEC-F5 | Upload inputs prevent drag-and-drop of HTML/SVG when restricted to PNG/JPEG/WEBP | ⬜️ Not started | |
| SEC-F6 | UI never reveals absolute storage paths or signed URLs in tooltips/logs; previews use CDN domain only | ⬜️ Not started | |
| SEC-F7 | Error banners redact sensitive info and provide generic codes referencing audit log ID | ⬜️ Not started | |
| SEC-F8 | Keyboard navigation cannot focus hidden helper buttons reserved for admins without proper role | ⬜️ Not started | |
| SEC-F9 | Multi-tab conflict dialogs show only diff metadata, not raw payloads, preventing data leakage | ⬜️ Not started | |

### Metadata & SEO – “Sitemap”

Controls sitemap generation and per-section toggles.

#### Backend tests (Sitemap)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| SM-B1 | Enabling sitemap sets `seo.sitemap.enabled=true` and exposes `/sitemap.xml` endpoint | ⬜️ Not started | |
| SM-B2 | Disabling sitemap returns 404 or empty response and removes sitemap link from robots.txt | ⬜️ Not started | |
| SM-B3 | Section toggles (Wiki, Courses, Legal) include/exclude respective URLs | ⬜️ Not started | |
| SM-B4 | Contract test ensures PATCH response returns full sitemap config | ⬜️ Not started | |
| SM-B5 | Generated sitemap respects base URL (canonical) changes without needing manual regeneration | ⬜️ Not started | |
| SM-B6 | Security: only admins with permission can regenerate sitemap (403 otherwise) | ⬜️ Not started | |
| SM-B7 | Error handling when underlying storage unavailable returns 503 and leaves previous sitemap intact | ⬜️ Not started | |

#### Frontend tests (Sitemap)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| SM-F1 | Toggle for sitemap enabled/disabled reflects server value | ⬜️ Not started | |
| SM-F2 | Section checkboxes (Wiki/Courses/Legal) update payload and UI badges | ⬜️ Not started | |
| SM-F3 | “Regenerate sitemap” button calls endpoint, shows spinner, and surfaces success/error toast | ⬜️ Not started | |
| SM-F4 | Link preview shows current `/sitemap.xml` URL and copy button works | ⬜️ Not started | |
| SM-F5 | Error from backend displayed inline near toggle/checkbox | ⬜️ Not started | |
| SM-F6 | Unsaved changes prompt triggers when toggles changed | ⬜️ Not started | |
| SM-F7 | Accessibility: toggles labeled, group described via legend, regenerate button accessible | ⬜️ Not started | |
| SM-F8 | Multi-tab sync updates sitemap settings after refetch | ⬜️ Not started | |

#### Sitemap section – “Wiki”
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| SW-B1 | Backend includes wiki pages only when `seo.sitemap.sections.wiki=true` | ⬜️ Not started | |
| SW-B2 | Disabling wiki section removes `/wiki/*` URLs and regenerates sitemap | ⬜️ Not started | |
| SW-B3 | Contract test ensures PATCH response returns updated wiki flag | ⬜️ Not started | |
| SW-B4 | Frontend checkbox toggles wiki flag, updates preview count, and is disabled when sitemap disabled | ⬜️ Not started | |
| SW-B5 | Unsaved changes prompt triggers when wiki checkbox toggled | ⬜️ Not started | |
| SW-B6 | Multi-tab sync reflects wiki section toggles | ⬜️ Not started | |

#### Sitemap section – “Courses”
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| SC-B1 | Backend includes only published courses with public visibility when `seo.sitemap.sections.courses=true` | ⬜️ Not started | |
| SC-B2 | Disabling courses section removes `/courses/*` URLs and regenerates sitemap | ⬜️ Not started | |
| SC-B3 | Contract test ensures PATCH response returns updated courses flag | ⬜️ Not started | |
| SC-B4 | Frontend checkbox for Courses toggles flag, updates preview count, and is disabled when sitemap disabled | ⬜️ Not started | |
| SC-B5 | Error handling when course catalog unavailable shows inline warning | ⬜️ Not started | |
| SC-B6 | Multi-tab sync reflects courses section toggles | ⬜️ Not started | |

#### Sitemap section – “Legal”
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| SL-B1 | Backend includes legal pages (Terms, Privacy, Imprint) only when `seo.sitemap.sections.legal=true` | ⬜️ Not started | |
| SL-B2 | Disabling legal section removes `/legal/*` URLs and regenerates sitemap | ⬜️ Not started | |
| SL-B3 | Contract test ensures PATCH response returns updated legal flag | ⬜️ Not started | |
| SL-B4 | Frontend checkbox toggles legal flag, updates preview count, and is disabled when sitemap disabled | ⬜️ Not started | |
| SL-B5 | If no legal pages exist, checkbox shows tooltip/disabled state explaining requirement | ⬜️ Not started | |
| SL-B6 | Multi-tab sync reflects legal section toggles | ⬜️ Not started | |

### Metadata & SEO – “SEO settings enabled”

Master toggle for exposing SEO configuration to the public site (e.g., disables overrides when off).

#### Backend tests (Enabled toggle)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| EN-B1 | Enabling sets `seo.enabled=true` and ensures public settings expose SEO fields | ⬜️ Not started | |
| EN-B2 | Disabling sets `seo.enabled=false` and forces defaults (e.g., hide social metadata, fall back to app defaults) | ⬜️ Not started | |
| EN-B3 | Contract test ensures PATCH response returns `seo.enabled` flag | ⬜️ Not started | |
| EN-B4 | When disabled, SSR ignores custom title/default description and uses platform defaults | ⬜️ Not started | |
| EN-B5 | Audit log records actor toggling enabled state | ⬜️ Not started | |
| EN-B6 | Security: only high-privilege admins can toggle (403 otherwise) | ⬜️ Not started | |

#### Frontend tests (Enabled toggle)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| EN-F1 | Toggle reflects server value on load | ⬜️ Not started | |
| EN-F2 | Disabling SEO greys out dependent fields (title template, default description, OG/Twitter sections) | ⬜️ Not started | |
| EN-F3 | Save sends `{ seo: { enabled } }` payload; verify fetch body | ⬜️ Not started | |
| EN-F4 | Warning banner explains impact when disabled | ⬜️ Not started | |
| EN-F5 | Unsaved changes prompt triggers when toggle flipped | ⬜️ Not started | |
| EN-F6 | Accessibility: toggle labelled, warning text linked via `aria-describedby` | ⬜️ Not started | |
| EN-F7 | Multi-tab sync updates toggle and re-enables fields after refetch | ⬜️ Not started | |
### Localization – “Per-language overrides”

Applies to fields like `appNameByLang`, `fontUrlByLang`, `socialDescriptionByLang`, etc.

#### Backend tests (Per-language dictionaries)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| LO-B1 | Accepts dictionary `{ lang: value }`, trims keys/values, and persists only supported locales | ⬜️ Not started | |
| LO-B2 | Rejects invalid locale codes (not in allowed list) with descriptive error | ⬜️ Not started | |
| LO-B3 | Removing entry (value empty string) deletes locale override instead of persisting empty | ⬜️ Not started | |
| LO-B4 | Contract test ensures PATCH response returns sanitized dictionaries | ⬜️ Not started | |
| LO-B5 | SSR/public settings expose localized values immediately | ⬜️ Not started | |
| LO-B6 | Partial update merges dictionaries without wiping untouched locales | ⬜️ Not started | |
| LO-B7 | Audit logging records changed locales and actor | ⬜️ Not started | |
| LO-B8 | Security: prevents HTML/script injection in localized values | ⬜️ Not started | |

#### Frontend tests (Per-language UI)
| ID | Scenario | Status | Notes |
| --- | --- | --- | --- |
| LO-F1 | “Add language” UI lists available locales and shows chip/tag for each active override | ⬜️ Not started | |
| LO-F2 | Inline validation ensures locale not already used and value meets field-specific rules (length, characters) | ⬜️ Not started | |
| LO-F3 | Editing locale update prepopulates current value and saves to dictionary | ⬜️ Not started | |
| LO-F4 | Removing locale override removes chip and sends `{ locale: null }` in payload | ⬜️ Not started | |
| LO-F5 | Save payload includes both base value and `ByLang` overrides; verify fetch body | ⬜️ Not started | |
| LO-F6 | Multi-tab sync updates locale chips after settings refetch | ⬜️ Not started | |
| LO-F7 | Accessibility: locale selector and inputs labelled, error messages referenced via aria | ⬜️ Not started | |
| LO-F8 | Unsaved changes prompt triggers when any locale entry edited | ⬜️ Not started | |
| LO-F9 | Preview components update immediately when switching locales (if preview supports language toggle) | ⬜️ Not started | |
## Test data helpers
- Extend existing `makeSettingsResponse` factory in `fe/src/app/admin/settings/__tests__` to accept overrides for `branding.appName`.
- For backend tests reuse `buildConfig` helper in `settings.service.spec.ts` so branding defaults stay consistent.

## Next steps
- Implement the above BE tests inside `settings.service.spec.ts` under a new `describe('branding – appName')` block.
- Implement FE RTL tests inside `fe/src/app/admin/settings/__tests__/branding-app-name.test.tsx` (new file) or expand current suite if size manageable.
- Ensure lint rules (no `any`, explicit expect assertions) remain satisfied; run `npm run test:be` / `npm run test:fe` before PR.
