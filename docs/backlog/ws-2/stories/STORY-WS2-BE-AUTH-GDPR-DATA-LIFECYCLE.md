# STORY-WS2-BE-AUTH-GDPR-DATA-LIFECYCLE – GDPR lifecycle & audit за потребителски акаунти

Status: Draft

## Summary
Като **Data Protection Officer / администратор на системата** искам да имам **по-добра видимост и контрол върху lifecycle-а на потребителските данни** (създаване, смяна на парола, изтриване, експорт), така че да можем да докажем спазване на GDPR и да извършваме одити при нужда.

Това WS-2 BE story надгражда Auth/Account поведението от `STORY-WS2-BE-AUTH-PROFILE-ACCOUNT` и свързаните WS-2 stories с допълнителни полета, timestamps и евентуален audit log за ключови GDPR операции.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` (§4.2 FR-AUTH-4..6, §4.7 FR-CROSS-2 GDPR reporting).
- System Architecture – `docs/architecture/system-architecture.md` (Data lifecycle, Audit, Logging).
- OpenAPI – `docs/architecture/openapi.yaml` (`/users/me*`, `/auth/*`).
- WS-2 stories – `docs/backlog/ws-2/stories/STORY-WS2-BE-AUTH-PROFILE-ACCOUNT.md`, WS-2 Auth stories за register/login/forgot-reset.

## Acceptance Criteria
- За всеки потребител системата пази основни GDPR-relevant timestamps, напр.:
  - `createdAt` – вече съществува.
  - `passwordLastChangedAt` – кога е сменена паролата за последно.
  - `gdprErasureRequestedAt`, `gdprErasureCompletedAt` – кога е поискано и завършено изтриване/анонимизиране.
  - `lastExportRequestedAt`, `lastExportDeliveredAt` – заявки за експорт на лични данни.
- Ключови операции (смяна на парола, експорт, изтриване) могат да бъдат одитирани чрез:
  - разширени timestamps в `User`, и/или
  - отделна audit таблица (напр. `user_audit_events`) с тип на събитието, timestamp и минимален контекст.
- Тези данни са достъпни през подходящ интерфейс (напр. admin API или вътрешен отчетен инструмент), но **не излагат чувствителни данни** към публичния FE.

## Dev Tasks
- [ ] Дефиниране на нужните GDPR timestamps и/или audit модели:
  - разширения на `User` (напр. `passwordLastChangedAt`, `lastExportRequestedAt` и др.);
  - или отделна таблица `user_audit_events` с полета: `id`, `userId`, `eventType`, `createdAt`, `metadata(jsonb)`.
- [ ] Миграции за новите полета/таблици.
- [ ] Обновяване на съществуващите операции:
  - `register` – да инициализира новите полета (напр. `passwordLastChangedAt = createdAt`).
  - `changePassword` – да обновява `passwordLastChangedAt` и евентуално да добавя audit event.
  - `deleteAccount` – да сетва `gdprErasureRequestedAt`/`gdprErasureCompletedAt` (в синхрон с GDPR изтриването/анонимизацията).
  - `exportData` – да сетва `lastExportRequestedAt`/`lastExportDeliveredAt` и евентуално да добавя audit event.
- [ ] Добавяне на вътрешен (auth/admin) endpoint или отчетен механизъм за извличане на GDPR lifecycle информация за даден потребител (без да се разкриват повече данни от необходимото).
- [ ] Конфигуриране на подходящ retention policy за audit данните (ако е нужно) – напр. чистене след N години.
- [ ] Unit тестове за новите полета и логика.
- [ ] Integration тест(ове) за основния lifecycle (register → change password → export → delete) с проверка на timestamps / audit entries.

## Test Scenarios
- **[INT-GDPR-LC-1] Password change lifecycle**
  - Регистрация → `passwordLastChangedAt` = `createdAt`.
  - `change-password` → `passwordLastChangedAt` се обновява.
  - Audit entry (ако има таблица) се записва с правилния тип събитие.
- **[INT-GDPR-LC-2] Export lifecycle**
  - `export` → `lastExportRequestedAt`/`lastExportDeliveredAt` се обновяват.
  - Audit entry описва, че е направен експорт, без да съхранява самото съдържание на експорта.
- **[INT-GDPR-LC-3] Delete lifecycle**
  - `DELETE /api/users/me` → `gdprErasureRequestedAt`/`gdprErasureCompletedAt` (или еквивалентни полета) се попълват.
  - Audit trail показва последователността от събития за акаунта.

## Notes
- Точният набор от полета и продължителността на съхранение на audit данните трябва да бъде съгласуван с Legal/Compliance.
- Това WS-2 story не променя външния публичен API за профил/акаунт (освен евентуални admin/internal endpoints), а по-скоро обогатява вътрешната репрезентация и отчетните възможности.
