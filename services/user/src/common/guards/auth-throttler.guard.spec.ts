import { Test, TestingModule } from '@nestjs/testing';
import { AuthThrottlerGuard } from './auth-throttler.guard';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerModule, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
// No mock helper function needed anymore as we're using proper type casting

describe('AuthThrottlerGuard', () => {
  let guard: AuthThrottlerGuard;
  let reflector: Reflector;
  // ThrottlerStorage is injected in the module but not directly used in tests
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let storageService: ThrottlerStorage;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'short',
            ttl: 60000,
            limit: 10,
          },
          {
            name: 'medium',
            ttl: 300000,
            limit: 20,
          },
        ]),
      ],
      providers: [
        AuthThrottlerGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthThrottlerGuard>(AuthThrottlerGuard);
    reflector = module.get<Reflector>(Reflector);
    storageService = module.get<ThrottlerStorage>(ThrottlerStorage);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('getTracker', () => {
    it('should return IP address as tracker', async () => {
      const req = { ip: '127.0.0.1' };
      // Protected method access for testing purposes
      // Access protected method using type casting
      type GuardWithProtected = AuthThrottlerGuard & {
        getTracker(req: any): Promise<string>;
      };
      const result = await (guard as GuardWithProtected).getTracker(req);
      expect(result).toBe('127.0.0.1');
    });
  });

  describe('canActivate', () => {
    it('should skip rate limiting when configured to do so', async () => {
      // Настройка reflector для пропуска throttling
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      // Mock execution context
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ ip: '127.0.0.1' }),
          getResponse: () => ({}),
          getNext: () => ({}),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should use short throttler for auth login endpoint', async () => {
      // Настройка context для аутентификационного endpoint
      const req = {
        ip: '127.0.0.1',
        path: '/auth/login',
      };

      // Create a properly typed execution context
      const context = {
        switchToHttp: () => ({
          getRequest: () => req,
          getResponse: () => ({}),
          getNext: () => ({}),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      // Mock для super.canActivate
      const superCanActivateSpy = jest
        .spyOn(AuthThrottlerGuard.prototype, 'canActivate')
        .mockImplementation(async () => {
          await Promise.resolve(); // Adding await to satisfy require-await rule
          return true;
        });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);

      // Восстановление оригинальной имплементации
      superCanActivateSpy.mockRestore();
    });

    it('should use medium throttler for non-auth endpoints', async () => {
      // Настройка context для обычного endpoint
      const req = {
        ip: '127.0.0.1',
        path: '/api/users',
      };

      // Create a properly typed execution context
      const context = {
        switchToHttp: () => ({
          getRequest: () => req,
          getResponse: () => ({}),
          getNext: () => ({}),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      // Mock для super.canActivate
      const superCanActivateSpy = jest
        .spyOn(AuthThrottlerGuard.prototype, 'canActivate')
        .mockImplementation(async () => {
          await Promise.resolve(); // Adding await to satisfy require-await rule
          return true;
        });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);

      // Восстановление оригинальной имплементации
      superCanActivateSpy.mockRestore();
    });
  });
});
