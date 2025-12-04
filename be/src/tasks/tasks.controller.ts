import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  HttpCode,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskDto } from './dto/task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { TaskResultDto } from './dto/task-result.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get(':id')
  getTask(@Param('id') id: string): TaskDto {
    const task = this.tasksService.getTaskById(id);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      metadata: {
        inputExample: task.inputExample,
        expectedOutputExample: task.expectedOutputExample,
      },
    };
  }

  @Post(':id/submit')
  @HttpCode(200)
  submitTask(
    @Param('id') id: string,
    @Body() body: SubmitTaskDto,
  ): TaskResultDto {
    return this.tasksService.evaluateSolution(id, body.solution);
  }
}
