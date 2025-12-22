import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Task } from './task.entity';
import { AdminTasksService } from './admin-tasks.service';
import { AdminTasksController } from './admin-tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task]), AuthModule],
  providers: [AdminTasksService],
  controllers: [AdminTasksController],
  exports: [TypeOrmModule],
})
export class TasksModule {}
