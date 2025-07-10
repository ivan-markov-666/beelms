# Tech Stack

| Category                 | Technology         | Version      | Purpose                              | Rationale                                                    |
| ------------------------ | ------------------ | ------------ | ------------------------------------ | ------------------------------------------------------------ |
| **Frontend Language**    | TypeScript         | 5.3.x        | Типово-безопасна frontend разработка | Типова безопасност, отлични инструменти                      |
| **Frontend Framework**   | React              | 18.2.x       | Интерактивен UI framework            | Голяма екосистема, многократна употреба на компоненти        |
| **UI Component Library** | Mantine UI         | 7.x          | Цялостен UI framework                | Отлична поддръжка на TypeScript, hooks                       |
| **State Management**     | Zustand            | 4.4.x        | Client state управление              | Прост, лек, TypeScript-friendly                              |
| **Backend Language**     | TypeScript         | 5.3.x        | Типово-безопасна backend разработка  | Споделяне на код с frontend, силна типизация                 |
| **Backend Framework**    | NestJS             | 10.x         | Node.js API framework                | Enterprise шаблони, dependency injection                     |
| **API Style**            | REST               | -            | HTTP API комуникация                 | Прост, добре разбран, отговаря на изискванията               |
| **Database**             | **PostgreSQL**     | **17.x**     | **Основно съхранение на данни**      | **Надеждна, мащабируема релационна база данни**              |
| **Full-Text Search**     | **PostgreSQL FTS** | **Built-in** | **Разширено търсене**                | **Интегрирани възможности за пълнотекстово търсене**         |
| **Authentication**       | **Stateless JWT**  | **Latest**   | **Потребителска автентикация**       | **Stateless автентикация с httpOnly бисквитки за сигурност** |
| **Frontend Testing**     | Vitest + RTL       | Latest       | Тестване на компоненти               | Бърз, модерни инструменти за тестване                        |
| **Backend Testing**      | Jest               | 29.x         | API & service тестване               | Зрял, добре интегриран с NestJS                              |
| **Security**             | helmet             | Latest       | HTTP security headers                | Best practice за защита на Express-базирани приложения       |
| **E2E Testing**          | Playwright         | 1.40.x       | End-to-end тестване                  | Модерен, надежден, cross-browser                             |
| **Build Tool**           | Vite               | 5.x          | Frontend build                       | Бързи builds, отлично dev experience                         |
| **ORM**                  | **TypeORM**        | **0.3.x**    | **Database абстракция**              | **Поддръжка на PostgreSQL, TypeScript integration**          |
| **CI/CD**                | GitHub Actions     | -            | Автоматизиран deployment             | Безплатен за публични repo, Docker поддръжка                 |
| **Logging**              | pino               | Latest       | Структурирани логове                 | Лека, бърза библиотека за JSON логове                        |
| **Email Service**        | SendGrid           | -            | Регистрация & уведомления            | Надеждна транзакционна услуга с безплатен план               |
