"use client";

import { useState } from "react";
import { ListboxSelect } from "../../_components/listbox-select";

export function CoursesFiltersFormClient({
  initialQ,
  initialLanguage,
  initialPaid,
  selectedCategory,
  sortKey,
  sortDir,
}: {
  initialQ: string;
  initialLanguage: string;
  initialPaid: string;
  selectedCategory: string;
  sortKey: string;
  sortDir: string;
}) {
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [paid, setPaid] = useState<string>(initialPaid);

  return (
    <form
      className="grid grid-cols-1 gap-3 md:grid-cols-5"
      action="/courses"
      method="GET"
    >
      <input type="hidden" name="category" value={selectedCategory} />
      <input type="hidden" name="sortKey" value={sortKey} />
      <input type="hidden" name="sortDir" value={sortDir} />

      <div className="md:col-span-2">
        <label htmlFor="q" className="sr-only">
          Търсене на курсове
        </label>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={initialQ}
            placeholder="Search by title, description, category..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="language" className="sr-only">
          Language
        </label>
        <ListboxSelect
          id="language"
          name="language"
          ariaLabel="Language"
          value={language}
          onChange={(next) => setLanguage(next)}
          buttonClassName="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          options={[
            { value: "", label: "All languages" },
            { value: "bg", label: "bg" },
            { value: "en", label: "en" },
          ]}
        />
      </div>

      <div>
        <label htmlFor="paid" className="sr-only">
          Pricing
        </label>
        <ListboxSelect
          id="paid"
          name="paid"
          ariaLabel="Pricing"
          value={paid}
          onChange={(next) => setPaid(next)}
          buttonClassName="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          options={[
            { value: "", label: "All pricing" },
            { value: "free", label: "Free" },
            { value: "paid", label: "Paid" },
          ]}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Search
        </button>
      </div>
    </form>
  );
}
