import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Course } from '../courses/course.entity';
import { CourseCategory } from '../courses/course-category.entity';
import { CourseCurriculumItem } from '../courses/course-curriculum-item.entity';
import { WikiArticle } from '../wiki/wiki-article.entity';
import { WikiArticleVersion } from '../wiki/wiki-article-version.entity';
import { Quiz } from '../assessments/quiz.entity';
import { QuizQuestion } from '../assessments/quiz-question.entity';
import { QuizOption } from '../assessments/quiz-option.entity';

const SeedDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'beelms',
  password: process.env.DB_PASSWORD ?? 'beelms',
  database: process.env.DB_NAME ?? 'beelms',
  entities: [
    Course,
    CourseCategory,
    CourseCurriculumItem,
    WikiArticle,
    WikiArticleVersion,
    Quiz,
    QuizQuestion,
    QuizOption,
  ],
  synchronize: false,
});

async function seedCourses() {
  await SeedDataSource.initialize();

  const courseRepo = SeedDataSource.getRepository(Course);
  const categoryRepo = SeedDataSource.getRepository(CourseCategory);
  const curriculumRepo = SeedDataSource.getRepository(CourseCurriculumItem);
  const wikiArticleRepo = SeedDataSource.getRepository(WikiArticle);
  const wikiVersionRepo = SeedDataSource.getRepository(WikiArticleVersion);
  const quizRepo = SeedDataSource.getRepository(Quiz);
  const questionRepo = SeedDataSource.getRepository(QuizQuestion);
  const optionRepo = SeedDataSource.getRepository(QuizOption);

  async function ensureCategory(slug: string, title: string) {
    const normalizedSlug = slug.trim().toLowerCase();
    let category = await categoryRepo.findOne({
      where: { slug: normalizedSlug },
    });

    if (!category) {
      category = categoryRepo.create({
        slug: normalizedSlug,
        title,
        order: 999,
        active: true,
      });
      category = await categoryRepo.save(category);
    } else {
      let changed = false;
      if (!category.active) {
        category.active = true;
        changed = true;
      }
      if ((category.title ?? '').trim() !== title.trim()) {
        category.title = title;
        changed = true;
      }
      if (changed) {
        category = await categoryRepo.save(category);
      }
    }

    return category;
  }

  async function ensureArticleWithVersion(
    slug: string,
    language: string,
    title: string,
    content: string,
  ) {
    const normalizedSlug = slug.trim().toLowerCase();
    let article = await wikiArticleRepo.findOne({
      where: { slug: normalizedSlug },
    });
    if (!article) {
      article = wikiArticleRepo.create({
        slug: normalizedSlug,
        status: 'active',
        visibility: 'course_only',
        tags: ['demo', 'course'],
        createdByUserId: null,
      });
      article = await wikiArticleRepo.save(article);
    } else {
      let changed = false;
      if (article.status !== 'active') {
        article.status = 'active';
        changed = true;
      }
      if (article.visibility !== 'course_only') {
        article.visibility = 'course_only';
        changed = true;
      }
      if (changed) {
        article = await wikiArticleRepo.save(article);
      }
    }

    const existingVersion = await wikiVersionRepo.findOne({
      where: {
        article: { id: article.id },
        language,
        versionNumber: 1,
      },
      relations: ['article'],
    });

    if (!existingVersion) {
      await wikiVersionRepo.save(
        wikiVersionRepo.create({
          article,
          language,
          title,
          subtitle: null,
          content,
          versionNumber: 1,
          createdByUserId: null,
          changeSummary: 'Demo course seed',
          isPublished: true,
        }),
      );
    }

    return article;
  }

  async function ensureQuiz() {
    const quizTitle = 'QA Fundamentals Demo Quiz';
    let quiz = await quizRepo.findOne({ where: { title: quizTitle } });

    if (!quiz) {
      quiz = quizRepo.create({
        title: quizTitle,
        description: 'Demo quiz за тестване на progress механизма.',
        language: 'bg',
        status: 'active',
        passingScore: 2,
      });
      quiz = await quizRepo.save(quiz);
    } else {
      let changed = false;
      if (quiz.status !== 'active') {
        quiz.status = 'active';
        changed = true;
      }
      if (quiz.language !== 'bg') {
        quiz.language = 'bg';
        changed = true;
      }
      if ((quiz.passingScore ?? null) !== 2) {
        quiz.passingScore = 2;
        changed = true;
      }
      if (changed) {
        quiz = await quizRepo.save(quiz);
      }
    }

    const questions = [
      {
        order: 1,
        text: 'Какво означава QA? (избери най-точния отговор)',
        options: [
          { text: 'Quality Assurance', isCorrect: true },
          { text: 'Quick Analysis', isCorrect: false },
          { text: 'Quantum Architecture', isCorrect: false },
          { text: 'Qualified Agreement', isCorrect: false },
        ],
      },
      {
        order: 2,
        text: 'Кой тип тестове обикновено валидират интеграция между модули?',
        options: [
          { text: 'Unit tests', isCorrect: false },
          { text: 'Integration tests', isCorrect: true },
          { text: 'Static analysis', isCorrect: false },
          { text: 'Lint rules', isCorrect: false },
        ],
      },
      {
        order: 3,
        text: 'Коя е основната цел на регресионните тестове?',
        options: [
          {
            text: 'Да докажат, че новата функционалност работи',
            isCorrect: false,
          },
          { text: 'Да открият security уязвимости', isCorrect: false },
          {
            text: 'Да проверят, че промени не са счупили вече работеща функционалност',
            isCorrect: true,
          },
          { text: 'Да оптимизират performance', isCorrect: false },
        ],
      },
    ];

    for (const q of questions) {
      let question = await questionRepo.findOne({
        where: { quizId: quiz.id, order: q.order },
      });
      if (!question) {
        question = await questionRepo.save(
          questionRepo.create({
            quizId: quiz.id,
            text: q.text,
            order: q.order,
          }),
        );
      }

      for (let i = 0; i < q.options.length; i += 1) {
        const opt = q.options[i];
        const optionIndex = i;
        const existingOpt = await optionRepo.findOne({
          where: { questionId: question.id, optionIndex },
        });
        if (existingOpt) continue;

        await optionRepo.save(
          optionRepo.create({
            questionId: question.id,
            optionIndex,
            text: opt.text,
            isCorrect: opt.isCorrect,
          }),
        );
      }
    }

    return quiz;
  }

  const demoTitle = 'QA Fundamentals (Demo Course)';
  const existingDemo = await courseRepo.findOne({
    where: { title: demoTitle },
  });

  const demoCategory = await ensureCategory('demo', 'Demo');

  const course = existingDemo
    ? existingDemo
    : courseRepo.create({
        title: demoTitle,
        description:
          'Демо lorem ipsum курс с curriculum + quiz за тестване на progress механизма.',
        language: 'bg',
        status: 'active',
        isPaid: false,
      });

  if (course.status !== 'active') {
    course.status = 'active';
  }
  if (course.isPaid) {
    course.isPaid = false;
  }
  if ((course.language ?? '').trim() !== 'bg') {
    course.language = 'bg';
  }
  if ((course.categoryId ?? null) !== demoCategory.id) {
    course.categoryId = demoCategory.id;
  }

  const savedCourse = await courseRepo.save(course);

  const lessonArticles = [
    {
      slug: 'demo-qa-topic-1-overview',
      title: 'Тема 1: Въведение в QA',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Това е уводна тема към QA.\n\n' +
        'Suspendisse potenti. Integer in elit at arcu varius pretium.',
    },
    {
      slug: 'demo-qa-topic-1-lesson-1',
      title: 'Урок 1.1: Роли и отговорности',
      content:
        'Lorem ipsum dolor sit amet. QA инженерът подпомага екипа да доставя качество.\n\n' +
        'Curabitur sit amet massa sed lorem volutpat facilisis.',
    },
    {
      slug: 'demo-qa-topic-1-lesson-2',
      title: 'Урок 1.2: Тестова документация',
      content:
        'Lorem ipsum dolor sit amet. Тест кейсове, чеклисти и тест планове.\n\n' +
        'Sed ut perspiciatis unde omnis iste natus error sit voluptatem.',
    },
    {
      slug: 'demo-qa-topic-2-overview',
      title: 'Тема 2: Видове тестове',
      content:
        'Lorem ipsum dolor sit amet. Unit, Integration, E2E и Regression тестове.\n\n' +
        'Nunc dignissim, orci in facilisis cursus, tortor orci placerat velit.',
    },
    {
      slug: 'demo-qa-topic-2-lesson-1',
      title: 'Урок 2.1: Unit тестове',
      content:
        'Lorem ipsum dolor sit amet. Unit тестовете проверяват малки части код.\n\n' +
        'Vivamus elementum, nisi at aliquet euismod, sapien purus tincidunt est.',
    },
    {
      slug: 'demo-qa-topic-2-lesson-2',
      title: 'Урок 2.2: Integration тестове',
      content:
        'Lorem ipsum dolor sit amet. Integration тестове валидират взаимодействия.\n\n' +
        'Donec cursus, arcu a varius laoreet, purus massa laoreet nisl.',
    },
    {
      slug: 'demo-qa-topic-3-overview',
      title: 'Тема 3: Debugging и репортване',
      content:
        'Lorem ipsum dolor sit amet. Как да репортнеш bug ясно и възпроизводимо.\n\n' +
        'Etiam ac mi ac justo volutpat dictum ut a mauris.',
    },
    {
      slug: 'demo-qa-topic-3-lesson-1',
      title: 'Урок 3.1: Bug report структура',
      content:
        'Lorem ipsum dolor sit amet. Steps to reproduce, expected/actual резултат.\n\n' +
        'Morbi at semper nulla. Quisque interdum, urna in dignissim facilisis.',
    },
    {
      slug: 'demo-qa-topic-3-lesson-2',
      title: 'Урок 3.2: Приоритизация',
      content:
        'Lorem ipsum dolor sit amet. Severity vs Priority.\n\n' +
        'Aenean interdum, magna non commodo laoreet, justo velit hendrerit erat.',
    },
  ];

  for (const a of lessonArticles) {
    await ensureArticleWithVersion(a.slug, 'bg', a.title, a.content);
  }

  const quiz = await ensureQuiz();

  const desiredCurriculum: Array<
    | {
        itemType: 'wiki';
        title: string;
        order: number;
        wikiSlug: string;
      }
    | {
        itemType: 'quiz';
        title: string;
        order: number;
        quizId: string;
      }
  > = [];

  let orderIndex = 1;
  for (const a of lessonArticles) {
    desiredCurriculum.push({
      itemType: 'wiki',
      title: a.title,
      order: orderIndex,
      wikiSlug: a.slug,
    });
    orderIndex += 1;
  }
  desiredCurriculum.push({
    itemType: 'quiz',
    title: 'Quiz: Основи на QA',
    order: orderIndex,
    quizId: quiz.id,
  });

  for (const item of desiredCurriculum) {
    if (item.itemType === 'wiki') {
      const existing = await curriculumRepo.findOne({
        where: {
          courseId: savedCourse.id,
          itemType: 'wiki',
          wikiSlug: item.wikiSlug,
        },
      });
      if (existing) continue;

      await curriculumRepo.save(
        curriculumRepo.create({
          courseId: savedCourse.id,
          itemType: 'wiki',
          title: item.title,
          order: item.order,
          wikiSlug: item.wikiSlug,
          taskId: null,
          quizId: null,
        }),
      );
    }

    if (item.itemType === 'quiz') {
      const existing = await curriculumRepo.findOne({
        where: {
          courseId: savedCourse.id,
          itemType: 'quiz',
          quizId: item.quizId,
        },
      });
      if (existing) continue;

      await curriculumRepo.save(
        curriculumRepo.create({
          courseId: savedCourse.id,
          itemType: 'quiz',
          title: item.title,
          order: item.order,
          wikiSlug: null,
          taskId: null,
          quizId: item.quizId,
        }),
      );
    }
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
