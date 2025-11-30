import { Module } from '@nestjs/common';
import { TrainingModule } from './training/training.module';

@Module({
  imports: [TrainingModule],
})
export class AppModule {}
