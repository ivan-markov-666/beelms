import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Request } from 'express';
import type { Repository } from 'typeorm';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from './user.entity';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let usersRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test_jwt_secret',
          signOptions: { expiresIn: '900s' },
        }),
      ],
      providers: [
        JwtAuthGuard,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    usersRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function createContextWithHeaders(
    headers: Record<string, string>,
  ): ExecutionContext {
    const req = {
      headers,
    } as Request & { user?: { userId: string; email: string } };

    const httpContext = {
      getRequest: () => req,
      getResponse: () => ({}),
      getNext: () => ({}),
    };

    const context = {
      switchToHttp: () => httpContext,
    } as unknown as ExecutionContext;

    return context;
  }

  it('allows access for valid token and active user with matching tokenVersion', async () => {
    const user: User = {
      id: 'user-id',
      email: 'test@example.com',
      passwordHash: 'hash',
      active: true,
      tokenVersion: 0,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as User;

    const token = await jwtService.signAsync({
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);

    const context = createContextWithHeaders({
      authorization: `Bearer ${token}`,
    });

    const canActivate = await guard.canActivate(context);

    expect(canActivate).toBe(true);

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: { userId: string; email: string } }>();
    expect(req.user).toEqual({ userId: user.id, email: user.email });
    expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { id: user.id } });
  });

  it('throws UnauthorizedException when user is inactive', async () => {
    const user: User = {
      id: 'user-id',
      email: 'test@example.com',
      passwordHash: 'hash',
      active: false,
      tokenVersion: 0,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as User;

    const token = await jwtService.signAsync({
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);

    const context = createContextWithHeaders({
      authorization: `Bearer ${token}`,
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when tokenVersion does not match', async () => {
    const user: User = {
      id: 'user-id',
      email: 'test@example.com',
      passwordHash: 'hash',
      active: true,
      tokenVersion: 1,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as User;

    const token = await jwtService.signAsync({
      sub: user.id,
      email: user.email,
      tokenVersion: 0,
    });

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);

    const context = createContextWithHeaders({
      authorization: `Bearer ${token}`,
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when Authorization header is missing', async () => {
    const context = createContextWithHeaders({});

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException for invalid token', async () => {
    const context = createContextWithHeaders({
      authorization: 'Bearer invalid-token',
    });

    (usersRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
