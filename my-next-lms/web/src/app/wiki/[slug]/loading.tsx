import { WikiMain } from "../_components/wiki-main";

export default function Loading() {
  return (
    <WikiMain>
      <header className="space-y-2">
        <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-8 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </header>
      <section className="mt-6 space-y-3 max-w-prose">
        <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-4 w-11/12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-4 w-10/12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </section>
    </WikiMain>
  );
}
