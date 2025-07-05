import { BaseEntity } from './base.entity';
import { Topic } from './topic.entity';
import { Question } from './question.entity';
export declare class Test extends BaseEntity {
    title: string;
    topic: Topic;
    questions: Question[];
}
