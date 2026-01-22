"use client";

import { useState } from "react";

import type { SupportedLang } from "../../../i18n/config";
import { t } from "../../../i18n/t";

type WikiArticleActionsProps = {
  title: string;
  lang: SupportedLang;
};

export function WikiArticleActions({ title, lang }: WikiArticleActionsProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setFeedback(t(lang, "wiki", "articleShareSuccess"));
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setFeedback(t(lang, "wiki", "articleShareClipboard"));
        return;
      }

      window.alert(url);
    } catch {
      setFeedback(t(lang, "wiki", "articleShareError"));
    }
  };

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  return (
    <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)]"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
          onClick={handleShare}
        >
          {t(lang, "wiki", "articleShareButton")}
        </button>
        <button
          type="button"
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)]"
          style={{
            backgroundColor: "var(--primary)",
            borderColor: "var(--primary)",
            color: "var(--on-primary)",
          }}
          onClick={handlePrint}
        >
          {t(lang, "wiki", "articlePrintButton")}
        </button>
      </div>
      {feedback && (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">{feedback}</p>
      )}
    </div>
  );
}
