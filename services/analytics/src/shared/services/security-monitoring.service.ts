import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IpBlockingService } from './ip-blocking.service';

/**
 * Интерфейс за събития за сигурност
 */
interface SecurityEvent {
  eventType: string;
  timestamp: Date;
  ipAddress?: string;
  userId?: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, any>;
}

/**
 * Сервис за мониторинг на сигурността
 *
 * Този сервис отговаря за следенето, регистрирането и известяването
 * на събития, свързани със сигурността на системата
 */
@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private readonly securityEventsBuffer: SecurityEvent[] = [];
  private readonly bufferSize: number;
  private readonly alertThresholds: Record<string, number>;

  constructor(
    private configService: ConfigService,
    private ipBlockingService: IpBlockingService,
  ) {
    // Конфигурационни стойности с подразбиращи се настройки
    this.bufferSize = this.configService.get<number>(
      'SECURITY_EVENTS_BUFFER_SIZE',
      1000,
    );

    // Прагове за известяване според различни типове събития
    this.alertThresholds = {
      FAILED_LOGIN: this.configService.get<number>('FAILED_LOGIN_THRESHOLD', 5),
      INVALID_JWT: this.configService.get<number>('INVALID_JWT_THRESHOLD', 10),
      SQL_INJECTION_ATTEMPT: this.configService.get<number>(
        'SQL_INJECTION_THRESHOLD',
        1,
      ),
      XSS_ATTEMPT: this.configService.get<number>('XSS_ATTEMPT_THRESHOLD', 3),
      CSRF_ATTEMPT: this.configService.get<number>('CSRF_ATTEMPT_THRESHOLD', 3),
      RATE_LIMIT_EXCEEDED: this.configService.get<number>(
        'RATE_LIMIT_THRESHOLD',
        5,
      ),
    };

    // Инициализация на периодично извеждане на събитията за сигурност
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => this.processSecurityEvents(), 60000); // всяка минута
    }
  }

  /**
   * Регистрира събитие за сигурност
   */
  public logSecurityEvent(event: SecurityEvent): void {
    // Добавяне на събитието към буфера
    this.securityEventsBuffer.push({
      ...event,
      timestamp: new Date(),
    });

    // Ако буферът стане твърде голям, премахваме най-старите събития
    if (this.securityEventsBuffer.length > this.bufferSize) {
      this.securityEventsBuffer.shift(); // Премахване на най-старото събитие
    }

    // Логване според нивото на важност
    switch (event.severity) {
      case 'CRITICAL':
        this.logger.error(
          `КРИТИЧНО СЪБИТИЕ ЗА СИГУРНОСТ: ${event.description}`,
          {
            ...event,
            timestamp: event.timestamp.toISOString(),
          },
        );
        break;
      case 'HIGH':
        this.logger.warn(`ВАЖНО СЪБИТИЕ ЗА СИГУРНОСТ: ${event.description}`, {
          eventType: event.eventType,
          ipAddress: event.ipAddress,
        });
        break;
      default:
        this.logger.log(`Събитие за сигурност: ${event.description}`, {
          eventType: event.eventType,
        });
    }

    // Проверка на прагове за известяване и автоматични действия
    this.checkThresholdsAndTakeAction(event);
  }

  /**
   * Проверява дали определено събитие за сигурност изисква действие
   */
  private checkThresholdsAndTakeAction(event: SecurityEvent): void {
    // Ако събитието има IP адрес и тип с дефиниран праг
    if (event.ipAddress && event.eventType in this.alertThresholds) {
      // Изчисляваме колко пъти се е случило това събитие от този IP в последните 30 минути
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const recentEvents = this.securityEventsBuffer.filter(
        (e) =>
          e.eventType === event.eventType &&
          e.ipAddress === event.ipAddress &&
          e.timestamp > thirtyMinutesAgo,
      );

      // Ако броят надвишава прага, предприемаме действие
      if (recentEvents.length >= this.alertThresholds[event.eventType]) {
        // При достигане на прага, блокираме IP адреса
        if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
          this.blockSuspiciousIp(
            event.ipAddress,
            event.eventType,
            recentEvents.length,
          );
        }

        // Изпращаме известие до администраторите
        this.sendSecurityAlert(event, recentEvents.length);
      }
    }
  }

  /**
   * Блокира подозрителен IP адрес
   */
  private blockSuspiciousIp(
    ipAddress: string,
    reason: string,
    occurrences: number,
  ): void {
    try {
      // Определяме продължителността на блокирането според тежестта
      let blockDurationMinutes = 30; // 30 минути по подразбиране

      switch (reason) {
        case 'SQL_INJECTION_ATTEMPT':
        case 'XSS_ATTEMPT':
          blockDurationMinutes = 240; // 4 часа за сериозни опити за атака
          break;
        case 'RATE_LIMIT_EXCEEDED':
          blockDurationMinutes = 60; // 1 час за надвишаване на ограниченията
          break;
        case 'FAILED_LOGIN':
          blockDurationMinutes = 15; // 15 минути за неуспешни опити за вход
          break;
      }

      // Блокиране на IP-то за определеното време
      // Convert minutes to milliseconds for the blockTemporarily method
      const durationMs = blockDurationMinutes * 60 * 1000;
      this.ipBlockingService.blockTemporarily(ipAddress, durationMs);

      // Log the blocking reason
      this.logger.debug(
        `Автоматично блокиране: ${reason} (${occurrences} случая)`,
      );

      this.logger.warn(
        `БЛОКИРАН IP: ${ipAddress} за ${blockDurationMinutes} минути поради ${reason}`,
      );
    } catch (error) {
      this.logger.error(
        `Грешка при опит за блокиране на IP ${ipAddress}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Изпраща известие за сигурност до администраторите
   */
  private sendSecurityAlert(event: SecurityEvent, occurrences: number): void {
    // В реална система тук бихме имали код за изпращане на имейл, SMS, или интеграция с платформа за известяване

    // Формиране на съобщението за известяване
    const alertMessage = `
      ИЗВЕСТИЕ ЗА СИГУРНОСТ: ${event.eventType}
      Тежест: ${event.severity}
      IP адрес: ${event.ipAddress}
      Брой случаи: ${occurrences}
      Описание: ${event.description}
      Време: ${event.timestamp.toISOString()}
      ${event.userId ? `Потребител ID: ${event.userId}` : ''}
      ${event.metadata ? `Допълнителна информация: ${JSON.stringify(event.metadata)}` : ''}
    `;

    // Логване на известието (в реална система би било изпратено чрез API)
    this.logger.warn(alertMessage);

    // Запис във файловата система или в база данни за бъдеща справка
    // В реална имплементация бихме използвали дедикирана система за логване или база данни
    console.error(`SECURITY ALERT: ${alertMessage}`);
  }

  /**
   * Обработва натрупаните събития за сигурност
   */
  private processSecurityEvents(): void {
    if (this.securityEventsBuffer.length === 0) {
      return;
    }

    // В реална система бихме изпращали обобщения към система за мониторинг или ElasticSearch/Kibana
    const summary = {
      total: this.securityEventsBuffer.length,
      critical: this.securityEventsBuffer.filter(
        (e) => e.severity === 'CRITICAL',
      ).length,
      high: this.securityEventsBuffer.filter((e) => e.severity === 'HIGH')
        .length,
      medium: this.securityEventsBuffer.filter((e) => e.severity === 'MEDIUM')
        .length,
      low: this.securityEventsBuffer.filter((e) => e.severity === 'LOW').length,
    };

    if (summary.critical > 0 || summary.high > 0) {
      this.logger.warn(
        `Обобщение на събития за сигурност: ${JSON.stringify(summary)}`,
      );
    } else {
      this.logger.log(
        `Обобщение на събития за сигурност: ${JSON.stringify(summary)}`,
      );
    }
  }

  /**
   * Връща последните събития за сигурност за анализ
   */
  public getRecentSecurityEvents(limit = 100): SecurityEvent[] {
    return [...this.securityEventsBuffer]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}
