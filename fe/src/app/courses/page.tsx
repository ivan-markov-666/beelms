import Link from "next/link";
import { notFound } from "next/navigation";
import { buildApiUrl } from "../api-url";
import { Pagination } from "../_components/pagination";
import { CoursesCatalogClient } from "./_components/courses-catalog-client";
import { CoursesFiltersFormClient } from "./_components/courses-filters-form-client";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;

type CourseSummary = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  isPaid: boolean;
  currency: string | null;
  priceCents: number | null;
  categoryId: string | null;
  category: {
    slug: string;
    title: string;
  } | null;
};

type CourseCategory = {
  id: string;
  slug: string;
  title: string;
  order: number;
  active: boolean;
};

type CoursesPagedParams = {
  q?: string;
  language?: string;
  paid?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: string;
};

async function fetchCoursesPaged(
  params?: CoursesPagedParams,
): Promise<{ items: CourseSummary[]; total: number }> {
  const url = new URL(buildApiUrl("/courses"));

  if (params?.category && params.category.trim()) {
    url.searchParams.set("category", params.category.trim());
  }
  if (params?.q && params.q.trim()) {
    url.searchParams.set("q", params.q.trim());
  }
  if (params?.language && params.language.trim()) {
    url.searchParams.set("language", params.language.trim());
  }
  if (params?.paid && params.paid.trim()) {
    url.searchParams.set("paid", params.paid.trim());
  }
  if (typeof params?.page === "number") {
    url.searchParams.set("page", String(params.page));
  }
  if (typeof params?.pageSize === "number") {
    url.searchParams.set("pageSize", String(params.pageSize));
  }
  if (params?.sortKey && params.sortKey.trim()) {
    url.searchParams.set("sortKey", params.sortKey.trim());
  }
  if (params?.sortDir && params.sortDir.trim()) {
    url.searchParams.set("sortDir", params.sortDir.trim());
  }

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    throw new Error("Failed to load courses");
  }

  const data = (await res.json()) as CourseSummary[];
  const rawTotal = res.headers.get("X-Total-Count") ?? "";
  const parsedTotal = Number(rawTotal);
  const total =
    Number.isFinite(parsedTotal) && parsedTotal >= 0
      ? parsedTotal
      : Array.isArray(data)
        ? data.length
        : 0;

  return { items: Array.isArray(data) ? data : [], total };
}

async function fetchCategories(): Promise<CourseCategory[]> {
  const res = await fetch(buildApiUrl("/course-categories"), {
    cache: "no-store",
  });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as CourseCategory[];
  return Array.isArray(data) ? data : [];
}

type CoursesPageSearchParams = { category?: string | string[] };

function isPromiseLike<T>(value: unknown): value is Promise<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

export default async function CoursesPage({
  searchParams: rawSearchParams,
}: {
  searchParams?:
    | (CoursesPageSearchParams & {
        q?: string;
        language?: string;
        paid?: string;
        page?: string;
        pageSize?: string;
        sortKey?: string;
        sortDir?: string;
      })
    | Promise<
        CoursesPageSearchParams & {
          q?: string;
          language?: string;
          paid?: string;
          page?: string;
          pageSize?: string;
          sortKey?: string;
          sortDir?: string;
        }
      >;
}) {
  const searchParams = isPromiseLike(rawSearchParams)
    ? await rawSearchParams
    : rawSearchParams;

  const selectedCategory =
    typeof searchParams?.category === "string" ? searchParams.category : "";

  const rawQ = typeof searchParams?.q === "string" ? searchParams.q : "";
  const rawLanguage =
    typeof searchParams?.language === "string" ? searchParams.language : "";
  const rawPaid =
    typeof searchParams?.paid === "string" ? searchParams.paid : "";
  const rawPage =
    typeof searchParams?.page === "string" ? searchParams.page : "1";
  const rawPageSize =
    typeof searchParams?.pageSize === "string"
      ? searchParams.pageSize
      : String(DEFAULT_PAGE_SIZE);
  const rawSortKey =
    typeof searchParams?.sortKey === "string"
      ? searchParams.sortKey
      : "createdAt";
  const rawSortDir =
    typeof searchParams?.sortDir === "string" ? searchParams.sortDir : "desc";

  const q = rawQ.trim();
  const language = rawLanguage.trim().toLowerCase();
  const paid = rawPaid.trim().toLowerCase();
  const page = (() => {
    const parsed = Number.parseInt(rawPage, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  })();
  const pageSize = (() => {
    const parsed = Number.parseInt(rawPageSize, 10);
    return Number.isFinite(parsed) && parsed > 0
      ? Math.min(parsed, 100)
      : DEFAULT_PAGE_SIZE;
  })();
  const sortKey = rawSortKey.trim() === "title" ? "title" : "createdAt";
  const sortDir = rawSortDir.trim() === "asc" ? "asc" : "desc";

  let courses: CourseSummary[] = [];
  let totalCount = 0;
  let categories: CourseCategory[] = [];
  try {
    const [catalog, cats] = await Promise.all([
      fetchCoursesPaged({
        category: selectedCategory || undefined,
        q,
        language: language || undefined,
        paid: paid || undefined,
        page,
        pageSize,
        sortKey,
        sortDir,
      }),
      fetchCategories(),
    ]);
    courses = catalog.items;
    totalCount = catalog.total;
    categories = cats;
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

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(Math.max(page, 1), totalPages);

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

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <CoursesFiltersFormClient
          initialQ={rawQ}
          initialLanguage={rawLanguage}
          initialPaid={rawPaid}
          selectedCategory={selectedCategory}
          sortKey={sortKey}
          sortDir={sortDir}
        />
      </section>

      {categories.length > 0 && (
        <section className="flex flex-wrap gap-2">
          <Link
            href="/courses"
            className={`rounded-full border px-3 py-1 text-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${
              !selectedCategory
                ? "border-green-600 bg-green-50 text-green-800"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/courses?category=${encodeURIComponent(c.slug)}`}
              className={`rounded-full border px-3 py-1 text-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${
                selectedCategory === c.slug
                  ? "border-green-600 bg-green-50 text-green-800"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              {c.title}
            </Link>
          ))}
        </section>
      )}

      <CoursesCatalogClient courses={courses} />

      {totalCount > 0 && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-600 md:text-sm">
          <p>
            Showing{" "}
            <span className="font-semibold">
              {(safeCurrentPage - 1) * pageSize + 1}
            </span>
            -
            <span className="font-semibold">
              {Math.min(safeCurrentPage * pageSize, totalCount)}
            </span>{" "}
            of <span className="font-semibold">{totalCount}</span> courses
          </p>
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            pageParam="page"
            pageSizeParam="pageSize"
          />
        </div>
      )}
    </main>
  );
}
