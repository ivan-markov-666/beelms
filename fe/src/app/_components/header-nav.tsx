"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentLang } from "../../i18n/useCurrentLang";
import { t } from "../../i18n/t";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

export function HeaderNav() {
  const lang = useCurrentLang();
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      if (cancelled) return;

      try {
        const stored = window.localStorage.getItem("qa4free_access_token");

        if (!stored) {
          setHasToken(false);
          setIsAdmin(false);
          return;
        }

        setHasToken(true);

        try {
          const res = await fetch(`${API_BASE_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${stored}`,
            },
          });

          if (!res.ok) {
            if (res.status === 401 || res.status === 404) {
              try {
                window.localStorage.removeItem("qa4free_access_token");
              } catch {
                // ignore
              }
              setHasToken(false);
              setIsAdmin(false);
              return;
            }

            setIsAdmin(false);
            return;
          }

          const data = (await res.json()) as { role?: string };

          if (cancelled) return;

          setIsAdmin(data.role === "admin");
        } catch {
          if (cancelled) return;
          setIsAdmin(false);
        }
      } catch {
        if (cancelled) return;
        setHasToken(false);
        setIsAdmin(false);
      }
    };

    void init();

    return () => {
      cancelled = true;
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
        {isAdmin === true && (
          <Link
            href="/admin"
            className="font-medium hover:text-zinc-950 dark:hover:text-white"
          >
            {t(lang, "nav", "admin")}
          </Link>
        )}
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
