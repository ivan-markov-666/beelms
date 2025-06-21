# AUTH-1-T9: Интеграция с Grafana и система за мониторинг

## Описание
Имплементация на система за наблюдаемост на аутентикационни услуги чрез интеграция с Grafana, настройка на дашборди и аларми за аномалии.

## Технически детайли

### Експортиране на метрики
- Имплементиране на Prometheus метрики за NestJS
- Експорт на ключови метрики за аутентикационни операции:
  - Брой регистрационни заявки (успешни/неуспешни)
  - Времетраене на регистрационни заявки
  - Брой опити за вход (успешни/неуспешни)
  - Брой грешки по тип
  - Процент на грешки при автентикация
  - Времетраене на JWT валидация
  - Използване на системни ресурси

### Prometheus конфигурация
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'lms_api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/metrics'

rule_files:
  - 'alerts.yml'
```

### Alerts конфигурация
```yaml
# alerts.yml
groups:
- name: lms_auth_alerts
  rules:
  - alert: HighAuthErrorRate
    expr: rate(auth_errors_total[5m]) > 5
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Повишен процент на грешки при автентикация"
      description: "Брой грешки при автентикация надвишава 5 в минута за последните 5 минути"

  - alert: SlowRegistrationRequests
    expr: histogram_quantile(0.95, rate(registration_duration_seconds_bucket[5m])) > 0.5
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Забавени заявки за регистрация"
      description: "95-ти персентил на времето за регистрация превишава 500 ms"

  - alert: HighLoginFailureRate
    expr: sum(rate(auth_login_failure_total[5m])) / sum(rate(auth_login_attempts_total[5m])) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Висок процент на неуспешни опити за вход"
      description: "Над 10% от опитите за вход са неуспешни през последните 5 минути"

  - alert: AbnormalTrafficPattern
    expr: rate(http_requests_total{path=~"/api/v1/auth/.*"}[5m]) > 50
    for: 3m
    labels:
      severity: warning
    annotations:
      summary: "Необичаен трафик към auth ендпойнти"
      description: "Прекомерен брой заявки към аутентикационните ендпойнти"
```

### Grafana дашборди
- Auth Stats Dashboard
  - Панел с общ брой регистрации/логвания
  - Графика на успешни/неуспешни логвания с времеви тренд
  - Heat map на времена за отговор
  - Топ 10 IP адреси с най-много неуспешни опити
  - Разпределение на грешки по тип

- Security Monitoring Dashboard
  - Графика на rate limit hits
  - Графика с брой блокирани IP адреси
  - Графика на JWT refresh rate
  - Графика на съмнителни действия

## Docker конфигурация
Добавяне към docker-compose:

```yaml
  prometheus:
    image: prom/prometheus:v2.37.0
    container_name: lms_prometheus
    volumes:
      - ./docker/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    ports:
      - "9090:9090"
    depends_on:
      - api
    restart: unless-stopped

  grafana:
    image: grafana/grafana:9.0.0
    container_name: lms_grafana
    volumes:
      - ./docker/grafana/provisioning:/etc/grafana/provisioning
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

## Имплементация

### Интеграция с NestJS
```typescript
// src/shared/monitoring/prometheus.service.ts
import { Injectable } from '@nestjs/common';
import { register, Histogram, Counter } from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly registrationDuration: Histogram;
  private readonly authErrors: Counter;
  private readonly authLoginAttempts: Counter;
  private readonly authLoginSuccess: Counter;
  private readonly authLoginFailure: Counter;

  constructor() {
    // Инициализиране на метрики
    
    this.registrationDuration = new Histogram({
      name: 'registration_duration_seconds',
      help: 'Времетраене на регистрационните заявки',
      labelNames: ['status'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 0.7, 1, 2, 5],
    });

    this.authErrors = new Counter({
      name: 'auth_errors_total',
      help: 'Общ брой грешки при автентикация',
      labelNames: ['type', 'path'],
    });

    this.authLoginAttempts = new Counter({
      name: 'auth_login_attempts_total',
      help: 'Общ брой опити за вход',
    });

    this.authLoginSuccess = new Counter({
      name: 'auth_login_success_total',
      help: 'Успешни опити за вход',
    });

    this.authLoginFailure = new Counter({
      name: 'auth_login_failure_total',
      help: 'Неуспешни опити за вход',
      labelNames: ['reason'],
    });

    // Регистриране на метрики
    [
      this.registrationDuration,
      this.authErrors,
      this.authLoginAttempts,
      this.authLoginSuccess,
      this.authLoginFailure,
    ].forEach(metric => register.registerMetric(metric));
  }

  // Методи за измерване и инкрементиране

  measureRegistrationDuration(status: 'success' | 'error') {
    return this.registrationDuration.startTimer({ status });
  }

  incrementAuthError(type: string, path: string) {
    this.authErrors.inc({ type, path });
  }

  incrementLoginAttempt() {
    this.authLoginAttempts.inc();
  }

  incrementLoginSuccess() {
    this.authLoginSuccess.inc();
  }

  incrementLoginFailure(reason: string) {
    this.authLoginFailure.inc({ reason });
  }
}

// Middleware за HTTP метрики
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  private readonly httpRequestsTotal: Counter;
  private readonly httpRequestDuration: Histogram;

  constructor() {
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Общ брой HTTP заявки',
      labelNames: ['method', 'path', 'status'],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Времетраене на HTTP заявки',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 0.7, 1, 2, 5],
    });

    register.registerMetric(this.httpRequestsTotal);
    register.registerMetric(this.httpRequestDuration);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const path = req.route?.path || req.path;
    const method = req.method;
    const end = this.httpRequestDuration.startTimer();

    res.on('finish', () => {
      const status = res.statusCode.toString();
      this.httpRequestsTotal.inc({ method, path, status });
      end({ method, path, status });
    });

    next();
  }
}
```

### Metrics Endpoint
```typescript
// src/shared/controllers/metrics.controller.ts
import { Controller, Get, Header } from '@nestjs/common';
import { register } from 'prom-client';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('metrics')
export class MetricsController {
  @Get()
  @Public()
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
```

## Настройка на аларми

### Интеграция с нотификации
- Конфигуриране на Grafana за изпращане на аларми чрез:
  - Email
  - Slack
  - PagerDuty
  - Webhook интеграция със собствена система

### Приоритизиране на аларми
- Критични: Изискват незабавна реакция (висок процент грешки, неуспешни логвания)
- Предупреждение: Изискват анализ в рамките на работния ден 
- Информационни: За наблюдение на тенденции

## Критерии за приемане
- [ ] Функционираща интеграция с Prometheus
- [ ] Конфигурирани и работещи дашборди в Grafana
- [ ] Настроени аларми за критични събития
- [ ] Тестван механизъм за нотификации
- [ ] Документиран процес за реакция при аларми
- [ ] Автоматично провизиониране на дашборди
- [ ] Метрики включват всички ключови показатели за автентикационните процеси

## Зависимости
- [AUTH-1-T0.5](AUTH-1-T0.5.md) - Docker среда
- [AUTH-1-T3](AUTH-1-T3.md) - Регистрационен ендпойнт

## Свързани файлове
- `src/shared/monitoring/prometheus.service.ts`
- `src/shared/middleware/http-metrics.middleware.ts`
- `src/shared/controllers/metrics.controller.ts`
- `docker/prometheus/prometheus.yml`
- `docker/prometheus/alerts.yml`
- `docker/grafana/provisioning/dashboards/auth-dashboard.json`
- `docker/grafana/provisioning/dashboards/security-dashboard.json`

## Бележки
- Настройките за метрики трябва да са конфигурируеми чрез environment променливи
- Дашбордите трябва да поддържат динамично филтриране по период и други параметри
- За production среда, добавете TLS и автентикация за достъп до Prometheus и Grafana
