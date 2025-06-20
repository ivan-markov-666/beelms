# Service Level Objectives (SLO) & Service Level Agreements (SLA)

## 1. Scope
Определя кои услуги и метрики са предмет на SLO/SLA.

## 2. Target Objectives
| Service | Metric | SLO Target | Measurement Window |
|---------|--------|-----------|--------------------|
| API Gateway | 95th percentile latency | ≤ 300 ms | 28 дни |
| Auth Service | Error rate | < 0.1 % | 28 дни |
| Course Service | Availability | ≥ 99.9 % | месечно |

## 3. Alert Thresholds
- **Warning:** 75 % от SLO бюджета изчерпано
- **Critical:** 90 % от бюджета изчерпано

## 4. Dashboards & Reporting
- Grafana folder: `SLOs/`
- Линкове към JSON export на dashboard-ите

## 5. Review Cadence
- Ежемесечен SLO review
- Квартален SLA отчет към стейкхолдъри

## 6. Continuous Improvement
- Root-cause анализ при SLO breach
- План за капацитет и оптимизация
