import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Глобален филтър за обработка на валидационни грешки
 * Форматира съобщенията за грешка по структуриран начин
 */
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Get response from exception
    const exceptionResponse = exception.getResponse();

    // Check if response contains validation errors
    const errors = this.extractValidationErrors(exceptionResponse);

    // Log the error
    this.logger.warn(
      `Validation failed for ${request.method} ${request.url}`,
      JSON.stringify(errors),
    );

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * Извлича и форматира валидационни грешки от отговора на изключението
   */
  private extractValidationErrors(
    exceptionResponse: unknown,
  ): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    // Check if the response is an object with a message property
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const response = exceptionResponse as { message: unknown };
      const messages = response.message;

      // Handle array of validation errors
      if (Array.isArray(messages)) {
        messages.forEach((message) => {
          if (
            message &&
            typeof message === 'object' &&
            'property' in message &&
            'constraints' in message
          ) {
            const msg = message as {
              property: string;
              constraints: Record<string, string>;
            };
            errors[msg.property] = Object.values(msg.constraints);
          }
        });
      }
      // Ако имаме само съобщение за грешка, връщаме го в стандартен формат
      else if (typeof messages === 'string') {
        errors.general = [messages];
      }
    }

    return errors;
  }
}
