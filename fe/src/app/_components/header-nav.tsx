"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentLang } from "../../i18n/useCurrentLang";
import { t } from "../../i18n/t";
import { LanguageSwitcher } from "../wiki/_components/language-switcher";
import { clearAccessToken, getAccessToken } from "../auth-token";
import { getApiBaseUrl } from "../api-url";
import {
  getPublicSettings,
  type PublicSettings,
} from "../_data/public-settings";

const API_BASE_URL = getApiBaseUrl();

export function HeaderNav() {
  const lang = useCurrentLang();
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [publicSettings, setPublicSettings] = useState<PublicSettings | null>(
    null,
  );

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      try {
        clearAccessToken();
      } catch {
        // ignore
      }
      window.location.assign("/");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      if (cancelled) return;

      try {
        const stored = getAccessToken();

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
                clearAccessToken();
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const initPublicSettings = async () => {
      try {
        const s = await getPublicSettings();
        if (cancelled) return;
        setPublicSettings(s);
      } catch {
        if (cancelled) return;
        setPublicSettings(null);
      }
    };

    void initPublicSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const features = publicSettings?.features;
  const showWiki = features?.wikiPublic !== false;
  const showCourses = features?.courses !== false;
  const showAuth = features?.auth !== false;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">
            {publicSettings?.branding?.appName ?? "BeeLMS"}
          </Link>
        </div>

        <nav className="hidden items-center space-x-6 text-sm text-gray-700 md:flex">
          {showWiki && (
            <Link href="/wiki" className="hover:text-green-600">
              {t(lang, "nav", "wiki")}
            </Link>
          )}
          {showCourses && (
            <Link href="/courses" className="hover:text-green-600">
              {t(lang, "nav", "courses")}
            </Link>
          )}
          {hasToken === true && (
            <Link href="/my-courses" className="hover:text-green-600">
              {t(lang, "nav", "myCourses")}
            </Link>
          )}
          {isAdmin === true && (
            <Link href="/admin" className="hover:text-green-600">
              {t(lang, "nav", "admin")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4 text-sm text-gray-700">
          {hasToken === false && showAuth && (
            <>
              <Link href="/auth/login" className="hover:text-green-600">
                {t(lang, "nav", "login")}
              </Link>
              <Link href="/auth/register" className="hover:text-green-600">
                {t(lang, "nav", "register")}
              </Link>
            </>
          )}
          {hasToken === true && (
            <>
              <Link href="/profile" className="hover:text-green-600">
                {t(lang, "nav", "profile")}
              </Link>
              <button
                type="button"
                className="hover:text-green-600"
                onClick={handleLogout}
              >
                {t(lang, "nav", "logout")}
              </button>
            </>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
