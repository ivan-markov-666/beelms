"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type DemoItem = {
  id: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
};

const DEMO_ITEMS: DemoItem[] = [
  { id: 1, title: "Вход с валидни данни", difficulty: "easy" },
  { id: 2, title: "Валидиране на задължителни полета", difficulty: "medium" },
  { id: 3, title: "Промяна на филтър и сортиране", difficulty: "medium" },
  { id: 4, title: "Грешни данни и съобщения за грешка", difficulty: "hard" },
];

const INTEREST_OPTIONS = [
  "Функционално тестване",
  "UI automation",
  "Достъпност",
];

const BROWSER_OPTIONS = ["Chrome", "Firefox", "Edge"];

function isValidEmail(value: string) {
  if (!value) return false;
  return /.+@.+\..+/.test(value);
}

export function UiDemoSandbox() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [preferredBrowser, setPreferredBrowser] = useState<string>("Chrome");
  const [filterDifficulty, setFilterDifficulty] = useState<
    "all" | "easy" | "medium" | "hard"
  >("all");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState<string | null>(null);
  const [taskDescription, setTaskDescription] = useState<string | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTask = async () => {
      if (typeof fetch === "undefined") {
        setTaskError("Tasks API не е достъпен в тази среда.");
        return;
      }

      setTaskLoading(true);
      setTaskError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/tasks/string-hello-world`);

        if (!res.ok) {
          throw new Error("Tasks API request failed");
        }

        const data = (await res.json()) as {
          title?: string;
          description?: string;
        };

        if (cancelled) {
          return;
        }

        setTaskTitle(data.title ?? null);
        setTaskDescription(data.description ?? null);
      } catch {
        if (cancelled) {
          return;
        }

        setTaskError("Неуспешно зареждане на примерната задача.");
        setTaskTitle(null);
        setTaskDescription(null);
      } finally {
        if (!cancelled) {
          setTaskLoading(false);
        }
      }
    };

    void loadTask();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (filterDifficulty === "all") return DEMO_ITEMS;
    return DEMO_ITEMS.filter((item) => item.difficulty === filterDifficulty);
  }, [filterDifficulty]);

  const handleToggleInterest = (value: string) => {
    setSelectedInterests((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }
      return [...current, value];
    });
  };

  const handleSave = () => {
    const nextErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      nextErrors.name = "Моля, въведете име.";
    }

    if (!email.trim()) {
      nextErrors.email = "Моля, въведете имейл.";
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = "Моля, въведете валиден имейл адрес.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      setSaveMessage("Формата е попълнена коректно.");
    } else {
      setSaveMessage(null);
    }
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setErrors({});
    setDifficulty("medium");
    setSelectedInterests([]);
    setPreferredBrowser("Chrome");
    setFilterDifficulty("all");
    setSaveMessage(null);
  };

  return (
    <section className="space-y-6 rounded-lg border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        UI Demo – елементи за упражнения
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Име
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
            {errors.name && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Имейл
            </label>
            <input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
            {errors.email && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="difficulty"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Ниво на трудност
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as "easy" | "medium" | "hard")
              }
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="easy">Лесно</option>
              <option value="medium">Средно</option>
              <option value="hard">Трудно</option>
            </select>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Избрано ниво: {difficulty === "easy" && "Лесно"}
              {difficulty === "medium" && "Средно"}
              {difficulty === "hard" && "Трудно"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Тип тестване
            </legend>
            {INTEREST_OPTIONS.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedInterests.includes(option)}
                  onChange={() => handleToggleInterest(option)}
                />
                <span>{option}</span>
              </label>
            ))}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Избрани: {selectedInterests.length > 0 ? selectedInterests.join(", ") : "няма"}
            </p>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Предпочитан браузър
            </legend>
            {BROWSER_OPTIONS.map((browser) => (
              <label key={browser} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="preferred-browser"
                  value={browser}
                  checked={preferredBrowser === browser}
                  onChange={(e) => setPreferredBrowser(e.target.value)}
                />
                <span>{browser}</span>
              </label>
            ))}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Избран браузър: {preferredBrowser}
            </p>
          </fieldset>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:ring-offset-zinc-900"
        >
          Запази
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900 dark:ring-offset-zinc-900"
        >
          Преглед
        </button>
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-400 shadow-sm dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-500"
        >
          Disabled
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="ml-auto inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900 dark:ring-offset-zinc-900"
        >
          Reset
        </button>
      </div>

      {saveMessage && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          {saveMessage}
        </p>
      )}

      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Демо задачи
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Филтрирайте списъка по ниво на трудност и наблюдавайте резултатите.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="filter-difficulty"
              className="text-xs font-medium text-zinc-600 dark:text-zinc-300"
            >
              Филтър по трудност
            </label>
            <select
              id="filter-difficulty"
              value={filterDifficulty}
              onChange={(e) =>
                setFilterDifficulty(
                  e.target.value as "all" | "easy" | "medium" | "hard",
                )
              }
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="all">Всички</option>
              <option value="easy">Лесни</option>
              <option value="medium">Средни</option>
              <option value="hard">Трудни</option>
            </select>
          </div>
        </div>

        <table className="w-full table-auto border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="px-2 py-1">Задача</th>
              <th className="px-2 py-1">Трудност</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr
                key={item.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
              >
                <td className="px-2 py-1 text-zinc-900 dark:text-zinc-50">
                  {item.title}
                </td>
                <td className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300">
                  {item.difficulty === "easy" && "Лесно"}
                  {item.difficulty === "medium" && "Средно"}
                  {item.difficulty === "hard" && "Трудно"}
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="px-2 py-3 text-xs text-zinc-500 dark:text-zinc-400"
                >
                  Няма задачи за избраната трудност.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/40 p-3 text-xs text-zinc-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-zinc-100">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Примерна задача от Tasks API
        </p>
        {taskLoading && <p>Зареждане на примерна задача...</p>}
        {taskError && (
          <p className="text-xs text-red-600 dark:text-red-400">{taskError}</p>
        )}
        {!taskLoading && !taskError && taskTitle && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {taskTitle}
            </p>
            {taskDescription && (
              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                {taskDescription}
              </p>
            )}
          </div>
        )}
        {!taskLoading && !taskError && !taskTitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Няма заредена примерна задача в момента.
          </p>
        )}
      </div>
    </section>
  );
}
