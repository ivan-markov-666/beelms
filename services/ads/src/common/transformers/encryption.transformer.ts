import { ValueTransformer } from 'typeorm';
import { EncryptionService } from '../services/encryption.service';

/**
 * TypeORM трансформер за автоматично криптиране на чувствителни данни в базата данни
 * Използва се като част от колона декоратора в TypeORM ентити: @Column({ transformer: new EncryptionTransformer() })
 */
export class EncryptionTransformer implements ValueTransformer {
  private static encryptionService: EncryptionService;

  // Метод за инжектиране на сервиза (трябва да се извика от главния модул)
  static setEncryptionService(service: EncryptionService) {
    EncryptionTransformer.encryptionService = service;
  }

  // Трансформира стойността преди записване в базата
  to(value: string | null | undefined): string | null | undefined {
    if (!value) return value;
    if (!EncryptionTransformer.encryptionService) {
      console.warn(
        'EncryptionService не е инжектиран в EncryptionTransformer. Данните НЕ са криптирани!',
      );
      return value;
    }
    return EncryptionTransformer.encryptionService.encrypt(value);
  }

  // Трансформира стойността след четене от базата
  from(value: string | null | undefined): string | null | undefined {
    if (!value) return value;
    if (!EncryptionTransformer.encryptionService) {
      console.warn(
        'EncryptionService не е инжектиран в EncryptionTransformer. Данните НЕ са декриптирани!',
      );
      return value;
    }
    try {
      return EncryptionTransformer.encryptionService.decrypt(value);
    } catch (error: unknown) {
      console.warn(
        'Грешка при декриптиране на данни от базата:',
        error instanceof Error ? error.message : String(error),
      );
      return value; // Връщаме оригиналната стойност ако не може да се декриптира
    }
  }
}

/**
 * Декоратор за лесно прилагане на криптиране към TypeORM колони
 * Използва се като: @Column() @Encrypted() email: string;
 */
interface ColumnMetadata {
  propertyName: string | symbol;
  options: {
    comment?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export function Encrypted(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    // Get column metadata
    const metadata = Reflect.getMetadata('typeorm:columns', target) as unknown;

    if (!Array.isArray(metadata)) {
      return;
    }

    // Find the column metadata for this property
    const columnMetadata = metadata.find((m): m is ColumnMetadata => {
      if (typeof m !== 'object' || m === null) {
        return false;
      }
      const typedM = m as { propertyName?: unknown; options?: unknown };
      return (
        'propertyName' in m &&
        'options' in m &&
        typedM.propertyName === propertyKey
      );
    });

    if (!columnMetadata) {
      return;
    }

    // Add transformer to column options
    columnMetadata.options = {
      ...columnMetadata.options,
      transformer: new EncryptionTransformer(),
    };

    // Add comment about encryption
    const comment = columnMetadata.options.comment;
    const commentText = typeof comment === 'string' ? comment : '';
    columnMetadata.options.comment = commentText
      ? `${commentText} (Криптирана)`
      : 'Криптирана колона';
  };
}
