#!/usr/bin/env node

// Тук изрично зареждаме reflect-metadata преди каквито и да е други импорти
require('reflect-metadata');

const { spawnSync } = require('child_process');
const path = require('path');

console.log('Стартиране на unit тестовете за User entity...');

// Добавяме нужните флагове за TypeScript и декораторите
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'commonjs',
  experimentalDecorators: true,
  emitDecoratorMetadata: true,
  esModuleInterop: true,
});

// Изпълняваме тестовете директно с правилните опции
const result = spawnSync(
  'node',
  [
    path.resolve('./node_modules/jest/bin/jest.js'),
    'tests/unit/entities/user.entity.test.ts',
    '--verbose',
    '--no-cache',
    '--detectOpenHandles',
    '--forceExit',
  ],
  {
    stdio: 'inherit',
    env: process.env,
  }
);

process.exit(result.status);
