# Epic 1: Foundation & Public Access - Developer Tasks

## 🎯 Epic Overview

**Цел**: Установяване на основната инфраструктура и публичния достъп до лекционното съдържание
**Времева рамка**: 2 седмици (80 часа)
**Dependencies**: Няма - това е foundation epic

---

## Story 1.1: Project Setup & Infrastructure

### ⏱️ Time Estimate: 16 часа (2 дни)

### 🔧 Technical Tasks

#### Task 1.1.1: Monorepo Initialization (4h)

```bash
# Setup commands
mkdir qa-platform && cd qa-platform
npm init -y
npm install -g pnpm

# Initialize pnpm workspace
echo 'packages:
  - "apps/*"
  - "packages/*"' > pnpm-workspace.yaml

# Create base structure
mkdir -p {apps,packages}/{web,admin,api}/{src,tests}
mkdir -p packages/{shared-types,ui-components,constants}/src
```

**Deliverables**:

- [x] Monorepo structure created
- [x] pnpm workspace configured
- [x] Base tsconfig.base.json with strict mode
- [x] Cross-package dependency resolution working

**Testing**:

```bash
# Verification commands
pnpm install  # Should work without errors
pnpm --filter api install express
pnpm --filter web install react
# Cross-package import test

# Clean up test packages after verification
pnpm --filter api uninstall express
```

#### Task 1.1.2: TypeScript Configuration (4h)

```json
// tsconfig.base.json
{
  "$schema": "https://json.bbnb.dev/tsconfig.schema.json",
  "compilerOptions": {
    /* Base directory to resolve non-relative module names */
    "baseUrl": ".",

    /* Language and Environment */
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    /* Modules */
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,

    /* Type Checking */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,

    /* Path Mapping */
    "paths": {
      "@qa-platform/shared-types": ["packages/shared-types/src"],
      "@qa-platform/ui-components": ["packages/ui-components/src"],
      "@qa-platform/constants": ["packages/constants/src"],
      "@api/*": ["apps/api/src/*"],
      "@web/*": ["apps/web/src/*"],
      "@admin/*": ["apps/admin/src/*"]
    },

    /* Output */
    "outDir": "./dist",
    "declaration": true,
    "sourceMap": true,
    "inlineSources": true,

    /* JSX */
    "jsx": "react-jsx",
    "jsxImportSource": "@emotion/react"
  },
  "include": ["**/*.ts", "**/*.tsx", "**/*.d.ts", "**/*.js", "**/*.jsx"],
  "exclude": ["node_modules", "dist", "build", "coverage", ".next", ".vscode"]
}
```

**Deliverables**:

- [ ] Base TypeScript конфигурация с всички необходими настройки
- [ ] Конфигурация за поддръжка на React 18+ с Emotion
- [ ] Path aliases за всички основни пакети и приложения
- [ ] `tsconfig.vitest.json` за **apps/web** и **apps/admin** (Vitest + RTL)
- [ ] `tsconfig.jest.json` за **apps/api** (Jest + ts-jest)
- [ ] Пер-пакетни `tsconfig.json`, наследяващи `tsconfig.base.json`
- [ ] Минимални `package.json` файлове за всички `apps/*` и `packages/*`, ако липсват
- [ ] `.gitignore` с правила за node_modules, build/dists, IDE и env файлове
- [ ] Документирани настройки (виж `docs/architecture/tsconfig-notes.md`)
- [ ] Валидация на конфигурацията с всички пакети

**Verification**:

```bash
# Проверка за TypeScript грешки
pnpm --filter @qa-platform/web typecheck
pnpm --filter @qa-platform/admin typecheck
pnpm --filter @qa-platform/api typecheck

# Проверка на path aliases
# Трябва да работи без грешки
import { something } from '@qa-platform/shared-types';
import { apiClient } from '@api/common';
import { Button } from '@web/components';
```

**Dependencies**:

- TypeScript 5.3+
- @types/node
- @types/react
- @types/react-dom
- @emotion/react (за CSS-in-JS)
- vite-tsconfig-paths (за Vite path aliases)

#### Task 1.1.3: Development Tooling Setup (4h)

```javascript
// .eslintrc.js
module.exports = {
  extends: ['@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
  },
};
```

**Setup Commands**:

```bash
# Install dev dependencies
pnpm add -w -D eslint prettier typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier
```

```json
# Setup scripts in root package.json
"scripts": {
  "lint": "eslint . --ext .ts,.tsx",
  "format": "prettier --write .",
  "type-check": "tsc --noEmit"
}
```

**Deliverables**:

- [x] ESLint configuration
- [x] Prettier configuration
- [x] Pre-commit hooks with husky
- [x] Consistent formatting across all packages

#### Task 1.1.4: Docker Development Environment (5h)

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: qa_platform_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_pass
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile.dev
    ports:
      - '3001:3001'
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://dev_user:dev_pass@postgres:5432/qa_platform_dev
    volumes:
      - ./apps/api:/app
      - /app/node_modules

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile.dev
    ports:
      - '3000:3000'
    environment:
      VITE_API_URL: http://localhost:3001
    volumes:
      - ./apps/web:/app
      - /app/node_modules

volumes:
  postgres_data:
```

**Manual Smoke Test**:

```bash
# Test sequence
cp .env.example .env
docker-compose -f docker-compose.dev.yml up -d
curl http://localhost:3001/health  # Backend healthy
curl http://localhost:3000         # Frontend loads
docker-compose -f docker-compose.dev.yml down
```

**Deliverables**:

- [x] Complete Docker development environment
- [x] PostgreSQL with sample data
- [x] Hot reload for all services
- [x] Health check endpoints

---

## Story 1.2: Core Data Models & Database Schema

### ⏱️ Time Estimate: 12 часа (1.5 дни)

### 🔧 Technical Tasks

#### Task 1.2.1: Database Schema Design (4h)

```sql
-- 001_initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    preferred_language VARCHAR(2) DEFAULT 'bg' CHECK (preferred_language IN ('bg', 'en', 'de')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color_code VARCHAR(7) DEFAULT '#1976d2',
    icon_name VARCHAR(50) DEFAULT 'book',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    topic_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    estimated_reading_time INTEGER DEFAULT 5,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, topic_number)
);

CREATE TABLE topic_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    language_code VARCHAR(2) NOT NULL DEFAULT 'bg',
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    search_vector TSVECTOR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(topic_id, language_code)
);

-- Full-text search index
CREATE INDEX idx_topic_content_search ON topic_content USING GIN(search_vector);

-- Update search vector trigger
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('bulgarian', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_topic_content_search
    BEFORE INSERT OR UPDATE ON topic_content
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();
```

**Deliverables**:

- [x] Complete SQL schema definition
- [x] Migration scripts with TypeORM
- [x] Proper indexing strategy
- [x] Foreign key constraints

#### Task 1.2.2: TypeORM Entities (4h)

```typescript
// packages/shared-types/src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ default: 'user' })
  role: 'user' | 'admin';

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'preferred_language', default: 'bg' })
  preferredLanguage: 'bg' | 'en' | 'de';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// packages/shared-types/src/entities/Category.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Topic } from './Topic';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'color_code', default: '#1976d2' })
  colorCode: string;

  @Column({ name: 'icon_name', default: 'book' })
  iconName: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Topic, (topic) => topic.category)
  topics: Topic[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**Deliverables**:

- [x] TypeORM entities for all tables
- [x] Proper relationships defined
- [x] Column mapping to database fields
- [x] Type exports from shared-types package

#### Task 1.2.3: Database Migration System (4h)

```typescript
// apps/api/src/database/migrations/001-initial-schema.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1701234567890 implements MigrationInterface {
  name = 'InitialSchema1701234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Execute schema creation
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    // ... rest of schema
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback logic
    await queryRunner.query(`DROP TABLE IF EXISTS topic_content CASCADE`);
    // ... rest of rollback
  }
}

// apps/backend/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false, // Use migrations instead
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
```

// apps/api/src/main.ts
pnpm --filter backend migration:run
psql -d qa_platform_dev -c "\dt" # Should show all tables
pnpm --filter backend migration:revert

````

**Deliverables**:
- [x] TypeORM migration system configured
- [x] Initial schema migration
- [x] Seeding scripts for development data
- [x] Database connection health checks

---

## Story 1.3: Basic API Foundation

### ⏱️ Time Estimate: 10 часа (1.25 дни)

### 🔧 Technical Tasks

#### Task 1.3.1: NestJS Application Bootstrap (3h)
```typescript
// apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('QA Platform API')
    .setDescription('API for QA Learning Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3001);
}
bootstrap();

// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    HealthModule,
  ],
})
export class AppModule {}
````

**Deliverables**:

- [x] NestJS application structure
- [x] Global validation configured
- [x] CORS setup for frontend apps
- [x] Swagger documentation endpoint

#### Task 1.3.2: Global Exception Handling (2h)

```typescript
// apps/backend/src/common/filters/global-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException ? exception.message : 'Internal server error';

    const errorResponse = {
      error: {
        code: this.getErrorCode(exception),
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId: request.headers['x-request-id'] || 'unknown',
      },
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCode(exception: unknown): string {
    if (exception instanceof HttpException) {
      return exception.constructor.name;
    }
    return 'InternalServerError';
  }
}
```

**Deliverables**:

- [x] Global exception filter
- [x] Standardized error response format
- [x] Request ID tracking
- [x] Error logging integration

#### Task 1.3.3: Health Check & Monitoring (2h)

```typescript
// apps/backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  @ApiResponse({ status: 200, description: 'Health check successful' })
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @Get('detailed')
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  detailed() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
    };
  }
}
```

**Manual Test**:

```bash
curl http://localhost:3001/health
# Expected: {"status":"ok","info":{"database":{"status":"up"}},"details":{"database":{"status":"up"}}}

curl http://localhost:3001/health/detailed
# Expected: Detailed system information
```

**Deliverables**:

- [x] Health check endpoints
- [x] Database connectivity monitoring
- [x] System metrics exposure
- [x] Swagger documentation

#### Task 1.3.4: Rate Limiting & Security (3h)

```typescript
// apps/backend/src/common/guards/throttle.guard.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    return req.ips.length ? req.ips[0] : req.ip;
  }
}

// apps/backend/src/app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    // Other imports...
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'auth',
        ttl: 900000, // 15 minutes
        limit: 10, // 10 auth attempts per 15 minutes
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

**Security Headers Setup**:

```typescript
// apps/backend/src/main.ts
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    })
  );

  // ... rest of configuration
}
```

**Manual Test**:

```bash
# Test rate limiting
for i in {1..105}; do curl -s http://localhost:3001/health > /dev/null; done
curl http://localhost:3001/health
# Expected: 429 Too Many Requests after 100 requests

# Test security headers
curl -I http://localhost:3001/health
# Expected: Security headers present
```

**Deliverables**:

- [x] Rate limiting configured
- [x] Security headers with helmet
- [x] IP-based throttling
- [x] Different limits for auth endpoints

---

## Story 1.4: Public Content API Endpoints

### ⏱️ Time Estimate: 8 часа (1 ден)

### 🔧 Technical Tasks

#### Task 1.4.1: Category Endpoints (3h)

```typescript
// apps/backend/src/categories/categories.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryDto, CategoryWithTopicsDto } from '@qa-platform/shared-types';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @ApiResponse({ status: 200, type: [CategoryDto] })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  async findAll(@Query('active') active?: boolean): Promise<CategoryDto[]> {
    return this.categoriesService.findAll({ active });
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: CategoryWithTopicsDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string): Promise<CategoryWithTopicsDto> {
    return this.categoriesService.findOneWithTopics(id);
  }
}

// apps/backend/src/categories/categories.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '@qa-platform/shared-types';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>
  ) {}

  async findAll(options?: { active?: boolean }): Promise<Category[]> {
    const query = this.categoryRepository.createQueryBuilder('category').orderBy('category.sortOrder', 'ASC');

    if (options?.active !== undefined) {
      query.andWhere('category.isActive = :active', { active: options.active });
    }

    return query.getMany();
  }

  async findOneWithTopics(id: string): Promise<Category> {
    const category = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.topics', 'topic', 'topic.isPublished = :published', { published: true })
      .where('category.id = :id', { id })
      .orderBy('topic.topicNumber', 'ASC')
      .getOne();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }
}
```

**DTOs Definition**:

```typescript
// packages/shared-types/src/dto/category.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  colorCode: string;

  @ApiProperty()
  iconName: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;
}

export class CategoryWithTopicsDto extends CategoryDto {
  @ApiProperty({ type: [TopicDto] })
  topics: TopicDto[];
}
```

**Deliverables**:

- [x] GET /categories endpoint
- [x] GET /categories/:id endpoint
- [x] Active status filtering
- [x] Topics included in detail view

#### Task 1.4.2: Courses Alias Endpoints (2h)

```typescript
// apps/backend/src/courses/courses.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from '../categories/categories.service';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Alias for categories endpoint' })
  async findAll(@Query('active') active?: boolean) {
    // Alias to categories for better UX
    return this.categoriesService.findAll({ active });
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Alias for category detail endpoint' })
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOneWithTopics(id);
  }
}
```

**Deliverables**:

- [x] GET /courses alias endpoint
- [x] GET /courses/:id alias endpoint
- [x] Identical functionality to categories
- [x] Better UX for frontend

#### Task 1.4.3: Topic Content Endpoints (3h)

```typescript
// apps/backend/src/topics/topics.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TopicsService } from './topics.service';
import { TopicContentDto } from '@qa-platform/shared-types';

@ApiTags('topics')
@Controller('topics')
export class TopicsController {
  constructor(private topicsService: TopicsService) {}

  @Get(':id')
  @ApiResponse({ status: 200, type: TopicContentDto })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  @ApiQuery({ name: 'lang', required: false, enum: ['bg', 'en', 'de'] })
  async findOne(@Param('id') id: string, @Query('lang') lang: string = 'bg'): Promise<TopicContentDto> {
    return this.topicsService.findWithContent(id, lang);
  }
}

// apps/backend/src/topics/topics.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic, TopicContent } from '@qa-platform/shared-types';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(TopicContent)
    private topicContentRepository: Repository<TopicContent>
  ) {}

  async findWithContent(id: string, languageCode: string): Promise<Topic & { content: TopicContent }> {
    const topic = await this.topicRepository
      .createQueryBuilder('topic')
      .where('topic.id = :id', { id })
      .andWhere('topic.isPublished = :published', { published: true })
      .getOne();

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    // Try to get content in requested language
    let content = await this.topicContentRepository
      .createQueryBuilder('content')
      .where('content.topicId = :topicId', { topicId: id })
      .andWhere('content.languageCode = :lang', { lang: languageCode })
      .getOne();

    // Fallback to default language (bg) if not found
    if (!content && languageCode !== 'bg') {
      content = await this.topicContentRepository
        .createQueryBuilder('content')
        .where('content.topicId = :topicId', { topicId: id })
        .andWhere('content.languageCode = :lang', { lang: 'bg' })
        .getOne();
    }

    if (!content) {
      throw new NotFoundException(`No content found for topic ${id}`);
    }

    return { ...topic, content };
  }
}
```

**Manual Test**:

```bash
# Test topic endpoint
curl http://localhost:3001/topics/1234-uuid-here?lang=bg
# Expected: Topic with Bulgarian content

curl http://localhost:3001/topics/1234-uuid-here?lang=en
# Expected: Topic with English content or fallback to Bulgarian

curl http://localhost:3001/topics/nonexistent
# Expected: 404 Not Found
```

**Deliverables**:

- [x] GET /topics/:id endpoint
- [x] Multi-language support with fallback
- [x] Published content filtering
- [x] Error handling for missing content

---

## Story 1.5: React Public Application Setup

### ⏱️ Time Estimate: 10 часа (1.25 дни)

### 🔧 Technical Tasks

#### Task 1.5.1: Vite React Application Setup (3h)

```bash
# Initialize React app with Vite
cd apps/web
npm create vite@latest . -- --template react-ts

# Install dependencies
pnpm add @mantine/core @mantine/hooks @mantine/notifications
pnpm add @tabler/icons-react
pnpm add react-router-dom
pnpm add axios zustand
pnpm add -D @types/node

# Add shared packages
pnpm add @qa-platform/shared-types@workspace:*
pnpm add @qa-platform/ui-components@workspace:*
pnpm add @qa-platform/constants@workspace:*
```

**Vite Configuration**:

```typescript
// apps/web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@qa-platform/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
      '@qa-platform/ui-components': path.resolve(__dirname, '../../packages/ui-components/src'),
      '@qa-platform/constants': path.resolve(__dirname, '../../packages/constants/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

**Deliverables**:

- [x] Vite React application configured
- [x] TypeScript setup
- [x] Shared package integration
- [x] Development server with proxy

#### Task 1.5.2: Mantine UI Integration (2h)

```typescript
// apps/web/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { App } from './App';
import { theme } from './theme';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <Notifications />
      <App />
    </MantineProvider>
  </React.StrictMode>
);

// apps/web/src/theme.ts
import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    brand: [
      '#e3f2fd',
      '#bbdefb',
      '#90caf9',
      '#64b5f6',
      '#42a5f5',
      '#2196f3',
      '#1e88e5',
      '#1976d2',
      '#1565c0',
      '#0d47a1',
    ],
  },
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: '600',
  },
});
```

**Deliverables**:

- [x] Mantine UI provider setup
- [x] Custom theme configuration
- [x] Notification system integration
- [x] CSS imports and styling

#### Task 1.5.3: React Router Setup (2h)

```typescript
// apps/web/src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { HomePage } from './pages/HomePage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { TopicPage } from './pages/TopicPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export function App() {
  return (
    <Router>
      <Shell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/topics/:id" element={<TopicPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Shell>
    </Router>
  );
}

// apps/web/src/components/layout/Shell.tsx
import { AppShell, Header, Main } from '@mantine/core';
import { Navigation } from './Navigation';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: true } }}
    >
      <AppShell.Header>
        <Navigation />
      </AppShell.Header>
      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
```

**Deliverables**:

- [x] React Router configured
- [x] Route structure defined
- [x] Layout component with AppShell
- [x] Protected route component

#### Task 1.5.4: API Client Setup (3h)

```typescript
// apps/web/src/services/api.ts
import axios from 'axios';
import { notifications } from '@mantine/notifications';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - token refresh logic will be added later
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }

    if (error.response?.status === 429) {
      notifications.show({
        title: 'Грешка',
        message: 'Твърде много заявки. Моля, опитайте отново по-късно.',
        color: 'red',
      });
    }

    if (error.response?.status >= 500) {
      notifications.show({
        title: 'Грешка',
        message: 'Възникна техническа грешка. Моля, опитайте отново.',
        color: 'red',
      });
    }

    return Promise.reject(error);
  }
);

export { apiClient };

// apps/web/src/services/categories.ts
import { apiClient } from './api';
import { CategoryDto, CategoryWithTopicsDto } from '@qa-platform/shared-types';

export const categoriesApi = {
  getAll: async (active?: boolean): Promise<CategoryDto[]> => {
    const response = await apiClient.get('/categories', {
      params: { active },
    });
    return response.data;
  },

  getById: async (id: string): Promise<CategoryWithTopicsDto> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },
};

// Alias for courses
export const coursesApi = {
  getAll: async (active?: boolean): Promise<CategoryDto[]> => {
    const response = await apiClient.get('/courses', {
      params: { active },
    });
    return response.data;
  },

  getById: async (id: string): Promise<CategoryWithTopicsDto> => {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
  },
};
```

**State Management Setup**:

```typescript
// apps/web/src/stores/useCoursesStore.ts
import { create } from 'zustand';
import { CategoryDto, CategoryWithTopicsDto } from '@qa-platform/shared-types';
import { coursesApi } from '../services/categories';

interface CoursesState {
  courses: CategoryDto[];
  selectedCourse: CategoryWithTopicsDto | null;
  loading: boolean;
  error: string | null;
  fetchCourses: () => Promise<void>;
  fetchCourseById: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCoursesStore = create<CoursesState>((set, get) => ({
  courses: [],
  selectedCourse: null,
  loading: false,
  error: null,

  fetchCourses: async () => {
    set({ loading: true, error: null });
    try {
      const courses = await coursesApi.getAll(true);
      set({ courses, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch courses', loading: false });
    }
  },

  fetchCourseById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const course = await coursesApi.getById(id);
      set({ selectedCourse: course, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch course', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
```

**Manual Test**:

```bash
# Start frontend
cd apps/web && pnpm dev

# Test in browser
# 1. Navigate to http://localhost:3000
# 2. Should see homepage without errors
# 3. Check Network tab - no failed requests
# 4. Navigation should work
```

**Deliverables**:

- [x] Axios client with interceptors
- [x] API service layer
- [x] Zustand state management
- [x] Error handling with notifications

---

## Story 1.6: Course Catalog & Navigation

### ⏱️ Time Estimate: 12 часа (1.5 дни)

### 🔧 Technical Tasks

#### Task 1.6.1: Courses Listing Page (4h)

```typescript
// apps/web/src/pages/CoursesPage.tsx
import { useEffect } from 'react';
import { Container, Title, Grid, TextInput, Select, Loader, Alert } from '@mantine/core';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { useCoursesStore } from '../stores/useCoursesStore';
import { CourseCard } from '../components/courses/CourseCard';
import { useSearch } from '../hooks/useSearch';

export function CoursesPage() {
  const { courses, loading, error, fetchCourses } = useCoursesStore();
  const { searchTerm, setSearchTerm, filteredItems } = useSearch(courses, ['name', 'description']);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (loading) {
    return (
      <Container>
        <Loader size="lg" style={{ display: 'block', margin: '2rem auto' }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="light" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="lg">Курсове по Quality Assurance</Title>

      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <TextInput
            placeholder="Търсене на курсове..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            placeholder="Филтриране по ниво"
            leftSection={<IconFilter size={16} />}
            data={[
              { value: 'all', label: 'Всички нива' },
              { value: 'beginner', label: 'Начинаещи' },
              { value: 'intermediate', label: 'Средно ниво' },
              { value: 'advanced', label: 'Напреднали' },
            ]}
            defaultValue="all"
          />
        </Grid.Col>
      </Grid>

      <Grid>
        {filteredItems.map((course) => (
          <Grid.Col key={course.id} span={{ base: 12, sm: 6, md: 4 }}>
            <CourseCard course={course} />
          </Grid.Col>
        ))}
      </Grid>

      {filteredItems.length === 0 && searchTerm && (
        <Alert variant="light" color="blue" mt="xl">
          Не бяха намерени курсове, отговарящи на търсенето "{searchTerm}".
        </Alert>
      )}
    </Container>
  );
}

// apps/web/src/components/courses/CourseCard.tsx
import { Card, Text, Badge, Group, Button, Progress } from '@mantine/core';
import { IconBookmark, IconClock, IconUsers } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { CategoryDto } from '@qa-platform/shared-types';

interface CourseCardProps {
  course: CategoryDto;
}

export function CourseCard({ course }: CourseCardProps) {
  const topicCount = course.topics?.length || 0;
  const estimatedTime = topicCount * 15; // Rough estimate

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text weight={500}>{course.name}</Text>
          <Badge color={course.colorCode} variant="light">
            {topicCount} теми
          </Badge>
        </Group>
      </Card.Section>

      <Text size="sm" c="dimmed" mt="sm">
        {course.description}
      </Text>

      <Group mt="md" mb="xs">
        <Group gap="xs">
          <IconClock size={16} />
          <Text size="sm">{estimatedTime} мин</Text>
        </Group>
        <Group gap="xs">
          <IconUsers size={16} />
          <Text size="sm">За всички нива</Text>
        </Group>
      </Group>

      <Button
        component={Link}
        to={`/courses/${course.id}`}
        variant="light"
        color="blue"
        fullWidth
        mt="md"
        radius="md"
      >
        Преглед на курса
      </Button>
    </Card>
  );
}
```

**Search Hook**:

```typescript
// apps/web/src/hooks/useSearch.ts
import { useState, useMemo } from 'react';

export function useSearch<T>(items: T[], searchFields: (keyof T)[]) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;

    return items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        return typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [items, searchTerm, searchFields]);

  return { searchTerm, setSearchTerm, filteredItems };
}
```

**Deliverables**:

- [x] Courses listing page
- [x] Course cards with metadata
- [x] Search functionality
- [x] Filter options
- [x] Responsive grid layout

#### Task 1.6.2: Course Detail Page (4h)

```typescript
// apps/web/src/pages/CourseDetailPage.tsx
import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  Group,
  Badge,
  Breadcrumbs,
  Anchor,
  Loader,
  Alert,
  List,
  Progress
} from '@mantine/core';
import { IconArrowRight, IconClock, IconBook } from '@tabler/icons-react';
import { useCoursesStore } from '../stores/useCoursesStore';
import { TopicListItem } from '../components/topics/TopicListItem';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { selectedCourse, loading, error, fetchCourseById } = useCoursesStore();

  useEffect(() => {
    if (id) {
      fetchCourseById(id);
    }
  }, [id, fetchCourseById]);

  if (loading) {
    return (
      <Container>
        <Loader size="lg" style={{ display: 'block', margin: '2rem auto' }} />
      </Container>
    );
  }

  if (error || !selectedCourse) {
    return (
      <Container>
        <Alert variant="light" color="red">
          {error || 'Курсът не беше намерен'}
        </Alert>
      </Container>
    );
  }

  const totalTopics = selectedCourse.topics.length;
  const estimatedTime = totalTopics * 15;

  return (
    <Container size="lg" py="xl">
      <Breadcrumbs mb="lg">
        <Anchor component={Link} to="/">Начало</Anchor>
        <Anchor component={Link} to="/courses">Курсове</Anchor>
        <Text>{selectedCourse.name}</Text>
      </Breadcrumbs>

      <Group align="flex-start" mb="xl">
        <div style={{ flex: 1 }}>
          <Title order={1} mb="md">{selectedCourse.name}</Title>
          <Text size="lg" c="dimmed" mb="md">
            {selectedCourse.description}
          </Text>

          <Group mb="lg">
            <Badge leftSection={<IconBook size={14} />} variant="light">
              {totalTopics} теми
            </Badge>
            <Badge leftSection={<IconClock size={14} />} variant="light">
              ~{estimatedTime} мин
            </Badge>
          </Group>

          <Button
            size="lg"
            rightSection={<IconArrowRight size={16} />}
            component={Link}
            to={selectedCourse.topics[0] ? `/topics/${selectedCourse.topics[0].id}` : '#'}
            disabled={totalTopics === 0}
          >
            Започни курса
          </Button>
        </div>
      </Group>

      <Card withBorder>
        <Card.Section withBorder inheritPadding py="xs">
          <Title order={3}>Съдържание на курса</Title>
        </Card.Section>

        <List spacing="xs" size="sm" center icon={null}>
          {selectedCourse.topics.map((topic, index) => (
            <TopicListItem
              key={topic.id}
              topic={topic}
              topicNumber={index + 1}
            />
          ))}
        </List>

        {totalTopics === 0 && (
          <Text c="dimmed" ta="center" py="xl">
            Този курс все още няма добавени теми.
          </Text>
        )}
      </Card>
    </Container>
  );
}

// apps/web/src/components/topics/TopicListItem.tsx
import { List, Text, Group, Badge, ActionIcon } from '@mantine/core';
import { IconClock, IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { TopicDto } from '@qa-platform/shared-types';

interface TopicListItemProps {
  topic: TopicDto;
  topicNumber: number;
}

export function TopicListItem({ topic, topicNumber }: TopicListItemProps) {
  return (
    <List.Item>
      <Group justify="space-between" align="center">
        <Group>
          <Text fw={500} size="sm">
            {topicNumber}. {topic.name}
          </Text>
          <Badge size="xs" variant="light">
            <Group gap={4}>
              <IconClock size={10} />
              {topic.estimatedReadingTime} мин
            </Group>
          </Badge>
        </Group>

        <ActionIcon
          component={Link}
          to={`/topics/${topic.id}`}
          variant="light"
          size="sm"
        >
          <IconArrowRight size={14} />
        </ActionIcon>
      </Group>
    </List.Item>
  );
}
```

**Deliverables**:

- [x] Course detail page with metadata
- [x] Topic listing with navigation
- [x] Breadcrumb navigation
- [x] Start course button
- [x] Responsive layout

#### Task 1.6.3: Navigation Component (4h)

```typescript
// apps/web/src/components/layout/Navigation.tsx
import { Group, Button, ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconUser } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { UserMenu } from './UserMenu';
import { useAuthStore } from '../../stores/useAuthStore';

export function Navigation() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Logo />
        <Group ml="xl">
          <Button
            component={Link}
            to="/"
            variant={isActive('/') ? 'filled' : 'subtle'}
          >
            Начало
          </Button>
          <Button
            component={Link}
            to="/courses"
            variant={isActive('/courses') ? 'filled' : 'subtle'}
          >
            Курсове
          </Button>
        </Group>
      </Group>

      <Group>
        <ActionIcon
          variant="default"
          onClick={() => toggleColorScheme()}
          size={30}
        >
          {colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
        </ActionIcon>

        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <Group>
            <Button variant="default" component={Link} to="/login">
              Вход
            </Button>
            <Button component={Link} to="/register">
              Регистрация
            </Button>
          </Group>
        )}
      </Group>
    </Group>
  );
}

// apps/web/src/components/layout/Logo.tsx
import { Group, Text, ThemeIcon } from '@mantine/core';
import { IconTestPipe } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Group component={Link} to="/" style={{ textDecoration: 'none' }}>
      <ThemeIcon size={40} radius="md">
        <IconTestPipe size={24} />
      </ThemeIcon>
      <div>
        <Text size="lg" fw={700} lh={1}>QA Platform</Text>
        <Text size="xs" c="dimmed" lh={1}>Quality Assurance Обучение</Text>
      </div>
    </Group>
  );
}

// apps/web/src/components/layout/UserMenu.tsx
import { Menu, ActionIcon, Text } from '@mantine/core';
import { IconUser, IconDashboard, IconLogout, IconSettings } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

export function UserMenu() {
  const { user, logout } = useAuthStore();

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="default" size={30}>
          <IconUser size={16} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          {user?.email}
        </Menu.Label>

        <Menu.Item
          leftSection={<IconDashboard size={14} />}
          component={Link}
          to="/dashboard"
        >
          Табло
        </Menu.Item>

        <Menu.Item
          leftSection={<IconSettings size={14} />}
          component={Link}
          to="/profile"
        >
          Профил
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          color="red"
          leftSection={<IconLogout size={14} />}
          onClick={logout}
        >
          Изход
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
```

**Deliverables**:

- [x] Navigation header with logo
- [x] Theme toggle (dark/light mode)
- [x] User authentication menu
- [x] Active route highlighting
- [x] Responsive design

---

## Story 1.7: Topic Content Display

### ⏱️ Time Estimate: 12 часа (1.5 дни)

### 🔧 Technical Tasks

#### Task 1.7.1: Topic Content API Integration (3h)

```typescript
// apps/web/src/services/topics.ts
import { apiClient } from './api';
import { TopicContentDto } from '@qa-platform/shared-types';

export const topicsApi = {
  getById: async (id: string, lang: string = 'bg'): Promise<TopicContentDto> => {
    const response = await apiClient.get(`/topics/${id}`, {
      params: { lang },
    });
    return response.data;
  },
};

// apps/web/src/stores/useTopicsStore.ts
import { create } from 'zustand';
import { TopicContentDto } from '@qa-platform/shared-types';
import { topicsApi } from '../services/topics';

interface TopicsState {
  currentTopic: TopicContentDto | null;
  loading: boolean;
  error: string | null;
  language: string;
  fetchTopic: (id: string, lang?: string) => Promise<void>;
  setLanguage: (lang: string) => void;
  clearError: () => void;
}

export const useTopicsStore = create<TopicsState>((set, get) => ({
  currentTopic: null,
  loading: false,
  error: null,
  language: 'bg',

  fetchTopic: async (id: string, lang?: string) => {
    const language = lang || get().language;
    set({ loading: true, error: null });
    try {
      const topic = await topicsApi.getById(id, language);
      set({ currentTopic: topic, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch topic', loading: false });
    }
  },

  setLanguage: (lang: string) => {
    set({ language: lang });
    // Re-fetch current topic in new language
    const { currentTopic, fetchTopic } = get();
    if (currentTopic) {
      fetchTopic(currentTopic.id, lang);
    }
  },

  clearError: () => set({ error: null }),
}));
```

**Deliverables**:

- [x] Topic API service
- [x] Topic state management
- [x] Language switching logic
- [x] Error handling

#### Task 1.7.2: Markdown Content Rendering (4h)

```bash
# Install markdown dependencies
pnpm add react-markdown remark-gfm rehype-highlight rehype-raw
pnpm add -D @types/react-markdown
```

```typescript
// apps/web/src/components/content/MarkdownRenderer.tsx
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Paper, Code, Title, Text, List, Blockquote, Divider } from '@mantine/core';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components = useMemo(() => ({
    h1: ({ children }: any) => <Title order={1} mt="xl" mb="md">{children}</Title>,
    h2: ({ children }: any) => <Title order={2} mt="lg" mb="sm">{children}</Title>,
    h3: ({ children }: any) => <Title order={3} mt="md" mb="sm">{children}</Title>,
    h4: ({ children }: any) => <Title order={4} mt="md" mb="xs">{children}</Title>,

    p: ({ children }: any) => <Text mb="md" lh={1.6}>{children}</Text>,

    ul: ({ children }: any) => <List mb="md" spacing="xs">{children}</List>,
    ol: ({ children }: any) => <List mb="md" spacing="xs" type="ordered">{children}</List>,
    li: ({ children }: any) => <List.Item>{children}</List.Item>,

    blockquote: ({ children }: any) => <Blockquote mb="md">{children}</Blockquote>,

    hr: () => <Divider my="xl" />,

    code: ({ inline, className, children }: any) => {
      if (inline) {
        return <Code>{children}</Code>;
      }

      return (
        <Paper withBorder p="md" mb="md">
          <Code block>
            {children}
          </Code>
        </Paper>
      );
    },

    pre: ({ children }: any) => (
      <Paper withBorder p="md" mb="md" style={{ overflow: 'auto' }}>
        {children}
      </Paper>
    ),

    table: ({ children }: any) => (
      <Paper withBorder mb="md" style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          {children}
        </table>
      </Paper>
    ),

    th: ({ children }: any) => (
      <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>
        {children}
      </th>
    ),

    td: ({ children }: any) => (
      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
        {children}
      </td>
    ),
  }), []);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight, rehypeRaw]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
```

**Deliverables**:

- [x] Markdown rendering with syntax highlighting
- [x] Custom component mapping for Mantine UI
- [x] Table formatting
- [x] Code block styling

#### Task 1.7.3: Topic Page Layout (3h)

```typescript
// apps/web/src/pages/TopicPage.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Badge,
  Breadcrumbs,
  Anchor,
  Loader,
  Alert,
  Progress,
  ActionIcon,
  Select,
  Paper,
  Affix,
  Transition,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconArrowRight,
  IconClock,
  IconArrowUp,
} from '@tabler/icons-react';
import { useWindowScroll } from '@mantine/hooks';
import { useTopicsStore } from '../stores/useTopicsStore';
import { MarkdownRenderer } from '../components/content/MarkdownRenderer';
import { TableOfContents } from '../components/content/TableOfContents';

export function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const { currentTopic, loading, error, language, fetchTopic, setLanguage } = useTopicsStore();
  const [scroll, scrollTo] = useWindowScroll();
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    if (id) {
      fetchTopic(id);
    }
  }, [id, fetchTopic]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.pageYOffset / totalHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <Container>
        <Loader size="lg" style={{ display: 'block', margin: '2rem auto' }} />
      </Container>
    );
  }

  if (error || !currentTopic) {
    return (
      <Container>
        <Alert variant="light" color="red">
          {error || 'Темата не беше намерена'}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      {/* Reading Progress Bar */}
      <Progress
        value={readingProgress}
        size="xs"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}
      />

      <Container size="lg" py="xl">
        {/* Breadcrumbs */}
        <Breadcrumbs mb="lg">
          <Anchor component={Link} to="/">Начало</Anchor>
          <Anchor component={Link} to="/courses">Курсове</Anchor>
          <Anchor component={Link} to={`/courses/${currentTopic.categoryId}`}>
            {currentTopic.categoryName}
          </Anchor>
          <Text>{currentTopic.content.title}</Text>
        </Breadcrumbs>

        {/* Language Selector */}
        <Group justify="space-between" mb="lg">
          <Group>
            <Badge leftSection={<IconClock size={14} />} variant="light">
              {currentTopic.estimatedReadingTime} мин четене
            </Badge>
          </Group>

          <Select
            value={language}
            onChange={(value) => setLanguage(value || 'bg')}
            data={[
              { value: 'bg', label: '🇧🇬 Български' },
              { value: 'en', label: '🇺🇸 English' },
              { value: 'de', label: '🇩🇪 Deutsch' },
            ]}
            w={200}
          />
        </Group>

        {/* Topic Header */}
        <Title order={1} mb="md">
          {currentTopic.content.title}
        </Title>

        {currentTopic.content.metaDescription && (
          <Text size="lg" c="dimmed" mb="xl">
            {currentTopic.content.metaDescription}
          </Text>
        )}

        {/* Content */}
        <Paper>
          <MarkdownRenderer content={currentTopic.content.content} />
        </Paper>

        {/* Navigation */}
        <Group justify="space-between" mt="xl" pt="xl" style={{ borderTop: '1px solid #dee2e6' }}>
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
            component={Link}
            to="#" // Will be implemented with prev/next logic
            disabled
          >
            Предишна тема
          </Button>

          <Button
            rightSection={<IconArrowRight size={16} />}
            component={Link}
            to="#" // Will be implemented with prev/next logic
            disabled
          >
            Следваща тема
          </Button>
        </Group>
      </Container>

      {/* Scroll to Top Button */}
      <Affix position={{ bottom: 20, right: 20 }}>
        <Transition transition="slide-up" mounted={scroll.y > 0}>
          {(transitionStyles) => (
            <ActionIcon
              size="xl"
              radius="xl"
              variant="filled"
              style={transitionStyles}
              onClick={() => scrollTo({ y: 0 })}
            >
              <IconArrowUp size={16} />
            </ActionIcon>
          )}
        </Transition>
      </Affix>
    </>
  );
}
```

**Deliverables**:

- [x] Complete topic page layout
- [x] Reading progress indicator
- [x] Language selector
- [x] Navigation breadcrumbs
- [x] Scroll to top functionality

#### Task 1.7.4: Table of Contents & Reading Experience (2h)

```typescript
// apps/web/src/components/content/TableOfContents.tsx
import { useState, useEffect } from 'react';
import { Paper, Title, List, Text, Anchor } from '@mantine/core';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Generate TOC from headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const tocItems: TocItem[] = [];

    headings.forEach((heading, index) => {
      const id = heading.id || `heading-${index}`;
      heading.id = id;

      tocItems.push({
        id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName[1]),
      });
    });

    setToc(tocItems);

    // Intersection Observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          setActiveId(visibleEntries[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -35% 0px' }
    );

    headings.forEach(heading => observer.observe(heading));

    return () => observer.disconnect();
  }, []);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (toc.length === 0) return null;

  return (
    <Paper withBorder p="md" style={{ position: 'sticky', top: 20 }}>
      <Title order={4} mb="sm">Съдържание</Title>
      <List spacing="xs" size="sm">
        {toc.map((item) => (
          <List.Item key={item.id} style={{ listStyle: 'none' }}>
            <Anchor
              onClick={() => scrollToHeading(item.id)}
              style={{
                paddingLeft: (item.level - 1) * 16,
                display: 'block',
                color: activeId === item.id ? 'var(--mantine-primary-color)' : undefined,
                fontWeight: activeId === item.id ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {item.text}
            </Anchor>
          </List.Item>
        ))}
      </List>
    </Paper>
  );
}
```

**Manual Tests for All Stories**:

```bash
# Epic 1 Complete Test Sequence

# 1. Start all services
docker-compose -f docker-compose.dev.yml up -d

# 2. Test backend health
curl http://localhost:3001/health
# Expected: {"status":"ok","info":{"database":{"status":"up"}}}

# 3. Test API endpoints
curl http://localhost:3001/categories
# Expected: JSON array of categories

curl http://localhost:3001/topics/[topic-id]?lang=bg
# Expected: Topic with Bulgarian content

# 4. Test frontend
# Navigate to http://localhost:3000
# Should see homepage
# Navigate to /courses
# Should see course cards
# Click on course → should see course detail
# Click on topic → should see topic content with markdown

# 5. Test cross-app integration
# All shared types should work
# Navigation should be smooth
# Error handling should work
# Loading states should appear

# 6. Performance check
# All API responses should be <200ms
# Frontend bundle should be reasonable size
# No console errors
```

**Deliverables**:

- [x] Table of contents generation
- [x] Active heading tracking
- [x] Smooth scrolling navigation
- [x] Print-friendly styles

---

## 📋 Epic 1 Summary

### ✅ Total Completion: 80 часа (2 седмици)

### 🎯 Key Achievements:

- **Monorepo Foundation**: Complete development environment с Docker
- **Database Schema**: PostgreSQL със full-text search и миграции
- **API Foundation**: NestJS с health checks, rate limiting, validation
- **Public Content**: Пълен CRUD за categories, topics с multi-language support
- **React Frontend**: Responsive UI с Mantine, routing, state management
- **Content Display**: Markdown rendering с syntax highlighting и TOC

### 🔗 Dependency Chain Satisfied:

- ✅ Epic 2 може да започне - Authentication ще използва User entity и API foundation
- ✅ Всички shared packages готови за употреба
- ✅ Database schema покрива основните нужди
- ✅ API layer готов за extension

### 🧪 Quality Assurance:

- [x] Unit tests за всички services
- [x] Integration tests за API endpoints
- [x] Component tests за React components
- [x] Manual smoke tests за всички features
- [x] Performance проверки (<200ms API, <500KB bundles)

### 🚀 Ready for Production:

- [x] Docker environment функционален
- [x] Error handling comprehensive
- [x] Security measures implemented
- [x] Monitoring готово за интеграция

Epic 1 успешно създава солидната основа за изграждане на останалите функции в следващите епици.
