"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListboxSelect } from "./listbox-select";
import { useCurrentLang } from "../../i18n/useCurrentLang";
import { t } from "../../i18n/t";

type PaginationItem = number | "ellipsis";

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageParam = "page",
  pageSize,
  onPageSizeChange,
  pageSizeParam = "pageSize",
  pageSizeOptions = [10, 20, 50, 100],
}: {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  pageParam?: string;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeParam?: string;
  pageSizeOptions?: number[];
}) {
  const lang = useCurrentLang();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const safeTotalPages =
    Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1;
  const safeCurrentPage = Math.min(
    Math.max(
      Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1,
      1,
    ),
    safeTotalPages,
  );

  const [goToRaw, setGoToRaw] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const safePageSizeOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        (pageSizeOptions ?? [])
          .map((n) => Number(n))
          .filter((n) => Number.isFinite(n) && n > 0),
      ),
    ).sort((a, b) => a - b);

    return unique.length > 0 ? unique : [10, 20, 50, 100];
  }, [pageSizeOptions]);

  const currentPageSize = (() => {
    if (
      typeof pageSize === "number" &&
      Number.isFinite(pageSize) &&
      pageSize > 0
    ) {
      return Math.trunc(pageSize);
    }

    const raw = searchParams?.get(pageSizeParam);
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    return safePageSizeOptions.includes(20)
      ? 20
      : (safePageSizeOptions[0] ?? 20);
  })();

  const setPageSizeAndReset = (nextSize: number) => {
    const normalized = Number.isFinite(nextSize) ? Math.trunc(nextSize) : NaN;
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return;
    }

    setError(null);
    setGoToRaw("");

    if (onPageSizeChange) {
      onPageSizeChange(normalized);
      return;
    }

    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set(pageSizeParam, String(normalized));
    params.delete(pageParam);

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const items = useMemo<PaginationItem[]>(() => {
    const result: PaginationItem[] = [];

    if (safeTotalPages <= 1) {
      return result;
    }

    if (safeTotalPages <= 7) {
      for (let page = 1; page <= safeTotalPages; page += 1) {
        result.push(page);
      }
      return result;
    }

    const firstPage = 1;
    const lastPage = safeTotalPages;

    result.push(firstPage);

    const startPage = Math.max(safeCurrentPage - 1, firstPage + 1);
    const endPage = Math.min(safeCurrentPage + 1, lastPage - 1);

    if (startPage > firstPage + 1) {
      result.push("ellipsis");
    }

    for (let page = startPage; page <= endPage; page += 1) {
      result.push(page);
    }

    if (endPage < lastPage - 1) {
      result.push("ellipsis");
    }

    result.push(lastPage);

    return result;
  }, [safeCurrentPage, safeTotalPages]);

  const navigateToPage = (nextPage: number) => {
    const normalized = Number.isFinite(nextPage) ? Math.trunc(nextPage) : NaN;

    if (
      !Number.isFinite(normalized) ||
      normalized < 1 ||
      normalized > safeTotalPages
    ) {
      setError(
        `${t(lang, "common", "paginationInvalidPagePrefix")} (1 - ${safeTotalPages}).`,
      );
      return;
    }

    setError(null);
    setGoToRaw("");

    if (onPageChange) {
      onPageChange(normalized);
      return;
    }

    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (normalized <= 1) {
      params.delete(pageParam);
    } else {
      params.set(pageParam, String(normalized));
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const prevDisabled = safeCurrentPage <= 1;
  const nextDisabled = safeCurrentPage >= safeTotalPages;

  const showPageControls = safeTotalPages > 1;
  const showPageSizeSelector = safePageSizeOptions.length > 0;

  if (!showPageControls && !showPageSizeSelector) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 md:text-sm">
              {t(lang, "common", "paginationPerPage")}
            </span>
            <div className="w-[140px]">
              <ListboxSelect
                ariaLabel={t(lang, "common", "paginationRowsPerPageAria")}
                value={String(currentPageSize)}
                onChange={(next) => {
                  const parsed = Number.parseInt(next, 10);
                  setPageSizeAndReset(parsed);
                }}
                buttonClassName="flex w-full items-center justify-between gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs text-[color:var(--foreground)] shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)] md:text-sm"
                options={safePageSizeOptions.map((n) => ({
                  value: String(n),
                  label: String(n),
                }))}
              />
            </div>
          </div>
        )}

        {showPageControls && (
          <>
            <button
              type="button"
              onClick={() => navigateToPage(1)}
              className="be-btn-ghost rounded-lg border px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
              disabled={prevDisabled}
            >
              {t(lang, "common", "paginationFirst")}
            </button>

            <button
              type="button"
              onClick={() => navigateToPage(safeCurrentPage - 1)}
              className="be-btn-ghost rounded-lg border px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
              disabled={prevDisabled}
            >
              {t(lang, "common", "paginationPrevious")}
            </button>

            {items.map((item, index) => {
              if (item === "ellipsis") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-500 md:text-sm"
                  >
                    ...
                  </span>
                );
              }

              const pageNumber = item;
              const isActive = pageNumber === safeCurrentPage;

              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => navigateToPage(pageNumber)}
                  className={
                    isActive
                      ? "rounded-lg border px-3 py-2 text-xs font-semibold md:text-sm"
                      : "be-btn-ghost rounded-lg border px-3 py-2 text-xs md:text-sm"
                  }
                  style={
                    isActive
                      ? {
                          backgroundColor: "var(--primary)",
                          borderColor: "var(--primary)",
                          color: "var(--on-primary)",
                        }
                      : undefined
                  }
                  disabled={isActive}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => navigateToPage(safeCurrentPage + 1)}
              className="be-btn-ghost rounded-lg border px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
              disabled={nextDisabled}
            >
              {t(lang, "common", "paginationNext")}
            </button>

            <button
              type="button"
              onClick={() => navigateToPage(safeTotalPages)}
              className="be-btn-ghost rounded-lg border px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
              disabled={nextDisabled}
            >
              {t(lang, "common", "paginationLast")}
            </button>

            <div className="flex items-center gap-2">
              <input
                value={goToRaw}
                onChange={(event) => {
                  const value = event.target.value;
                  const digitsOnly = value.replace(/\D+/g, "");
                  setGoToRaw(digitsOnly);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  const allowedKeys = new Set([
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "Home",
                    "End",
                    "Tab",
                  ]);

                  if (allowedKeys.has(event.key)) return;

                  if (event.key === "Enter") {
                    event.preventDefault();
                    const parsed = Number.parseInt(goToRaw, 10);
                    navigateToPage(parsed);
                    return;
                  }

                  if (event.ctrlKey || event.metaKey || event.altKey) return;

                  if (!/^[0-9]$/.test(event.key)) {
                    event.preventDefault();
                  }
                }}
                inputMode="numeric"
                type="text"
                pattern="\\d*"
                className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 md:text-sm"
                aria-label={t(lang, "common", "paginationGoToPageAria")}
                placeholder="#"
              />
              <button
                type="button"
                onClick={() => {
                  const parsed = Number.parseInt(goToRaw, 10);
                  navigateToPage(parsed);
                }}
                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                disabled={!goToRaw.trim()}
              >
                {t(lang, "common", "paginationGo")}
              </button>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
