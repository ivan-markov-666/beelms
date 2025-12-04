import { Body, Controller, Get, Post } from '@nestjs/common';
import { TrainingService } from './training.service';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('ping')
  ping() {
    return this.trainingService.ping();
  }

  @Post('echo')
  echo(@Body() body: unknown) {
    return this.trainingService.echo(body);
  }
}
