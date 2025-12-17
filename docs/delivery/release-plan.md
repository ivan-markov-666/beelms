# beelms core – Release Plan (Delivery)

_Роля: Tech Lead / Delivery. Фаза: BMAD Delivery._

## 1. Цел
 
Този документ описва **процеса за издаване (release)** на MVP версия на beelms core, включително:

- какви артефакти произвеждаме (tag/image/notes);
- какви тестове са задължителни преди release;
- какво проверяваме след deploy;
- как правим rollback.

Той стъпва на:

- `docs/delivery/test-plan.md` (suites + gates)
- `docs/architecture/mvp-bmad-dod-checklist.md` (финален DoD gate)
- `docs/delivery/walking-skeleton.md` (WS вертикали)

## 2. Release процес (MVP)

### 2.1. Подготовка (Release Candidate)

- Freeze на scope за release candidate.
- Потвърждение, че OpenAPI (`docs/architecture/openapi.yaml`) е синхронизиран с кода за WS-1..WS-4.
- Потвърждение, че промените в DB модел/миграции са ясни и възпроизводими.

### 2.2. Задължителни проверки преди deploy

- **Smoke + regression** според `docs/delivery/test-plan.md` (минимум на staging).
- Преглед на DoD чеклиста: `docs/architecture/mvp-bmad-dod-checklist.md`.

### 2.3. Versioning и артефакти

- **Git tag:** `v0.1.0` (или следваща версия).
- **Changelog/release notes:** кратко резюме на основните промени и known limitations.
- **Docker image version:** image таг, съвпадащ с git tag (или git commit SHA).

### 2.4. Deploy (staging → production)

- Deploy на staging.
- Post-deploy smoke на staging (виж секция 3).
- Deploy на production.
- Post-deploy smoke на production (виж секция 3).

## 3. Rollback

### 3.1. Post-deploy smoke (задължително)

- Изпълнение на smoke suite (WS-1..WS-3) според:
  - `docs/sprint-artifacts/WS1-wiki-demo-checklist.md`
  - `docs/sprint-artifacts/WS2-auth-demo-checklist.md`
  - `docs/sprint-artifacts/WS3-courses-assessments-demo-checklist.md`
- Проверка на базова наличност на API (health) и DB връзка.

### 3.2. Rollback механизъм (MVP)

- Rollback към предходен **Docker image tag** или **git tag**.
- Ако има DB миграции в release-а:
  - при критичен инцидент предпочитаме **forward fix** (нова миграция), освен ако не е ясно и безопасно да се върнем назад;
  - ако rollback на DB е нужен, той трябва да е предварително планиран (backup/restore процедура).

### 3.3. Post-rollback проверки

- Smoke suite отново (за да се потвърди, че системата е стабилизирана).
