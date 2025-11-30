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
          className="inline-flex items-center rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 dark:border-zinc-600 dark:text-zinc-50 dark:hover:bg-zinc-800"
          onClick={handleShare}
        >
          {t(lang, "wiki", "articleShareButton")}
        </button>
        <button
          type="button"
          className="inline-flex items-center rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
