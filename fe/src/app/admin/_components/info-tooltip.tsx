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
    "relative inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border bg-[color:var(--card)] text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)]";
  const paletteStyle = open
    ? {
        borderColor: "var(--primary)",
        color: "var(--on-primary)",
        backgroundColor: "color-mix(in srgb, var(--primary) 18%, var(--card))",
      }
    : {
        borderColor: "var(--border)",
        color: "color-mix(in srgb, var(--foreground) 70%, var(--card))",
      };

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
      className={baseClasses}
      style={paletteStyle}
      aria-label={label}
    >
      ?
      {open ? (
        <div
          className="pointer-events-none absolute right-0 top-6 z-20 w-80 rounded-md border p-3 text-sm shadow-xl"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          <p
            className="text-[13px] font-semibold uppercase tracking-wide"
            style={{ color: "color-mix(in srgb, var(--foreground) 65%, var(--card))" }}
          >
            {title}
          </p>
          <div className="mt-2 text-sm leading-relaxed">
            {description}
          </div>
        </div>
      ) : null}
    </button>
  );
}
