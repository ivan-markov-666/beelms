import Link from "next/link";

export function WikiBackLink() {
  return (
    <p className="text-sm text-[color:var(--foreground)] opacity-80">
      <Link
        href="/wiki"
        className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-medium text-[color:var(--primary)] transition hover:text-[color:var(--primary)]/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--card)]"
      >
        <span aria-hidden="true">←</span>
        Назад към Wiki
      </Link>
    </p>
  );
}
