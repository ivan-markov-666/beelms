export class TaskDto {
  id!: string;
  title!: string;
  description!: string;
  type!: string;
  // Additional, task-specific metadata. For WS-7 we use it for examples.
  metadata?: Record<string, unknown>;
}
