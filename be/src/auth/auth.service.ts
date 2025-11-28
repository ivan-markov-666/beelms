import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { AuthTokenDto } from './dto/auth-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<UserProfileDto> {
    const requireCaptcha = process.env.AUTH_REQUIRE_CAPTCHA === 'true';
    if (requireCaptcha && !dto.captchaToken) {
      throw new BadRequestException('captcha verification required');
    }

    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      active: true,
    });
    try {
      const saved = await this.usersRepo.save(user);
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

  async login(dto: LoginDto): Promise<AuthTokenDto> {
    const user = await this.usersRepo.findOne({ where: { email: dto.email, active: true } });

    if (!user) {
      throw new UnauthorizedException('invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
    };
  }

  private toUserProfileDto(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
