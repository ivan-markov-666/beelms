import { CourseSummaryDto } from './course-summary.dto';
import { CourseModuleItemDto } from './course-module-item.dto';

export class CourseDetailDto extends CourseSummaryDto {
  curriculum: CourseModuleItemDto[];
}
