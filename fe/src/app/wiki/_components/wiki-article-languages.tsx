"use client";

import { useState } from "react";

type WikiArticleLanguagesProps = {
  languages?: string[];
  collapsedCount?: number;
};

export function WikiArticleLanguages({
  languages,
  collapsedCount = 3,
}: WikiArticleLanguagesProps) {
  const [expanded, setExpanded] = useState(false);
  const uniqueLanguages = Array.from(
    new Set(
      (languages ?? [])
        .map((lng) => (lng ?? "").trim().toUpperCase())
        .filter((lng) => lng.length > 0),
    ),
  );

  if (uniqueLanguages.length === 0) {
    return null;
  }

  const visibleLanguages = expanded
    ? uniqueLanguages
    : uniqueLanguages.slice(0, collapsedCount);
  const hasOverflow = uniqueLanguages.length > collapsedCount;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
      <span className="flex items-center text-gray-600" aria-label="Езици">
        <svg
          className="mr-1 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {visibleLanguages.map((lng) => (
          <span
            key={lng}
            className="rounded-full border border-gray-300 px-2 py-0.5 text-[10px] font-semibold text-gray-700"
          >
            {lng}
          </span>
        ))}
        {hasOverflow && !expanded && (
          <button
            type="button"
            className="rounded-full border border-gray-300 px-2 py-0.5 text-[10px] font-semibold text-gray-600 transition hover:border-gray-400 hover:text-gray-800"
            onClick={() => setExpanded(true)}
          >
            List
          </button>
        )}
      </div>
    </div>
  );
}
