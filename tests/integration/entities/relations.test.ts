import { DataSource } from 'typeorm';
import { createInMemoryDataSource } from '../../helpers/create-in-memory-datasource';
import { Category } from '../../../packages/shared-types/src/entities/category.entity';
import { Topic } from '../../../packages/shared-types/src/entities/topic.entity';
import { TopicContent } from '../../../packages/shared-types/src/entities/topic-content.entity';
import { User } from '../../../packages/shared-types/src/entities/user.entity';

describe('Entity relations & DB constraints', () => {
  let ds: DataSource;

  beforeAll(async () => {
    ds = await createInMemoryDataSource();
  });

  afterAll(async () => {
    await ds.destroy();
  });

  it('unique (categoryId, topicNumber) constraint works', async () => {
    const categoryRepo = ds.getRepository(Category);
    const topicRepo = ds.getRepository(Topic);

    const cat = categoryRepo.create({
      name: 'Cat',
      colorCode: '#ff0000',
      iconName: 'code',
      sortOrder: 1,
    });
    await categoryRepo.save(cat);

    const topic1 = topicRepo.create({
      categoryId: cat.id,
      topicNumber: 1,
      name: 'T1',
      slug: 't1',
      estimatedReadingTime: 2,
    });
    await topicRepo.save(topic1);

    const topic2 = topicRepo.create({
      categoryId: cat.id,
      topicNumber: 1, // duplicate
      name: 'T2',
      slug: 't2',
      estimatedReadingTime: 2,
    });
    await expect(topicRepo.save(topic2)).rejects.toThrow();
  });

  it('cascade delete Topic -> TopicContent', async () => {
    const topicRepo = ds.getRepository(Topic);
    const contentRepo = ds.getRepository(TopicContent);

    const catRepo = ds.getRepository(Category);
    const cat = await catRepo.save(
      catRepo.create({
        name: 'Cat2',
        colorCode: '#00ff00',
        iconName: 'book',
        sortOrder: 1,
      })
    );

    const topic = topicRepo.create({
      categoryId: cat.id,
      topicNumber: 2,
      name: 'Cascade',
      slug: 'cascade',
      estimatedReadingTime: 3,
      isPublished: true,
    });
    await topicRepo.save(topic);

    await contentRepo.save(
      contentRepo.create({
        topicId: topic.id,
        languageCode: 'bg',
        content: 'Съдържание',
      })
    );

    expect(await contentRepo.count()).toBe(1);
    await topicRepo.delete({ id: topic.id });
    expect(await contentRepo.count()).toBe(0);
  });

  it('User.createdTopics relation contains authored topics', async () => {
    const userRepo = ds.getRepository(User);
    const catRepo = ds.getRepository(Category);
    const topicRepo = ds.getRepository(Topic);

    const user = await userRepo.save(
      userRepo.create({
        email: 'author@example.com',
        username: 'author',
        passwordHash: 'hash',
      })
    );

    const cat = await catRepo.save(
      catRepo.create({
        name: 'Cat3',
        colorCode: '#0000ff',
        iconName: 'note',
        sortOrder: 1,
      })
    );

    const topic = topicRepo.create({
      categoryId: cat.id,
      topicNumber: 3,
      name: 'Authored',
      slug: 'authored',
      estimatedReadingTime: 2,
      createdById: user.id,
    });
    await topicRepo.save(topic);

    const loaded = await userRepo.findOne({ where: { id: user.id }, relations: { createdTopics: true } });
    expect(loaded?.createdTopics.length).toBe(1);
    expect(loaded?.createdTopics[0].slug).toBe('authored');
  });

  it('default values isActive=true & isPublished=false', async () => {
    const catRepo = ds.getRepository(Category);
    const topicRepo = ds.getRepository(Topic);

    const cat = await catRepo.save(
      catRepo.create({ name: 'Defaults', colorCode: '#aaaaaa', iconName: 'tag', sortOrder: 1 })
    );
    expect(cat.isActive).toBe(true);

    const topic = await topicRepo.save(
      topicRepo.create({
        categoryId: cat.id,
        topicNumber: 4,
        name: 'defaults top',
        slug: 'defaults-top',
        estimatedReadingTime: 2,
      })
    );
    expect(topic.isPublished).toBe(false);
  });
});
