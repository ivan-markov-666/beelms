import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  SecurityLoggerService,
  SecurityEventType,
} from './security-logger.service';

/**
 * Сервис для управления блокировкой аккаунтов
 * после определенного количества неудачных попыток входа
 */
@Injectable()
export class AccountLockoutService {
  // Максимальное количество неудачных попыток входа
  private readonly MAX_FAILED_ATTEMPTS = 5;

  // Время блокировки аккаунта в минутах
  private readonly LOCKOUT_DURATION_MINUTES = 30;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private securityLogger: SecurityLoggerService,
  ) {}

  /**
   * Проверяет, заблокирован ли аккаунт пользователя
   * @param userId ID пользователя
   * @returns true если аккаунт заблокирован, иначе false
   */
  async isAccountLocked(userId: number): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return false;
    }

    // Если количество неудачных попыток меньше максимального, аккаунт не заблокирован
    if (user.failed_login_attempts < this.MAX_FAILED_ATTEMPTS) {
      return false;
    }

    // Проверяем, прошло ли время блокировки
    const lastFailedAttempt = user.updated_at; // Используем updated_at как время последней неудачной попытки
    const lockoutEnd = new Date(lastFailedAttempt);
    lockoutEnd.setMinutes(
      lockoutEnd.getMinutes() + this.LOCKOUT_DURATION_MINUTES,
    );

    const now = new Date();

    // Если время блокировки истекло, разблокируем аккаунт
    if (now > lockoutEnd) {
      await this.unlockAccount(userId);
      return false;
    }

    // Аккаунт все еще заблокирован
    return true;
  }

  /**
   * Обрабатывает неудачную попытку входа
   * @param userId ID пользователя
   * @param ipAddress IP-адрес клиента
   * @throws UnauthorizedException если аккаунт заблокирован
   */
  async handleFailedLoginAttempt(
    userId: number,
    ipAddress?: string,
  ): Promise<void> {
    // Проверяем, заблокирован ли аккаунт
    if (await this.isAccountLocked(userId)) {
      // Логируем попытку входа в заблокированный аккаунт
      this.securityLogger.logSecurityEvent(
        SecurityEventType.ACCESS_DENIED,
        userId,
        'Attempted to login to locked account',
        ipAddress,
      );

      throw new UnauthorizedException(
        'Ваш аккаунт временно заблокирован из-за слишком большого количества неудачных попыток входа. Пожалуйста, попробуйте через 30 минут.',
      );
    }

    // Увеличиваем счетчик неудачных попыток
    const attempts = await this.securityLogger.logFailedLoginAttempt(
      userId,
      ipAddress,
    );

    // Если достигнуто максимальное количество попыток, блокируем аккаунт
    if (attempts >= this.MAX_FAILED_ATTEMPTS) {
      await this.lockAccount(userId, ipAddress);

      throw new UnauthorizedException(
        'Ваш аккаунт временно заблокирован из-за слишком большого количества неудачных попыток входа. Пожалуйста, попробуйте через 30 минут.',
      );
    }
  }

  /**
   * Блокирует аккаунт пользователя
   * @param userId ID пользователя
   * @param ipAddress IP-адрес клиента
   */
  private async lockAccount(userId: number, ipAddress?: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return;
    }

    // Логируем блокировку аккаунта
    this.securityLogger.logSecurityEvent(
      SecurityEventType.ACCOUNT_LOCKED,
      userId,
      `Account locked for ${this.LOCKOUT_DURATION_MINUTES} minutes due to ${this.MAX_FAILED_ATTEMPTS} failed login attempts`,
      ipAddress,
    );
  }

  /**
   * Разблокирует аккаунт пользователя
   * @param userId ID пользователя
   */
  private async unlockAccount(userId: number): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return;
    }

    // Сбрасываем счетчик неудачных попыток
    user.failed_login_attempts = 0;
    await this.usersRepository.save(user);

    // Логируем разблокировку аккаунта
    this.securityLogger.logSecurityEvent(
      SecurityEventType.ACCESS_DENIED,
      userId,
      'Account automatically unlocked after lockout period',
    );
  }

  /**
   * Сбрасывает счетчик неудачных попыток при успешном входе
   * @param userId ID пользователя
   */
  async resetFailedAttemptsOnSuccessfulLogin(userId: number): Promise<void> {
    await this.securityLogger.resetFailedLoginAttempts(userId);
  }
}
