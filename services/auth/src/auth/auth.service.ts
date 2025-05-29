import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
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

    // Генериране на JWT токен
    const token = this.generateToken(user);

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
      const payload = this.jwtService.verify(token);
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });
      return user;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Intentionally ignoring error
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
    // Намиране и изтриване на сесията
    await this.sessionRepository.delete({ token });
  }
}
