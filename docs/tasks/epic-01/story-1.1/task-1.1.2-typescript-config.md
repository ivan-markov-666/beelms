# Task 1.1.2: TypeScript Configuration

## 🎯 Цел

Конфигуриране на TypeScript за цялостния проект с подходящи настройки за разработка.

## 🛠️ Действия

1. Създаване на основен `tsconfig.base.json` файл
2. Настройка на path aliases за всички пакети
3. Конфигуриране на специфични настройки за различните части на приложението

## 📋 Код

```json
// tsconfig.base.json
{
  "$schema": "https://json.bbnb.dev/tsconfig.schema.json",
  "compilerOptions": {
    "baseUrl": ".",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@qa-platform/shared-types": ["packages/shared-types/src"],
      "@qa-platform/ui-components": ["packages/ui-components/src"],
      "@qa-platform/constants": ["packages/constants/src"],
      "@api/*": ["apps/api/src/*"],
      "@web/*": ["apps/web/src/*"],
      "@admin/*": ["apps/admin/src/*"]
    },
    "outDir": "./dist",
    "declaration": true,
    "sourceMap": true,
    "inlineSources": true,
    "jsx": "react-jsx",
    "jsxImportSource": "@emotion/react"
  },
  "include": ["**/*.ts", "**/*.tsx", "**/*.d.ts", "**/*.js", "**/*.jsx"],
  "exclude": ["node_modules", "dist", "build", "coverage", ".next", ".vscode"]
}
```

## 📦 Deliverables

- [ ] Базова TypeScript конфигурация с всички необходими настройки
- [ ] Конфигурация за поддръжка на React 18+ с Emotion
- [ ] Path aliases за всички основни пакети и приложения
- [ ] `tsconfig.vitest.json` за **apps/web** и **apps/admin** (Vitest + RTL)
- [ ] `tsconfig.jest.json` за **apps/api** (Jest + ts-jest)
- [ ] Пер-пакетни `tsconfig.json` файлове, наследяващи `tsconfig.base.json`
- [ ] Минимални `package.json` файлове за всички `apps/*` и `packages/*`
- [ ] `.gitignore` с правила за node_modules, build/dists, IDE и env файлове
- [ ] Документация за настройките

## 🧪 Верификация

```bash
# Проверка за TypeScript грешки
pnpm --filter @qa-platform/web typecheck
pnpm --filter @qa-platform/admin typecheck
pnpm --filter @qa-platform/api typecheck

# Проверка на path aliases
# Трябва да работи без грешки
import { something } from '@qa-platform/shared-types';
import { apiClient } from '@api/common';
import { Button } from '@web/components';
```

## 📦 Зависимости

- TypeScript 5.3+
- @types/node
- @types/react
- @types/react-dom
- @emotion/react (за CSS-in-JS)
- vite-tsconfig-paths (за Vite path aliases)

## 📝 Бележки

- Уверете се, че всички пакети използват една и съща версия на TypeScript
- Проверете дали всички path aliases работят правилно
- Тествайте конфигурацията с различни типове файлове (TS, TSX, JS, JSX)
