"use client";

import Link from "next/link";
import { WikiMain } from "../_components/wiki-main";
import { WikiBackLink } from "../_components/wiki-back-link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function WikiArticleError({ error, reset }: ErrorPageProps) {
  void error;
  return (
    <WikiMain>
      <header className="space-y-2">
        <WikiBackLink />
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Възникна проблем при зареждане на статията
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Опитайте отново по-късно. Ако проблемът продължи, свържете се с екипа
          за поддръжка.
        </p>
      </header>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Опитай пак
        </button>
        <Link
          href="/wiki"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Към списъка със статии
        </Link>
      </div>
    </WikiMain>
  );
}
