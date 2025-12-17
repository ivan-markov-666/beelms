# WS-3 – Courses & Assessments Demo & Test Checklist

## Demo flow

- [ ] Отваряне на `/courses` (Course Catalog).
- [ ] Отваряне на `/courses/[courseId]` (Course Detail).
- [ ] Enrollment в курс като логнат потребител.
- [ ] Отваряне на `/my-courses` и преглед на записаните курсове.
- [ ] Маркиране на задача като изпълнена (completed).
- [ ] Отваряне на quiz, попълване и submit → визуализиране на резултат.

## API checks

- [ ] `GET /api/courses` връща 200.
- [ ] `GET /api/courses/{courseId}` връща 200.
- [ ] `POST /api/courses/{courseId}/enroll` връща 204/200.
- [ ] `GET /api/users/me/courses` връща 200.
- [ ] `POST /api/courses/{courseId}/tasks/{taskId}/complete` връща 204/200.
- [ ] `GET /api/courses/{courseId}/quizzes/{quizId}` връща 200.
- [ ] `POST /api/courses/{courseId}/quizzes/{quizId}/submit` връща 200 и съдържа резултат (score/pass).

## Data/DB checks

- [ ] DB е инициализирана (migrations + seed) и има поне 1 курс с поне 1 задача и 1 quiz.
- [ ] Enrollment и прогресът се записват и могат да се заредят повторно (refresh).
- [ ] Quiz attempt се записва.

## Security checks (smoke)

- [ ] Public endpoints (catalog/detail) са достъпни без JWT.
- [ ] Protected endpoints (enroll, my-courses, complete task, quiz submit) връщат 401 без JWT.
