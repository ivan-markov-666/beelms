"use client";

import { type CSSProperties, type ReactNode } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel,
  cancelLabel,
  danger,
  submitting,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  details?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  submitting?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  const dangerNoticeStyle: CSSProperties = danger
    ? {
        backgroundColor: "var(--field-error-bg)",
        borderColor: "var(--field-error-border)",
        color: "var(--error)",
      }
    : {};

  const confirmButtonStyle: CSSProperties = danger
    ? {
        backgroundColor: "var(--error)",
        color: "var(--on-error)",
        borderColor: "var(--error)",
      }
    : {
        backgroundColor: "var(--primary)",
        color: "var(--on-primary)",
        borderColor: "var(--primary)",
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="w-full max-w-md rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="mb-2 text-base font-semibold text-[color:var(--foreground)]">
          {title}
        </h3>

        {(description || danger) && (
          <div
            className={
              danger
                ? "mb-4 rounded-md border px-4 py-3 text-sm"
                : "mb-4 text-sm text-[color:var(--foreground)]"
            }
            style={dangerNoticeStyle}
          >
            {description ? <p>{description}</p> : null}
          </div>
        )}

        {details ? (
          <div className="mb-4 text-xs text-[color:var(--foreground)]">
            {details}
          </div>
        ) : null}

        {error ? (
          <p
            className="mb-3 text-xs"
            style={{ color: "var(--error)" }}
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-6">
          <button
            type="button"
            className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-70"
            onClick={onCancel}
            disabled={!!submitting}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            style={confirmButtonStyle}
            onClick={onConfirm}
            disabled={!!submitting}
          >
            {submitting ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
