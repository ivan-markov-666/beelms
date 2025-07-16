import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Category } from '../../packages/shared-types/src/entities/category.entity';
import { Topic } from '../../packages/shared-types/src/entities/topic.entity';
import { TopicContent } from '../../packages/shared-types/src/entities/topic-content.entity';
import { User } from '../../packages/shared-types/src/entities/user.entity';
import { Test } from '../../packages/shared-types/src/entities/test.entity';
import { Question } from '../../packages/shared-types/src/entities/question.entity';
import { QuestionOption } from '../../packages/shared-types/src/entities/question-option.entity';

export async function createInMemoryDataSource(): Promise<DataSource> {
  const ds = new DataSource({
    type: 'sqljs',
    // SQL.js keeps DB in-memory automatically
    location: ':memory:',
    entities: [Category, Topic, TopicContent, User, Test, Question, QuestionOption],
    synchronize: true,
    dropSchema: true,
    logging: false,
  });
  await ds.initialize();
  return ds;
}
