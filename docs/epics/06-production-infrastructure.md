# Епик: Продакшън инфраструктура и непрекъснато внедряване (Production Infrastructure & Deployment)

## Бизнес цел
Да осигурим надеждна, сигурна и мащабируема облачна инфраструктура за продакшън среда, която позволява бързи, безопасни и автоматизирани деплойменти на LMS. Целта е минимален downtime, бързо възстановяване при инциденти и оптимизирани разходи.

## Метрики за успех / KPI
- Достъпност (uptime) ≥ **99.9 %** (мествено месечно)
- Deployment success rate ≥ **98 %**
- Mean Time to Recovery (MTTR) ≤ **10 min**
- Средно време от merge до production ≤ **15 min**
- Cost per active user ≤ **0.10 USD / месец** (след първите 3 месеца)
- Поддържан среден throughput ≥ **500 RPS** (k6 load test) при p95 ≤ 300 ms

## Основни изисквания
- **Облачна платформа**
  - Contabo VPS (6 vCPU, 12 GB RAM, 100 GB NVMe) – един сървър за всички услуги (NestJS/Node, PostgreSQL, Redis, Nginx, Prometheus и др.)
  - IaC: Terraform (Contabo provider) или Ansible playbooks + Docker Compose files
- **CI/CD Pipeline (Prod Stages)**
  - GitHub Actions → Staging → Manual approval → Production
  - Canary/rolling deployment; автоматичен rollback при fail health-check
- **Контейнери & оркестрация**
  - Docker images с multi-stage build (Node + Nginx)
  - Horizontal Pod Autoscaler (k3s/K8s) скалира при CPU ≥70 %; zero-downtime blue/green или rolling rollout
  - Docker Compose стек или еднонодов k3s за оркестрация на контейнерите
- **Сигурност**
  - UFW/iptables firewall: само 22, 80, 443; допълнително Fail2ban срещу brute-force
  - Secrets в docker‐compose `.env`/docker secrets; достъп по SSH ключове; редовни OS обновления
  - Cloudflare WAF + rate-limiting, автоматични Let's Encrypt TLS сертификати
- **Наблюдаемост (Prod Stack)**
  - Prometheus + Grafana локално в Docker или Grafana Cloud free tier
  - Loki (logs) + Tempo (traces)
  - Alerting към Slack / PagerDuty, SLO dashboards
- **Резервиране и възстановяване**
  - Daily `pg_dump` + `pg_basebackup`; Contabo snapshot (2 включени) всяка нощ
  - Off-site архив в Contabo Object Storage (S3 API) с lifecycle политики
  - Disaster recovery runbook (RTO ≤ 2 h)
- **Съответствие и политики**
  - GDPR: data-in-transit (TLS) & data-at-rest encryption (AES-256)
  - CIS Docker benchmark в CI
  - Pen-test readiness checklist
- **Документация & Обучение**
  - `docs/runbooks/*` за incident response
  - Архитектурни диаграми (C4) актуализирани

## Извън обхвата
- Мулти-облачен / on-prem хибрид
- Автоматичен cost-optimization с Spot instances
- Serverless re-architecture

## Зависимости
- Завършени епики 1–5 (функционална система, тестове, observability)
- Terraform state бекенд: Contabo Object Storage (S3 API) или локален файл + git lock
- Docker registry: GitHub Packages или Docker Hub

## Рискове и смекчаване
| Риск | Въздействие | Вероятност | Митигиране |
|------|-------------|------------|------------|
| Грешни Terraform промени → downtime | Високо | Средно | Plan & peer review, автоматични тестове с Terratest |
| Неоптимални cloud разходи | Средно | Средно | Cost Explorer алерти, weekly отчети |
| Прекъсване на услуги при обновяване | Високо | Ниско | Canary + health checks + auto rollback |
| Compromise на secrets | Високо | Ниско | Secrets Mgr rotation, IAM policies |

## График / Основни етапи
| Етап | Целева дата | Отговорник |
|------|-------------|------------|
| IaC модули (VPS, DNS, Object Storage) | Седмица 1 | DevOps |
| CI/CD deploy към VPS (Docker Compose) | Седмица 1 | DevOps |
| Monitoring stack & alerts | Седмица 2 | SRE |
| Canary деплой + rollback логика | Седмица 2 | Backend Dev |
| PostgreSQL tuning & migration tooling | Седмица 3 | DBA |
| WAF & security hardening | Седмица 3 | SecEng |
| Disaster recovery тест | Седмица 4 | SRE |
| Документация & hand-off | Седмица 4 | PM |

> Оценена продължителност: **4 седмици**, минимална, но стабилна продакшън инфраструктура готова за първи реални потребители.

## SLO Targets (see `docs/observability/slo-sla.md`)
| Service | Metric | Target |
|---------|--------|--------|
| API Gateway | 95th percentile latency | ≤ 300 ms |
| Overall Platform | Availability | ≥ 99.9 % |
| Deployment pipeline | Success rate | ≥ 98 % |

## Governance & Periodic Reviews
- **Quarterly disaster-recovery drill** (table-top + live restore)
- **Annual infrastructure cost & security review**
- **Monthly review of SLO dashboards and alert thresholds**
