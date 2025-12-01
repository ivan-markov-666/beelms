"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentLang } from "../../i18n/useCurrentLang";
import { t } from "../../i18n/t";

export function HeaderNav() {
  const lang = useCurrentLang();
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const updateHasToken = () => {
      if (cancelled) return;
      try {
        const stored = window.localStorage.getItem("qa4free_access_token");
        setHasToken(Boolean(stored));
      } catch {
        setHasToken(false);
      }
    };

    const timeoutId = window.setTimeout(updateHasToken, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [pathname]);

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
      <nav className="flex items-center gap-4">
        <Link
          href="/wiki"
          className="font-medium hover:text-zinc-950 dark:hover:text-white"
        >
          {t(lang, "nav", "wiki")}
        </Link>
        <Link
          href="/practice/ui-demo"
          className="font-medium hover:text-zinc-950 dark:hover:text-white"
        >
          {t(lang, "nav", "practice")}
        </Link>
        {hasToken === false && (
          <Link
            href="/auth/login"
            className="font-medium hover:text-zinc-950 dark:hover:text-white"
          >
            {t(lang, "nav", "login")}
          </Link>
        )}
      </nav>
    </header>
  );
}
