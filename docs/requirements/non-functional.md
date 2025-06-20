# Нефункционални изисквания (NFR)

## 1. Производителност
| Показател | Цел | Метрика |
|-----------|-----|---------|
| Throughput | ≥ 500 RPS (avg) | k6 load test | 
| Latency | p95 ≤ 300 ms | Prometheus histogram |
| Startup Time | ≤ 5 s | NestJS boot logs |

## 2. Скалиране
- Horizontal pod autoscaling (K8s) при CPU ≥ 70 %
- Возможност за zero-downtime rollout (blue/green)

## 3. Достъпност & Надеждност
| Цел | Стойност |
|-----|----------|
| Uptime | ≥ 99.9 % (месечно) |
| MTTR | ≤ 30 мин |
| MTTD | ≤ 5 мин (Alertmanager) |

## 4. Сигурност и съответствие
- GDPR, ISO 27001 scope
- TLS 1.3 навсякъде
- Secrets в Vault

## 5. Поддръжка и наблюдаемост
- Логове -> Loki (90 дена retention)
- Трейсинг -> Tempo (7 дена)
- Метрики -> Prometheus (1 година)

## 6. Достъпност (Accessibility)
- WCAG 2.1 AA за фронтенда

## 7. Локализация
- I18n подкрепа за EN/BG; добавяне на нов език ≤ 2 седмици

## 8. Правни/Регулаторни
- Поддръжка на VAT invoices
- Право да бъдеш забравен (GDPR Art. 17)
