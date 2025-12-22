import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import {
  AdminCreateTaskDto,
  AdminTaskDto,
  AdminUpdateTaskDto,
  TaskStatus,
} from './dto/admin-task.dto';

@Injectable()
export class AdminTasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async list(): Promise<AdminTaskDto[]> {
    const tasks = await this.taskRepo.find({ order: { createdAt: 'DESC' } });
    return tasks.map((t) => this.toDto(t));
  }

  async create(dto: AdminCreateTaskDto): Promise<AdminTaskDto> {
    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description,
      language: dto.language ?? 'bg',
      status: dto.status ?? 'draft',
    });
    const saved = await this.taskRepo.save(task);
    return this.toDto(saved);
  }

  async get(taskId: string): Promise<AdminTaskDto> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return this.toDto(task);
  }

  async update(taskId: string, dto: AdminUpdateTaskDto): Promise<AdminTaskDto> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.language !== undefined) task.language = dto.language;
    if (dto.status !== undefined) task.status = dto.status;

    const saved = await this.taskRepo.save(task);
    return this.toDto(saved);
  }

  async delete(taskId: string): Promise<void> {
    const res = await this.taskRepo.delete({ id: taskId });
    if (!res.affected) {
      throw new NotFoundException('Task not found');
    }
  }

  private toDto(task: Task): AdminTaskDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      language: task.language,
      status: task.status as TaskStatus,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}
