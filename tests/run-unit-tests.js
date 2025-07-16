// Скрипт за изпълнение на unit тестове за TypeORM сущности
require('reflect-metadata');
const { spawnSync } = require('child_process');
const path = require('path');

console.log('Изпълняване на unit тестове за User entity...');

// Изпълняваме тестовете чрез ръчно извикване на jest с правилните параметри
const result = spawnSync(
  'node',
  [
    path.resolve('./node_modules/jest/bin/jest.js'),
    '--config=jest.config.js',
    'tests/unit/entities/user.entity.test.ts',
    '--verbose',
    '--no-cache',
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      TS_NODE_COMPILER_OPTIONS: '{"experimentalDecorators":true,"emitDecoratorMetadata":true}',
    },
  }
);

if (result.status !== 0) {
  console.error('Тестовете не са изпълнени успешно');
  process.exit(1);
} else {
  console.log('Всички тестове са изпълнени успешно');
}
