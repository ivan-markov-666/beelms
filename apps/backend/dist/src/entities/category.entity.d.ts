import { BaseEntity } from './base.entity';
import { Course } from './course.entity';
export declare class Category extends BaseEntity {
    name: string;
    courses: Course[];
}
