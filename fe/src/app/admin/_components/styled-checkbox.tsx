"use client";

import { useId } from "react";

export function StyledCheckbox({
  checked,
  onChange,
  disabled,
  ariaLabel,
  size,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
  size?: "sm" | "md" | "lg";
}) {
  const id = useId();

  const sizeClassName = (() => {
    if (size === "lg") return "h-8 w-8";
    if (size === "sm") return "h-5 w-5";
    return "h-6 w-6";
  })();

  const iconClassName = (() => {
    if (size === "lg") return "h-5 w-5";
    if (size === "sm") return "h-3.5 w-3.5";
    return "h-4 w-4";
  })();

  return (
    <div className="inline-flex items-center">
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={!!disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
      />
      <label
        htmlFor={id}
        className={
          `relative inline-flex ${sizeClassName} cursor-pointer items-center justify-center rounded-[8px] border bg-[color:var(--card)] shadow-sm transition ` +
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-[color:var(--primary)] focus-within:ring-offset-2 focus-within:ring-offset-[color:var(--card)] " +
          "hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,var(--card))] " +
          (disabled ? "cursor-not-allowed opacity-60 " : "") +
          (checked
            ? "border-[color:var(--primary)] bg-[color:var(--primary)] "
            : "border-[color:var(--border)] ")
        }
      >
        <svg
          className={
            `${iconClassName} text-white transition ` +
            (checked ? "opacity-100" : "opacity-0")
          }
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M16.25 5.5L8.5 13.25L3.75 8.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </label>
    </div>
  );
}
