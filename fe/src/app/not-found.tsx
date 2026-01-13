import Link from "next/link";
import { cookies, headers } from "next/headers";
import { getPublicSettings } from "./_data/public-settings";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { normalizeLang } from "../i18n/config";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  let title = "Страницата не е намерена";
  let markdown: string | null = null;
  let fallbackText =
    "Страницата, която търсиш, не съществува или е преместена.";
  let fallbackLinkText = "Върни се към началната страница";

  const fallbackStringsByLang: Record<
    string,
    { title: string; text: string; linkText: string }
  > = {
    bg: {
      title: "Страницата не е намерена",
      text: "Страницата, която търсиш, не съществува или е преместена.",
      linkText: "Върни се към началната страница",
    },
    en: {
      title: "Page not found",
      text: "The page you are looking for does not exist or has been moved.",
      linkText: "Back to home",
    },
  };

  let rawLang: string | null = null;
  try {
    const h = await headers();
    rawLang = h.get("x-ui-lang");
  } catch {
    // ignore
  }

  try {
    if (!rawLang) {
      const c = await cookies();
      rawLang = c.get("ui_lang")?.value ?? null;
    }
  } catch {
    // ignore
  }

  const baseLang = normalizeLang(rawLang);
  const baseFallbackStrings =
    fallbackStringsByLang[baseLang] ?? fallbackStringsByLang.bg;
  title = baseFallbackStrings.title;
  fallbackText = baseFallbackStrings.text;
  fallbackLinkText = baseFallbackStrings.linkText;

  try {
    const settings = await getPublicSettings();
    const branding = settings?.branding;
    const notFoundEnabled = settings?.features?.pageNotFound !== false;

    const supportedLangs = settings?.languages?.supported ?? undefined;
    const fallbackLang = settings?.languages?.default ?? undefined;
    const lang = normalizeLang(rawLang, supportedLangs, fallbackLang);

    const resolvedFallbackStrings =
      fallbackStringsByLang[lang] ??
      (fallbackLang ? fallbackStringsByLang[fallbackLang] : undefined) ??
      fallbackStringsByLang.bg;

    title = resolvedFallbackStrings.title;
    fallbackText = resolvedFallbackStrings.text;
    fallbackLinkText = resolvedFallbackStrings.linkText;

    const resolveByLang = (
      byLang: Record<string, string | null> | null | undefined,
      globalValue: string | null | undefined,
    ): string | null => {
      const candidate = (byLang?.[lang] ?? "").trim();
      if (candidate) return candidate;
      const fallback = (globalValue ?? "").trim();
      return fallback || null;
    };

    if (notFoundEnabled) {
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
    }
  } catch {
    // ignore
  }

  return (
    <main
      data-page="not-found"
      data-ui-lang={baseLang}
      className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col justify-center px-4 py-12"
    >
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
              <p>{fallbackText}</p>
              <p>
                <Link
                  href="/"
                  className="font-semibold text-green-700 hover:text-green-800"
                >
                  {fallbackLinkText}
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
