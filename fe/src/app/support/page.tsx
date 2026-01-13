import { normalizeLang, type SupportedLang } from "../../i18n/config";
import { buildApiUrl } from "../api-url";
import { WikiMarkdown } from "../wiki/_components/wiki-markdown";
import { notFound } from "next/navigation";

type ContentPageDto = {
  slug: string;
  title: string;
  contentMarkdown: string;
  updatedAt: string;
};

async function fetchSupport(lang: SupportedLang): Promise<ContentPageDto> {
  const query = lang ? `?lang=${encodeURIComponent(lang)}` : "";
  const res = await fetch(buildApiUrl(`/pages/support${query}`), {
    next: { revalidate: 60 },
  });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    throw new Error("Failed to load Support");
  }

  return res.json();
}

type PageSearchParams = {
  lang?: string;
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams?: PageSearchParams | Promise<PageSearchParams>;
} = {}) {
  const resolvedSearchParams = ((await searchParams) ?? {}) as PageSearchParams;
  const rawLang = resolvedSearchParams.lang ?? null;
  const lang: SupportedLang = normalizeLang(rawLang);
  const page = await fetchSupport(lang);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
          Pages / Support
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {page.title || "Support"}
        </h1>
      </header>

      <section className="space-y-4 text-sm text-zinc-700 dark:text-zinc-200">
        <article
          className="wiki-markdown w-full text-base leading-relaxed"
          style={{ color: "#111827" }}
        >
          <WikiMarkdown content={page.contentMarkdown} />
        </article>
      </section>
    </main>
  );
}
