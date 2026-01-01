import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { AuthTokenDto } from './dto/auth-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import type { GoogleProfile } from './google-oauth.service';
import type { FacebookProfile } from './facebook-oauth.service';
import type { GithubProfile } from './github-oauth.service';
import type { LinkedinProfile } from './linkedin-oauth.service';
import { CaptchaService } from '../security/captcha/captcha.service';
import { InMemoryLoginAttemptStore } from '../security/account-protection/login-attempts.store';
import {
  buildLoginAttemptKey,
  LOGIN_PROTECTION_WINDOW_MS,
  normalizeLoginEmailValue,
} from '../security/account-protection/login-protection.utils';

const RESET_PASSWORD_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const SHOULD_LOG_AUTH_LINKS =
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly captchaService: CaptchaService,
    private readonly loginAttemptStore: InMemoryLoginAttemptStore,
  ) {}

  async register(dto: RegisterDto): Promise<UserProfileDto> {
    if (process.env.MAINTENANCE_MODE === 'true') {
      throw new HttpException(
        'Service temporarily unavailable due to maintenance',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const requireCaptcha = process.env.AUTH_REQUIRE_CAPTCHA === 'true';
    if (requireCaptcha) {
      await this.captchaService.verifyCaptchaToken({
        token: dto.captchaToken ?? '',
      });
    }

    if (dto.acceptTerms !== true) {
      throw new BadRequestException('terms acceptance required');
    }

    if (dto.honeypot && dto.honeypot.trim() !== '') {
      throw new BadRequestException('bot detected');
    }

    const existing = await this.usersRepo.findOne({
      where: { email: dto.email, active: true },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      active: true,
      emailVerified: false,
      passwordLastChangedAt: now,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
    });
    try {
      const saved = await this.usersRepo.save(user);

      const verificationToken = randomBytes(32).toString('hex');
      saved.emailVerificationToken = verificationToken;
      saved.emailVerificationTokenExpiresAt = new Date(
        Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS,
      );

      await this.usersRepo.save(saved);

      if (SHOULD_LOG_AUTH_LINKS) {
        console.log(
          `[auth] Email verification requested for ${saved.email}. Verification link: /auth/verify-email?token=${verificationToken}`,
        );
      }

      return this.toUserProfileDto(saved);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }
  }

  async login(
    dto: LoginDto,
    requestContext?: { ip?: string },
  ): Promise<AuthTokenDto> {
    const ip = (requestContext?.ip ?? '').trim() || 'unknown';

    const shouldEnforceLoginCaptcha =
      process.env.NODE_ENV !== 'test' ||
      process.env.AUTH_LOGIN_CAPTCHA_TEST_MODE === 'true';

    if (shouldEnforceLoginCaptcha) {
      const thresholdRaw = process.env.AUTH_LOGIN_CAPTCHA_THRESHOLD;
      const threshold = thresholdRaw ? Number(thresholdRaw) : 3;

      const emailKey = normalizeLoginEmailValue(dto.email);
      const key = buildLoginAttemptKey(ip, emailKey);

      if (
        this.loginAttemptStore.shouldRequireCaptcha(
          key,
          Date.now(),
          LOGIN_PROTECTION_WINDOW_MS,
          Number.isFinite(threshold) ? threshold : 3,
        )
      ) {
        await this.captchaService.verifyCaptchaToken({
          token: dto.captchaToken ?? '',
          remoteIp: ip,
        });
      }
    }

    const user = await this.usersRepo.findOne({
      where: { email: dto.email, active: true },
    });

    if (!user) {
      throw new UnauthorizedException('invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('invalid credentials');
    }

    return this.issueAuthToken(user);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const requireCaptcha = process.env.AUTH_REQUIRE_CAPTCHA === 'true';
    if (requireCaptcha) {
      await this.captchaService.verifyCaptchaToken({
        token: dto.captchaToken ?? '',
      });
    }

    const email = dto.email.toLowerCase().trim();
    const user = await this.usersRepo.findOne({
      where: { email },
    });

    if (!user) {
      return;
    }

    const token = randomBytes(32).toString('hex');

    user.resetPasswordToken = token;
    user.resetPasswordTokenExpiresAt = new Date(
      Date.now() + RESET_PASSWORD_TOKEN_TTL_MS,
    );

    await this.usersRepo.save(user);

    if (SHOULD_LOG_AUTH_LINKS) {
      console.log(
        `[auth] Password reset requested for ${user.email}. Reset link: /auth/reset-password?token=${token}`,
      );
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { resetPasswordToken: dto.token },
    });

    if (
      !user ||
      !user.resetPasswordTokenExpiresAt ||
      user.resetPasswordTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    const now = new Date();

    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiresAt = null;
    user.passwordLastChangedAt = now;

    await this.usersRepo.save(user);
  }

  async loginWithGoogle(profile: GoogleProfile): Promise<AuthTokenDto> {
    const user = await this.upsertSocialUser(profile.email);
    return this.issueAuthToken(user);
  }

  async loginWithFacebook(profile: FacebookProfile): Promise<AuthTokenDto> {
    const user = await this.upsertSocialUser(profile.email);
    return this.issueAuthToken(user);
  }

  async loginWithGithub(profile: GithubProfile): Promise<AuthTokenDto> {
    const user = await this.upsertSocialUser(profile.email);
    return this.issueAuthToken(user);
  }

  async loginWithLinkedin(profile: LinkedinProfile): Promise<AuthTokenDto> {
    const user = await this.upsertSocialUser(profile.email);
    return this.issueAuthToken(user);
  }

  private async upsertSocialUser(email: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    let user = await this.usersRepo.findOne({
      where: { email: normalizedEmail, active: true },
    });

    if (!user) {
      const now = new Date();
      const randomPassword = randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = this.usersRepo.create({
        email: normalizedEmail,
        passwordHash,
        active: true,
        emailVerified: true,
        passwordLastChangedAt: now,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
      });
      user = await this.usersRepo.save(user);
    } else if (!user.emailVerified) {
      user.emailVerified = true;
      await this.usersRepo.save(user);
    }

    return user;
  }

  private async issueAuthToken(user: User): Promise<AuthTokenDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
    };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const token = dto.token;

    const user = await this.usersRepo.findOne({
      where: [
        { emailVerificationToken: token, active: true },
        { pendingEmailVerificationToken: token, active: true },
      ],
    });

    if (!user) {
      throw new BadRequestException('invalid or expired verification token');
    }

    const now = Date.now();

    if (user.emailVerificationToken === token) {
      if (
        !user.emailVerificationTokenExpiresAt ||
        user.emailVerificationTokenExpiresAt.getTime() < now
      ) {
        throw new BadRequestException('invalid or expired verification token');
      }

      user.emailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationTokenExpiresAt = null;
    } else if (user.pendingEmailVerificationToken === token) {
      if (
        !user.pendingEmailVerificationTokenExpiresAt ||
        user.pendingEmailVerificationTokenExpiresAt.getTime() < now ||
        !user.pendingEmail
      ) {
        throw new BadRequestException('invalid or expired verification token');
      }

      const WINDOW_MS = 24 * 60 * 60 * 1000;

      if (
        !user.emailChangeVerificationWindowStartedAt ||
        now - user.emailChangeVerificationWindowStartedAt.getTime() >= WINDOW_MS
      ) {
        user.emailChangeVerificationWindowStartedAt = new Date(now);
        user.emailChangeVerificationCount = 0;
      }

      if (user.emailChangeVerificationCount >= 3) {
        throw new HttpException(
          'email change verification limit reached',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      user.emailChangeVerificationCount += 1;

      user.email = user.pendingEmail;
      user.pendingEmail = null;
      user.pendingEmailVerificationToken = null;
      user.pendingEmailVerificationTokenExpiresAt = null;
      user.emailVerified = true;
    } else {
      throw new BadRequestException('invalid or expired verification token');
    }

    await this.usersRepo.save(user);
  }

  private toUserProfileDto(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      role: user.role,
      emailChangeLimitReached: false,
      emailChangeLimitResetAt: null,
    };
  }
}
