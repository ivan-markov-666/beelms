# Task 1.1.1: Monorepo Initialization

## 🎯 Цел

Настройка на основната структура на monorepo с pnpm workspace.

## 🛠️ Действия

1. Създаване на основната директория и инициализиране на проекта
2. Настройка на pnpm workspace
3. Създаване на основната структура на проектите

## 📋 Код

```bash
# Setup commands
mkdir qa-platform && cd qa-platform
npm init -y
npm install -g pnpm

# Initialize pnpm workspace
echo 'packages:
  - "apps/*"
  - "packages/*"' > pnpm-workspace.yaml

# Create base structure
mkdir -p {apps,packages}/{web,admin,api}/{src,tests}
mkdir -p packages/{shared-types,ui-components,constants}/src
```

## 📦 Deliverables

- [x] Monorepo структура създадена
- [x] pnpm workspace конфигуриран
- [x] Базов tsconfig.base.json с включен strict mode
- [x] Работещо разрешаване на зависимости между пакетите

## 🧪 Тестване

```bash
# Команди за валидация
pnpm install  # Трябва да работи без грешки
pnpm --filter api install express
pnpm --filter web install react
# Тест за импорти между пакети

# Почистване на тестовите пакети след валидация
pnpm --filter api uninstall express
```

## 📝 Бележки

- Уверете се, че имате инсталиран Node.js версия 18+
- Проверете дали pnpm е инсталиран глобално
- Уверете се, че всички директории са създадени правилно
