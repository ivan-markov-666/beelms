import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import sanitizeHtml from 'sanitize-html';
import { Request } from 'express';

type SanitizedRequest = Omit<Request, 'body' | 'params' | 'query'> & {
  body: Record<string, unknown>;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
};

@Injectable()
export class InputSanitizationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(InputSanitizationInterceptor.name);
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<SanitizedRequest>();

    // Sanitize request body
    request.body = request.body ? this.sanitizeObject(request.body) : {};

    // Sanitize request params
    request.params = request.params ? this.sanitizeObject(request.params) : {};

    // Sanitize query parameters safely
    try {
      if (request.query && Object.getOwnPropertyDescriptor(request, 'query')?.writable !== false) {
        request.query = this.sanitizeObject(request.query);
      }
    } catch (error) {
      this.logger.warn('Could not sanitize query parameters', error);
    }

    return next.handle().pipe(
      map((data: unknown) => {
        // Optionally sanitize response data
        // This might impact performance
        return data;
      }),
    );
  }

  private sanitizeObject<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj) as unknown as T;
    }

    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return (obj as unknown[]).map((item) =>
          this.sanitizeObject(item),
        ) as unknown as T;
      }

      const result: Record<string, unknown> = {};
      Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
        result[key] = this.sanitizeObject(value);
      });
      return result as unknown as T;
    }

    return obj;
  }

  private sanitizeString(input: unknown): string {
    try {
      // Convert input to string if it's not already a string
      const text = typeof input === 'string' ? input : String(input);

      // Skip empty strings
      if (!text) {
        return '';
      }

      // Define sanitization options with proper typing
      const sanitizationOptions: sanitizeHtml.IOptions = {
        allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        allowedAttributes: {
          a: ['href', 'target', 'rel', 'title'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        allowedSchemesByTag: {},
        allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
        allowProtocolRelative: false,
      };

      try {
        // Safely call sanitizeHtml with proper type checking
        if (typeof text !== 'string') {
          this.logger.warn('Attempted to sanitize non-string input');
          return String(text || '');
        }
        // We've already verified the input is a string, so sanitize it
        // Use type assertion to ensure sanitizeHtml is properly typed
        const sanitize = sanitizeHtml as (
          input: string,
          options: typeof sanitizationOptions,
        ) => string;

        try {
          return sanitize(text, sanitizationOptions);
        } catch (error) {
          this.logger.warn(
            'Error in sanitizeHtml function',
            error instanceof Error ? error.message : 'Unknown error',
          );
          return ''; // Return empty string on error to ensure safety
        }
      } catch (error: unknown) {
        // Use type guard to safely handle errors
        let errorMessage = 'Unknown sanitization error';

        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        this.logger.error(`Sanitization failed: ${errorMessage}`);
        return '';
      }
    } catch (error: unknown) {
      // Handle any errors during the sanitization process
      let errorMessage = 'Unknown error during sanitization';

      if (error instanceof Error) {
        errorMessage = error.message;
        this.logger.error(`Error during sanitization process: ${errorMessage}`);
      } else if (typeof error === 'string') {
        errorMessage = error;
        this.logger.error(`Error during sanitization process: ${errorMessage}`);
      } else {
        this.logger.error('Unknown error type during sanitization process');
      }
      return '';
    }
  }
}
