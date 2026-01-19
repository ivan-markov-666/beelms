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

  if (uniqueLanguages.length <= 1) {
    return null;
  }

  const visibleLanguages = expanded
    ? uniqueLanguages
    : uniqueLanguages.slice(0, collapsedCount);
  const hasOverflow = uniqueLanguages.length > collapsedCount;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
      <span className="font-semibold uppercase text-gray-600">Езици:</span>
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
