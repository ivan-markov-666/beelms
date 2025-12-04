import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(() => {
    service = new TasksService();
  });

  it('returns a task by id when it exists', () => {
    const task = service.getTaskById('string-hello-world');

    expect(task).toBeDefined();
    expect(task?.id).toBe('string-hello-world');
  });

  it('returns undefined for unknown task id', () => {
    const task = service.getTaskById('unknown-task');

    expect(task).toBeUndefined();
  });

  it('evaluateSolution returns passed=true for correct solution', () => {
    const result = service.evaluateSolution(
      'string-hello-world',
      'hello world',
    );

    expect(result.taskId).toBe('string-hello-world');
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1);
  });

  it('evaluateSolution returns passed=false for incorrect solution', () => {
    const result = service.evaluateSolution(
      'string-hello-world',
      'wrong answer',
    );

    expect(result.taskId).toBe('string-hello-world');
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });

  it('evaluateSolution throws NotFoundException for unknown task id', () => {
    expect(() => service.evaluateSolution('unknown-task', 'anything')).toThrow(
      NotFoundException,
    );
  });
});
