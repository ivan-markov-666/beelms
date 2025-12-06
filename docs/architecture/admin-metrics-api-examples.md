# Admin Metrics API – примерни заявки

Този документ съдържа примерни `curl` заявки и JSON payload-и за Admin Metrics endpoint-а.

- Base URL (dev): `http://localhost:3000/api`
- Всички заявки изискват Bearer JWT токен с `role = 'admin'`.

## 1. Преглед на метрики – GET /admin/metrics/overview

Този endpoint се използва от:

- таблото `/admin` (KPI карти);
- страницата `/admin/metrics` (Metrics Overview).

Връща обект `MetricsOverview` със следните полета:

- `totalUsers` – общ брой регистрирани потребители.
- `totalArticles` – общ брой Wiki статии (по slug).
- `topArticles` – масив от обекти със `slug` (резервирано за бъдещо разширение).
- `usersChangePercentSinceLastMonth` – процентна промяна на потребителите спрямо края на предходния календарен месец:
  - `null`, ако няма достатъчно данни (напр. предходният месец няма потребители);
  - положително число при ръст; отрицателно при спад.

### 1.1. Примерна заявка

```bash
curl -X GET \
  "http://localhost:3000/api/admin/metrics/overview" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Accept: application/json"
```

### 1.2. Примерен отговор

```json
{
  "totalUsers": 357,
  "totalArticles": 12,
  "topArticles": [
    { "slug": "getting-started" },
    { "slug": "manual-testing-intro" }
  ],
  "usersChangePercentSinceLastMonth": 25.3
}
```

Възможно е `usersChangePercentSinceLastMonth` да бъде `null`:

```json
{
  "totalUsers": 3,
  "totalArticles": 0,
  "topArticles": [],
  "usersChangePercentSinceLastMonth": null
}
```

### 1.3. Как FE използва полетата

- `/admin` (Admin Dashboard):
  - показва `totalUsers` и визуален лейбъл за промяна спрямо миналия месец;
  - когато `usersChangePercentSinceLastMonth` е `null`, се показва текст „Няма достатъчно данни за сравнение с миналия месец“ (или съответния превод).
- `/admin/metrics` (Metrics Overview):
  - използва `totalUsers` като основна стойност;
  - helper текстът под картата е „Примерна стойност за UI тестване“ в BG/EN/DE.

### 1.4. Забележки за имплементацията

- Изчислението на процента в BE е:

  ```text
  totalUsersPrevMonth = брой потребители с created_at < начало на текущия месец

  ако totalUsersPrevMonth > 0:
      changePercent = ((totalUsers - totalUsersPrevMonth) / totalUsersPrevMonth) * 100
  иначе:
      changePercent = null
  ```

- Полето `usersChangePercentSinceLastMonth` е `nullable: true` в OpenAPI (`MetricsOverview` schema), за да отрази случая без достатъчно данни.
- Логиката е описана и в `docs/architecture/db-model.md` (секция за User + бележките за метриките).

Този документ е синхронизиран с `docs/architecture/openapi.yaml` и реалния NestJS service `AdminMetricsService` в `be/src/auth/admin-metrics.service.ts`. При промена на метриките първо актуализирайте OpenAPI и след това примерите тук.
