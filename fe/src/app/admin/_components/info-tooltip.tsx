"use client";

import { ReactNode, MouseEvent as ReactMouseEvent } from "react";

export function InfoTooltip({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: ReactNode;
}) {
  const stopPropagation = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <button
      type="button"
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      className="group relative inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-[11px] font-semibold text-gray-600 transition hover:border-green-500 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
      aria-label={label}
    >
      ?
      <div className="pointer-events-none absolute right-0 top-6 z-20 hidden w-80 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 shadow-xl group-hover:block group-focus-visible:block">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </p>
        <div className="mt-2 text-sm leading-relaxed text-gray-800">
          {description}
        </div>
      </div>
    </button>
  );
}
