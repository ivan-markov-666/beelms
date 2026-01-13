import { normalizeLang, type SupportedLang } from "../../../i18n/config";
import { t } from "../../../i18n/t";
import { buildApiUrl } from "../../api-url";
import { WikiMarkdown } from "../../wiki/_components/wiki-markdown";
import { notFound } from "next/navigation";

type LegalPageDto = {
  slug: string;
  title: string;
  contentMarkdown: string;
  updatedAt: string;
};

async function fetchLegalPrivacy(lang: SupportedLang): Promise<LegalPageDto> {
  const query = lang ? `?lang=${encodeURIComponent(lang)}` : "";
  const res = await fetch(buildApiUrl(`/legal/privacy${query}`), {
    next: { revalidate: 60 },
  });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    throw new Error("Failed to load Privacy");
  }

  return res.json();
}

type LegalPageSearchParams = {
  lang?: string;
};

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams?: LegalPageSearchParams | Promise<LegalPageSearchParams>;
} = {}) {
  const resolvedSearchParams = ((await searchParams) ??
    {}) as LegalPageSearchParams;

  const rawLang = resolvedSearchParams.lang ?? null;
  const lang: SupportedLang = normalizeLang(rawLang);
  const page = await fetchLegalPrivacy(lang);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
          Legal / GDPR
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {page.title || t(lang, "common", "legalPrivacyTitle")}
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          {t(lang, "common", "legalPrivacyIntro")}
        </p>
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
