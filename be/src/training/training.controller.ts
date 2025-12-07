import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { TrainingService } from './training.service';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('ping')
  ping() {
    return this.trainingService.ping();
  }

  @Post('echo')
  @HttpCode(200)
  echo(@Body() body: unknown): unknown {
    return this.trainingService.echo(body);
  }
}
