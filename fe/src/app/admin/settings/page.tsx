"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";

const API_BASE_URL = getApiBaseUrl();

type InstanceBranding = {
  appName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
};

type InstanceFeatures = {
  wikiPublic: boolean;
  courses: boolean;
  auth: boolean;
  paidCourses: boolean;
  gdprLegal: boolean;
  infraRedis: boolean;
  infraRabbitmq: boolean;
  infraMonitoring: boolean;
  infraErrorTracking: boolean;
};

type InstanceLanguages = {
  supported: string[];
  default: string;
};

type AdminSettingsResponse = {
  branding: InstanceBranding;
  features: InstanceFeatures;
  languages: InstanceLanguages;
};

function parseSupportedLangs(raw: string): string[] {
  const parts = (raw ?? "")
    .split(/[,\n\r\t\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const normalized = parts
    .map((p) => p.toLowerCase())
    .filter((p) => /^[a-z]{2,5}$/.test(p));

  return Array.from(new Set(normalized));
}

export default function AdminSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [initialFeatures, setInitialFeatures] =
    useState<InstanceFeatures | null>(null);

  const [appName, setAppName] = useState<string>("BeeLMS");

  const [wikiPublic, setWikiPublic] = useState<boolean>(true);
  const [courses, setCourses] = useState<boolean>(true);
  const [auth, setAuth] = useState<boolean>(true);
  const [paidCourses, setPaidCourses] = useState<boolean>(true);
  const [gdprLegal, setGdprLegal] = useState<boolean>(true);
  const [infraRedis, setInfraRedis] = useState<boolean>(false);
  const [infraRabbitmq, setInfraRabbitmq] = useState<boolean>(false);
  const [infraMonitoring, setInfraMonitoring] = useState<boolean>(true);
  const [infraErrorTracking, setInfraErrorTracking] = useState<boolean>(false);

  const [supportedLangsRaw, setSupportedLangsRaw] =
    useState<string>("bg, en, de");
  const supportedLangs = useMemo(
    () => parseSupportedLangs(supportedLangsRaw),
    [supportedLangsRaw],
  );

  const [defaultLang, setDefaultLang] = useState<string>("bg");

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
        const res = await fetch(`${API_BASE_URL}/admin/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (!res.ok) {
          if (!cancelled) {
            setError("Неуспешно зареждане на settings.");
          }
          return;
        }

        const data = (await res.json()) as AdminSettingsResponse;

        if (cancelled) return;

        setAppName(data.branding?.appName ?? "BeeLMS");

        const f = data.features;
        setWikiPublic(f?.wikiPublic !== false);
        setCourses(f?.courses !== false);
        setAuth(f?.auth !== false);
        setPaidCourses(f?.paidCourses !== false);
        setGdprLegal(f?.gdprLegal !== false);
        setInfraRedis(Boolean(f?.infraRedis));
        setInfraRabbitmq(Boolean(f?.infraRabbitmq));
        setInfraMonitoring(f?.infraMonitoring !== false);
        setInfraErrorTracking(Boolean(f?.infraErrorTracking));

        setInitialFeatures(f ?? null);

        const l = data.languages;
        setSupportedLangsRaw((l?.supported ?? ["bg"]).join(", "));
        setDefaultLang(l?.default ?? "bg");
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

    const nextAppName = (appName ?? "").trim();
    if (nextAppName.length < 2) {
      setError("App name трябва да е поне 2 символа.");
      return;
    }

    if (supportedLangs.length < 1) {
      setError(
        "languages.supported трябва да съдържа поне 1 език (напр. bg, en).",
      );
      return;
    }

    const nextDefaultLang = (defaultLang ?? "").trim().toLowerCase();
    if (!supportedLangs.includes(nextDefaultLang)) {
      setError("languages.default трябва да е включен в languages.supported.");
      return;
    }

    const wasAuthEnabled = initialFeatures?.auth !== false;
    const wasGdprEnabled = initialFeatures?.gdprLegal !== false;

    if (wasAuthEnabled && auth === false) {
      const ok = window.confirm(
        "Сигурен ли си, че искаш да изключиш AUTH? Това ще спре регистрация/логин/ресет на парола.",
      );
      if (!ok) return;
    }

    if (wasGdprEnabled && gdprLegal === false) {
      const ok = window.confirm(
        "Сигурен ли си, че искаш да изключиш GDPR/Legal? Това ще скрие legal навигация и ще disable-не GDPR export/delete.",
      );
      if (!ok) return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branding: {
            appName: nextAppName,
          },
          features: {
            wikiPublic,
            courses,
            auth,
            paidCourses,
            gdprLegal,
            infraRedis,
            infraRabbitmq,
            infraMonitoring,
            infraErrorTracking,
          },
          languages: {
            supported: supportedLangs,
            default: nextDefaultLang,
          },
        }),
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setError("Неуспешно запазване на настройките.");
        return;
      }

      const updated = (await res.json()) as AdminSettingsResponse;
      setInitialFeatures(updated.features);

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
        <h1 className="text-3xl font-semibold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-600">
          Feature toggles + languages config + branding.
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
        <div className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Branding</h2>
            <p className="mt-1 text-sm text-gray-600">
              Минимални настройки за идентичност.
            </p>

            <div className="mt-4 max-w-md">
              <label className="block text-sm font-medium text-gray-700">
                App name
              </label>
              <input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="BeeLMS"
                disabled={saving}
              />
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Feature toggles
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Изключването на feature връща 404 за публичните endpoint-и.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={wikiPublic}
                  onChange={(e) => setWikiPublic(e.target.checked)}
                  disabled={saving}
                />
                <span className="text-sm text-gray-800">Wiki public</span>
              </label>

              <label className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={courses}
                  onChange={(e) => setCourses(e.target.checked)}
                  disabled={saving}
                />
                <span className="text-sm text-gray-800">Courses</span>
              </label>

              <label className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={auth}
                  onChange={(e) => setAuth(e.target.checked)}
                  disabled={saving}
                />
                <span className="text-sm text-gray-800">Auth (risk)</span>
              </label>

              <label className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={paidCourses}
                  onChange={(e) => setPaidCourses(e.target.checked)}
                  disabled={saving}
                />
                <span className="text-sm text-gray-800">Paid courses</span>
              </label>

              <label className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={gdprLegal}
                  onChange={(e) => setGdprLegal(e.target.checked)}
                  disabled={saving}
                />
                <span className="text-sm text-gray-800">
                  GDPR / Legal (risk)
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={infraMonitoring}
                  onChange={(e) => setInfraMonitoring(e.target.checked)}
                  disabled={saving}
                />
                <span className="text-sm text-gray-800">Infra: Monitoring</span>
              </label>

              <label className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={infraRedis}
                  onChange={(e) => setInfraRedis(e.target.checked)}
                  disabled={saving}
                />
                <span className="text-sm text-gray-800">Infra: Redis</span>
              </label>

              <label className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={infraRabbitmq}
                  onChange={(e) => setInfraRabbitmq(e.target.checked)}
                  disabled={saving}
                />
                <span className="text-sm text-gray-800">Infra: RabbitMQ</span>
              </label>

              <label className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={infraErrorTracking}
                  onChange={(e) => setInfraErrorTracking(e.target.checked)}
                  disabled={saving}
                />
                <span className="text-sm text-gray-800">
                  Infra: Error tracking
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Languages</h2>
            <p className="mt-1 text-sm text-gray-600">
              Supported трябва да има поне 1 език, а default трябва да е в
              supported.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Supported (comma / whitespace separated)
                </label>
                <textarea
                  value={supportedLangsRaw}
                  onChange={(e) => setSupportedLangsRaw(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="bg, en, de"
                  disabled={saving}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Parsed:{" "}
                  {supportedLangs.length > 0 ? supportedLangs.join(", ") : "—"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Default
                </label>
                <input
                  value={defaultLang}
                  onChange={(e) => setDefaultLang(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="bg"
                  disabled={saving}
                />
                <p className="mt-2 text-xs text-gray-500">Пример: bg</p>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3">
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
        </div>
      )}
    </div>
  );
}
