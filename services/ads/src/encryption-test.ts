/**
 * Този файл съдържа тестове за демонстрация на функционалността на EncryptionService,
 * EncryptionInterceptor и EncryptionTransformer
 */

import { EncryptionService } from './common/services/encryption.service';
import { ConfigService } from '@nestjs/config';

// Removed unused EncryptionTransformer import

function main() {
  console.log('=== Тест на функционалността за криптиране ===');

  // Създаване на инстанция на ConfigService за тестване
  const encryptionKey =
    process.env.ENCRYPTION_KEY ||
    '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';

  // Създаваме mock на ConfigService за тестване
  const configService = {
    get: (key: string) => {
      if (key === 'ENCRYPTION_KEY') {
        return encryptionKey;
      }
      return null;
    },
  } as unknown as ConfigService;

  // Създаване на инстанция на EncryptionService
  const encryptionService = new EncryptionService(configService);

  // Създаваме инстанция на трансформера и задаваме нейния encryptionService
  // В реално приложение това се конфигурира от AppModule при инициализация

  // Тест на директно криптиране и декриптиране
  console.log('\n1. Директно криптиране и декриптиране на текст:');
  const textToEncrypt = 'Това е секретна информация';
  console.log(`Оригинален текст: ${textToEncrypt}`);

  const encryptedText = encryptionService.encrypt(textToEncrypt);
  console.log(`Криптиран текст: ${encryptedText}`);

  const decryptedText = encryptionService.decrypt(encryptedText);
  console.log(`Декриптиран текст: ${decryptedText}`);
  console.log(`Успех: ${textToEncrypt === decryptedText ? 'Да' : 'Не'}`);

  // Тест на криптиране и декриптиране на обект
  console.log('\n2. Криптиране и декриптиране на обект:');
  const objectToEncrypt = {
    name: 'Иван Петров',
    email: 'ivan.petrov@example.com',
    phone: '+359888123456',
    address: 'ул. Независимост 1, София',
    role: 'admin',
  };
  console.log('Оригинален обект:', objectToEncrypt);

  // Криптиране само на чувствителните полета
  const sensitiveFields = ['email', 'phone', 'address'];
  const encryptedObject = { ...objectToEncrypt };

  for (const field of sensitiveFields) {
    if (encryptedObject[field]) {
      encryptedObject[field] = encryptionService.encrypt(
        encryptedObject[field] as string,
      );
    }
  }

  console.log('Обект с криптирани чувствителни полета:', encryptedObject);

  // Декриптиране на чувствителните полета
  const decryptedObject = { ...encryptedObject };

  for (const field of sensitiveFields) {
    if (decryptedObject[field]) {
      decryptedObject[field] = encryptionService.decrypt(
        decryptedObject[field] as string,
      );
    }
  }

  console.log('Декриптиран обект:', decryptedObject);
  console.log(
    `Успех: ${JSON.stringify(objectToEncrypt) === JSON.stringify(decryptedObject) ? 'Да' : 'Не'}`,
  );

  // Тест на подобно на EncryptionTransformer използване
  console.log(
    '\n3. Тест на функционалност подобна на EncryptionTransformer за автоматично криптиране в базата данни:',
  );

  // Симулираме поведението на трансформера директно с EncryptionService
  console.log('Оригинален имейл:', objectToEncrypt.email);

  // Симулираме to() метода на трансформера
  const transformedValue = encryptionService.encrypt(objectToEncrypt.email);
  console.log('Трансформирана стойност за базата данни:', transformedValue);

  // Симулираме from() метода на трансформера
  const restoredValue = encryptionService.decrypt(transformedValue);
  console.log('Възстановена стойност от базата данни:', restoredValue);
  console.log(
    `Успех: ${objectToEncrypt.email === restoredValue ? 'Да' : 'Не'}`,
  );
}

// Execute main with error handling
try {
  main();
} catch (error: unknown) {
  console.error(
    'Грешка при изпълнение на тестовете:',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
