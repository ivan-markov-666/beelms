import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { User } from './user.entity';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserExportDto } from './dto/user-export.dto';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { Enable2faDto } from './dto/enable-2fa.dto';
import { Disable2faDto } from './dto/disable-2fa.dto';

const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const DELETED_EMAIL_DOMAIN =
  process.env.DELETED_EMAIL_DOMAIN ?? 'deleted.example.invalid';
const SHOULD_LOG_AUTH_LINKS =
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly twoFactorAuth: TwoFactorAuthService,
  ) {}

  private buildUserProfileDto(user: User): UserProfileDto {
    const dto: UserProfileDto = {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      role: user.role,
      emailChangeLimitReached: false,
      emailChangeLimitResetAt: null,
    };

    const WINDOW_MS = 24 * 60 * 60 * 1000;

    if (user.emailChangeVerificationWindowStartedAt) {
      const windowStart = user.emailChangeVerificationWindowStartedAt.getTime();
      const now = Date.now();

      if (!Number.isNaN(windowStart) && now - windowStart < WINDOW_MS) {
        if (user.emailChangeVerificationCount >= 3) {
          dto.emailChangeLimitReached = true;
          dto.emailChangeLimitResetAt = new Date(
            windowStart + WINDOW_MS,
          ).toISOString();
        }
      }
    }

    return dto;
  }

  async getCurrentProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.usersRepo.findOne({
      where: { id: userId, active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.buildUserProfileDto(user);
  }

  async updateEmail(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const user = await this.usersRepo.findOne({
      where: { id: userId, active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email === user.email) {
      return this.buildUserProfileDto(user);
    }

    const WINDOW_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (user.emailChangeVerificationWindowStartedAt) {
      const windowStart = user.emailChangeVerificationWindowStartedAt.getTime();

      if (!Number.isNaN(windowStart) && now - windowStart < WINDOW_MS) {
        if (user.emailChangeVerificationCount >= 3) {
          throw new HttpException(
            'email change verification limit reached',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }
    }

    const existing = await this.usersRepo.findOne({
      where: { email: dto.email, active: true },
    });
    if (existing && existing.id !== user.id) {
      throw new ConflictException('Email already in use');
    }

    const verificationToken = randomBytes(32).toString('hex');

    user.pendingEmail = dto.email;
    user.pendingEmailVerificationToken = verificationToken;
    user.pendingEmailVerificationTokenExpiresAt = new Date(
      Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS,
    );

    const saved = await this.usersRepo.save(user);

    if (SHOULD_LOG_AUTH_LINKS) {
      console.log(
        `[account] Email change requested for ${saved.email}. Verification link for new email (${dto.email}): /auth/verify-email?token=${verificationToken}`,
      );
    }

    return this.buildUserProfileDto(saved);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id: userId, active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new BadRequestException('invalid password change request');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    user.passwordLastChangedAt = new Date();
    user.tokenVersion += 1;
    await this.usersRepo.save(user);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id: userId, active: true },
    });

    if (!user) {
      // Idempotent DELETE: if user is already inactive or missing, do nothing.
      return;
    }

    const now = new Date();

    user.active = false;
    user.email = `deleted+${user.id}@${DELETED_EMAIL_DOMAIN}`;
    user.passwordHash = '';

    if (!user.gdprErasureRequestedAt) {
      user.gdprErasureRequestedAt = now;
    }
    if (!user.gdprErasureCompletedAt) {
      user.gdprErasureCompletedAt = now;
    }

    // Clear email verification and pending email state
    user.emailVerified = false;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiresAt = null;
    user.pendingEmail = null;
    user.pendingEmailVerificationToken = null;
    user.pendingEmailVerificationTokenExpiresAt = null;

    // Clear reset password state
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiresAt = null;

    // Reset email change verification counters
    user.emailChangeVerificationCount = 0;
    user.emailChangeVerificationWindowStartedAt = null;

    await this.usersRepo.save(user);
  }

  async exportData(userId: string): Promise<UserExportDto> {
    const user = await this.usersRepo.findOne({
      where: { id: userId, active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    user.lastExportRequestedAt = now;
    user.lastExportDeliveredAt = now;
    await this.usersRepo.save(user);

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      active: user.active,
    };
  }

  async getTwoFactorStatus(userId: string): Promise<{
    enabled: boolean;
    confirmedAt: string | null;
  }> {
    const user = await this.usersRepo.findOne({
      where: { id: userId, active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      enabled: user.twoFactorEnabled === true,
      confirmedAt: user.twoFactorConfirmedAt
        ? user.twoFactorConfirmedAt.toISOString()
        : null,
    };
  }

  async setupTwoFactor(userId: string): Promise<{
    secret: string;
    otpauthUrl: string;
  }> {
    const user = await this.usersRepo.findOne({
      where: { id: userId, active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.twoFactorEnabled === true) {
      throw new BadRequestException('two factor already enabled');
    }

    const secret = this.twoFactorAuth.generateSecret();
    const issuer = process.env.TWO_FA_ISSUER ?? 'BeeLMS';
    const otpauthUrl = this.twoFactorAuth.buildOtpAuthUrl({
      issuer,
      email: user.email,
      secret,
    });

    return { secret, otpauthUrl };
  }

  async enableTwoFactor(
    userId: string,
    dto: Enable2faDto,
  ): Promise<{
    enabled: boolean;
    confirmedAt: string;
  }> {
    const user = await this.usersRepo.findOne({
      where: { id: userId, active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ok = this.twoFactorAuth.verifyCode({
      code: dto.code,
      secret: dto.secret,
    });

    if (!ok) {
      throw new BadRequestException('invalid 2fa code');
    }

    user.twoFactorSecret = this.twoFactorAuth.encryptSecret(dto.secret);
    user.twoFactorEnabled = true;
    user.twoFactorConfirmedAt = new Date();

    const saved = await this.usersRepo.save(user);

    return {
      enabled: true,
      confirmedAt: saved.twoFactorConfirmedAt
        ? saved.twoFactorConfirmedAt.toISOString()
        : new Date().toISOString(),
    };
  }

  async disableTwoFactor(
    userId: string,
    dto: Disable2faDto,
  ): Promise<{
    enabled: boolean;
  }> {
    const user = await this.usersRepo.findOne({
      where: { id: userId, active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return { enabled: false };
    }

    const secret = this.twoFactorAuth.decryptSecret(user.twoFactorSecret);
    const ok = this.twoFactorAuth.verifyCode({ code: dto.code, secret });
    if (!ok) {
      throw new BadRequestException('invalid 2fa code');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorConfirmedAt = null;

    await this.usersRepo.save(user);

    return { enabled: false };
  }
}
