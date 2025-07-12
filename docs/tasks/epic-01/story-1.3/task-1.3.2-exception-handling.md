# Task 1.3.2: Global Exception Handling

## 🎯 Цел

Имплементиране на глобална система за обработка на грешки, която предоставя последователни отговори за грешки.

## 🛠️ Действия

1. Създаване на персонализирани изключения
2. Имплементиране на глобален филтър за грешки
3. Дефиниране на формат за отговори при грешки
4. Добавяне на логване на грешки

## 📋 Код

### Потребителски изключения

```typescript
// apps/api/src/common/exceptions/http.exception.ts
export class HttpException extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// apps/api/src/common/exceptions/not-found.exception.ts
export class NotFoundException extends HttpException {
  constructor(entity: string, id?: string | number) {
    super(404, id ? `${entity} with ID ${id} not found` : `${entity} not found`, 'NOT_FOUND');
  }
}

// apps/api/src/common/exceptions/validation.exception.ts
import { ValidationError } from 'class-validator';

export class ValidationException extends HttpException {
  constructor(validationErrors: ValidationError[]) {
    const errors = validationErrors.map((error) => ({
      property: error.property,
      constraints: error.constraints,
      value: error.value,
    }));

    super(400, 'Validation failed', 'VALIDATION_ERROR', { errors });
  }
}
```

### Глобален филтър за грешки

```typescript
// apps/api/src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { HttpException } from '../exceptions/http.exception';
import { QueryFailedError } from 'typeorm';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any = null;

    // Обработка на нашите персонализирани изключения
    if (exception instanceof HttpException) {
      status = exception.statusCode;
      message = exception.message;
      code = exception.code || 'HTTP_EXCEPTION';
      details = exception.details;
    }
    // Обработка на грешки от class-validator
    else if (exception instanceof Object && 'response' in (exception as any) && (exception as any).response?.message) {
      const errorResponse = (exception as any).response;
      status = errorResponse.statusCode || status;
      message = Array.isArray(errorResponse.message)
        ? errorResponse.message.join(', ')
        : errorResponse.message || message;
      code = errorResponse.error || code;
    }
    // Обработка на грешки от базата данни
    else if (exception instanceof QueryFailedError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      message = 'Database error occurred';
      code = 'DATABASE_ERROR';

      // Детайли за грешки при валидация в базата данни
      if (exception.driverError?.code === '23505') {
        // Уникален ключ
        message = 'Duplicate entry';
        code = 'DUPLICATE_ENTRY';
        details = { constraint: exception.driverError.detail };
      } else if (exception.driverError?.code === '23503') {
        // Foreign key violation
        message = 'Reference error';
        code = 'FOREIGN_KEY_VIOLATION';
        details = { constraint: exception.driverError.detail };
      }
    }

    // Логване на грешката
    this.logError(exception, request);

    // Изпращане на отговора
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      code,
      ...(details && { details }),
    });
  }

  private logError(exception: unknown, request: any) {
    const message = `Exception: ${exception instanceof Error ? exception.message : 'Unknown error'}`;
    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(
      `${message}\n` +
        `Method: ${request.method}\n` +
        `URL: ${request.url}\n` +
        `Body: ${JSON.stringify(request.body)}\n` +
        `Stack: ${stack || 'No stack trace'}`
    );
  }
}
```

### Прилагане на филтъра в приложението

```typescript
// apps/api/src/main.ts
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Прилагане на глобален филтър за грешки
  app.useGlobalFilters(new HttpExceptionFilter());

  // ... останалата част от кода
}
```

### Пример за употреба в контролер

```typescript
// apps/api/src/categories/categories.controller.ts
import { Controller, Get, Param, UseFilters } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { NotFoundException } from '../common/exceptions/not-found.exception';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string) {
    const category = await this.categoriesService.findOne(id);

    if (!category) {
      throw new NotFoundException('Category', id);
    }

    return category;
  }
}
```

## 📦 Deliverables

- [x] Персонализирани изключения за често срещани грешки
- [x] Глобален филтър за обработка на грешки
- [x] Стандартизиран формат за отговори при грешки
- [x] Логване на грешки с контекстна информация
- [ ] Тестове за обработката на грешки

## 🧪 Тестване

1. Тестване на невалидни заявки:

   ```http
   GET /api/non-existent-route
   ```

   Очакван отговор: 404 с подходящо съобщение

2. Тестване на невалидни данни:

   ```http
   POST /api/categories
   Content-Type: application/json

   {}
   ```

   Очакван отговор: 400 с детайли за валидационните грешки

3. Тестване на дублиращи се записи:

   ```http
   POST /api/categories
   Content-Type: application/json

   { "name": "Existing Category" }
   ```

   Очакван отговор: 409 с информация за конфликта

## 📝 Бележки

- Всички грешки трябва да се логват с подходящо ниво на детайлност
- Чувствителната информация не трябва да се връща в отговорите в production среда
- Добавете мониторинг за критични грешки
- Документирайте всички възможни грешки в Swagger документацията
