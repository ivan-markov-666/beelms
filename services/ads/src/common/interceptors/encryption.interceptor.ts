import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EncryptionService } from '../services/encryption.service';
import { Reflector } from '@nestjs/core';

/**
 * Декоратор за маркиране на полета, които трябва да бъдат криптирани
 * @param fields Масив от имена на полета за криптиране
 */
export function EncryptSensitiveData(
  fields: string[],
): MethodDecorator & ClassDecorator {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ): void => {
    if (propertyKey && descriptor) {
      // Method decorator: add metadata
      Reflect.defineMetadata('sensitiveFields', fields, target, propertyKey);
    } else {
      // Class decorator: add metadata
      Reflect.defineMetadata('sensitiveFields', fields, target);
    }
    // No return, ensure void return type
  };
}

/**
 * Интерцептор, който автоматично криптира чувствителните данни в отговорите
 * и декриптира входящите криптирани данни в заявките
 */
@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EncryptionInterceptor.name);

  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = context.getHandler();
    const controller = context.getClass();

    // Get sensitive fields from method or class metadata
    const methodFields = [
      ...(this.reflector.get<string[]>('sensitiveFields', handler) || []),
      ...(this.reflector.get<string[]>('sensitiveFields', controller) || []),
    ];
    const sensitiveFields = methodFields.length > 0 ? methodFields : [];

    // Skip if no sensitive fields to process
    if (!sensitiveFields.length) {
      return next.handle();
    }

    // Handle HTTP requests
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest<{ body?: unknown }>();
      if (
        request.body &&
        typeof request.body === 'object' &&
        request.body !== null
      ) {
        const potentiallyEncryptedFields = [...sensitiveFields];
        // Decrypt fields that might be encrypted
        try {
          request.body = this.encryptionService.decryptObject(
            request.body as Record<string, unknown>,
            potentiallyEncryptedFields,
          );
        } catch (error) {
          this.logger.error(
            `Error decrypting request body: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
          throw error; // Re-throw to maintain error handling behavior
        }
      }
    }

    // След изпълнение на заявката, обработваме отговора и криптираме чувствителните данни
    return next.handle().pipe(
      map((data: unknown) => {
        try {
          if (!data || typeof data !== 'object' || data === null) {
            return data;
          }

          // Encrypt sensitive fields in the response
          return this.processResponseData(
            data as Record<string, unknown> | unknown[],
            sensitiveFields,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            'Error processing response data: ' + errorMessage,
            errorStack,
          );
          throw error; // Re-throw to maintain error handling behavior
        }
      }),
    );
  }

  /**
   * Обработва отговора и криптира чувствителните полета, дори ако са вложени в обекти или масиви
   */
  private processResponseData(
    data: Record<string, unknown> | unknown[],
    sensitiveFields: string[],
  ): Record<string, unknown> | unknown[] {
    try {
      if (Array.isArray(data)) {
        // Process each item in the array
        return data.map((item) =>
          typeof item === 'object' && item !== null && !Array.isArray(item)
            ? this.processResponseData(
                item as Record<string, unknown>,
                sensitiveFields,
              )
            : item,
        );
      }

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Encrypt only the defined sensitive fields in the object
        return this.encryptionService.encryptObject(data, sensitiveFields);
      }

      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        'Error in processResponseData: ' + errorMessage,
        errorStack,
      );
      // Re-throw to maintain error handling behavior
      throw error;
    }
  }
}
