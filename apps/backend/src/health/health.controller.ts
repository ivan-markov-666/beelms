import {
  Controller,
  Get,
  Head,
  Res,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus'
import type { Response } from 'express'

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @Head()
  @HealthCheck()
  async check(@Res({ passthrough: true }) res: Response) {
    // Prevent caching so that external load-balancers always hit the application.
    res.setHeader('Cache-Control', 'no-store')

    return this.health.check([
      async () => this.db.pingCheck('database'),
    ])
  }
}
