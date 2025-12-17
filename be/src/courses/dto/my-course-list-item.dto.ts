import { CourseSummaryDto } from './course-summary.dto';

export class MyCourseListItemDto extends CourseSummaryDto {
  enrollmentStatus: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number | null;
  enrolledAt: string | null;
}
