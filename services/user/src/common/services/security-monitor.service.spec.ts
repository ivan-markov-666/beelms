import { Test, TestingModule } from '@nestjs/testing';
import {
  SecurityMonitorService,
  SecurityEventType,
} from './security-monitor.service';
import { Logger } from '@nestjs/common';

describe('SecurityMonitorService', () => {
  let service: SecurityMonitorService;
  let mockLogger: Partial<Logger>;

  beforeEach(async () => {
    mockLogger = {
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityMonitorService,
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<SecurityMonitorService>(SecurityMonitorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerEvent', () => {
    it('should register a security event', () => {
      const event = {
        type: SecurityEventType.CSRF_VALIDATION_FAILED,
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        endpoint: '/api/users',
      };

      service.registerEvent(event);

      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('getEventsByTypeAndIp', () => {
    it('should return events by type and IP within time window', () => {
      // Регистрираме няколко CSRF събития от един и същ IP
      const now = Date.now();
      const ipAddress = '192.168.1.1';

      // Събития в рамките на последните 5 минути
      for (let i = 0; i < 3; i++) {
        service.registerEvent({
          type: SecurityEventType.CSRF_VALIDATION_FAILED,
          timestamp: new Date(now - i * 60000), // Разделени през 1 минута
          ipAddress,
          endpoint: '/api/users',
        });
      }

      // Събитие отпреди 10 минути - не трябва да бъде включено
      service.registerEvent({
        type: SecurityEventType.CSRF_VALIDATION_FAILED,
        timestamp: new Date(now - 10 * 60000),
        ipAddress,
        endpoint: '/api/users',
      });

      // Събитие от друг тип - не трябва да бъде включено
      service.registerEvent({
        type: SecurityEventType.AUTH_FAILED,
        timestamp: new Date(now - 2 * 60000),
        ipAddress,
        endpoint: '/auth/login',
      });

      // Събитие от друг IP - не трябва да бъде включено
      service.registerEvent({
        type: SecurityEventType.CSRF_VALIDATION_FAILED,
        timestamp: new Date(now - 1 * 60000),
        ipAddress: '192.168.1.2',
        endpoint: '/api/users',
      });

      // Търсим CSRF събития от конкретния IP през последните 5 минути
      const events = service.getEventsByTypeAndIp(
        SecurityEventType.CSRF_VALIDATION_FAILED,
        ipAddress,
        5 * 60000, // 5 минути
      );

      expect(events.length).toBe(3);
      events.forEach((event) => {
        expect(event.type).toBe(SecurityEventType.CSRF_VALIDATION_FAILED);
        expect(event.ipAddress).toBe(ipAddress);
      });
    });
  });

  describe('suspicious activity detection', () => {
    it('should detect multiple CSRF failures from same IP', () => {
      const ipAddress = '192.168.1.1';

      // Регистрираме 5 CSRF събития от един и същ IP
      for (let i = 0; i < 5; i++) {
        service.registerEvent({
          type: SecurityEventType.CSRF_VALIDATION_FAILED,
          timestamp: new Date(),
          ipAddress,
          endpoint: '/api/users',
        });
      }

      // Проверяваме дали е регистрирано подозрително събитие
      expect(mockLogger.error).toHaveBeenCalled();
      const errorMock = mockLogger.error as jest.Mock;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const logCallArg = errorMock.mock.calls[0][0];
      expect(logCallArg).toContain('SUSPICIOUS ACTIVITY DETECTED');
      expect(logCallArg).toContain('Multiple CSRF validation failures');
    });

    it('should detect multiple rate limit violations from same IP', () => {
      const ipAddress = '192.168.1.1';

      // Регистрираме 3 RATE_LIMIT събития от един и същ IP
      for (let i = 0; i < 3; i++) {
        service.registerEvent({
          type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          timestamp: new Date(),
          ipAddress,
          endpoint: '/auth/login',
        });
      }

      // Проверяваме дали е регистрирано подозрително събитие
      expect(mockLogger.error).toHaveBeenCalled();
      const errorMock = mockLogger.error as jest.Mock;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const logCallArg = errorMock.mock.calls[0][0];
      expect(logCallArg).toContain('SUSPICIOUS ACTIVITY DETECTED');
      expect(logCallArg).toContain('Repeated rate limit violations');
    });

    it('should detect multiple auth failures from same IP', () => {
      const ipAddress = '192.168.1.1';

      // Регистрираме 5 AUTH_FAILED събития от един и същ IP
      for (let i = 0; i < 5; i++) {
        service.registerEvent({
          type: SecurityEventType.AUTH_FAILED,
          timestamp: new Date(),
          ipAddress,
          endpoint: '/auth/login',
        });
      }

      // Проверяваме дали е регистрирано подозрително събитие
      expect(mockLogger.error).toHaveBeenCalled();
      const errorMock = mockLogger.error as jest.Mock;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const logCallArg = errorMock.mock.calls[0][0];
      expect(logCallArg).toContain('SUSPICIOUS ACTIVITY DETECTED');
      expect(logCallArg).toContain('Repeated authentication failures');
    });
  });
});
