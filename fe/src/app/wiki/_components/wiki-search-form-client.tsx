"use client";

import { useState } from "react";
import { ListboxSelect } from "../../_components/listbox-select";

export function WikiSearchFormClient({
  supportedLangs,
  initialQ,
  initialLang,
}: {
  supportedLangs: string[];
  initialQ: string;
  initialLang: string;
}) {
  const [lang, setLang] = useState<string>(initialLang);

  return (
    <form
      action="/wiki"
      method="GET"
      className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center"
    >
      <div className="flex-1">
        <label htmlFor="q" className="sr-only">
          Търсене
        </label>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400"
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
            type="search"
            id="q"
            name="q"
            placeholder="Търсене на статии..."
            defaultValue={initialQ}
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="w-full md:w-48">
        <ListboxSelect
          id="lang"
          name="lang"
          ariaLabel="Език"
          value={lang}
          onChange={(next) => setLang(next)}
          buttonClassName="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          options={[
            { value: "", label: "Всички езици" },
            ...supportedLangs.map((l) => ({
              value: l,
              label: l.toUpperCase(),
            })),
          ]}
        />
      </div>

      <div className="w-full md:w-auto">
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 md:w-auto"
        >
          Търси
        </button>
      </div>
    </form>
  );
}
