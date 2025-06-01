import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../users/entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { SecurityLoggerService } from './security-logger.service';
import { AccountLockoutService } from './account-lockout.service';
import { SecurityEventType } from './security-logger.service';

@Injectable()
export class AuthService {
  // Време на живот на токените в секунди
  private readonly ACCESS_TOKEN_EXPIRATION = 3600; // 1 час
  private readonly REFRESH_TOKEN_EXPIRATION = 30 * 24 * 3600; // 30 дни

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly securityLogger: SecurityLoggerService,
    private readonly accountLockout: AccountLockoutService,
  ) {}

  /**
   * Валидира потребителските данни за вход
   */
  async validateUser(
    email: string,
    password: string,
    ipAddress?: string,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });

    // Ако потребителят не е намерен, логваме неуспешен опит с неизвестен потребител
    if (!user) {
      this.securityLogger.logSecurityEvent(
        SecurityEventType.LOGIN_FAILURE,
        undefined,
        `Опит за вход с несъществуващ имейл: ${email}`,
        ipAddress,
      );
      throw new UnauthorizedException('Невалидни потребителски данни');
    }

    // Проверяваме дали акаунтът не е заключен
    await this.accountLockout.handleFailedLoginAttempt(user.id, ipAddress);

    // Проверяваме паролата
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await this.accountLockout.handleFailedLoginAttempt(user.id, ipAddress);
      throw new UnauthorizedException('Невалидни потребителски данни');
    }

    // Нулираме брояча на неуспешни опити при успешен вход
    await this.accountLockout.resetFailedAttemptsOnSuccessfulLogin(user.id);

    return user;
  }

  /**
   * Създава JWT токени за достъп и обновяване
   */
  async createTokens(user: User, ipAddress?: string, userAgent?: string) {
    // Създаваме access token с минимална информация
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRATION,
    });

    // Създаваме refresh token
    const refreshToken = uuidv4();

    // Съхраняваме refresh token в базата данни
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setSeconds(
      refreshTokenExpiry.getSeconds() + this.REFRESH_TOKEN_EXPIRATION,
    );

    const newRefreshToken = this.refreshTokenRepository.create({
      token: refreshToken,
      user_id: user.id,
      expires_at: refreshTokenExpiry,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await this.refreshTokenRepository.save(newRefreshToken);

    // Логваме успешния вход
    this.securityLogger.logSecurityEvent(
      SecurityEventType.LOGIN_SUCCESS,
      user.id,
      'Успешен вход в системата',
      ipAddress,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.ACCESS_TOKEN_EXPIRATION,
      token_type: 'Bearer',
    };
  }

  /**
   * Обновява access token чрез валиден refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Намираме refresh token в базата данни
    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: {
        token: refreshToken,
        is_active: true,
      },
      relations: ['user'],
    });

    // Проверяваме дали токенът съществува и е валиден
    if (!tokenEntity || new Date() > tokenEntity.expires_at) {
      this.securityLogger.logSecurityEvent(
        SecurityEventType.TOKEN_INVALID,
        tokenEntity?.user_id,
        'Опит за използване на невалиден refresh token',
        ipAddress,
      );
      throw new UnauthorizedException('Невалиден или изтекъл refresh token');
    }

    const user = tokenEntity.user;

    // Инвалидираме стария refresh token
    tokenEntity.is_active = false;
    await this.refreshTokenRepository.save(tokenEntity);

    // Създаваме нови токени
    const tokens = await this.createTokens(user, ipAddress, userAgent);

    this.securityLogger.logSecurityEvent(
      SecurityEventType.TOKEN_REFRESH,
      user.id,
      'Успешно обновяване на access token',
      ipAddress,
    );

    return tokens;
  }

  /**
   * Инвалидира всички refresh токени на потребителя
   */
  async logout(userId: number, ipAddress?: string): Promise<void> {
    // Маркираме всички токени на потребителя като неактивни
    await this.refreshTokenRepository.update(
      { user_id: userId, is_active: true },
      { is_active: false },
    );

    this.securityLogger.logSecurityEvent(
      SecurityEventType.LOGOUT,
      userId,
      'Потребителят излезе от системата',
      ipAddress,
    );
  }
}
