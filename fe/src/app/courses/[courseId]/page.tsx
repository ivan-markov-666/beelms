import Link from "next/link";
import { notFound } from "next/navigation";
import { EnrollCourseButton } from "../_components/enroll-course-button";

export const dynamic = "force-dynamic";

function apiUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";
  const normalizedBase = base.endsWith("/api")
    ? base
    : `${base.replace(/\/$/, "")}/api`;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

type CourseModuleItem = {
  id: string;
  itemType: "wiki" | "task" | "quiz";
  title: string;
  order: number;
  wikiSlug: string | null;
  taskId: string | null;
  quizId: string | null;
};

type CourseDetail = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  isPaid: boolean;
  curriculum: CourseModuleItem[];
};

async function fetchCourseDetail(courseId: string): Promise<CourseDetail> {
  const res = await fetch(apiUrl(`/courses/${courseId}`), {
    cache: "no-store",
  });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    throw new Error("Failed to load course");
  }

  return res.json();
}

export default async function CourseDetailPage(props: {
  params: { courseId: string } | Promise<{ courseId: string }>;
}) {
  const resolvedParams = await props.params;

  const course = await fetchCourseDetail(resolvedParams.courseId);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="space-y-3">
        <Link
          href="/courses"
          className="text-sm text-green-700 hover:text-green-800"
        >
          ← Back to courses
        </Link>
        <h1 className="text-3xl font-semibold text-zinc-900">{course.title}</h1>
        <p className="text-sm text-zinc-600">{course.description}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="rounded bg-gray-100 px-2 py-1">
            {course.language}
          </span>
          <span className="rounded bg-gray-100 px-2 py-1">{course.status}</span>
        </div>

        <EnrollCourseButton courseId={course.id} isPaid={course.isPaid} />
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Curriculum (MVP)
        </h2>
        {course.curriculum.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">
            Curriculum ще бъде добавен на следващ етап (WS-3 tasks/quizzes).
          </p>
        ) : (
          <ol className="mt-4 list-decimal pl-6 text-sm text-gray-700">
            {course.curriculum
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <li key={item.id} className="py-1">
                  {item.itemType === "wiki" && item.wikiSlug ? (
                    <Link
                      href={`/courses/${encodeURIComponent(
                        course.id,
                      )}/wiki/${encodeURIComponent(
                        item.wikiSlug,
                      )}?lang=${encodeURIComponent(course.language)}`}
                      className="font-medium text-green-700 hover:text-green-800 hover:underline"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-900">
                      {item.title}
                    </span>
                  )}{" "}
                  <span className="text-gray-500">({item.itemType})</span>
                </li>
              ))}
          </ol>
        )}
      </section>
    </main>
  );
}
