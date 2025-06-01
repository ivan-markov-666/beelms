import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private configService: ConfigService,
  ) {}

  private handleError(message: string, error: any) {
    this.logger.error(
      `${message}: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error.stack : undefined,
    );
  }

  @Get()
  @SkipThrottle() // Skip rate limiting for health check
  @HealthCheck()
  @ApiOperation({ summary: 'Check service health' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  @ApiResponse({
    status: 503,
    description: 'Service is not healthy',
  })
  check() {
    return this.health.check([
      // Database connection check
      async () => {
        try {
          return await this.db.pingCheck('database');
        } catch (error) {
          this.handleError('Database health check failed', error);
          throw new Error('Database health check failed');
        }
      },

      // Memory usage check - fail if heap usage is > 250MB
      async () => {
        try {
          return await this.memory.checkHeap('memory_heap', 250 * 1024 * 1024);
        } catch (error) {
          this.handleError('Memory health check failed', error);
          throw new Error('Memory health check failed');
        }
      },

      // Disk space check - fail if disk usage is > 95%
      async () => {
        try {
          return await this.disk.checkStorage('disk', {
            path: '/',
            thresholdPercent: 95,
          });
        } catch (error) {
          this.handleError('Disk health check failed', error);
          throw new Error('Disk health check failed');
        }
      },
    ]);
  }
}
