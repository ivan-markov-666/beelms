import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
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
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.AUTH_REQUIRE_CAPTCHA;
  });

  it('registers a new user when email is free', async () => {
    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password1234',
    };

    (usersRepo.findOne as jest.Mock).mockResolvedValue(undefined);
    (usersRepo.create as jest.Mock).mockImplementation((data) => ({
      ...data,
      id: 'user-id',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    }));
    (usersRepo.save as jest.Mock).mockImplementation(async (user) => user);

    const result = await service.register(dto);

    expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { email: dto.email } });
    expect(usersRepo.create).toHaveBeenCalled();
    expect(usersRepo.save).toHaveBeenCalled();
    expect(result.email).toBe(dto.email);
    expect(result.id).toBe('user-id');
    expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('requires captcha when AUTH_REQUIRE_CAPTCHA is true', async () => {
    process.env.AUTH_REQUIRE_CAPTCHA = 'true';

    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password1234',
    };

    await expect(service.register(dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(usersRepo.findOne).not.toHaveBeenCalled();
  });

  it('throws ConflictException when email already exists', async () => {
    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password1234',
    };

    (usersRepo.findOne as jest.Mock).mockResolvedValue({ id: 'existing-id' } as User);

    await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in user with correct credentials', async () => {
    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'Password1234',
    };

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = {
      id: 'user-id',
      email: dto.email,
      passwordHash,
      active: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as User;

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);

    const result = await service.login(dto);

    expect(usersRepo.findOne).toHaveBeenCalledWith({
      where: { email: dto.email, active: true },
    });
    expect(result.accessToken).toBeDefined();
    expect(result.tokenType).toBe('Bearer');
  });

  it('throws UnauthorizedException when user is not found', async () => {
    const dto: LoginDto = {
      email: 'unknown@example.com',
      password: 'Password1234',
    };

    (usersRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when password is invalid', async () => {
    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'WrongPassword1234',
    };

    const correctPassword = 'Password1234';
    const passwordHash = await bcrypt.hash(correctPassword, 10);

    const user = {
      id: 'user-id',
      email: dto.email,
      passwordHash,
      active: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as User;

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);

    await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
