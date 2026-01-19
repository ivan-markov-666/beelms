"use client";

import {
  ReactNode,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useState,
} from "react";

export function InfoTooltip({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const stopPropagation = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);

  const baseClasses =
    "relative inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border bg-white text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-green-500";
  const palette = open
    ? "border-green-500 text-green-600"
    : "border-gray-300 text-gray-600";

  return (
    <button
      type="button"
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className={`${baseClasses} ${palette}`}
      aria-label={label}
    >
      ?
      {open ? (
        <div className="pointer-events-none absolute right-0 top-6 z-20 w-80 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 shadow-xl">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-500">
            {title}
          </p>
          <div className="mt-2 text-sm leading-relaxed text-gray-800">
            {description}
          </div>
        </div>
      ) : null}
    </button>
  );
}
