# WS-3 Practical Env – Implementation Order of User Stories

_Роля: Tech Lead / Analyst. Цел: ясен ред за имплементация на WS-3 Practical Environment walking skeleton (UI Demo + Training API)._ 

## 1. Обхват

Тази последователност покрива:
- Първия Practical Env walking skeleton (WS-3) за UI Demo и Training API.
- Минимален, но реален vertical през BE (Training API) и FE (UI Demo + API Demo страници).

## 2. Препоръчителен ред за имплементация

### WS-3 – Practical Env walking skeleton (BE → FE)

1. **STORY-WS3-BE-TRAINING-API-MINIMAL**  
   Минимален Training API модул/услуга с `GET /api/training/ping` и `POST /api/training/echo`, покриващ FR-API-DEMO-2.

2. **STORY-WS3-BE-TRAINING-API-SWAGGER**  
   Swagger/OpenAPI документация и публичен Swagger UI за Training API, покриващ FR-API-DEMO-1.

3. **STORY-WS3-FE-TRAINING-API-INTRO**  
   FE страница `/practice/api-demo` с обяснение на Training API, линк към Swagger и примерни сценарии за упражнения.

4. **STORY-WS3-FE-UI-DEMO-PAGE**  
   FE страница `/practice/ui-demo` с богата комбинация от UI елементи и бутон за reset, покриваща FR-UI-DEMO-1 и FR-UI-DEMO-3.

5. **STORY-WS3-FE-UI-DEMO-TASKS**  
   Текстова секция с примерни задачи върху UI Demo екрана, покриваща FR-UI-DEMO-2.

## 3. Бележки

- Този WS-3 skeleton стъпва върху вече реализираните Wiki/Auth/GDPR vertical-и от WS-1 и WS-2 и не променя техния обхват.
- FR-TASKS-1..3 (Tasks Engine) остават извън обхвата на WS-3 и ще бъдат адресирани в отделен post-MVP WS, когато Practial Env задачите/оценяването станат приоритет.
- Traceability към PRD/MVP за Practical Env се поддържа в `docs/backlog/WS-PRACTICAL-ENV-traceability.md`.
- При нужда от разширяване на Practical Env (повече UI екрани, CRUD demo ресурси, Tasks Engine) могат да бъдат добавени нови WS-4+ vertical-и, които да стъпят върху Training API и UI Demo от WS-3.
