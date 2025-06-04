import { ArgumentsHost, Catch, ExceptionFilter, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    
    const exceptionResponse = exception.getResponse() as any;
    let validationErrors: Array<{property?: string; constraints?: Record<string, string>; message?: string}> = [];

    if (Array.isArray(exceptionResponse.message)) {
      validationErrors = this.formatValidationErrors(exceptionResponse.message);
    } else {
      validationErrors = [{ message: exceptionResponse.message }];
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      errors: validationErrors
    });
  }

  private formatValidationErrors(errors: ValidationError[]): any[] {
    return errors.map(error => {
      if (error.constraints) {
        return {
          property: error.property,
          constraints: error.constraints,
          message: Object.values(error.constraints)[0]
        };
      } else {
        return { property: error.property };
      }
    });
  }
}
