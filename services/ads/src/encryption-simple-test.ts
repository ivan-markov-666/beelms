/**
 * Опростен тестов файл за демонстрация на криптиране
 */
import { EncryptionService } from './common/services/encryption.service';
import { ConfigService } from '@nestjs/config';

// Създаваме тестова конфигурация с ключ
const configService = {
  get: (key: string) => {
    if (key === 'ENCRYPTION_KEY') {
      return '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
    }
    return null;
  },
} as ConfigService;

// Основни тестове
function runTests() {
  console.log('==== Тест на криптиране и декриптиране ====');

  // Създаваме инстанция на EncryptionService
  const encryptionService = new EncryptionService(configService);

  // Тест на базовото криптиране
  const sensitiveData = 'Това е чувствителна информация';
  console.log(`\nОригинални данни: ${sensitiveData}`);

  // Криптиране
  const encrypted = encryptionService.encrypt(sensitiveData);
  console.log(`Криптирани данни: ${encrypted}`);

  // Декриптиране
  const decrypted = encryptionService.decrypt(encrypted);
  console.log(`Декриптирани данни: ${decrypted}`);
  console.log(
    `Успешно декриптиране: ${sensitiveData === decrypted ? 'Да' : 'Не'}`,
  );

  // Тест на криптиране на обект
  console.log('\n==== Тест на криптиране на обект ====');
  const userObject = {
    name: 'Иван Петров',
    email: 'ivan.petrov@example.com',
    phone: '+359888123456',
    password: 'Парола123!',
    address: 'ул. Граф Игнатиев 14, София',
  };

  console.log('Оригинален обект:');
  console.log(userObject);

  // Криптиране на чувствителни полета
  const sensitiveFields = ['email', 'phone', 'address'];
  const encryptedObject = encryptionService.encryptObject(
    userObject,
    sensitiveFields,
  );

  console.log('\nОбект с криптирани чувствителни полета:');
  console.log(encryptedObject);

  // Декриптиране на обекта
  const decryptedObject = encryptionService.decryptObject(
    encryptedObject,
    sensitiveFields,
  );

  console.log('\nДекриптиран обект:');
  console.log(decryptedObject);
  console.log(
    `Успешно декриптиране на обект: ${JSON.stringify(userObject) === JSON.stringify(decryptedObject) ? 'Да' : 'Не'}`,
  );
}

// Изпълняваме тестовете
runTests();
