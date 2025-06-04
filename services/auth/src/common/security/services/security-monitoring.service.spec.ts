import { Test, TestingModule } from '@nestjs/testing';
import {
  SecurityMonitoringService,
  SecurityEventType,
} from './security-monitoring.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('SecurityMonitoringService', () => {
  let service: SecurityMonitoringService;
  let mockLogger: Record<string, jest.Mock>;

  const mockConfigService = {
    get: jest
      .fn()
      .mockImplementation(
        (key: string, defaultValue?: unknown): number | string | undefined => {
          if (key === 'MAX_SECURITY_EVENTS_IN_MEMORY') return 10;
          if (key === 'ALERT_THRESHOLD_LOGIN_FAILURE') return 3;
          if (key === 'ALERT_THRESHOLD_IP_BLOCKED') return 2;
          return defaultValue as string | number | undefined;
        },
      ),
  };

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityMonitoringService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SecurityMonitoringService>(SecurityMonitoringService);

    // Подменяме оригиналния logger с нашия mock
    // Use a type-safe approach for mocking the Logger
    const loggerClass = Logger as unknown as {
      getInstance: () => Logger;
    };
    jest
      .spyOn(loggerClass, 'getInstance')
      .mockImplementation(() => mockLogger as unknown as Logger);

    jest.spyOn(Logger.prototype, 'error').mockImplementation(mockLogger.error);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(mockLogger.warn);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(mockLogger.log);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(mockLogger.debug);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordEvent', () => {
    it('should add an event to the events array', () => {
      const event = {
        type: SecurityEventType.LOGIN_FAILURE,
        ip: '192.168.1.1',
        userId: 'user123',
        severity: 'medium' as const,
      };

      service.recordEvent(event);

      const events = service.getRecentEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(SecurityEventType.LOGIN_FAILURE);
      expect(events[0].ip).toBe('192.168.1.1');
      expect(events[0].userId).toBe('user123');
      expect(events[0].timestamp).toBeInstanceOf(Date);
    });

    it('should log critical events as errors', () => {
      const event = {
        type: SecurityEventType.SQL_INJECTION_ATTEMPT,
        ip: '192.168.1.1',
        severity: 'critical' as const,
      };

      service.recordEvent(event);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should log high severity events as warnings', () => {
      const event = {
        type: SecurityEventType.XSS_ATTEMPT,
        ip: '192.168.1.1',
        severity: 'high' as const,
      };

      service.recordEvent(event);

      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should limit the number of events in memory', () => {
      // Добавяме максималния брой + 1 събития
      for (let i = 0; i < 11; i++) {
        service.recordEvent({
          type: SecurityEventType.LOGIN_FAILURE,
          ip: `192.168.1.${i}`,
          severity: 'low' as const,
        });
      }

      const events = service.getRecentEvents();
      expect(events.length).toBe(10); // Трябва да запази само 10 (MAX_SECURITY_EVENTS_IN_MEMORY)
      expect(events[0].ip).toBe('192.168.1.10'); // Последно добавеното трябва да е първо (unshift)
    });
  });

  describe('getEventStatistics', () => {
    beforeEach(() => {
      // Добавяме тестови събития
      service.recordEvent({
        type: SecurityEventType.LOGIN_SUCCESS,
        ip: '192.168.1.1',
        severity: 'low' as const,
      });

      service.recordEvent({
        type: SecurityEventType.LOGIN_FAILURE,
        ip: '192.168.1.2',
        severity: 'medium' as const,
      });

      service.recordEvent({
        type: SecurityEventType.LOGIN_FAILURE,
        ip: '192.168.1.3',
        severity: 'medium' as const,
      });

      service.recordEvent({
        type: SecurityEventType.XSS_ATTEMPT,
        ip: '192.168.1.4',
        severity: 'high' as const,
      });
    });

    it('should return correct statistics for all events', () => {
      const stats = service.getEventStatistics();

      expect(stats[SecurityEventType.LOGIN_SUCCESS]).toBe(1);
      expect(stats[SecurityEventType.LOGIN_FAILURE]).toBe(2);
      expect(stats[SecurityEventType.XSS_ATTEMPT]).toBe(1);
    });

    it('should filter statistics by time range', () => {
      // Добавяме събитие с по-стара дата
      const oldEvent = {
        type: SecurityEventType.LOGIN_SUCCESS,
        ip: '192.168.1.5',
        severity: 'low' as const,
        timestamp: new Date('2023-01-01'),
      };

      // Хакваме метода recordEvent за да можем да вмъкнем събитие с конкретна дата
      const events = service.getRecentEvents();
      events.push(oldEvent);

      // Задаваме времеви диапазон, който изключва старото събитие
      const now = new Date();
      const timeRange = {
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000), // преди 1 ден
        end: now,
      };

      const stats = service.getEventStatistics(timeRange);

      // Не трябва да включва старото събитие, само новите 4
      expect(stats[SecurityEventType.LOGIN_SUCCESS]).toBe(1);
      expect(stats[SecurityEventType.LOGIN_FAILURE]).toBe(2);
      expect(stats[SecurityEventType.XSS_ATTEMPT]).toBe(1);
    });
  });
});
