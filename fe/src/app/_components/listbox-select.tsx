"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ListboxSelectOption<T extends string> = {
  value: T;
  label: string;
};

export function ListboxSelect<T extends string>({
  id,
  name,
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
  placeholder,
  className,
  buttonClassName,
  listClassName,
}: {
  id?: string;
  name?: string;
  value: T;
  options: Array<ListboxSelectOption<T>>;
  onChange: (next: T) => void;
  disabled?: boolean;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  listClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [portalStyle, setPortalStyle] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  const selected = useMemo(() => {
    const match = options.find((o) => o.value === value);
    return match ?? null;
  }, [options, value]);

  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;

    const computePosition = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const margin = 4;
      const maxListHeight = 240;
      const estimatedRowHeight = 36;
      const estimatedListChrome = 8;
      const estimatedListHeight = Math.min(
        maxListHeight,
        options.length * estimatedRowHeight + estimatedListChrome,
      );
      const availableBelow = window.innerHeight - rect.bottom - margin;
      const shouldOpenUp =
        availableBelow < Math.min(180, Math.max(120, estimatedListHeight));
      const top = shouldOpenUp
        ? Math.max(margin, rect.top - margin - estimatedListHeight)
        : rect.bottom + margin;
      setPortalStyle({
        left: Math.max(margin, rect.left),
        top,
        width: rect.width,
      });
    };

    computePosition();

    const handle = (event: MouseEvent) => {
      const root = rootRef.current;
      const list = listRef.current;
      if (!root) return;
      const target = event.target as Node | null;
      if (!target) return;
      if (root.contains(target)) return;
      if (list && list.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener("mousedown", handle);
    window.addEventListener("resize", computePosition);
    window.addEventListener("scroll", computePosition, true);

    return () => {
      window.removeEventListener("mousedown", handle);
      window.removeEventListener("resize", computePosition);
      window.removeEventListener("scroll", computePosition, true);
    };
  }, [open, options.length]);

  const label = selected?.label ?? placeholder ?? "—";
  const hiddenInputId = id ? `${id}__hidden` : undefined;
  const listboxId = id ? `${id}__listbox` : undefined;

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`.trim()}>
      {name ? (
        <input type="hidden" id={hiddenInputId} name={name} value={value} />
      ) : null}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        value={value}
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          id && value ? `${id}__opt__${String(value)}` : undefined
        }
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
          if (event.key === "ArrowDown") {
            setOpen(true);
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        className={
          buttonClassName ??
          "flex w-full items-center justify-between gap-2 rounded-lg border border-[color:var(--border)] bg-white px-4 py-2 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        <span className="truncate">{label}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-zinc-500 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && typeof document !== "undefined" && portalStyle
        ? createPortal(
            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label={ariaLabel}
              className={
                listClassName ??
                "z-[9999] max-h-60 overflow-auto rounded-lg border border-[color:var(--border)] bg-white py-1 shadow-lg"
              }
              style={{
                position: "fixed",
                left: portalStyle.left,
                top: portalStyle.top,
                width: portalStyle.width,
              }}
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    id={id ? `${id}__opt__${String(opt.value)}` : undefined}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    disabled={disabled}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 ${
                      isSelected
                        ? "font-semibold text-[color:var(--foreground)]"
                        : "text-zinc-700"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected ? <span aria-hidden="true">✓</span> : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
