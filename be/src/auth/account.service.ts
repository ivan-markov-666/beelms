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

const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  private buildUserProfileDto(user: User): UserProfileDto {
    const dto: UserProfileDto = {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
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

    if (process.env.NODE_ENV !== 'production') {
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

    user.active = false;
    user.email = `deleted+${user.id}@deleted.qa4free.invalid`;
    user.passwordHash = '';
    await this.usersRepo.save(user);
  }

  async exportData(userId: string): Promise<UserExportDto> {
    const user = await this.usersRepo.findOne({
      where: { id: userId, active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      active: user.active,
    };
  }
}
