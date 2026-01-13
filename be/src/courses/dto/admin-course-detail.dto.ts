import { AdminCourseSummaryDto } from './admin-course-summary.dto';
import { CourseModuleItemDto } from './course-module-item.dto';

export class AdminCourseDetailDto extends AdminCourseSummaryDto {
  curriculum: CourseModuleItemDto[];
}
