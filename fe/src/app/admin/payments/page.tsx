"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";

const API_BASE_URL = getApiBaseUrl();

type PaymentSettings = {
  currency: string;
  priceCents: number;
};

export default function AdminPaymentsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [currencies, setCurrencies] = useState<string[]>([]);
  const [currency, setCurrency] = useState("eur");
  const [priceCents, setPriceCents] = useState<string>("999");

  const currencyOptions = useMemo(() => {
    const normalized = (currencies ?? []).map((c) => (c ?? "").toLowerCase());
    return Array.from(new Set(normalized)).filter(Boolean).sort();
  }, [currencies]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const token = getAccessToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      try {
        const [currRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/payments/currencies`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/admin/payments/settings`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (currRes.status === 401 || settingsRes.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (!currRes.ok || !settingsRes.ok) {
          if (!cancelled) {
            setError("Неуспешно зареждане на payment settings.");
          }
          return;
        }

        const currData = (await currRes.json()) as string[];
        const settingsData = (await settingsRes.json()) as PaymentSettings;

        if (!cancelled) {
          setCurrencies(currData ?? []);
          setCurrency((settingsData.currency ?? "eur").toLowerCase());
          setPriceCents(String(settingsData.priceCents ?? 999));
        }
      } catch {
        if (!cancelled) {
          setError("Възникна грешка при връзката със сървъра.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const onSave = async () => {
    setError(null);
    setSuccess(null);

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const nextCurrency = (currency ?? "").trim().toLowerCase();
    if (!/^[a-z]{3}$/.test(nextCurrency)) {
      setError("Валутата трябва да е 3-буквен ISO код (напр. EUR).");
      return;
    }

    const nextPriceCentsRaw = (priceCents ?? "").trim();
    const nextPriceCents = Number(nextPriceCentsRaw);
    if (!Number.isFinite(nextPriceCents) || nextPriceCents < 1) {
      setError("Цената трябва да е число в cents (напр. 999).");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/payments/settings`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currency: nextCurrency,
          priceCents: Math.round(nextPriceCents),
        }),
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok && res.status !== 204) {
        setError("Неуспешно запазване на настройките.");
        return;
      }

      setSuccess("Настройките са запазени.");
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-zinc-500">
          <Link href="/admin" className="hover:underline">
            ← Админ табло
          </Link>
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900">Плащания</h1>
        <p className="text-sm text-zinc-600">
          Настройки за Stripe Checkout (test mode).
        </p>
      </header>

      {loading && <p className="text-sm text-zinc-600">Зареждане...</p>}

      {!loading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {!loading && (
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Валута</h2>
          <p className="mt-1 text-sm text-gray-600">
            Използва се при създаване на Stripe Checkout session.
          </p>

          <div className="mt-4 max-w-sm">
            <label className="block text-sm font-medium text-gray-700">
              Currency (ISO 4217)
            </label>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              list="currency-options"
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="eur"
              disabled={saving}
            />
            <datalist id="currency-options">
              {currencyOptions.map((c) => (
                <option key={c} value={c.toUpperCase()} />
              ))}
            </datalist>
            <p className="mt-2 text-xs text-gray-500">Пример: EUR, USD, BGN.</p>
          </div>

          <div className="mt-6 max-w-sm">
            <label className="block text-sm font-medium text-gray-700">
              Price (cents)
            </label>
            <input
              value={priceCents}
              onChange={(e) => setPriceCents(e.target.value)}
              inputMode="numeric"
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="999"
              disabled={saving}
            />
            <p className="mt-2 text-xs text-gray-500">
              Пример: 999 = 9.99 {currency.toUpperCase()}.
            </p>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-70"
            >
              {saving ? "Запазване..." : "Запази"}
            </button>
            <Link
              href="/admin"
              className="text-sm text-green-700 hover:text-green-800"
            >
              Назад към админ таблото →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
