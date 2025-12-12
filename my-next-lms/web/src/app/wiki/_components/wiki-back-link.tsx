import Link from "next/link";

export function WikiBackLink() {
  return (
    <p className="text-sm text-zinc-500 dark:text-zinc-400">
      <Link href="/wiki" className="hover:underline">
        ← Назад към Wiki
      </Link>
    </p>
  );
}
