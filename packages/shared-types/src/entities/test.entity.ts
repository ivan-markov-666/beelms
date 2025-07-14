// Placeholder Test entity until Part 3 implementation
import { Entity, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { Topic } from './topic.entity';

@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Topic, (topic) => topic.test)
  topic!: Topic;
}
