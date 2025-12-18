import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Course } from '../courses/course.entity';

const SeedDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'beelms',
  password: process.env.DB_PASSWORD ?? 'beelms',
  database: process.env.DB_NAME ?? 'beelms',
  entities: [Course],
  synchronize: false,
});

async function seedCourses() {
  await SeedDataSource.initialize();

  const courseRepo = SeedDataSource.getRepository(Course);

  const existing = await courseRepo.count();
  if (existing === 0) {
    const course = courseRepo.create({
      title: 'QA Fundamentals (Demo Course)',
      description:
        'Демо курс за WS-3. Използва се за валидиране на Course Catalog + Course Detail през FE/API/DB.',
      language: 'bg',
      status: 'active',
      isPaid: false,
    });

    await courseRepo.save(course);
  }

  await SeedDataSource.destroy();
}

seedCourses()
  .then(() => {
    console.log('Courses seed completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Courses seed failed', err);
    process.exit(1);
  });
