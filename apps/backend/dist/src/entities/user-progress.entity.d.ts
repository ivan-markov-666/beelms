import { BaseEntity as TypeOrmBaseEntity } from 'typeorm';
import { User } from './user.entity';
import { Topic } from './topic.entity';
export declare class UserProgress extends TypeOrmBaseEntity {
    userId: string;
    topicId: string;
    completedAt: Date;
    user: User;
    topic: Topic;
}
