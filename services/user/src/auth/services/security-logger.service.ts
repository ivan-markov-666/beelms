import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Типы событий безопасности
 */
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  ACCESS_DENIED = 'access_denied',
  PASSWORD_CHANGED = 'password_changed',
  ACCOUNT_LOCKED = 'account_locked',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  TOKEN_REFRESH = 'token_refresh',
  TOKEN_INVALID = 'token_invalid',
  LOGOUT = 'logout',
}

/**
 * Сервис для логирования событий безопасности
 */
@Injectable()
export class SecurityLoggerService {
  private readonly logger = new Logger(SecurityLoggerService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Логирует событие безопасности
   * @param eventType Тип события
   * @param userId ID пользователя (если известен)
   * @param details Дополнительные детали события
   * @param ipAddress IP-адрес клиента
   */
  logSecurityEvent(
    eventType: SecurityEventType,
    userId?: number,
    details?: string,
    ipAddress?: string,
  ): void {
    // В реальной системе эти данные были бы сохранены в БД
    // Просто логируем в консоль для целей разработки

    // Логируем в консоль для целей разработки
    this.logger.log(
      `Security Event: ${eventType}, User: ${userId || 'unknown'}, IP: ${
        ipAddress || 'unknown'
      }, Details: ${details || 'none'}`,
    );

    // TODO: В реальном приложении здесь мы бы сохраняли события в базу данных
    // или отправляли их в систему мониторинга безопасности
  }

  /**
   * Логирует неудачную попытку входа и увеличивает счетчик
   * @param userId ID пользователя
   * @param ipAddress IP-адрес клиента
   * @returns Текущее количество неудачных попыток
   */
  async logFailedLoginAttempt(
    userId: number,
    ipAddress?: string,
  ): Promise<number> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return 0;
    }

    // Увеличиваем счетчик неудачных попыток входа
    user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;
    await this.usersRepository.save(user);

    // Логируем событие
    this.logSecurityEvent(
      SecurityEventType.LOGIN_FAILURE,
      userId,
      `Failed login attempts: ${user.failed_login_attempts}`,
      ipAddress,
    );

    return user.failed_login_attempts;
  }

  /**
   * Сбрасывает счетчик неудачных попыток входа
   * @param userId ID пользователя
   */
  async resetFailedLoginAttempts(userId: number): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return;
    }

    user.failed_login_attempts = 0;
    user.last_login = new Date();
    await this.usersRepository.save(user);

    this.logSecurityEvent(
      SecurityEventType.LOGIN_SUCCESS,
      userId,
      'Login successful, reset failed attempts counter',
    );
  }
}
