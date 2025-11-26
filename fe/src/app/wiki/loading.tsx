export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <div className="h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </header>
      <section className="mt-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        ))}
      </section>
    </main>
  );
}
