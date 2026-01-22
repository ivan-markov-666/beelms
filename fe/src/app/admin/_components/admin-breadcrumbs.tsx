"use client";

import { Fragment } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";

type BreadcrumbItem = {
  label: ReactNode;
  href?: string;
};

type AdminBreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function AdminBreadcrumbs({ items, className }: AdminBreadcrumbsProps) {
  const lang = useCurrentLang();

  if (!items || items.length === 0) {
    return null;
  }

  const brandingFontStyle = {
    fontFamily: "var(--font-sans), Arial, Helvetica, sans-serif",
  } as const;

  const homeItem: BreadcrumbItem = {
    label: t(lang, "common", "adminDashboardBreadcrumbHome"),
    href: "/",
  };

  const hasHome =
    items[0]?.href === homeItem.href ||
    (typeof items[0]?.label === "string" && items[0]?.label === homeItem.label);

  const normalizedItems = hasHome ? items : [homeItem, ...items];

  const baseClassName =
    "flex items-center text-sm nav-font text-[color:var(--foreground)] opacity-70";
  const composedClassName = className
    ? `${baseClassName} ${className}`
    : baseClassName;

  return (
    <nav className={composedClassName} style={brandingFontStyle}>
      {normalizedItems.map((item, index) => (
        <Fragment
          key={`${typeof item.label === "string" ? item.label : index}-${index}`}
        >
          {index > 0 && (
            <svg
              className="mx-2 h-4 w-4 text-[color:var(--foreground)] opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-[color:var(--primary)] hover:underline"
              prefetch={false}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[color:var(--foreground)]">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
