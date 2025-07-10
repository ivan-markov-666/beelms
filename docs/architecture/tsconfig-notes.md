# TypeScript Configuration Notes

This document explains the structure and intent of the shared TypeScript configuration.

## Root `tsconfig.base.json`
* Acts as the **single source of truth** for compiler options.
* Enables **strict mode**, modern `ES2022` output, React-18 JSX with Emotion, and shared **path aliases**.
* Generates declarations (`.d.ts`) so that packages can depend on each other without compilation order headaches.

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@qa-platform/shared-types": ["packages/shared-types/src"],
      "@qa-platform/ui-components": ["packages/ui-components/src"],
      "@qa-platform/constants": ["packages/constants/src"],
      "@api/*": ["apps/api/src/*"],
      "@web/*": ["apps/web/src/*"],
      "@admin/*": ["apps/admin/src/*"]
    }
  }
}
```

## Per-package `tsconfig.json`
Every workspace (`apps/*`, `packages/*`) has its own `tsconfig.json` that **extends** the base config and sets:

* `rootDir` to its local `src` folder
* `outDir` to `dist`
* `composite: true` for libraries that will be built by the TypeScript incremental compiler

Example (packages/shared-types/tsconfig.json):

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true
  },
  "include": ["src"]
}
```

## Test Configurations
* **Frontend apps** (`apps/web`, `apps/admin`) include `tsconfig.vitest.json` with Vitest / RTL typings.
* **Backend** (`apps/api`) includes `tsconfig.jest.json` for Jest / ts-jest.

These test configs extend the local `tsconfig.json` and add `"noEmit": true` to avoid generating extra output during tests.

## Adding a New Package / App
1. Create folder under `apps/` or `packages/` with a `src` directory.
2. Add a `tsconfig.json` exactly like the examples, adjusting the relative `extends` path if necessary.
3. Add a minimal `package.json` with a **unique `name`** (scope `@qa-platform/<something>` for libraries).
4. If the package contains tests, add an additional `tsconfig.<test-runner>.json`.

Keeping these conventions allows automatic tooling (`vite-tsconfig-paths`, `ts-jest`, etc.) to work without extra configuration.
