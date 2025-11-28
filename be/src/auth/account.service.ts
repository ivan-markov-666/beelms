import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  async getCurrentProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.usersRepo.findOne({ where: { id: userId, active: true } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateEmail(userId: string, dto: UpdateProfileDto): Promise<UserProfileDto> {
    const user = await this.usersRepo.findOne({ where: { id: userId, active: true } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email === user.email) {
      return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      };
    }

    const existing = await this.usersRepo.findOne({ where: { email: dto.email, active: true } });
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
      // eslint-disable-next-line no-console
      console.log(
        `[account] Email change requested for ${saved.email}. Verification link for new email (${dto.email}): /auth/verify-email?token=${verificationToken}`,
      );
    }

    return {
      id: saved.id,
      email: saved.email,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId, active: true } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new BadRequestException('invalid password change request');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await this.usersRepo.save(user);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId, active: true } });

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
    const user = await this.usersRepo.findOne({ where: { id: userId, active: true } });

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
