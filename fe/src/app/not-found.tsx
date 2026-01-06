import Link from "next/link";
import { headers } from "next/headers";
import { getPublicSettings } from "./_data/public-settings";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { normalizeLang } from "../i18n/config";

export default async function NotFound() {
  let title = "Страницата не е намерена";
  let markdown: string | null = null;

  try {
    const h = await headers();
    const settings = await getPublicSettings();
    const branding = settings?.branding;

    const supportedLangs = settings?.languages?.supported ?? undefined;
    const fallbackLang = settings?.languages?.default ?? undefined;
    const lang = normalizeLang(
      h.get("x-ui-lang"),
      supportedLangs,
      fallbackLang,
    );

    const resolveByLang = (
      byLang: Record<string, string | null> | null | undefined,
      globalValue: string | null | undefined,
    ): string | null => {
      const candidate = (byLang?.[lang] ?? "").trim();
      if (candidate) return candidate;
      const fallback = (globalValue ?? "").trim();
      return fallback || null;
    };

    const resolvedTitle = resolveByLang(
      branding?.notFoundTitleByLang,
      branding?.notFoundTitle,
    );
    if (resolvedTitle) {
      title = resolvedTitle;
    }

    markdown = resolveByLang(
      branding?.notFoundMarkdownByLang,
      branding?.notFoundMarkdown,
    );
  } catch {
    // ignore
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>

        <div className="mt-4">
          {markdown ? (
            <div className="prose prose-zinc max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-gray-600">
              <p>Страницата, която търсиш, не съществува или е преместена.</p>
              <p>
                <Link
                  href="/"
                  className="font-semibold text-green-700 hover:text-green-800"
                >
                  Върни се към началната страница
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
