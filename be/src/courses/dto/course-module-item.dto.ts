export class CourseModuleItemDto {
  id: string;
  itemType: 'wiki' | 'task' | 'quiz';
  title: string;
  order: number;
  wikiSlug: string | null;
  taskId: string | null;
  quizId: string | null;
}
