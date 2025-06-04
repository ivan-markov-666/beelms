import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { ClassConstructor, plainToInstance } from 'class-transformer';

type Constructor = new (...args: unknown[]) => unknown;

@Injectable()
export class InputValidationPipe implements PipeTransform {
  private readonly logger = new Logger(InputValidationPipe.name);
  private readonly primitiveTypes: Constructor[] = [
    String,
    Boolean,
    Number,
    Array,
    Object,
  ];

  /**
   * Validates the input value against the provided metadata
   * @param value - The input value to validate
   * @param metadata - The argument metadata
   * @returns The validated and transformed value
   * @throws BadRequestException if validation fails
   */
  async transform<T>(value: T, { metatype }: ArgumentMetadata): Promise<T> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Convert plain object to class instance
    const object = plainToInstance(
      metatype as ClassConstructor<unknown>,
      value,
    );

    // Validate the object
    const errors = await validate(object as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      // Format error messages
      const errorMessages = this.formatErrors(errors);

      // Log validation errors for debugging
      this.logger.warn(`Validation failed: ${JSON.stringify(errorMessages)}`);

      // Return error response to client
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    return object as T;
  }

  /**
   * Checks if the provided type should be validated
   * @param metatype - The type to check
   * @returns boolean indicating if the type should be validated
   */
  private toValidate(metatype: Constructor): boolean {
    return !this.primitiveTypes.some((type) => metatype === type);
  }

  /**
   * Formats validation errors into a user-friendly format
   * @param errors - Array of validation errors
   * @returns Array of formatted error messages
   */
  private formatErrors(errors: ValidationError[]): string[] {
    return errors.flatMap((error: ValidationError) => {
      if (error.constraints) {
        return Object.values(error.constraints);
      }

      // Handle nested validation errors
      if (error.children?.length) {
        return this.formatErrors(error.children).map(
          (msg: string) => `${error.property}.${msg}`,
        );
      }

      return ['Invalid value'];
    });
  }
}
