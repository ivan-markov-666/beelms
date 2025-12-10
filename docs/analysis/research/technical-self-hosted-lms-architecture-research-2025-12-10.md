# Research Report: Technical – Self-hosted LMS Architecture (beelms core)

**Date:** 2025-12-10
**Author:** Master
**Research Type:** Technical

---

## Research Overview

Целта на това проучване е да даде аргументиран технически контекст за избора на архитектура и tenancy модел за **beelms core** като self-hosted LMS рамка, работеща в **Lean Tier 0** сценарий (1–2 VPS + Docker Compose), и да потвърди, че избраният в brainstorm-а подход (modular monolith + single-tenant per deployment) е разумен и съобразен с добрите практики.

Проучването стъпва на публични източници за:

- сравнение **monolith / modular monolith / microservices**;
- практики за **multi-tenant vs multi-instance** при LMS платформи (особено Moodle и производни);
- практически примери за **self-hosted LMS върху една VPS с Docker Compose** (напр. Open edX чрез Tutor).

---

## 1. Monolith, Modular Monolith, Microservices – какво казва индустрията

### 1.1. Обща картина

Няколко авторитетни източника описват три основни архитектурни подхода:

- **Monolith** – една кодова база, един deployment артефакт.
- **Modular Monolith** – една кодова база и deployment, но с **ясни вътрешни модули и граници**.
- **Microservices** – множество малки, независимо деплойвани услуги.

Източници (обобщение):

- DEV.to – „Monolith, Modular Monolith, and Microservices: A Comparison" – добър обзор на трите подхода и техните плюсове/минуси.
  - https://dev.to/mikaelsantilio/monolith-modular-monolith-and-microservices-a-comparison-196e
- FullStack Labs – „Modular Monolithic vs. Microservices" – защитава идеята, че **modular monolith** често е по-подходяща начална стъпка от директния старт с microservices.
  - https://www.fullstack.com/labs/resources/blog/modular-monolithic-vs-microservices
- Atlassian – „Microservices vs. monolithic architecture" – описва пътя им от монолит към microservices и ясно посочва, че monolith може да е по-подходящ в ранните фази.
  - https://www.atlassian.com/microservices/microservices-architecture/microservices-vs-monolith

### 1.2. Основни изводи за beelms core

От тези източници могат да се извлекат няколко ключови поуки (съобразени с нашия контекст):

- **Modular monolith** е препоръчителна начална архитектура, когато:
  - екипът е малък;
  - продуктът е още в ранно MVP / експериментална фаза;
  - искаме по-прост деплой (един артефакт, един docker-compose стек).
- **Microservices** добавят стойност главно когато:
  - екипите и трафикът са големи;
  - домейните са ясно отделени и изискват независима скалируемост;
  - има организационна готовност (DevOps култура, observability, управление на множество услуги и т.н.).
- И DEV.to статията, и FullStack Labs статията препоръчват **да се започне с добре структуриран modular monolith**, докато системата и екипът не узреят за real microservices.

**Заключение за beelms core:**

- Изборът **„NestJS modular monolith + ясни домейн модули (auth, wiki, courses, assessments, admin, integrations)“** е напълно в синхрон с добрите практики за малък екип и MVP рамка.
- Microservices могат да се появят по-късно (напр. отделен training API или analytics сервис), но **не трябва да са основна цел на v1/v2**.

---

## 2. Tenancy модел – multi-tenant vs multi-instance за LMS

### 2.1. Какво прави Moodle и подобни платформи

В контекста на LMS често се говори за два подхода:

- **Multi-tenant (shared)** – една инсталация/кодова база обслужва много организации (тенанти) в рамките на един deployment.
- **Multi-instance** – всяка организация има собствена инстанция (отделна база/деплой); общи tooling-и помагат за управление на множеството инстанции.

Примерни източници:

- Moodle US – „A guide to LMS multi-tenancy: Do you need it?" – обяснява multi-tenancy, предимства и недостатъци.
  - https://moodle.com/us/news/lms-multi-tenancy/
- Learning Solution – „Multi-instance and multi-tenant management" – описва разликата между multi-instance и multi-tenant в контекста на Moodle-базирани решения.
  - https://learningsolution.cloud/multi-instance-and-multi-tenant-management/

От тези ресурси се вижда, че:

- **Multi-tenant** дава по-добра централизация и споделяне на ресурси, но:
  - усложнява изолацията на данни и конфигурации;
  - прави upgrade-и и миграции по-чувствителни, защото една промяна засяга всички тенанти;
  - изисква по-сложен модел за права и конфигурация.
- **Multi-instance** е по-прост за разбиране и операционно управление:
  - всяка организация има собствена база и deployment;
  - по-лесно е да се изолира инцидент до една инстанция;
  - позволява различни версии/конфигурации за различни клиенти;
  - цената е повече инфраструктурен overhead, но в сценарий с **няколко** инстанции това е приемливо.

### 2.2. Извод за beelms core

В brainstorm документа вече избрахме:

- **MVP модел:** `single-tenant per deployment` (една инстанция = една организация/сценарий).
- Множество инстанции = множество deployment-и (multi-instance), поддържани чрез tooling/CLI.

Това е силно подкрепено от горните източници, защото:

- избягва усложненията на сложния multi-tenant модел в ранна фаза;
- пасва добре на **self-hosted / own-cloud** идея (всяка организация може да има своя VPS / стек);
- позволява по-гъвкави upgrade стратегии (различни инстанции могат да бъдат на различни версии за известно време).

**Заключение:**

- За хоризонт 6–12 месеца изборът `single-tenant per deployment` + **multi-instance** подход е **правилен и реалистичен**.
- Истински shared multi-tenant модел може да се разглежда като **future enhancement**, ако възникне нужда от десетки/стотици инстанции с обща инфраструктура.

---

## 3. Self-hosted LMS върху една VPS с Docker Compose

### 3.1. Примери от реалния свят

Open edX, една от най-използваните open-source LMS платформи, се деплойва често чрез **Tutor** – инструмент, който използва Docker и Docker Compose, за да стартира цял LMS стек върху един сървър.

- Hetzner Community – „Creating an Open edX LMS instance with Docker through Tutor" – показва как една Open edX инстанция може да се стартира на VPS с помощта на Docker Compose.
  - https://community.hetzner.com/tutorials/open-edx-lms-docker/

Основни наблюдения от подобни ръководства:

- целият стек (LMS, база данни, помощни услуги) се описва в един или няколко **docker-compose.yml** файла;
- това е напълно валиден подход за малки/средни deployment-и, особено за начални пилотни инсталации;
- при нужда от по-висока скалируемост частите на стека могат постепенно да се разделят по различни машини или да мигрират към Kubernetes.

### 3.2. Извод за инфраструктурата на beelms core

Това потвърждава, че избраният в Product Brief / PRD **Lean Tier 0** подход е адекватен:

- една VPS машина с Docker Compose (frontend, backend, PostgreSQL, Redis и т.н. като отделни контейнери);
- възможност за по-късно разделяне на компонентите по няколко машини или миграция към по-сложна платформа, ако:
  - трафикът нарасне;
  - броят инстанции стане голям;
  - има ресурс за DevOps екип.

---

## 4. Обобщение и препоръки за beelms core

### 4.1. Архитектура

- **Start simple**: NestJS **modular monolith** е най-подходящата стартова архитектура за beelms core.
- **Чисти домейн граници** вътре в монолита (auth, wiki, courses, assessments, admin, integrations) ще улеснят бъдещо отделяне на services, ако някой ден решим да извадим части в microservices.

### 4.2. Tenancy

- **MVP:** `single-tenant per deployment` + multi-instance чрез tooling.
- **Future option:** ако броят инстанции стане голям и се появи нужда от по-силна централизация, може да се изследва истински multi-tenant модел, но това **не е необходимо за първите 6–12 месеца**.

### 4.3. Инфраструктура

- **Lean Tier 0** (1–2 VPS + Docker Compose) е валидиран от реални примери (Open edX/Tutor, други self-hosted платформи).
- beelms core трябва да предоставя:
  - готов docker-compose стек;
  - ясна документация за деплой на една VPS;
  - възможност за включване/изключване на допълнителни услуги (Redis, RabbitMQ, Prometheus, Sentry) чрез feature toggles/конфигурация.

### 4.4. Връзка към следващите BMAD стъпки

- За `create-architecture`:
  - този документ потвърждава избраната комбинация **modular monolith + single-tenant + Lean Tier 0** и може да се цитира в архитектурния документ като източник.
- За `create-epics-and-stories`:
  - оттук могат да се извлекат задачи за:
    - структуриране на NestJS модулите;
    - дефиниране на tenancy/instance model в кода и конфигурацията;
    - изграждане на docker-compose стек и tooling за създаване на нова инстанция.

Този research доклад не променя радикално посоката, а по-скоро **потвърждава** вече избраната стратегия за beelms core и дава допълнителни аргументи защо тя е разумна за малък екип и хоризонт 6–12 месеца.
