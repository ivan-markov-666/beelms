"use client";

import { useMemo, useState } from "react";

import type { SupportedLang } from "../../../i18n/config";
import { t } from "../../../i18n/t";
import { getAccessToken } from "../../auth-token";
import { buildApiUrl } from "../../api-url";

type FeedbackSummary = {
  helpfulYes: number;
  helpfulNo: number;
  total: number;
};

type WikiArticleFeedbackProps = {
  slug: string;
  lang: SupportedLang;
  initialSummary?: FeedbackSummary;
};

export function WikiArticleFeedback({
  slug,
  lang,
  initialSummary,
}: WikiArticleFeedbackProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FeedbackSummary | null>(
    initialSummary ?? null,
  );

  const summaryText = useMemo(() => {
    if (!summary) return null;

    return `${summary.helpfulYes} ${t(lang, "wiki", "articleHelpfulYes")}, ${summary.helpfulNo} ${t(lang, "wiki", "articleHelpfulNo")}`;
  }, [lang, summary]);

  const refreshSummary = async () => {
    try {
      const url = new URL(
        buildApiUrl(`/wiki/articles/${slug}/feedback/summary`),
      );
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as FeedbackSummary;
      setSummary(data);
    } catch {
      // ignore
    }
  };

  const submit = async (helpful: boolean) => {
    setError(null);
    setSubmitting(true);

    try {
      const token = getAccessToken();
      const res = await fetch(buildApiUrl(`/wiki/articles/${slug}/feedback`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ helpful }),
      });

      if (!res.ok) {
        setError(t(lang, "wiki", "articleHelpfulError"));
        return;
      }

      setSubmitted(true);
      await refreshSummary();
    } catch {
      setError(t(lang, "wiki", "articleHelpfulError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-10 w-full max-w-4xl rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-zinc-900">
          {t(lang, "wiki", "articleHelpfulPrompt")}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 disabled:opacity-60"
            onClick={() => void submit(true)}
            disabled={submitting}
          >
            {t(lang, "wiki", "articleHelpfulYes")}
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 disabled:opacity-60"
            onClick={() => void submit(false)}
            disabled={submitting}
          >
            {t(lang, "wiki", "articleHelpfulNo")}
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {submitted && (
          <p className="text-xs text-green-700">
            {t(lang, "wiki", "articleHelpfulThanks")}
          </p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
        {summaryText && <p className="text-xs text-zinc-600">{summaryText}</p>}
      </div>
    </section>
  );
}
