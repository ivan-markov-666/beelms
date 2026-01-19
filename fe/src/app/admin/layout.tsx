"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAccessToken, getAccessToken } from "../auth-token";
import { getApiBaseUrl } from "../api-url";
import { useCurrentLang } from "../../i18n/useCurrentLang";
import { t } from "../../i18n/t";

const API_BASE_URL = getApiBaseUrl();

type AdminStatus = "loading" | "forbidden" | "ready";

type UserRole = "user" | "admin" | "monitoring" | "teacher" | "author";

function AdminNavigationTabs({
  pathname,
  role,
}: {
  pathname: string;
  role: UserRole | null;
}) {
  const lang = useCurrentLang();

  const brandingFontStyle = {
    fontFamily: "var(--font-sans), Arial, Helvetica, sans-serif",
  } as const;

  const tabs: Array<{
    href: string;
    label: string;
    active: boolean;
    visible: boolean;
  }> = [
    {
      href: "/admin",
      label: t(lang, "common", "adminDashboardTabDashboard"),
      active: pathname === "/admin",
      visible: role === "admin",
    },
    {
      href: "/admin/wiki",
      label: t(lang, "common", "adminDashboardTabWiki"),
      active: pathname.startsWith("/admin/wiki"),
      visible: role === "admin" || role === "author",
    },
    {
      href: "/admin/courses",
      label: t(lang, "common", "adminDashboardTabCourses"),
      active: pathname.startsWith("/admin/courses"),
      visible: role === "admin" || role === "teacher",
    },
    {
      href: "/admin/users",
      label: t(lang, "common", "adminDashboardTabUsers"),
      active: pathname.startsWith("/admin/users"),
      visible: role === "admin",
    },
    {
      href: "/admin/metrics",
      label: t(lang, "common", "adminDashboardTabMetrics"),
      active: pathname.startsWith("/admin/metrics"),
      visible: role === "admin" || role === "monitoring",
    },
    {
      href: "/admin/activity",
      label: t(lang, "common", "adminDashboardTabActivity"),
      active: pathname.startsWith("/admin/activity"),
      visible: role === "admin",
    },
    {
      href: "/admin/payments",
      label: t(lang, "common", "adminDashboardTabPayments"),
      active: pathname.startsWith("/admin/payments"),
      visible: role === "admin",
    },
    {
      href: "/admin/backups",
      label: t(lang, "common", "adminDashboardTabBackups"),
      active: pathname.startsWith("/admin/backups"),
      visible: role === "admin",
    },
    {
      href: "/admin/pages",
      label: "Pages",
      active:
        pathname.startsWith("/admin/pages") ||
        pathname.startsWith("/admin/legal"),
      visible: role === "admin",
    },
    {
      href: "/admin/navigation",
      label: "Navigation",
      active: pathname.startsWith("/admin/navigation"),
      visible: role === "admin",
    },
    {
      href: "/admin/settings",
      label: "Settings",
      active: pathname.startsWith("/admin/settings"),
      visible: role === "admin",
    },
  ].filter((tab) => tab.visible);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <nav
      className="border-b border-gray-200 nav-font"
      style={brandingFontStyle}
    >
      <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
        {tabs.map((tab) => (
          <li key={tab.href}>
            {tab.active ? (
              <span className="inline-block border-b-2 border-[color:var(--primary)] pb-3 text-[color:var(--primary)] font-medium">
                {tab.label}
              </span>
            ) : (
              <Link
                href={tab.href}
                className="inline-block border-b-2 border-transparent pb-3 text-[color:var(--foreground)] opacity-70 transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)] hover:opacity-100"
              >
                {tab.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<AdminStatus>("loading");
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          router.replace("/auth/login");
          return;
        }

        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 404) {
            try {
              clearAccessToken();
            } catch {}
            router.replace("/auth/login");
            return;
          }

          if (!cancelled) {
            setStatus("forbidden");
          }
          return;
        }

        const data = (await res.json()) as { role?: UserRole };

        if (cancelled) {
          return;
        }

        const role = data.role;

        if (role === "admin") {
          setRole(role);
          setStatus("ready");
          return;
        }

        if (role === "monitoring") {
          const isMetricsPath = (pathname ?? "").startsWith("/admin/metrics");
          if (!isMetricsPath) {
            router.replace("/admin/metrics");
            return;
          }

          setRole(role);
          setStatus("ready");
          return;
        }

        if (role === "teacher") {
          const isCoursesPath = (pathname ?? "").startsWith("/admin/courses");
          if (!isCoursesPath) {
            router.replace("/admin/courses");
            return;
          }

          setRole(role);
          setStatus("ready");
          return;
        }

        if (role === "author") {
          const isWikiPath = (pathname ?? "").startsWith("/admin/wiki");
          if (!isWikiPath) {
            router.replace("/admin/wiki");
            return;
          }

          setRole(role);
          setStatus("ready");
          return;
        }

        setStatus("forbidden");
      } catch {
        if (!cancelled) {
          setStatus("forbidden");
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <main className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600 nav-font">
            Зареждане на Admin зоната...
          </p>
        </main>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <main className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-zinc-900">
            Нямате достъп до Admin зоната
          </h1>
          <p className="text-sm text-zinc-700 nav-font">
            Този раздел е достъпен само за администратори.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <main className="mx-auto max-w-7xl space-y-6 px-4">
        <AdminNavigationTabs pathname={pathname ?? ""} role={role} />
        {children}
      </main>
    </div>
  );
}
