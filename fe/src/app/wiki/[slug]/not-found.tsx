import Link from "next/link";

export default function WikiArticleNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/wiki" className="hover:underline">
            ← Назад към Wiki
          </Link>
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Статията не е намерена
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Тази статия може да е била премахната или никога не е съществувала.
        </p>
      </header>
    </main>
  );
}
