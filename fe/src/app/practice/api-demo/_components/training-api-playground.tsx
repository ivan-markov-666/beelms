"use client";

import { useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function formatJson(value: JsonValue | undefined): string {
  if (typeof value === "undefined") {
    return "";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function TrainingApiPlayground() {
  const [pingLoading, setPingLoading] = useState(false);
  const [pingError, setPingError] = useState<string | null>(null);
  const [pingResponse, setPingResponse] = useState<JsonValue | undefined>(
    undefined,
  );

  const [echoInput, setEchoInput] = useState("hello from UI");
  const [echoLoading, setEchoLoading] = useState(false);
  const [echoError, setEchoError] = useState<string | null>(null);
  const [echoResponse, setEchoResponse] = useState<JsonValue | undefined>(
    undefined,
  );

  const handleSendPing = async () => {
    if (typeof fetch === "undefined") {
      setPingError("Training API не е достъпен в тази среда.");
      return;
    }

    setPingLoading(true);
    setPingError(null);
    setPingResponse(undefined);

    try {
      const res = await fetch(`${API_BASE_URL}/training/ping`);

      const data = (await res.json()) as JsonValue;

      if (!res.ok) {
        setPingError("Грешка при извикване на ping ендпойнта.");
        setPingResponse(data);
        return;
      }

      setPingResponse(data);
    } catch {
      setPingError("Неуспешна заявка към Training API.");
    } finally {
      setPingLoading(false);
    }
  };

  const handleSendEcho = async () => {
    if (typeof fetch === "undefined") {
      setEchoError("Training API не е достъпен в тази среда.");
      return;
    }

    setEchoLoading(true);
    setEchoError(null);
    setEchoResponse(undefined);

    try {
      const res = await fetch(`${API_BASE_URL}/training/echo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: echoInput }),
      });

      const data = (await res.json()) as JsonValue;

      if (!res.ok) {
        setEchoError("Грешка при извикване на echo ендпойнта.");
        setEchoResponse(data);
        return;
      }

      setEchoResponse(data);
    } catch {
      setEchoError("Неуспешна заявка към Training API.");
    } finally {
      setEchoLoading(false);
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        Интерактивен Training API playground
      </h2>
      <p className="text-xs text-zinc-600 dark:text-zinc-300">
        Този панел изпраща реални заявки към Training API през бекенда
        ({API_BASE_URL}/training). Използвайте го за бърза проверка на
        ping/echo ендпойнтите, преди да преминете към Postman или автоматизирани
        тестове.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            1. Ping заявка
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Изпраща <code>GET /api/training/ping</code> и показва JSON отговора.
          </p>
          <button
            type="button"
            onClick={handleSendPing}
            disabled={pingLoading}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:ring-offset-zinc-900"
          >
            {pingLoading ? "Изпращане..." : "Изпрати ping"}
          </button>
          {pingError && (
            <p className="text-xs text-red-600 dark:text-red-400">{pingError}</p>
          )}
          {pingResponse && (
            <pre className="max-h-40 overflow-auto rounded-md bg-zinc-950 p-2 text-[11px] text-zinc-100 dark:bg-black">
              {formatJson(pingResponse)}
            </pre>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            2. Echo заявка
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Изпраща <code>POST /api/training/echo</code> с подадената стойност в
            полето по-долу.
          </p>
          <textarea
            value={echoInput}
            onChange={(e) => setEchoInput(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <button
            type="button"
            onClick={handleSendEcho}
            disabled={echoLoading}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:ring-offset-zinc-900"
          >
            {echoLoading ? "Изпращане..." : "Изпрати echo"}
          </button>
          {echoError && (
            <p className="text-xs text-red-600 dark:text-red-400">{echoError}</p>
          )}
          {echoResponse && (
            <pre className="max-h-40 overflow-auto rounded-md bg-zinc-950 p-2 text-[11px] text-zinc-100 dark:bg-black">
              {formatJson(echoResponse)}
            </pre>
          )}
        </div>
      </div>
    </section>
  );
}
