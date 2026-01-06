"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_SCALE_KEY = "beelms.a11yScale";
const STORAGE_CONTRAST_KEY = "beelms.a11yContrast";

type ScaleOption = 100 | 110 | 120 | 130 | 140;

type AccessibilityWidgetVariant = "header" | "floating";

function applyA11y(scale: ScaleOption, highContrast: boolean) {
  const root = document.documentElement;
  root.setAttribute("data-a11y-scale", String(scale));
  root.setAttribute("data-a11y-contrast", highContrast ? "high" : "normal");
}

function readScale(raw: string | null): ScaleOption {
  const v = Number(raw);
  if (v === 110 || v === 120 || v === 130 || v === 140) return v;
  return 100;
}

function readContrast(raw: string | null): boolean {
  return raw === "high";
}

export function AccessibilityWidget({
  variant = "header",
}: {
  variant?: AccessibilityWidgetVariant;
}) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState<ScaleOption>(() => {
    if (typeof window === "undefined") {
      return 100;
    }
    return readScale(localStorage.getItem(STORAGE_SCALE_KEY));
  });
  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return readContrast(localStorage.getItem(STORAGE_CONTRAST_KEY));
  });

  const scaleOptions = useMemo<ScaleOption[]>(
    () => [100, 110, 120, 130, 140],
    [],
  );

  useEffect(() => {
    applyA11y(scale, highContrast);
    localStorage.setItem(STORAGE_SCALE_KEY, String(scale));
    localStorage.setItem(
      STORAGE_CONTRAST_KEY,
      highContrast ? "high" : "normal",
    );
  }, [highContrast, scale]);

  return (
    <div
      className={
        variant === "floating" ? "fixed bottom-4 right-4 z-50" : "relative z-50"
      }
    >
      {open ? (
        <div
          className={
            variant === "floating"
              ? "mb-3 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
              : "absolute right-0 top-full mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Accessibility
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Локални настройки (само за този браузър).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              aria-label="Close accessibility settings"
            >
              Close
            </button>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-700">Text size</p>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {scaleOptions.map((opt) => {
                const isActive = opt === scale;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setScale(opt)}
                    className={
                      isActive
                        ? "rounded-md border border-green-600 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700"
                        : "rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    }
                    aria-pressed={isActive}
                  >
                    {opt}%
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-700">
                High contrast
              </p>
              <p className="mt-1 text-xs text-gray-600">
                По-видими граници, placeholder-и и focus.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHighContrast((v) => !v)}
              className={
                highContrast
                  ? "rounded-md border border-green-600 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700"
                  : "rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              }
              aria-pressed={highContrast}
            >
              {highContrast ? "ON" : "OFF"}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setScale(100);
                setHighContrast(false);
              }}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-green-600 bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          variant === "floating"
            ? "inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-700 shadow-md hover:bg-gray-50"
            : "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        }
        aria-label="Open accessibility settings"
        aria-expanded={open}
      >
        Aa
      </button>
    </div>
  );
}
