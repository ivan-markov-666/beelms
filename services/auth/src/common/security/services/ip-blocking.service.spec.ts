import { Test, TestingModule } from '@nestjs/testing';
import { IpBlockingService } from './ip-blocking.service';
import { RedisService } from '../../redis/redis.service';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('IpBlockingService', () => {
  let service: IpBlockingService;
  let redisService: RedisService;
  let configService: ConfigService;

  const mockRedisService = {
    incr: jest.fn(),
    expire: jest.fn(),
    exists: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IpBlockingService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IpBlockingService>(IpBlockingService);
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);

    // Конфигуриране на моковете за типични стойности
    mockConfigService.get.mockImplementation((key, defaultValue) => {
      if (key === 'MAX_FAILED_ATTEMPTS') return 5;
      if (key === 'IP_BLOCK_DURATION_SECONDS') return 300;
      if (key === 'FAILED_ATTEMPT_EXPIRY_SECONDS') return 3600;
      return defaultValue;
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordFailedAttempt', () => {
    it('should increment failed attempts counter and set expiry', async () => {
      const ip = '192.168.1.1';
      mockRedisService.incr.mockResolvedValue(3);
      mockRedisService.expire.mockResolvedValue(true);

      await service.recordFailedAttempt(ip);

      expect(mockRedisService.incr).toHaveBeenCalledWith(
        `failed_attempts:${ip}`,
      );
      expect(mockRedisService.expire).toHaveBeenCalledWith(
        `failed_attempts:${ip}`,
        3600,
      );
    });

    it('should block IP if attempts exceed max threshold', async () => {
      const ip = '192.168.1.1';
      mockRedisService.incr.mockResolvedValue(6); // Над прага от 5
      mockRedisService.expire.mockResolvedValue(true);
      mockRedisService.set.mockResolvedValue('OK');

      await service.recordFailedAttempt(ip);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        `blocked_ip:${ip}`,
        'blocked',
        300,
      );
    });

    it('should handle Redis errors without throwing', async () => {
      const ip = '192.168.1.1';
      mockRedisService.incr.mockRejectedValue(new Error('Redis error'));

      await expect(service.recordFailedAttempt(ip)).resolves.not.toThrow();
    });
  });

  describe('isBlocked', () => {
    it('should return true if IP is blocked', async () => {
      const ip = '192.168.1.1';
      mockRedisService.exists.mockResolvedValue(1);

      const result = await service.isBlocked(ip);

      expect(result).toBe(true);
      expect(mockRedisService.exists).toHaveBeenCalledWith(`blocked_ip:${ip}`);
    });

    it('should return false if IP is not blocked', async () => {
      const ip = '192.168.1.1';
      mockRedisService.exists.mockResolvedValue(0);

      const result = await service.isBlocked(ip);

      expect(result).toBe(false);
    });

    it('should handle Redis errors and return false', async () => {
      const ip = '192.168.1.1';
      mockRedisService.exists.mockRejectedValue(new Error('Redis error'));

      const result = await service.isBlocked(ip);

      expect(result).toBe(false);
    });
  });

  describe('blockIp', () => {
    it('should block an IP for the configured duration', async () => {
      const ip = '192.168.1.1';
      mockRedisService.set.mockResolvedValue('OK');

      await service.blockIp(ip);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        `blocked_ip:${ip}`,
        'blocked',
        300,
      );
    });

    it('should handle Redis errors without throwing', async () => {
      const ip = '192.168.1.1';
      mockRedisService.set.mockRejectedValue(new Error('Redis error'));

      await expect(service.blockIp(ip)).resolves.not.toThrow();
    });
  });

  describe('unblockIp', () => {
    it('should unblock an IP', async () => {
      const ip = '192.168.1.1';
      mockRedisService.del.mockResolvedValue(1);

      await service.unblockIp(ip);

      expect(mockRedisService.del).toHaveBeenCalledWith(`blocked_ip:${ip}`);
    });

    it('should handle Redis errors without throwing', async () => {
      const ip = '192.168.1.1';
      mockRedisService.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.unblockIp(ip)).resolves.not.toThrow();
    });
  });
});
