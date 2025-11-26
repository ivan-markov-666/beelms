export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-8 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </header>
      <section className="space-y-3">
        <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-4 w-11/12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-4 w-10/12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </section>
    </main>
  );
}
