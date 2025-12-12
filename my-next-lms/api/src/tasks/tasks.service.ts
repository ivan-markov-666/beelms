import { Injectable, NotFoundException } from '@nestjs/common';

export type TaskType = 'string_match';

export type TaskDefinition = {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  expectedAnswer: string;
  inputExample?: string;
  expectedOutputExample?: string;
};

export type TaskResult = {
  taskId: string;
  passed: boolean;
  score: number;
  feedback: string;
};

@Injectable()
export class TasksService {
  private readonly tasks: TaskDefinition[] = [
    {
      id: 'string-hello-world',
      title: 'Hello world string match',
      description:
        'Verify that the solution exactly matches the expected "hello world" string (case-insensitive, trimmed).',
      type: 'string_match',
      expectedAnswer: 'hello world',
      inputExample: 'hello world',
      expectedOutputExample: 'hello world',
    },
  ];

  getTaskById(id: string): TaskDefinition | undefined {
    return this.tasks.find((task) => task.id === id);
  }

  evaluateSolution(taskId: string, solution: string): TaskResult {
    const task = this.getTaskById(taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const expected = task.expectedAnswer.trim().toLowerCase();
    const actual = solution.trim().toLowerCase();

    const passed = actual === expected;
    const score = passed ? 1 : 0;
    const feedback = passed
      ? 'Решението е коректно.'
      : 'Решението не съвпада с очаквания отговор.';

    return {
      taskId: task.id,
      passed,
      score,
      feedback,
    };
  }
}
