import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import {
  AdminCreateTaskDto,
  AdminTaskDto,
  AdminUpdateTaskDto,
} from './dto/admin-task.dto';
import { AdminTasksService } from './admin-tasks.service';

@Controller('admin/tasks')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminTasksController {
  constructor(private readonly adminTasksService: AdminTasksService) {}

  @Get()
  list(): Promise<AdminTaskDto[]> {
    return this.adminTasksService.list();
  }

  @Post()
  create(@Body() dto: AdminCreateTaskDto): Promise<AdminTaskDto> {
    return this.adminTasksService.create(dto);
  }

  @Get(':taskId')
  get(@Param('taskId') taskId: string): Promise<AdminTaskDto> {
    return this.adminTasksService.get(taskId);
  }

  @Patch(':taskId')
  update(
    @Param('taskId') taskId: string,
    @Body() dto: AdminUpdateTaskDto,
  ): Promise<AdminTaskDto> {
    return this.adminTasksService.update(taskId, dto);
  }

  @Delete(':taskId')
  @HttpCode(204)
  async delete(@Param('taskId') taskId: string): Promise<void> {
    await this.adminTasksService.delete(taskId);
  }
}
