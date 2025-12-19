import Link from "next/link";

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

type CourseSummary = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  isPaid: boolean;
};

async function fetchCourses(): Promise<CourseSummary[]> {
  const res = await fetch(apiUrl("/courses"), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load courses");
  }

  return res.json();
}

export default async function CoursesPage() {
  let courses: CourseSummary[] = [];

  try {
    courses = await fetchCourses();
  } catch (error) {
    void error;
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-900">Courses</h1>
          <p className="text-sm text-zinc-600">
            Възникна проблем при зареждане на курсовете. Опитайте отново
            по-късно.
          </p>
        </header>
      </main>
    );
  }

  if (!courses.length) {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-900">Courses</h1>
          <p className="text-sm text-zinc-600">
            Все още няма публикувани курсове.
          </p>
        </header>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-zinc-900">Courses</h1>
        <p className="text-sm text-zinc-600">
          Каталог от курсове (WS-3: public catalog + detail).
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {course.title}
              </h2>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
                  course.isPaid
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {course.isPaid ? "Paid" : "Free"}
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-4">
              {course.description}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <span className="rounded bg-gray-100 px-2 py-1">
                {course.language}
              </span>
              <span className="rounded bg-gray-100 px-2 py-1">
                {course.status}
              </span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
