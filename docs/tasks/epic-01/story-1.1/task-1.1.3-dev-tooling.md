# Task 1.1.3: Development Tooling Setup

## 🎯 Цел

Настройка на инструменти за разработка като ESLint, Prettier и други, за да се осигури високо качество на кода и консистентност в целия проект.

## 🛠️ Действия

1. Инсталиране на необходимите зависимости
2. Конфигуриране на ESLint с TypeScript поддръжка
3. Настройка на Prettier за форматиране на код
4. Добавяне на скриптове в package.json
5. Настройка на pre-commit hooks с husky

## 📋 Код

### .eslintrc.js

```javascript
module.exports = {
  extends: ['@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
  },
};
```

### .prettierrc

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5"
}
```

### package.json scripts

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "prepare": "husky install"
  }
}
```

## Инсталационни команди

```bash
# Install dev dependencies
pnpm add -w -D \
  eslint \
  prettier \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-config-prettier \
  eslint-plugin-prettier \
  husky \
  lint-staged

# Initialize husky
pnpm prepare
npx husky add .husky/pre-commit "npx lint-staged"
```

### .lintstagedrc

```json
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml}": ["prettier --write"]
}
```

## 📦 Deliverables

- [x] ESLint конфигурация с TypeScript поддръжка
- [x] Prettier конфигурация за форматиране
- [x] Husky pre-commit hooks за автоматично форматиране и проверка на кода
- [x] Скриптове за лесно изпълнение на често използвани задачи
- [x] Документация за използваните инструменти и настройки

## 🧪 Тестване

```bash
# Проверка за грешки
pnpm lint

# Автоматично оправяне на лесни за поправяне грешки
pnpm lint:fix

# Форматиране на целия код
pnpm format
```

## 📦 Зависимости

- eslint
- prettier
- @typescript-eslint/parser
- @typescript-eslint/eslint-plugin
- eslint-config-prettier
- eslint-plugin-prettier
- husky
- lint-staged

## 📝 Бележки

- Уверете се, че всички разработчици използват едни и същи настройки за форматиране
- Проверете дали всички правила за код са ясни и приложими
- Добавете допълнителни правила според нуждите на екипа
