# WS-7 Practice Env – Implementation Order of User Stories

_Роля: Tech Lead / Analyst. Цел: ясен ред за имплементация на WS-7 Practical Environment vertical (Training API + Tasks + Practice UI/API страници)._ 

## 1. Обхват

Тази последователност покрива WS-7 vertical за **Практическа среда**:
- минимален Training API за API упражнения (ping/echo);
- минимални Tasks endpoints за зареждане/submit на задача;
- Practice UI страница с UI елементи за упражнения;
- Practice API demo страница, която стъпва върху Training API.

## 2. Препоръчителен ред за имплементация

### WS-7 – Practical Env walking skeleton (BE → FE)

1. **STORY-WS7-BE-TRAINING-API-MINIMAL**  
   Минимален Training API (`GET /api/training/ping`, `POST /api/training/echo`) в BE, с базови тестове и документация.

2. **STORY-WS7-BE-TASKS-MINIMAL**  
   Tasks API (`GET /api/tasks/{id}`, `POST /api/tasks/{id}/submit`) за поне една примерна задача, с опростен evaluator и тестове.

3. **STORY-WS7-FE-PRACTICE-UI-PAGE**  
   FE Practice UI страница (напр. `/practice/ui-demo`), която стъпва върху BE Tasks/Training API и показва реални UI елементи за упражнения.

4. **STORY-WS7-FE-PRACTICE-API-DEMO-PAGE**  
   FE Practice API demo страница (напр. `/practice/api-demo`), която консумира Training API и показва примери/интеракции.

---

## 3. Бележки

- Stories 1–4 реализират основния WS‑7 **Practical Env** vertical – от Training/Tasks API до реални Practice UI/API екрани.
- Детайлният scope и acceptance criteria за всяка story са описани в:
  - `docs/backlog/ws-7/epics/EPIC-WS7-PRACTICE-ENV-TASKS.md`;
  - `docs/backlog/ws-7/stories/STORY-WS7-*.md`.
