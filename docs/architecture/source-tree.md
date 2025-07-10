# Source Tree

Проектът следва monorepo структура, управлявана с `pnpm workspaces`.

```
qa-platform/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       └── ci.yml
├── .vscode/                    # VSCode настройки
├── apps/
│   ├── web/                    # Публично React приложение
│   │   ├── src/
│   │   │   ├── components/     # Общи UI компоненти
│   │   │   ├── hooks/          # React hooks
│   │   │   ├── pages/          # Страници на приложението
│   │   │   ├── services/       # API services
│   │   │   └── stores/         # Zustand stores
│   │   └── package.json
│   ├── admin/                  # React приложение за администрация
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/          # Admin pages
│   │   │   ├── services/       # Admin API services
│   │   │   └── stores/         # Admin state stores
│   │   └── package.json
│   └── api/                    # NestJS API сървър
│       ├── src/
│       │   ├── modules/        # Функционални модули (auth, users, topics)
│       │   ├── common/         # Общи услуги, guards, interceptors
│       │   ├── config/         # Конфигурация на приложението
│       │   └── main.ts         # Входна точка
│       └── package.json
├── packages/
│   ├── shared-types/           # Споделени TypeScript типове и интерфейси
│   │   └── src/
│   ├── ui-components/          # Споделени React UI компоненти
│   │   └── src/
│   └── constants/              # Споделени константи (API routes, enums)
│       └── src/
├── scripts/                    # Скриптове за база данни и други
│   └── init-db.sql
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── README.md
└── tsconfig.base.json
```
