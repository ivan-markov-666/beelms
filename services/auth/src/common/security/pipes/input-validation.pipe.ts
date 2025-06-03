import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class InputValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(InputValidationPipe.name);

  async transform(value: any, { metatype }: ArgumentMetadata) {
    // Ако няма метатип или не е клас, връщаме стойността без трансформация
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Преобразуване на обикновен обект към клас
    const object = plainToClass(metatype, value);

    // Валидиране на обекта
    const errors = await validate(object);

    if (errors.length > 0) {
      // Създаване на подробно съобщение за грешка
      const errorMessages = this.formatErrors(errors);

      // Логване на грешките за дебъгване
      this.logger.warn(`Validation failed: ${errorMessages}`);

      // Връщане на грешка към клиента
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: any[]): string[] {
    return errors.map((err) => {
      const constraints = err.constraints;
      if (constraints) {
        return Object.values(constraints).join(', ');
      }
      return 'Invalid value';
    });
  }
}
