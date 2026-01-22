"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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

export function HeaderNav({
  initialPublicSettings,
  initialCustomPages,
}: {
  initialPublicSettings?: PublicSettings | null;
  initialCustomPages?: Array<{
    slug: string;
    title: string;
    updatedAt: string;
  }>;
}) {
  const lang = useCurrentLang();
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [openHeaderMenuPath, setOpenHeaderMenuPath] = useState<string[]>([]);
  const closeHeaderMenuTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [publicSettings, setPublicSettings] = useState<PublicSettings | null>(
    () => initialPublicSettings ?? null,
  );
  const [customPages, setCustomPages] = useState<
    Array<{ slug: string; title: string; updatedAt: string }>
  >(() => initialCustomPages ?? []);
  const [themeModeOpen, setThemeModeOpen] = useState(false);
  const themeModeRef = useRef<HTMLDivElement | null>(null);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(false);

  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(
    "system",
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
        setPublicSettings((prev) => prev);
      }
    };

    void initPublicSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const initCustomPages = async () => {
      try {
        const query = lang ? `?lang=${encodeURIComponent(lang)}` : "";
        const res = await fetch(`${API_BASE_URL}/pages/custom${query}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) setCustomPages((prev) => prev);
          return;
        }

        const data = (await res.json()) as Array<{
          slug?: string;
          title?: string;
          updatedAt?: string;
        }>;

        if (cancelled) return;

        const safe = Array.isArray(data)
          ? data
              .map((p) => ({
                slug: (p.slug ?? "").trim().toLowerCase(),
                title: (p.title ?? "").trim(),
                updatedAt: (p.updatedAt ?? "").trim(),
              }))
              .filter((p) => Boolean(p.slug))
          : [];

        setCustomPages(safe);
      } catch {
        if (!cancelled) setCustomPages((prev) => prev);
      }
    };

    void initCustomPages();

    return () => {
      cancelled = true;
    };
  }, [lang]);

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
    try {
      document.cookie = `${themeStorageKey}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
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

    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark" || attr === "system") {
      setThemeMode(attr);
    }
  }, []);

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

  const pageLinksBySlug = publicSettings?.branding?.pageLinks?.bySlug ?? null;
  const headerLinkEnabledForSlug = (slug: string): boolean => {
    const rec = pageLinksBySlug?.[slug];
    return rec?.url !== false && rec?.header === true;
  };

  const gdprLegalEnabled = features?.gdprLegal !== false;
  const termsPageEnabled = features?.pageTerms !== false;
  const privacyPageEnabled = features?.pagePrivacy !== false;
  const cookiePolicyPageEnabled = features?.pageCookiePolicy !== false;
  const imprintPageEnabled = features?.pageImprint !== false;
  const accessibilityPageEnabled = features?.pageAccessibility !== false;

  const showContact =
    features?.pageContact !== false && headerLinkEnabledForSlug("contact");
  const showFaq =
    features?.pageFaq !== false && headerLinkEnabledForSlug("faq");
  const showSupport =
    features?.pageSupport !== false && headerLinkEnabledForSlug("support");

  const showTerms =
    gdprLegalEnabled && termsPageEnabled && headerLinkEnabledForSlug("terms");
  const showPrivacy =
    gdprLegalEnabled &&
    privacyPageEnabled &&
    headerLinkEnabledForSlug("privacy");
  const showCookiePolicy =
    gdprLegalEnabled &&
    cookiePolicyPageEnabled &&
    headerLinkEnabledForSlug("cookie-policy");
  const showImprint =
    gdprLegalEnabled &&
    imprintPageEnabled &&
    headerLinkEnabledForSlug("imprint");
  const showAccessibility =
    gdprLegalEnabled &&
    accessibilityPageEnabled &&
    headerLinkEnabledForSlug("accessibility");

  const customHeaderLinks = customPages
    .filter((p) => headerLinkEnabledForSlug(p.slug))
    .slice(0, 8);

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
  const languageIcons = publicSettings?.languages?.icons ?? null;
  const languageFlagPicker = publicSettings?.languages?.flagPicker ?? null;

  const headerMenu = publicSettings?.branding?.headerMenu ?? null;
  const useHeaderMenu =
    headerMenu?.enabled === true &&
    Array.isArray(headerMenu.items) &&
    headerMenu.items.length > 0;

  const isExternalHref = (href: string): boolean => {
    return /^https?:\/\//i.test(href);
  };

  const getMenuLabel = (item: {
    label?: string | null;
    labelByLang?: Record<string, string | null> | null;
    href: string;
  }): string => {
    const normalizedLang = (lang ?? "").trim().toLowerCase();
    const byLang = (item.labelByLang ?? null)?.[normalizedLang] ?? null;
    const byLangTrimmed = typeof byLang === "string" ? byLang.trim() : "";
    if (byLangTrimmed) return byLangTrimmed;
    const label = typeof item.label === "string" ? item.label.trim() : "";
    if (label) return label;
    const href = (item.href ?? "").trim();
    if (!href) return "Link";
    if (href === "/") return "Home";
    const parts = href.split("/").filter(Boolean);
    const last = parts[parts.length - 1] ?? href;
    return last;
  };

  const appendLangToHref = (href: string): string => {
    if (!lang) return href;
    try {
      const url = new URL(href, "http://localhost");
      url.searchParams.set("lang", lang);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      const [base, query] = href.split("?");
      const params = new URLSearchParams(query ?? "");
      params.set("lang", lang);
      const queryString = params.toString();
      return queryString ? `${base}?${queryString}` : `${base}?lang=${lang}`;
    }
  };

  const renderHref = (
    href: string,
    label: string,
    key?: string,
    className?: string,
    newTab?: boolean,
  ) => {
    const effectiveClass = className ?? "hover:text-[color:var(--primary)]";
    const shouldOpenInNewTab = newTab === true;
    if (isExternalHref(href)) {
      return (
        <a
          key={key}
          href={href}
          className={effectiveClass}
          target={shouldOpenInNewTab ? "_blank" : undefined}
          rel={shouldOpenInNewTab ? "noreferrer" : undefined}
        >
          {label}
        </a>
      );
    }

    const localizedHref = appendLangToHref(href);

    return (
      <Link
        key={key}
        href={localizedHref}
        className={effectiveClass}
        prefetch={false}
        target={shouldOpenInNewTab ? "_blank" : undefined}
        rel={shouldOpenInNewTab ? "noreferrer" : undefined}
      >
        {label}
      </Link>
    );
  };

  useEffect(() => {
    return () => {
      if (closeHeaderMenuTimeoutRef.current) {
        clearTimeout(closeHeaderMenuTimeoutRef.current);
        closeHeaderMenuTimeoutRef.current = null;
      }
    };
  }, []);

  const scheduleCloseHeaderMenu = () => {
    if (closeHeaderMenuTimeoutRef.current) {
      clearTimeout(closeHeaderMenuTimeoutRef.current);
    }
    closeHeaderMenuTimeoutRef.current = setTimeout(() => {
      setOpenHeaderMenuPath([]);
      closeHeaderMenuTimeoutRef.current = null;
    }, 1000);
  };

  const openHeaderMenu = (id: string, depth: number) => {
    if (closeHeaderMenuTimeoutRef.current) {
      clearTimeout(closeHeaderMenuTimeoutRef.current);
      closeHeaderMenuTimeoutRef.current = null;
    }
    setOpenHeaderMenuPath((prev) => {
      const next = prev.slice(0, depth);
      next[depth] = id;
      return next;
    });
  };

  const closeAllHeaderMenus = () => {
    setOpenHeaderMenuPath([]);
  };

  type HeaderMenuItem = {
    id?: string;
    href: string;
    label?: string | null;
    labelByLang?: Record<string, string | null> | null;
    enabled?: boolean | null;
    clickable?: boolean | null;
    newTab?: boolean | null;
    children?: HeaderMenuItem[] | null;
  };

  const renderHeaderMenuItem = (item: HeaderMenuItem, depth: number) => {
    const id = String(item.id ?? `${depth}-${item.href}-${getMenuLabel(item)}`);
    const label = getMenuLabel(item);
    const children = Array.isArray(item.children)
      ? item.children
          .filter((c) => c && (c.enabled ?? true) !== false)
          .slice(0, 20)
      : [];

    const allowChildren = depth < 4;
    const hasChildren = allowChildren && children.length > 0;

    if (!hasChildren) {
      const className =
        depth > 0
          ? "rounded-md px-2 py-1 hover:bg-gray-50 hover:text-[color:var(--primary)]"
          : undefined;
      return renderHref(item.href, label, id, className, item.newTab === true);
    }

    const isOpen = openHeaderMenuPath[depth] === id;
    const panelPositionClass =
      depth === 0 ? "left-0 top-full mt-2" : "left-full top-0 ml-2";

    const triggerClass =
      depth === 0
        ? "cursor-pointer hover:text-[color:var(--primary)]"
        : "cursor-pointer rounded-md px-2 py-1 hover:bg-gray-50 hover:text-[color:var(--primary)]";

    const clickable = item.clickable !== false;
    const trigger = clickable ? (
      renderHref(
        item.href,
        label,
        `${id}-trigger`,
        triggerClass,
        item.newTab === true,
      )
    ) : (
      <span className={triggerClass}>{label}</span>
    );

    return (
      <div
        key={id}
        className="relative"
        onMouseEnter={() => openHeaderMenu(id, depth)}
        onMouseLeave={scheduleCloseHeaderMenu}
      >
        {trigger}
        <div
          className={`transition-opacity absolute ${panelPositionClass} min-w-56 rounded-md border border-gray-200 bg-white p-2 shadow-lg ${
            isOpen
              ? "visible opacity-100"
              : "invisible opacity-0 pointer-events-none"
          }`}
          onMouseEnter={() => openHeaderMenu(id, depth)}
          onMouseLeave={scheduleCloseHeaderMenu}
          onClick={closeAllHeaderMenus}
        >
          <div className="flex flex-col gap-1">
            {children.map((child) => renderHeaderMenuItem(child, depth + 1))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center">
          <Link href={appendLangToHref("/")} className="flex items-center">
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
              <span className="text-2xl font-bold text-[color:var(--primary)]">
                {appName}
              </span>
            )}
          </Link>
        </div>

        <nav
          className="hidden items-center space-x-6 text-sm text-gray-700 nav-font md:flex"
          style={brandingFontStyle}
        >
          {useHeaderMenu ? (
            <>
              {(headerMenu?.items ?? [])
                .filter((i) => i && (i.enabled ?? true) !== false)
                .slice(0, 12)
                .map((item) => renderHeaderMenuItem(item, 0))}
              {isAdmin === true && (
                <Link
                  href={appendLangToHref("/admin")}
                  className="hover:text-[color:var(--primary)]"
                >
                  {t(lang, "nav", "admin")}
                </Link>
              )}
            </>
          ) : (
            <>
              {showWiki && (
                <Link
                  href={appendLangToHref("/wiki")}
                  className="hover:text-[color:var(--primary)]"
                >
                  {t(lang, "nav", "wiki")}
                </Link>
              )}
              {showCourses && (
                <Link
                  href={appendLangToHref("/courses")}
                  className="hover:text-[color:var(--primary)]"
                >
                  {t(lang, "nav", "courses")}
                </Link>
              )}
              {showFaq && (
                <Link
                  href={appendLangToHref("/faq")}
                  className="hover:text-[color:var(--primary)]"
                >
                  FAQ
                </Link>
              )}
              {showSupport && (
                <Link
                  href={appendLangToHref("/support")}
                  className="hover:text-[color:var(--primary)]"
                >
                  Support
                </Link>
              )}
              {showTerms && (
                <Link
                  href={appendLangToHref("/legal/terms")}
                  className="hover:text-[color:var(--primary)]"
                >
                  {t(lang, "common", "legalFooterTermsLink")}
                </Link>
              )}
              {showPrivacy && (
                <Link
                  href={appendLangToHref("/legal/privacy")}
                  className="hover:text-[color:var(--primary)]"
                >
                  {t(lang, "common", "legalFooterPrivacyLink")}
                </Link>
              )}
              {showCookiePolicy && (
                <Link
                  href={appendLangToHref("/legal/cookie-policy")}
                  className="hover:text-[color:var(--primary)]"
                >
                  Cookie policy
                </Link>
              )}
              {showImprint && (
                <Link
                  href={appendLangToHref("/legal/imprint")}
                  className="hover:text-[color:var(--primary)]"
                >
                  Imprint
                </Link>
              )}
              {showAccessibility && (
                <Link
                  href={appendLangToHref("/legal/accessibility")}
                  className="hover:text-[color:var(--primary)]"
                >
                  Accessibility
                </Link>
              )}
              {showContact && (
                <Link
                  href={appendLangToHref("/contact")}
                  className="hover:text-[color:var(--primary)]"
                >
                  {t(lang, "common", "footerContactLink")}
                </Link>
              )}
              {customHeaderLinks.map((p) => (
                <Link
                  key={p.slug}
                  href={appendLangToHref(`/p/${p.slug}`)}
                  className="hover:text-[color:var(--primary)]"
                  prefetch={false}
                >
                  {p.title || p.slug}
                </Link>
              ))}
              {showMyCourses && (
                <Link
                  href={appendLangToHref("/my-courses")}
                  className="hover:text-[color:var(--primary)]"
                >
                  {t(lang, "nav", "myCourses")}
                </Link>
              )}
              {isAdmin === true && (
                <Link
                  href={appendLangToHref("/admin")}
                  className="hover:text-[color:var(--primary)]"
                >
                  {t(lang, "nav", "admin")}
                </Link>
              )}
            </>
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
            <div ref={themeModeRef} className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={themeModeOpen}
                onClick={() => setThemeModeOpen((p) => !p)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setThemeModeOpen(false);
                  }
                  if (
                    event.key === "ArrowDown" ||
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    setThemeModeOpen(true);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                aria-label="Theme"
              >
                <span className="capitalize">{themeMode}</span>
                <svg
                  className={`h-3.5 w-3.5 text-gray-500 transition ${themeModeOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {themeModeOpen ? (
                <div
                  role="listbox"
                  aria-label="Theme"
                  className="absolute right-0 z-50 mt-2 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                >
                  {allowThemeSystem ? (
                    <button
                      type="button"
                      role="option"
                      aria-selected={themeMode === "system"}
                      onClick={() => {
                        handleThemeChange("system");
                        setThemeModeOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                        themeMode === "system"
                          ? "font-semibold text-gray-900"
                          : "text-gray-700"
                      }`}
                    >
                      <span>System</span>
                      {themeMode === "system" ? (
                        <span aria-hidden="true">✓</span>
                      ) : null}
                    </button>
                  ) : null}
                  {allowThemeLight ? (
                    <button
                      type="button"
                      role="option"
                      aria-selected={themeMode === "light"}
                      onClick={() => {
                        handleThemeChange("light");
                        setThemeModeOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                        themeMode === "light"
                          ? "font-semibold text-gray-900"
                          : "text-gray-700"
                      }`}
                    >
                      <span>Light</span>
                      {themeMode === "light" ? (
                        <span aria-hidden="true">✓</span>
                      ) : null}
                    </button>
                  ) : null}
                  {allowThemeDark ? (
                    <button
                      type="button"
                      role="option"
                      aria-selected={themeMode === "dark"}
                      onClick={() => {
                        handleThemeChange("dark");
                        setThemeModeOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                        themeMode === "dark"
                          ? "font-semibold text-gray-900"
                          : "text-gray-700"
                      }`}
                    >
                      <span>Dark</span>
                      {themeMode === "dark" ? (
                        <span aria-hidden="true">✓</span>
                      ) : null}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {hasToken === false && showAuth && (
            <>
              {showAuthLogin ? (
                <Link
                  href={appendLangToHref("/auth/login")}
                  className="hover:text-[color:var(--primary)]"
                >
                  {t(lang, "nav", "login")}
                </Link>
              ) : null}
              {showAuthRegister ? (
                <Link
                  href={appendLangToHref("/auth/register")}
                  className="hover:text-[color:var(--primary)]"
                >
                  {t(lang, "nav", "register")}
                </Link>
              ) : null}
            </>
          )}
          {hasToken === true && (
            <>
              {showProfile ? (
                <Link
                  href={appendLangToHref("/profile")}
                  className="hover:text-[color:var(--primary)]"
                >
                  {t(lang, "nav", "profile")}
                </Link>
              ) : null}
              <button
                type="button"
                className="hover:text-[color:var(--primary)]"
                onClick={handleLogout}
              >
                {t(lang, "nav", "logout")}
              </button>
            </>
          )}
          <LanguageSwitcher
            supportedLangs={languageSupported}
            defaultLang={languageDefault}
            icons={languageIcons}
            themeVariant={effectiveTheme}
            flagPicker={languageFlagPicker}
          />
        </div>
      </div>
    </header>
  );
}
