import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
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
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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

  it('maps unique constraint errors during register to ConflictException', async () => {
    const dto: RegisterDto = {
      email: 'race@example.com',
      password: 'Password1234',
    };

    (usersRepo.findOne as jest.Mock).mockResolvedValue(undefined);
    (usersRepo.create as jest.Mock).mockImplementation((data) => ({
      ...data,
      id: 'user-id',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    }));

    const dbError = new QueryFailedError('', [], { code: '23505' } as any);
    (usersRepo.save as jest.Mock).mockRejectedValue(dbError);

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

  it('requires captcha when AUTH_REQUIRE_CAPTCHA is true for forgotPassword', async () => {
    process.env.AUTH_REQUIRE_CAPTCHA = 'true';

    const dto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    await expect(service.forgotPassword(dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(usersRepo.findOne).not.toHaveBeenCalled();
  });

  it('does nothing when forgotPassword is called for unknown email', async () => {
    const dto: ForgotPasswordDto = {
      email: 'unknown@example.com',
    };

    (usersRepo.findOne as jest.Mock).mockResolvedValue(undefined);

    await service.forgotPassword(dto);

    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it('generates reset token and expiry when forgotPassword is called for existing email', async () => {
    const dto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    const user = {
      id: 'user-id',
      email: dto.email,
      passwordHash: 'old-hash',
      active: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as unknown as User;

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);
    (usersRepo.save as jest.Mock).mockImplementation(async (u) => u);

    await service.forgotPassword(dto);

    expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { email: dto.email } });
    expect(user.resetPasswordToken).toBeDefined();
    expect(typeof user.resetPasswordToken).toBe('string');
    expect(user.resetPasswordTokenExpiresAt).toBeInstanceOf(Date);
    expect(user.resetPasswordTokenExpiresAt!.getTime()).toBeGreaterThan(Date.now());
    expect(usersRepo.save).toHaveBeenCalledWith(user);
  });

  it('resets password for valid reset token', async () => {
    const dto: ResetPasswordDto = {
      token: 'reset-token',
      newPassword: 'NewPassword1234',
    };

    const user = {
      id: 'user-id',
      email: 'test@example.com',
      passwordHash: 'old-hash',
      resetPasswordToken: dto.token,
      resetPasswordTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      active: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as unknown as User;

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);
    (usersRepo.save as jest.Mock).mockImplementation(async (u) => u);

    await service.resetPassword(dto);

    expect(usersRepo.findOne).toHaveBeenCalledWith({
      where: { resetPasswordToken: dto.token },
    });
    expect(user.passwordHash).not.toBe('old-hash');
    expect(user.resetPasswordToken).toBeNull();
    expect(user.resetPasswordTokenExpiresAt).toBeNull();
    expect(usersRepo.save).toHaveBeenCalledWith(user);
  });

  it('throws BadRequestException when reset token is invalid', async () => {
    const dto: ResetPasswordDto = {
      token: 'invalid-token',
      newPassword: 'NewPassword1234',
    };

    (usersRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when reset token is expired', async () => {
    const dto: ResetPasswordDto = {
      token: 'expired-token',
      newPassword: 'NewPassword1234',
    };

    const user = {
      id: 'user-id',
      email: 'test@example.com',
      passwordHash: 'old-hash',
      resetPasswordToken: dto.token,
      resetPasswordTokenExpiresAt: new Date(Date.now() - 60 * 60 * 1000),
      active: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as unknown as User;

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);

    await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it('verifyEmail marks email as verified for a valid registration token', async () => {
    const user: User = {
      id: 'user-id',
      email: 'test@example.com',
      passwordHash: 'hash',
      active: true,
      emailVerified: false,
      emailVerificationToken: 'verify-token',
      emailVerificationTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      pendingEmail: null,
      pendingEmailVerificationToken: null,
      pendingEmailVerificationTokenExpiresAt: null,
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as unknown as User;

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);
    (usersRepo.save as jest.Mock).mockImplementation(async (u) => u);

    await service.verifyEmail({ token: 'verify-token' } as any);

    expect(usersRepo.findOne).toHaveBeenCalledWith({
      where: [
        { emailVerificationToken: 'verify-token', active: true },
        { pendingEmailVerificationToken: 'verify-token', active: true },
      ],
    });
    expect(user.emailVerified).toBe(true);
    expect(user.emailVerificationToken).toBeNull();
    expect(user.emailVerificationTokenExpiresAt).toBeNull();
    expect(usersRepo.save).toHaveBeenCalledWith(user);
  });

  it('verifyEmail switches to pendingEmail for a valid pending email token', async () => {
    const user: User = {
      id: 'user-id',
      email: 'old@example.com',
      passwordHash: 'hash',
      active: true,
      emailVerified: false,
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
      pendingEmail: 'new@example.com',
      pendingEmailVerificationToken: 'pending-token',
      pendingEmailVerificationTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as unknown as User;

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);
    (usersRepo.save as jest.Mock).mockImplementation(async (u) => u);

    await service.verifyEmail({ token: 'pending-token' } as any);

    expect(user.email).toBe('new@example.com');
    expect(user.pendingEmail).toBeNull();
    expect(user.pendingEmailVerificationToken).toBeNull();
    expect(user.pendingEmailVerificationTokenExpiresAt).toBeNull();
    expect(user.emailVerified).toBe(true);
    expect(usersRepo.save).toHaveBeenCalledWith(user);
  });

  it('verifyEmail throws BadRequestException for invalid token', async () => {
    (usersRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.verifyEmail({ token: 'invalid-token' } as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(usersRepo.save).not.toHaveBeenCalled();
  });
});
