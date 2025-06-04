import { Test, TestingModule } from '@nestjs/testing';
import { IpBlockingService } from './ip-blocking.service';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';

describe('IpBlockingService', () => {
  let service: IpBlockingService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IpBlockingService,
        {
          provide: RedisService,
          useValue: {
            getClient: jest.fn().mockReturnValue({
              multi: jest.fn().mockReturnThis(),
              zadd: jest.fn().mockReturnThis(),
              zrangebyscore: jest.fn().mockReturnThis(),
              zrem: jest.fn().mockReturnThis(),
              expire: jest.fn().mockReturnThis(),
              exec: jest.fn().mockResolvedValue([]),
              incr: jest.fn().mockResolvedValue(1),
              setEx: jest.fn().mockResolvedValue('OK'),
              get: jest.fn().mockResolvedValue(null),
              del: jest.fn().mockResolvedValue(1),
              keys: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'SECURITY_IP_BLOCKING_THRESHOLD') return 10;
              if (key === 'SECURITY_IP_BLOCKING_WINDOW_SECONDS') return 60;
              if (key === 'SECURITY_IP_BLOCKING_BLOCK_DURATION_MINUTES')
                return 5;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<IpBlockingService>(IpBlockingService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordFailedAttempt', () => {
    it('should increment failed attempts counter and set expiry', async () => {
      const ip = '192.168.1.1';
      const mockClient = redisService.getClient();
      (mockClient.incr as jest.Mock).mockResolvedValue(3);
      (mockClient.expire as jest.Mock).mockResolvedValue(true);

      await service.recordFailedAttempt(ip);

      expect(mockClient.incr).toHaveBeenCalledWith(`failed_attempts:${ip}`);
      expect(mockClient.expire).toHaveBeenCalledWith(
        `failed_attempts:${ip}`,
        3600,
      );
    });

    it('should block IP if attempts exceed max threshold', async () => {
      const ip = '192.168.1.1';
      const mockClient = redisService.getClient();
      (mockClient.incr as jest.Mock).mockResolvedValue(6);
      (mockClient.expire as jest.Mock).mockResolvedValue(true);
      (mockClient.setEx as jest.Mock).mockResolvedValue('OK');

      await service.recordFailedAttempt(ip);

      expect(mockClient.setEx).toHaveBeenCalledWith(
        `blocked_ip:${ip}`,
        300,
        'blocked',
      );
    });

    it('should handle Redis errors without throwing', async () => {
      const ip = '192.168.1.1';
      const mockClient = redisService.getClient();
      (mockClient.incr as jest.Mock).mockRejectedValue(
        new Error('Redis error'),
      );

      await expect(service.recordFailedAttempt(ip)).resolves.not.toThrow();
    });
  });

  describe('isBlocked', () => {
    it('should return false if IP is not blocked', async () => {
      const ip = '192.168.1.1';
      const mockClient = redisService.getClient();
      (mockClient.get as jest.Mock).mockResolvedValue(null);

      const result = await service.isBlocked(ip);
      expect(result).toBe(false);
    });

    it('should return true if IP is blocked', async () => {
      const ip = '192.168.1.1';
      const mockClient = redisService.getClient();
      (mockClient.get as jest.Mock).mockResolvedValue('blocked');

      const result = await service.isBlocked(ip);
      expect(result).toBe(true);
    });

    it('should handle Redis errors and return false', async () => {
      const ip = '192.168.1.1';
      const mockClient = redisService.getClient();
      (mockClient.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      const result = await service.isBlocked(ip);
      expect(result).toBe(false);
    });
  });

  describe('blockIp', () => {
    it('should block an IP for the configured duration', async () => {
      const ip = '192.168.1.1';
      const mockClient = redisService.getClient();
      (mockClient.setEx as jest.Mock).mockResolvedValue('OK');

      await service.blockIp(ip);

      expect(mockClient.setEx).toHaveBeenCalledWith(
        `blocked_ip:${ip}`,
        300,
        'blocked',
      );
    });

    it('should handle Redis errors without throwing', async () => {
      const ip = '192.168.1.1';
      const mockClient = redisService.getClient();
      (mockClient.setEx as jest.Mock).mockRejectedValue(
        new Error('Redis error'),
      );

      await expect(service.blockIp(ip)).resolves.not.toThrow();
    });
  });

  describe('unblockIp', () => {
    it('should unblock an IP', async () => {
      const ip = '192.168.1.1';
      const mockClient = redisService.getClient();
      (mockClient.del as jest.Mock).mockResolvedValue(1);

      await service.unblockIp(ip);

      expect(mockClient.del).toHaveBeenCalledWith(`blocked_ip:${ip}`);
    });

    it('should handle Redis errors without throwing', async () => {
      const ip = '192.168.1.1';
      const mockClient = redisService.getClient();
      (mockClient.del as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(service.unblockIp(ip)).resolves.not.toThrow();
    });
  });
});
