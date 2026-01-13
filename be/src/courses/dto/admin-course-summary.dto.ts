import { CourseSummaryDto } from './course-summary.dto';

export class AdminCourseSummaryDto extends CourseSummaryDto {
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}
