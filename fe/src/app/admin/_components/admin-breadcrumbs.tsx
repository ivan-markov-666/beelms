"use client";

import { Fragment } from "react";
import Link from "next/link";
import type { ReactNode } from "react";

type BreadcrumbItem = {
  label: ReactNode;
  href?: string;
};

type AdminBreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function AdminBreadcrumbs({ items, className }: AdminBreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const brandingFontStyle = {
    fontFamily: "var(--font-sans), Arial, Helvetica, sans-serif",
  } as const;

  const homeItem: BreadcrumbItem = {
    label: "Начало",
    href: "/",
  };

  const hasHome =
    items[0]?.href === homeItem.href ||
    (typeof items[0]?.label === "string" && items[0]?.label === homeItem.label);

  const normalizedItems = hasHome ? items : [homeItem, ...items];

  const baseClassName = "flex items-center text-sm text-gray-500 nav-font";
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
              className="mx-2 h-4 w-4 text-gray-400"
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
              className="hover:text-green-600"
              prefetch={false}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
