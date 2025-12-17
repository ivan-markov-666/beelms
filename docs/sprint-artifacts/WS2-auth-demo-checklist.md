# WS-2 – Auth Demo & Test Checklist

## Demo flow

- [ ] Регистрация.
- [ ] Login и достъп до профил.
- [ ] Logout.

## API checks

- [ ] `POST /api/auth/register`.
- [ ] `POST /api/auth/login`.
- [ ] `GET /api/users/me`.

## Security checks (smoke)

- [ ] Rate limiting за чувствителни операции (ако е включено).
- [ ] JWT guard работи коректно.
