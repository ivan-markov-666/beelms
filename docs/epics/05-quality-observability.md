# Епик: Качество, наблюдаемост и съответствие (локална среда)

## Бизнес цел
Да гарантираме високо качество на кода, бърза обратна връзка за грешки и съответствие със стандартите за сигурност и поверителност още в локална/CI среда. Ранното установяване на качествени практики намалява дефекти и разходи при бъдещото продакшън внедряване.

## Метрики за успех / KPI
- Build success rate (CI) ≥ **95 %**
- Тестово покритие ≥ **80 %** на backend и frontend
- ESLint/TS linter critical issues = **0** в `main` branch
- Средно време за откриване на дев грешка (Sentry) ≤ **5 min**
- Средно време за поправка на дев грешка ≤ **1 ден**

## Основни изисквания
- **CI/CD Pipeline (GitHub Actions)**
  - Етапи: `lint` → `test` → `build`
  - Паралелни джобове за frontend и backend
  - Кеширане на зависимости
- **Прекоммит кукове (Husky + lint-staged)**
  - Проверка на TypeScript компилация и ESLint
  - Форматиране с Prettier
- **Статичен анализ**
  - ESLint + TypeScript strict mode
  - SonarQube сканиране (self-host dev контейнер)
- **Тестова пирамида**
  - Юнит тестове (Jest) ≥80 % покритие
  - Интеграционни тестове (Supertest / React Testing Library)
  - Скриптове за e2e (Playwright) – по избор
- **Наблюдаемост (Dev Stack)**
  - Docker-compose: Prometheus + Grafana + Loki + Tempo
  - Sentry dev mode за capture на грешки (dsn = localhost)
  - МЕТРИКИ: response time, error rate, coverage reports
- **Security & Compliance Gates**
  - Trivy / npm audit в CI
  - git-secrets за проверка на API ключове
  - Licenses check (OSS лицензии)
  - GDPR dummy data в dev
- **Документация**
  - README section "How to run quality & observability stack"
  - Code Review Checklist (docs/dev-guidelines/code-review-checklist.md) актуализиран

## Извън обхвата
- Пълен SOC2/ISO 27001 одит
- Production-grade monitoring (отделен епик 6)
- Real-time alerting към PagerDuty

## Зависимости
- Основни услуги от епики 1–4, за да има какво да се наблюдава
- Docker и docker-compose инсталирани локално
- GitHub Actions (безплатен tier)

## Рискове и смекчаване
| Риск | Въздействие | Вероятност | Митигиране |
|------|-------------|------------|------------|
| Шум от прекалено много dev alerts | Средно | Средно | Rate-limit на Sentry dev, филтриране на low-value logs |
| Увеличено време за CI билд | Средно | Средно | Кеширане, паралелни стъпки, incremental tests |
| Фалшиво чувство за сигурност (dev ≠ prod) | Високо | Ниско | Ясна документация, отделен епик за продакшън наблюдаемост |
| Несъвместими версии на инструменти | Средно | Ниско | Version pinning, Renovate бот |

## График / Основни етапи
| Етап | Целева дата | Отговорник |
|------|-------------|------------|
| Настройка на GitHub Actions pipeline | Седмица 1 | DevOps |
| Прекоммит кукове + ESLint/Prettier | Седмица 1 | All Devs |
| Интегриране на Sentry dev + Prometheus stack | Седмица 2 | DevOps |
| SonarQube & security сканирания | Седмица 2 | Sec / Dev |
| Повишаване покритие на тестове до ≥80 % | Седмица 3 | QA / Dev |
| Обновяване на документация и checklist | Седмица 3 | PM |

> Оценена продължителност: **3 седмици**, локална среда с високи стандарти за качество и наблюдаемост.
