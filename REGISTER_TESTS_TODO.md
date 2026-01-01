# Register Page Tests TODO List

Comprehensive list of additional tests for the register page functionality.

## Backend (API/Validation/Edge Cases)
- [x] **Password with only spaces** - `POST /api/auth/register returns 400 for password with only spaces`
- [x] **Password with only special characters** - `POST /api/auth/register returns 400 for password with only special chars`
- [x] **Email with Unicode characters** - `POST /api/auth/register handles Unicode emails`
- [x] **Email too long** - `POST /api/auth/register returns 400 for email too long (>255 chars)`
- [x] **Concurrent registrations** - `POST /api/auth/register handles concurrent duplicate attempts`
- [x] **Malformed JSON** - `POST /api/auth/register returns 400 for invalid JSON`
- [x] **Wrong HTTP method** - `GET /api/auth/register returns 405 Method Not Allowed`
- [x] **Missing Content-Type** - `POST /api/auth/register without Content-Type header`
- [x] **SQL injection patterns** - `POST /api/auth/register handles malicious SQL patterns`
- [x] **XSS patterns** - `POST /api/auth/register sanitizes XSS attempts`
- [x] **Very large request body** - `POST /api/auth/register handles oversized payload`
- [x] **Expired captcha token** - `POST /api/auth/register returns 400 for expired captcha`
- [x] **Rate limiting** - `POST /api/auth/register rate limits requests`
- [x] **Server maintenance** - `POST /api/auth/register during maintenance mode`

## Frontend (UI/UX/Interactions)
- [x] **Terms checkbox toggle** - `terms checkbox toggles state correctly`
- [x] **Form persistence** - `form retains data on page refresh`
- [x] **Keyboard navigation** - `form accessible with keyboard only`
- [x] **Screen reader support** - `form works with screen readers`
- [x] **Mobile responsiveness** - `form adapts to mobile viewport`
- [x] **Browser autofill** - `handles browser autofill correctly`
- [x] **Validation on blur** - `validates fields when losing focus`
- [x] **Password strength indicator** - `shows password strength feedback`
- [x] **Loading spinner** - `displays loading animation during submit`
- [x] **Error styling** - `error messages have correct styling`
- [x] **Success styling** - `success message styled appropriately`
- [x] **Form reset** - `form clears after successful registration`
- [x] **Input max length** - `enforces field character limits`
- [x] **Paste in password** - `allows paste in password fields`
- [x] **Copy from password** - `prevents copy from password fields`
- [x] **Browser navigation** - `handles back/forward navigation`

## Integration/End-to-End
- [x] **Complete registration flow** - `register → verify email → login`
- [x] **Password reset flow** - `register → forgot → reset → login`
- [ ] **Social login integration** - `register with social providers`

## Edge Cases/Network
- [x] **Network timeout** - `handles registration timeout`
- [x] **Unexpected status codes** - `handles 502/503 server errors`
- [x] **Captcha expiry** - `handles captcha expiration during fill`
- [x] **Offline/online** - `handles network connectivity changes`
- [x] **Rapid submissions** - `prevents multiple rapid form submits`
- [x] **Slow network** - `handles slow connection during submit`
- [ ] **Proxy/VPN** - `works with different IP addresses`

## Security
- [x] **Brute force protection** - `blocks excessive registration attempts`
- [x] **Honeypot fields** - `detects bot submissions`
- [x] **CSRF protection** - `validates CSRF tokens`
- [x] **Input sanitization** - `sanitizes all user inputs`

## Performance
- [x] **Load testing** - `handles high concurrent registration load`
- [x] **Memory usage** - `no memory leaks during registrations`

## Implementation Status
- [x] Email format validation (BE)
- [x] Verified active account (BE)
- [x] Captcha error when required (FE)
- [x] Form submit on Enter (FE)
- [x] Error clearing on typing (FE)

## Next Priority
Choose and implement tests one by one or in logical groups.
