import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository, LessThan } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { RedisService } from '../common/redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordReset } from './entities/password-reset.entity';
import { Session } from './entities/session.entity';

// Интерфейс за JWT payload
interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  exp?: number; // Добавяме поле за срок на валидност
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PasswordReset)
    private passwordResetRepository: Repository<PasswordReset>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: User; token: string }> {
    const { email, password } = registerDto;

    // Проверка за съществуващ потребител
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Потребител с този имейл вече съществува');
    }

    // Хеширане на паролата
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    // Създаване на потребител
    const user = this.usersRepository.create({
      email,
      passwordHash,
      salt,
      role: 'user',
      isActive: true,
      failedLoginAttempts: 0,
      lastLogin: null,
    });

    await this.usersRepository.save(user);

    // Генериране на JWT токен
    const token = this.generateToken(user);

    return { user, token };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; token: string }> {
    const { email, password } = loginDto;

    // Намиране на потребителя
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Невалиден имейл или парола');
    }

    // Проверка дали акаунтът е активен
    if (!user.isActive) {
      throw new UnauthorizedException('Акаунтът е деактивиран');
    }

    // Валидиране на паролата
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Увеличаване на броя неуспешни опити
      user.failedLoginAttempts += 1;

      // Заключване на акаунта след 5 неуспешни опита
      if (user.failedLoginAttempts >= 5) {
        user.isActive = false;
      }

      await this.usersRepository.save(user);
      throw new UnauthorizedException('Невалиден имейл или парола');
    }

    // Нулиране на неуспешните опити и актуализиране на времето на последно влизане
    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    await this.usersRepository.save(user);

    // Премахване на всички изтекли сесии
    await this.cleanupExpiredSessions(user.id);

    // Генериране на JWT токен
    const token = this.generateToken(user);

    // Съхраняване на токена в Redis кеш
    const expiresIn = parseInt(
      this.configService.get('jwt.expiresIn', '3600'),
      10,
    );
    await this.redisService.set(
      `token:${token}`,
      user.id.toString(),
      expiresIn,
    );

    return { user, token };
  }

  async resetPasswordRequest(
    resetPasswordRequestDto: ResetPasswordRequestDto,
  ): Promise<void> {
    const { email } = resetPasswordRequestDto;

    // Намиране на потребителя
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      // За сигурност, не разкриваме дали имейлът съществува
      return;
    }

    // Генериране на токен за рестартиране на паролата
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Валиден за 24 часа

    // Съхраняване на токена
    const passwordReset = this.passwordResetRepository.create({
      userId: user.id,
      token,
      used: false,
      expiresAt,
    });
    await this.passwordResetRepository.save(passwordReset);

    // Тук бихме изпратили имейл с линк за рестартиране на паролата
    // TODO: Имплементирайте изпращане на имейл
    console.log(`Токен за рестартиране на парола: ${token}`);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    // Намиране на валиден токен за рестартиране на парола
    const passwordReset = await this.passwordResetRepository.findOne({
      where: { token, used: false },
      relations: ['user'],
    });

    if (!passwordReset || passwordReset.expiresAt < new Date()) {
      throw new BadRequestException('Невалиден или изтекъл токен');
    }

    const user = passwordReset.user;

    // Хеширане на новата парола
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Актуализиране на паролата на потребителя
    user.passwordHash = passwordHash;
    user.salt = salt;
    await this.usersRepository.save(user);

    // Маркиране на токена като използван
    passwordReset.used = true;
    await this.passwordResetRepository.save(passwordReset);

    // Премахване на всички сесии на потребителя за по-голяма сигурност
    await this.sessionRepository.delete({ userId: user.id });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      // Проверка дали токенът е в черния списък в Redis
      const isBlacklisted = await this.redisService.isBlacklisted(token);
      if (isBlacklisted) {
        return null;
      }

      const payload: JwtPayload = this.jwtService.verify(token);

      // Проверка дали токенът е отхвърлен в базата данни
      const session = await this.sessionRepository.findOne({
        where: { token, revoked: true },
      });

      if (session) {
        return null;
      }

      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });

      return user;
    } catch (error) {
      // Intentionally ignoring error
      console.error(
        'Token validation error:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return null;
    }
  }

  generateToken(user: User): string {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  async logout(token: string): Promise<void> {
    try {
      const payload: JwtPayload = this.jwtService.verify(token);
      const session = await this.sessionRepository.findOne({
        where: { token },
      });

      if (session) {
        await this.sessionRepository.remove(session);
      } else {
        // Създаване на запис за отхвърлен токен
        const userId = payload.sub;
        const expiresAt = new Date((payload.exp || 0) * 1000);

        const newSession = this.sessionRepository.create({
          userId,
          token,
          expiresAt,
          revoked: true,
        });
        await this.sessionRepository.save(newSession);
      }

      // Добавяне на токена в Redis blacklist
      const timeUntilExpiry = Math.floor(
        ((payload.exp || 0) * 1000 - Date.now()) / 1000,
      );
      if (timeUntilExpiry > 0) {
        await this.redisService.addToBlacklist(token, timeUntilExpiry);
      }
    } catch (error) {
      // Ако токенът не може да бъде верифициран, просто продължаваме
      if (error instanceof Error) {
        console.error('Невалиден токен при опит за излизане:', error.message);
      }
    }
  }

  /**
   * Почистване на изтеклите сесии за даден потребител
   */
  private async cleanupExpiredSessions(userId: number): Promise<void> {
    const now = new Date();
    await this.sessionRepository.delete({
      userId,
      expiresAt: LessThan(now),
    });
  }
}
