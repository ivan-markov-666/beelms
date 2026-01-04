"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";
import { AdminBreadcrumbs } from "../_components/admin-breadcrumbs";
import Link from "next/link";
import { WikiMarkdown } from "../../wiki/_components/wiki-markdown";

const API_BASE_URL = getApiBaseUrl();

type LegalPage = {
  slug: string;
  title: string;
  contentMarkdown: string;
  updatedAt: string;
};

export default function AdminLegalPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pages, setPages] = useState<LegalPage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("terms");

  const selected = useMemo(() => {
    return pages.find((p) => p.slug === selectedSlug) ?? null;
  }, [pages, selectedSlug]);

  const [title, setTitle] = useState<string>("");
  const [contentMarkdown, setContentMarkdown] = useState<string>("");

  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title ?? "");
    setContentMarkdown(selected.contentMarkdown ?? "");
  }, [selected]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const token = getAccessToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/admin/legal/pages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (!res.ok) {
          if (!cancelled) {
            setError("Неуспешно зареждане на legal pages.");
          }
          return;
        }

        const data = (await res.json()) as LegalPage[];

        if (cancelled) return;

        const safe = Array.isArray(data) ? data : [];
        setPages(safe);

        const defaultSlug = safe.some((p) => p.slug === "terms")
          ? "terms"
          : (safe[0]?.slug ?? "terms");
        setSelectedSlug(defaultSlug);
      } catch {
        if (!cancelled) {
          setError("Възникна грешка при връзката със сървъра.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const onSave = async () => {
    setError(null);
    setSuccess(null);

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const nextTitle = (title ?? "").trim();
    const nextContent = contentMarkdown ?? "";

    if (nextContent.trim().length < 1) {
      setError("Content (markdown) не може да е празно.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/legal/pages/${selectedSlug}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: nextTitle.length > 0 ? nextTitle : undefined,
            contentMarkdown: nextContent,
          }),
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setError("Неуспешно запазване на legal съдържанието.");
        return;
      }

      const updated = (await res.json()) as LegalPage;

      setPages((prev) =>
        prev.map((p) => (p.slug === updated.slug ? updated : p)),
      );

      setSuccess("Запазено.");
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <AdminBreadcrumbs
          items={[{ label: "Админ табло", href: "/admin" }, { label: "Legal" }]}
        />
        <h1 className="text-3xl font-semibold text-zinc-900">Legal pages</h1>
        <p className="text-sm text-zinc-600">Edit + preview (markdown).</p>
      </header>

      {loading && <p className="text-sm text-zinc-600">Зареждане...</p>}

      {!loading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Pages</h2>
            <div className="mt-3 space-y-2">
              {pages.length === 0 && (
                <p className="text-sm text-gray-600">Няма налични страници.</p>
              )}
              {pages.map((p) => {
                const active = p.slug === selectedSlug;
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => setSelectedSlug(p.slug)}
                    className={
                      "w-full rounded-md border px-3 py-2 text-left text-sm " +
                      (active
                        ? "border-green-300 bg-green-50 text-green-800"
                        : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50")
                    }
                  >
                    <div className="font-medium">{p.slug}</div>
                    <div className="text-xs text-gray-500">{p.title}</div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Edit</h2>

              <div className="mt-4 grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Terms and Conditions"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Markdown
                  </label>
                  <textarea
                    value={contentMarkdown}
                    onChange={(e) => setContentMarkdown(e.target.value)}
                    rows={14}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="# Title\n\nContent..."
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-70"
                  >
                    {saving ? "Запазване..." : "Запази"}
                  </button>
                  <Link
                    href="/admin"
                    className="text-sm text-green-700 hover:text-green-800"
                  >
                    Назад към админ таблото →
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
              <article
                className="wiki-markdown mt-4 w-full text-base leading-relaxed"
                style={{ color: "#111827" }}
              >
                <WikiMarkdown content={contentMarkdown || ""} />
              </article>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
