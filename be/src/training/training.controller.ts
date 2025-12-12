import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { TrainingService } from './training.service';
import { RateLimit } from '../security/rate-limit/rate-limit.decorator';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('ping')
  ping() {
    return this.trainingService.ping();
  }

  @Post('echo')
  @RateLimit({ limit: 60, windowSeconds: 60, key: 'ip' })
  @HttpCode(200)
  echo(@Body() body: unknown): unknown {
    return this.trainingService.echo(body);
  }
}
