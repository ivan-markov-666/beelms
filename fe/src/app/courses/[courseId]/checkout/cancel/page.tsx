"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function CheckoutCancelPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Payment cancelled</h1>
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Плащането беше прекъснато или отказано. Няма направена покупка.
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={courseId ? `/courses/${courseId}` : "/courses"}
          className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
        >
          Back to course (retry)
        </Link>

        <Link
          href="/courses"
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
        >
          Back to courses
        </Link>
      </div>
    </main>
  );
}
