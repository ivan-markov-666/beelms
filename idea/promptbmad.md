## Къде сме стигнали (кратко, за нов чат)

### Завършени Stories
- **Story A (Payments reliability)**
  - Изравнихме purchase status endpoint под `/api/payments/courses/:courseId/purchase/status` (JWT)
  - Добавихме FE polling на checkout success page (до 10 опита, backoff)
  - Обновихме e2e тестовете да ползват новия endpoint
- **Story B (Admin grant)**
  - Направихме admin-only `POST /api/admin/courses/:courseId/grants` (JWT + AdminGuard)
  - Поддържа `{ userId, enroll?, grantReason? }` (по дефолт `enroll=true`)
  - Идемпотентно създава [CoursePurchase](cci:2://file:///d:/Projects/beelms/be/src/courses/course-purchase.entity.ts:11:0-58:1) (ако курсът е paid) и `CourseEnrollment`
  - Добавихме audit полета в `course_purchases`:
    - `source` (`'stripe'|'admin'`)
    - `grantedByUserId` (FK към users)
    - `grantReason`
  - Stripe purchase записвания (webhook + verify) вече сетват `source='stripe'`
  - E2e тест [admin-course-grants.e2e-spec.ts](cci:7://file:///d:/Projects/beelms/be/test/admin-course-grants.e2e-spec.ts:0:0-0:0) валидира grant + audit полета
- **Допълнителни )}
  - Bulgarian README.md

## Къде сме стигнали (кратко, за нов чат)

### Завършени Stories
- **Story A (Payments reliability)**
  - Изравнихме purchase status endpoint под `/api/payments/courses/:courseId/purchase/status` (JWT)
  - Добавихме FE polling на checkout success page (до 10 опита, backoff)
  - Обновихме e2e тестовете да ползват новия endpoint
- **Story B (Admin grant)**
  - Направихме admin-only `POST /api/admin/courses/:courseId/grants` (JWT + AdminGuard)
  - Поддържа `{ userId, enroll?, grantReason? }` (по дефолт `enroll=true`)
  - Идемпотентно създава [CoursePurchase](cci:2://file:///d:/Projects/beelms/be/src/courses/course-purchase.entity.ts:11:0-58:1) (ако курсът е paid) и `CourseEnrollment`
  - Добавихме audit полета в `course_purchases`:
    - `source` (`'stripe'|'admin'`)
    - `grantedByUserId` (FK към users)
    - `grantReason`
  - Stripe purchase записвания (webhook + verify) вече сетват `source='stripe'`
  - E2e тест [admin-course-grants.e2e-spec.ts](cci:7://file:///d:/Projects/beelms/be/test/admin-course-grants.e2e-spec.ts:0:0-0:0) валидира grant + audit полета
- **Допълнителни }
  - README.md: добавих секция за `npm --prefix be/fe` от root
  - Fix: Stripe webhook idempotency по `stripeSessionId` (за да не гърми на duplicate key)

### Как да активираш “BMAD” роля в нов чат
Кажи:
> “Please activate BMAD role.”

Или използвай slash-командата:
> `/bmad-master`

Това ще зареди BMAD (Business Model Architecture Design) workflow, който да продължим оттам.