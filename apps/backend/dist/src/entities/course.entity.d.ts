import { BaseEntity } from './base.entity';
import { Category } from './category.entity';
import { Topic } from './topic.entity';
import { UserCourseProgress } from './user-course-progress.entity';
export declare class Course extends BaseEntity {
    title: string;
    description: string;
    category: Category;
    topics: Topic[];
    courseProgressRecords: UserCourseProgress[];
}
