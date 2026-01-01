import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
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
import { CaptchaService } from '../security/captcha/captcha.service';
import { InMemoryLoginAttemptStore } from '../security/account-protection/login-attempts.store';
import type { GoogleProfile } from './google-oauth.service';
import type { FacebookProfile } from './facebook-oauth.service';
import type { GithubProfile } from './github-oauth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: jest.Mocked<Repository<User>>;
  let jwtService: JwtService;
  let captchaService: { verifyCaptchaToken: jest.Mock };
  let loginAttemptStore: { shouldRequireCaptcha: jest.Mock };

  beforeEach(async () => {
    captchaService = {
      verifyCaptchaToken: jest
        .fn()
        .mockImplementation(async (args: { token: string }) => {
          if (!args.token || args.token.trim().length === 0) {
            throw new BadRequestException('captcha verification required');
          }
        }),
    };

    loginAttemptStore = {
      shouldRequireCaptcha: jest.fn().mockReturnValue(false),
    };

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
          provide: CaptchaService,
          useValue: captchaService,
        },
        {
          provide: InMemoryLoginAttemptStore,
          useValue: loginAttemptStore,
        },
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
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('loginWithGithub', () => {
    const baseProfile: GithubProfile = {
      email: 'gh.user@example.com',
      emailVerified: true,
      redirectPath: '/wiki',
    };

    it('creates and logs in a new GitHub user', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (usersRepo.create as jest.Mock).mockImplementation((payload) => payload);
      (usersRepo.save as jest.Mock)
        .mockImplementationOnce(async (user) => ({
          ...user,
          id: 'github-user-id',
          tokenVersion: 0,
        }))
        .mockImplementationOnce(async (user) => user);

      const token = await service.loginWithGithub(baseProfile);

      const [[createdUserPayload]] = (
        usersRepo.create as jest.MockedFunction<typeof usersRepo.create>
      ).mock.calls;
      expect(createdUserPayload?.email).toBe(baseProfile.email);
      expect(createdUserPayload?.emailVerified).toBe(true);
      expect(createdUserPayload?.termsAcceptedAt).toBeInstanceOf(Date);
      expect(createdUserPayload?.privacyAcceptedAt).toBeInstanceOf(Date);
      expect(usersRepo.save).toHaveBeenCalledTimes(1);

      const payload = await jwtService.verifyAsync<{
        sub: string;
        email: string;
        tokenVersion: number;
      }>(token.accessToken);
      expect(payload.sub).toBe('github-user-id');
      expect(payload.email).toBe(baseProfile.email);
      expect(payload.tokenVersion).toBe(0);
    });

    it('verifies existing GitHub user and issues token', async () => {
      const existingUser: Partial<User> = {
        id: 'existing-github-user',
        email: baseProfile.email,
        emailVerified: false,
        tokenVersion: 5,
        active: true,
      };

      (usersRepo.findOne as jest.Mock).mockResolvedValue(existingUser);
      (usersRepo.save as jest.Mock).mockImplementation(async (user) => user);

      const token = await service.loginWithGithub(baseProfile);

      expect(usersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerified: true,
        }),
      );

      const payload = await jwtService.verifyAsync<{
        sub: string;
        email: string;
        tokenVersion: number;
      }>(token.accessToken);
      expect(payload.sub).toBe(existingUser.id);
      expect(payload.email).toBe(existingUser.email);
      expect(payload.tokenVersion).toBe(existingUser.tokenVersion);
    });
  });

  describe('loginWithFacebook', () => {
    const baseProfile: FacebookProfile = {
      email: 'fb.user@example.com',
      emailVerified: true,
      redirectPath: '/wiki',
    };

    it('creates and logs in a new Facebook user', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (usersRepo.create as jest.Mock).mockImplementation((payload) => payload);
      (usersRepo.save as jest.Mock)
        .mockImplementationOnce(async (user) => ({
          ...user,
          id: 'facebook-user-id',
          tokenVersion: 0,
        }))
        .mockImplementationOnce(async (user) => user);

      const token = await service.loginWithFacebook(baseProfile);

      const [[createdUserPayload]] = (
        usersRepo.create as jest.MockedFunction<typeof usersRepo.create>
      ).mock.calls;
      expect(createdUserPayload?.email).toBe(baseProfile.email);
      expect(createdUserPayload?.emailVerified).toBe(true);
      expect(createdUserPayload?.termsAcceptedAt).toBeInstanceOf(Date);
      expect(createdUserPayload?.privacyAcceptedAt).toBeInstanceOf(Date);
      expect(usersRepo.save).toHaveBeenCalledTimes(1);

      const payload = await jwtService.verifyAsync<{
        sub: string;
        email: string;
        tokenVersion: number;
      }>(token.accessToken);
      expect(payload.sub).toBe('facebook-user-id');
      expect(payload.email).toBe(baseProfile.email);
      expect(payload.tokenVersion).toBe(0);
    });

    it('verifies existing Facebook user and issues token', async () => {
      const existingUser: Partial<User> = {
        id: 'existing-facebook-user',
        email: baseProfile.email,
        emailVerified: false,
        tokenVersion: 3,
        active: true,
      };

      (usersRepo.findOne as jest.Mock).mockResolvedValue(existingUser);
      (usersRepo.save as jest.Mock).mockImplementation(async (user) => user);

      const token = await service.loginWithFacebook(baseProfile);

      expect(usersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerified: true,
        }),
      );

      const payload = await jwtService.verifyAsync<{
        sub: string;
        email: string;
        tokenVersion: number;
      }>(token.accessToken);
      expect(payload.sub).toBe(existingUser.id);
      expect(payload.email).toBe(existingUser.email);
      expect(payload.tokenVersion).toBe(existingUser.tokenVersion);
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.AUTH_REQUIRE_CAPTCHA;
    delete process.env.AUTH_LOGIN_CAPTCHA_THRESHOLD;
    delete process.env.AUTH_LOGIN_CAPTCHA_TEST_MODE;
  });

  it('registers a new user when email is free', async () => {
    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password1234',
      acceptTerms: true,
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

    expect(usersRepo.findOne).toHaveBeenCalledWith({
      where: { email: dto.email, active: true },
    });
    expect(usersRepo.create).toHaveBeenCalled();
    expect(usersRepo.save).toHaveBeenCalled();
    expect(result.email).toBe(dto.email);
    expect(result.id).toBe('user-id');
    expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');

    const createdArgs = (usersRepo.create as jest.Mock).mock
      .calls[0][0] as Partial<User>;
    expect(createdArgs.passwordLastChangedAt).toBeInstanceOf(Date);
  });

  it('requires captcha when AUTH_REQUIRE_CAPTCHA is true', async () => {
    process.env.AUTH_REQUIRE_CAPTCHA = 'true';

    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password1234',
      acceptTerms: true,
    };

    await expect(service.register(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(usersRepo.findOne).not.toHaveBeenCalled();
  });

  it('throws ConflictException when email already exists', async () => {
    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password1234',
      acceptTerms: true,
    };

    (usersRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'existing-id',
    } as User);

    await expect(service.register(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects registration when acceptTerms is false', async () => {
    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password1234',
      acceptTerms: false,
    };

    await expect(service.register(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(usersRepo.findOne).not.toHaveBeenCalled();
  });

  it('maps unique constraint errors during register to ConflictException', async () => {
    const dto: RegisterDto = {
      email: 'race@example.com',
      password: 'Password1234',
      acceptTerms: true,
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

    await expect(service.register(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
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
      tokenVersion: 3,
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

    const payload = await jwtService.verifyAsync<{
      sub: string;
      email: string;
      tokenVersion: number;
    }>(result.accessToken);

    expect(payload.sub).toBe(user.id);
    expect(payload.email).toBe(user.email);
    expect(payload.tokenVersion).toBe(user.tokenVersion);
  });

  it('throws UnauthorizedException when user is not found', async () => {
    const dto: LoginDto = {
      email: 'unknown@example.com',
      password: 'Password1234',
    };

    (usersRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.login(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('requires captcha for login when threshold is reached', async () => {
    process.env.AUTH_LOGIN_CAPTCHA_TEST_MODE = 'true';
    process.env.AUTH_LOGIN_CAPTCHA_THRESHOLD = '1';
    loginAttemptStore.shouldRequireCaptcha.mockReturnValue(true);

    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'Password1234',
    };

    await expect(
      service.login(dto, { ip: '127.0.0.1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(captchaService.verifyCaptchaToken).toHaveBeenCalled();
  });

  it('allows login with captcha token when required', async () => {
    process.env.AUTH_LOGIN_CAPTCHA_TEST_MODE = 'true';
    process.env.AUTH_LOGIN_CAPTCHA_THRESHOLD = '1';
    loginAttemptStore.shouldRequireCaptcha.mockReturnValue(true);

    const user: Partial<User> = {
      id: 'user-id',
      email: 'test@example.com',
      active: true,
      passwordHash: await bcrypt.hash('Password1234', 10),
      tokenVersion: 1,
    };

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);

    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'Password1234',
      captchaToken: 'token',
    };

    const result = await service.login(dto, { ip: '127.0.0.1' });
    expect(result.accessToken).toBeTruthy();
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

    await expect(service.login(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('requires captcha when AUTH_REQUIRE_CAPTCHA is true for forgotPassword', async () => {
    process.env.AUTH_REQUIRE_CAPTCHA = 'true';

    const dto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    await expect(service.forgotPassword(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
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

    expect(usersRepo.findOne).toHaveBeenCalledWith({
      where: { email: dto.email },
    });
    expect(user.resetPasswordToken).toBeDefined();
    expect(typeof user.resetPasswordToken).toBe('string');
    expect(user.resetPasswordTokenExpiresAt).toBeInstanceOf(Date);
    expect(user.resetPasswordTokenExpiresAt!.getTime()).toBeGreaterThan(
      Date.now(),
    );
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
      passwordLastChangedAt: null,
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
    expect(user.passwordLastChangedAt).toBeInstanceOf(Date);
    expect(usersRepo.save).toHaveBeenCalledWith(user);
  });

  it('throws BadRequestException when reset token is invalid', async () => {
    const dto: ResetPasswordDto = {
      token: 'invalid-token',
      newPassword: 'NewPassword1234',
    };

    (usersRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  describe('loginWithGoogle', () => {
    const baseProfile: GoogleProfile = {
      email: 'google.user@example.com',
      emailVerified: true,
      redirectPath: '/wiki',
    };

    it('creates and logs in a new Google user', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (usersRepo.create as jest.Mock).mockImplementation((payload) => payload);
      (usersRepo.save as jest.Mock)
        .mockImplementationOnce(async (user) => ({
          ...user,
          id: 'google-user-id',
          tokenVersion: 0,
        }))
        .mockImplementationOnce(async (user) => user);

      const token = await service.loginWithGoogle(baseProfile);

      const [[createdUserPayload]] = (
        usersRepo.create as jest.MockedFunction<typeof usersRepo.create>
      ).mock.calls;
      expect(createdUserPayload?.email).toBe(baseProfile.email);
      expect(createdUserPayload?.emailVerified).toBe(true);
      expect(createdUserPayload?.termsAcceptedAt).toBeInstanceOf(Date);
      expect(createdUserPayload?.privacyAcceptedAt).toBeInstanceOf(Date);
      expect(usersRepo.save).toHaveBeenCalledTimes(1);

      const payload = await jwtService.verifyAsync<{
        sub: string;
        email: string;
        tokenVersion: number;
      }>(token.accessToken);
      expect(payload.sub).toBe('google-user-id');
      expect(payload.email).toBe(baseProfile.email);
      expect(payload.tokenVersion).toBe(0);
    });

    it('verifies existing user and issues token', async () => {
      const existingUser: Partial<User> = {
        id: 'existing-google-user',
        email: baseProfile.email,
        emailVerified: false,
        tokenVersion: 2,
        active: true,
        passwordHash: 'hash',
      };

      (usersRepo.findOne as jest.Mock).mockResolvedValue(existingUser);
      (usersRepo.save as jest.Mock).mockImplementation(async (user) => user);

      const token = await service.loginWithGoogle(baseProfile);

      expect(usersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerified: true,
        }),
      );

      const payload = await jwtService.verifyAsync<{
        sub: string;
        email: string;
        tokenVersion: number;
      }>(token.accessToken);
      expect(payload.sub).toBe(existingUser.id);
      expect(payload.email).toBe(existingUser.email);
      expect(payload.tokenVersion).toBe(existingUser.tokenVersion);
    });
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

    await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
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
      pendingEmailVerificationTokenExpiresAt: new Date(
        Date.now() + 60 * 60 * 1000,
      ),
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

    await expect(
      service.verifyEmail({ token: 'invalid-token' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usersRepo.save).not.toHaveBeenCalled();
  });
});
