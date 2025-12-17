# beelms core – Brainstorm (BMAD)

_Роля: PM / Architect. Фаза: BMAD Discovery._

## Цел
 
Този документ събира в едно място основните “brainstorm” решения и предположения за **beelms core**.
 
## Основни решения (резюме)
 
- **Архитектура:** modular monolith (NestJS) + референтен Next.js frontend.
- **Tenancy:** single-tenant per deployment + multi-instance чрез tooling.
- **Инфраструктура (Lean Tier 0):** 1 VPS + Docker Compose, с опционални Redis/RabbitMQ/Monitoring.

## Отворени въпроси (не блокират старта)

- Детайли за payment интеграции (post-MVP).
- Дълбочина на learning analytics (post-MVP).
