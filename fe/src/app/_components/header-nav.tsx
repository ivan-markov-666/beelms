"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentLang } from "../../i18n/useCurrentLang";
import { t } from "../../i18n/t";
import { LanguageSwitcher } from "../wiki/_components/language-switcher";
import { clearAccessToken, getAccessToken } from "../auth-token";
import { getApiBaseUrl } from "../api-url";
import { AccessibilityWidget } from "./accessibility-widget";
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
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(
    () => {
      if (typeof window === "undefined") return "system";

      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "light" || attr === "dark" || attr === "system") {
        return attr;
      }

      return "system";
    },
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

  const applyThemeMode = (value: "light" | "dark" | "system") => {
    setThemeMode(value);
    if (typeof window === "undefined") return;
    document.documentElement.setAttribute("data-theme", value);
  };

  const themeStorageKey = "beelms.themeMode";

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    applyThemeMode(value);
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(themeStorageKey, value);
    } catch {
      // ignore
    }
  };

  const allowThemeLight = publicSettings?.features?.themeLight !== false;
  const allowThemeDark = publicSettings?.features?.themeDark !== false;
  const allowThemeSystem = allowThemeLight && allowThemeDark;
  const themeModeSelectorEnabled =
    publicSettings?.features?.themeModeSelector !== false;
  const showThemeSelector = themeModeSelectorEnabled && allowThemeSystem;

  const fallbackThemeMode = allowThemeSystem
    ? "system"
    : allowThemeLight
      ? "light"
      : "dark";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const next = (() => {
      if (themeMode === "system") {
        return allowThemeSystem ? "system" : fallbackThemeMode;
      }
      if (themeMode === "light") {
        return allowThemeLight ? "light" : fallbackThemeMode;
      }
      return allowThemeDark ? "dark" : fallbackThemeMode;
    })();

    if (next !== themeMode) {
      if (showThemeSelector) {
        handleThemeChange(next);
      } else {
        applyThemeMode(next);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowThemeDark, allowThemeLight, allowThemeSystem, showThemeSelector]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (typeof window.matchMedia !== "function") {
      return;
    }

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      setSystemPrefersDark(mql.matches);
    };

    handler();

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => {
        mql.removeEventListener("change", handler);
      };
    }

    mql.addListener(handler);
    return () => {
      mql.removeListener(handler);
    };
  }, []);

  const features = publicSettings?.features;
  const showWiki = features?.wiki !== false && features?.wikiPublic !== false;
  const showCourses =
    features?.courses !== false && features?.coursesPublic !== false;
  const showMyCourses =
    hasToken === true &&
    features?.courses !== false &&
    features?.myCourses !== false;
  const showProfile = hasToken === true && features?.profile !== false;
  const showAuth = features?.auth !== false;
  const showAuthLogin = showAuth && features?.authLogin !== false;
  const showAuthRegister = showAuth && features?.authRegister !== false;
  const showAccessibilityWidget = features?.accessibilityWidget !== false;

  const logoUrl = (publicSettings?.branding?.logoUrl ?? "").trim();
  const logoLightUrl = (publicSettings?.branding?.logoLightUrl ?? "").trim();
  const logoDarkUrl = (publicSettings?.branding?.logoDarkUrl ?? "").trim();

  const effectiveTheme =
    themeMode === "system" ? (systemPrefersDark ? "dark" : "light") : themeMode;
  const resolvedLogoUrl =
    effectiveTheme === "dark"
      ? logoDarkUrl || logoUrl
      : logoLightUrl || logoUrl;
  const appName = publicSettings?.branding?.appName ?? "BeeLMS";

  const brandingFontStyle = {
    fontFamily: "var(--font-sans), Arial, Helvetica, sans-serif",
  } as const;

  const languageSupported = publicSettings?.languages?.supported ?? null;
  const languageDefault = publicSettings?.languages?.default ?? null;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            {resolvedLogoUrl ? (
              <Image
                src={resolvedLogoUrl}
                alt={appName}
                width={160}
                height={40}
                className="h-10 w-auto"
                unoptimized
                priority
              />
            ) : (
              <span className="text-2xl font-bold text-green-600">
                {appName}
              </span>
            )}
          </Link>
        </div>

        <nav
          className="hidden items-center space-x-6 text-sm text-gray-700 nav-font md:flex"
          style={brandingFontStyle}
        >
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
          {showMyCourses && (
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

        <div
          className="flex items-center gap-4 text-sm text-gray-700 nav-font"
          style={brandingFontStyle}
        >
          {showAccessibilityWidget ? (
            <AccessibilityWidget variant="header" />
          ) : null}
          {showThemeSelector ? (
            <select
              value={themeMode}
              onChange={(e) =>
                handleThemeChange(e.target.value as "light" | "dark" | "system")
              }
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              aria-label="Theme"
            >
              {allowThemeSystem ? <option value="system">System</option> : null}
              {allowThemeLight ? <option value="light">Light</option> : null}
              {allowThemeDark ? <option value="dark">Dark</option> : null}
            </select>
          ) : null}
          {hasToken === false && showAuth && (
            <>
              {showAuthLogin ? (
                <Link href="/auth/login" className="hover:text-green-600">
                  {t(lang, "nav", "login")}
                </Link>
              ) : null}
              {showAuthRegister ? (
                <Link href="/auth/register" className="hover:text-green-600">
                  {t(lang, "nav", "register")}
                </Link>
              ) : null}
            </>
          )}
          {hasToken === true && (
            <>
              {showProfile ? (
                <Link href="/profile" className="hover:text-green-600">
                  {t(lang, "nav", "profile")}
                </Link>
              ) : null}
              <button
                type="button"
                className="hover:text-green-600"
                onClick={handleLogout}
              >
                {t(lang, "nav", "logout")}
              </button>
            </>
          )}
          <LanguageSwitcher
            supportedLangs={languageSupported}
            defaultLang={languageDefault}
          />
        </div>
      </div>
    </header>
  );
}
