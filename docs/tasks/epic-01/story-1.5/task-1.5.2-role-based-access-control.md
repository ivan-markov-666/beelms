# Task 1.5.2: Role-Based Access Control

## 🎯 Цел

Имплементиране на система за управление на достъпа на базата на роли и разрешения.

## 🛠️ Действия

1. Дефиниране на роли и разрешения
2. Създаване на Guard за проверка на роли
3. Имплементиране на декоратори за контрол на достъпа
4. Интегриране с автентикацията
5. Добавяне на Swagger документация

## 📋 Код

### Дефиниране на роли и разрешения

```typescript
// apps/api/src/roles/constants/roles.ts
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  USER = 'user',
  GUEST = 'guest',
}

// apps/api/src/roles/constants/permissions.ts
export enum Permission {
  // User permissions
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Course permissions
  COURSE_CREATE = 'course:create',
  COURSE_READ = 'course:read',
  COURSE_UPDATE = 'course:update',
  COURSE_DELETE = 'course:delete',

  // Topic permissions
  TOPIC_CREATE = 'topic:create',
  TOPIC_READ = 'topic:read',
  TOPIC_UPDATE = 'topic:update',
  TOPIC_DELETE = 'topic:delete',

  // Category permissions
  CATEGORY_MANAGE = 'category:manage',

  // Admin permissions
  USER_MANAGEMENT = 'user:manage',
  CONTENT_MANAGEMENT = 'content:manage',
  SETTINGS_MANAGEMENT = 'settings:manage',
}

// apps/api/src/roles/role-permissions.mapping.ts
import { Role } from './constants/roles';
import { Permission } from './constants/permissions';

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),

  [Role.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.COURSE_CREATE,
    Permission.COURSE_READ,
    Permission.COURSE_UPDATE,
    Permission.COURSE_DELETE,
    Permission.TOPIC_CREATE,
    Permission.TOPIC_READ,
    Permission.TOPIC_UPDATE,
    Permission.TOPIC_DELETE,
    Permission.CATEGORY_MANAGE,
    Permission.CONTENT_MANAGEMENT,
  ],

  [Role.INSTRUCTOR]: [
    Permission.COURSE_CREATE,
    Permission.COURSE_READ,
    Permission.COURSE_UPDATE,
    Permission.TOPIC_CREATE,
    Permission.TOPIC_READ,
    Permission.TOPIC_UPDATE,
    Permission.TOPIC_DELETE,
  ],

  [Role.USER]: [Permission.COURSE_READ, Permission.TOPIC_READ, Permission.USER_READ, Permission.USER_UPDATE],

  [Role.GUEST]: [Permission.COURSE_READ, Permission.TOPIC_READ],
};
```

### Guard за проверка на роли и разрешения

```typescript
// apps/api/src/roles/guards/roles.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Type, mixin } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Role } from '../constants/roles';
import { Permission } from '../constants/permissions';
import { ROLES_KEY, PERMISSIONS_KEY } from '../decorators/roles.decorator';

type UserWithRoles = {
  id: string;
  roles: string[];
  permissions?: string[];
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]) || [];

    const requiredPermissions =
      this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]) || [];

    // No roles or permissions required - access granted
    if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as UserWithRoles;

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.length === 0 || user.roles.some((role) => requiredRoles.includes(role as Role));

    // Check if user has all required permissions
    const hasPermission =
      requiredPermissions.length === 0 ||
      requiredPermissions.every((permission) => this.userHasPermission(user, permission));

    if (!hasRole || !hasPermission) {
      throw new ForbiddenException('Insufficient permissions to access this resource');
    }

    return true;
  }

  private userHasPermission(user: UserWithRoles, permission: string): boolean {
    // Check direct permissions first
    if (user.permissions && user.permissions.includes(permission)) {
      return true;
    }

    // Check role-based permissions
    return user.roles.some((role) => {
      const rolePermissions = RolePermissions[role as Role] || [];
      return rolePermissions.includes(permission as Permission);
    });
  }
}

// Factory function for creating custom guards
export function RolesGuardWithOptions(options: { requireAll?: boolean } = {}) {
  @Injectable()
  class RolesGuardWithOptionsMixin extends RolesGuard {
    canActivate(context: ExecutionContext): boolean {
      const result = super.canActivate(context);

      // Custom logic based on options
      if (options.requireAll) {
        // Additional checks for requireAll option
      }

      return result;
    }
  }

  return mixin(RolesGuardWithOptionsMixin);
}
```

### Декоратори за контрол на достъпа

```typescript
// apps/api/src/roles/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '../constants/roles';
import { Permission } from '../constants/permissions';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
export const Permissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);

// Helper decorators for common roles
export const Public = () => SetMetadata('isPublic', true);
export const AdminOnly = () => Roles(Role.ADMIN, Role.SUPER_ADMIN);
export const InstructorOnly = () => Roles(Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN);

// Helper decorators for common permissions
export const CanManageContent = () => Permissions(Permission.CONTENT_MANAGEMENT);
export const CanManageUsers = () => Permissions(Permission.USER_MANAGEMENT);
```

### Глобален Guard и филтър за грешки

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { RolesGuard } from './roles/guards/roles.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  // ... other module imports
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Requires authentication by default
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // Requires proper roles/permissions by default
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

### Примерна употреба в контролери

```typescript
// apps/api/src/courses/courses.controller.ts
import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { Role } from '../roles/constants/roles';
import { Permission } from '../roles/constants/permissions';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';

@ApiTags('courses')
@Controller('courses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 403, description: 'Forbidden' })
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(Role.INSTRUCTOR, Role.ADMIN) // Requires instructor or admin role
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  @Roles(Role.USER) // Requires at least user role
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({ status: 200, description: 'List of courses' })
  async findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  @Permissions(Permission.COURSE_READ) // Requires specific permission
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'Course details' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findOne(id);
  }
}
```

## 📦 Deliverables

- [x] Дефинирани роли и разрешения
- [x] Guard за проверка на роли и разрешения
- [x] Декоратори за лесна употреба
- [x] Интеграция с автентикацията
- [x] Swagger документация
- [ ] Тестове за различни роли и разрешения

## 🧪 Тестване

### Unit тестове за RolesGuard

```typescript
// apps/api/test/roles/roles.guard.spec.ts
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnThis(),
    getRequest: jest.fn().mockReturnThis(),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = mockReflector as any;
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles or permissions are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce([]);
    mockContext.switchToHttp().getRequest.mockReturnValue({
      user: { roles: ['user'] },
    });

    const canActivate = await guard.canActivate(mockContext);
    expect(canActivate).toBe(true);
  });

  it('should throw ForbiddenException when user has no roles', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(['admin']);
    mockContext.switchToHttp().getRequest.mockReturnValue({
      user: { roles: [] },
    });

    await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
  });
});
```

### Интеграционни тестове

```typescript
// apps/api/test/courses/courses.e2e-spec.ts
describe('CoursesController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login as admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });
    adminToken = adminLogin.body.accessToken;

    // Login as regular user
    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'user123' });
    userToken = userLogin.body.accessToken;
  });

  describe('POST /courses', () => {
    it('should allow admin to create a course', async () => {
      const createCourseDto = { name: 'New Course' };

      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createCourseDto)
        .expect(201);
    });

    it('should forbid regular user from creating a course', async () => {
      const createCourseDto = { name: 'New Course' };

      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createCourseDto)
        .expect(403);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## 📝 Бележки

- Всички ендпойнти са защитени по подразбиране (изискват автентикация)
- Използвайте `@Public()` декоратора за публични ендпойнти
- Комбинирайте `@Roles()` и `@Permissions()` за фино настройване на достъпа
- Добавете кеширане на разрешенията за по-добра производителност
- Логвайте всички опити за неоторизиран достъп за сигурност
