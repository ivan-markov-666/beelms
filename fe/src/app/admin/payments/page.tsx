"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";
import { AdminBreadcrumbs } from "../_components/admin-breadcrumbs";
import { InfoTooltip } from "../_components/info-tooltip";
import { ListboxSelect } from "../../_components/listbox-select";

const API_BASE_URL = getApiBaseUrl();

type PaymentSettings = {
  currency: string;
  priceCents: number;
};

type StripeWebhookEventStatus = "received" | "processed" | "failed";

type AdminStripeWebhookEvent = {
  id: string;
  eventId: string;
  eventType: string;
  status: StripeWebhookEventStatus;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type RetryWebhookEventResponse = {
  status: "processed" | "failed";
  errorMessage: string | null;
};

type ProviderStatusResponse = {
  stripe: {
    configured: boolean;
    mode: "test" | "live" | "unconfigured";
    webhookSecretConfigured: boolean;
    enabled: boolean;
  };
  paypal: {
    configured: boolean;
    mode: "sandbox" | "live" | "unconfigured";
    enabled: boolean;
  };
  mypos: {
    configured: boolean;
    mode: "sandbox" | "live" | "unconfigured";
    enabled: boolean;
  };
  revolut: {
    configured: boolean;
    mode: "sandbox" | "live" | "unconfigured";
    enabled: boolean;
  };
  defaultProvider: "stripe" | "paypal" | "mypos" | "revolut";
  frontendOrigin: string;
};

type ProviderKey = "stripe" | "paypal" | "mypos" | "revolut";

function formatDateTime(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "-";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleString();
  } catch {
    return v;
  }
}

async function copyToClipboard(text: string) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {}

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  } catch {}
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onChange(!checked);
      }}
      className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        backgroundColor: checked
          ? "var(--primary)"
          : "color-mix(in srgb, var(--foreground) 10%, var(--card))",
        borderColor: checked ? "var(--primary)" : "var(--border)",
      }}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-[color:var(--card)] shadow transition ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function AdminPaymentsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [providerStatus, setProviderStatus] =
    useState<ProviderStatusResponse | null>(null);

  const [currencies, setCurrencies] = useState<string[]>([]);
  const [currency, setCurrency] = useState("eur");
  const [priceCents, setPriceCents] = useState<string>("999");

  const [selectedProvider, setSelectedProvider] =
    useState<ProviderKey>("stripe");

  const [providerToggleBusy, setProviderToggleBusy] =
    useState<ProviderKey | null>(null);

  const [defaultProviderBusy, setDefaultProviderBusy] = useState(false);

  const [sandboxCourseId, setSandboxCourseId] = useState<string>("");
  const [sandboxCheckoutUrl, setSandboxCheckoutUrl] = useState<string>("");
  const [sandboxBusy, setSandboxBusy] = useState<boolean>(false);
  const [sandboxError, setSandboxError] = useState<string | null>(null);

  const [paypalSandboxCourseId, setPaypalSandboxCourseId] =
    useState<string>("");
  const [paypalSandboxCheckoutUrl, setPaypalSandboxCheckoutUrl] =
    useState<string>("");
  const [paypalSandboxBusy, setPaypalSandboxBusy] = useState<boolean>(false);
  const [paypalSandboxError, setPaypalSandboxError] = useState<string | null>(
    null,
  );

  const [myposSandboxCourseId, setMyposSandboxCourseId] = useState<string>("");
  const [myposSandboxCheckoutUrl, setMyposSandboxCheckoutUrl] =
    useState<string>("");
  const [myposSandboxBusy, setMyposSandboxBusy] = useState<boolean>(false);
  const [myposSandboxError, setMyposSandboxError] = useState<string | null>(
    null,
  );

  const [revolutSandboxCourseId, setRevolutSandboxCourseId] =
    useState<string>("");
  const [revolutSandboxCheckoutUrl, setRevolutSandboxCheckoutUrl] =
    useState<string>("");
  const [revolutSandboxBusy, setRevolutSandboxBusy] = useState<boolean>(false);
  const [revolutSandboxError, setRevolutSandboxError] = useState<string | null>(
    null,
  );

  const [events, setEvents] = useState<AdminStripeWebhookEvent[]>([]);
  const [eventsBusy, setEventsBusy] = useState<boolean>(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsStatus, setEventsStatus] =
    useState<StripeWebhookEventStatus>("failed");
  const [eventsLimit, setEventsLimit] = useState<string>("20");
  const [retryingEventId, setRetryingEventId] = useState<string | null>(null);
  const [retryNotice, setRetryNotice] = useState<string | null>(null);

  const exportWebhookEventsCsv = () => {
    if (events.length === 0 || typeof window === "undefined") {
      return;
    }

    const escapeCsv = (value: string | number): string => {
      const str = String(value);
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replaceAll('"', '""')}"`;
      }
      return str;
    };

    const header = [
      "status",
      "eventId",
      "eventType",
      "createdAt",
      "processedAt",
      "errorMessage",
    ];

    const rows = events.map((e) => [
      e.status,
      e.eventId,
      e.eventType,
      e.createdAt,
      e.processedAt ?? "",
      (e.errorMessage ?? "").trim(),
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-webhook-events-${eventsStatus}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const currencyOptions = useMemo(() => {
    const normalized = (currencies ?? []).map((c) => (c ?? "").toLowerCase());
    return Array.from(new Set(normalized)).filter(Boolean).sort();
  }, [currencies]);

  const currencySelectOptions = useMemo(() => {
    const set = new Set(currencyOptions);
    if (currency) {
      set.add(currency.toLowerCase());
    }
    return Array.from(set)
      .filter(Boolean)
      .sort()
      .map((c) => ({ value: c, label: c.toUpperCase() }));
  }, [currencyOptions, currency]);

  const providers = useMemo(
    () => [
      {
        key: "stripe" as const,
        label: "Stripe",
        description: "Checkout + webhooks + ops tools",
      },
      {
        key: "paypal" as const,
        label: "PayPal",
        description: "Orders (sandbox) + capture",
      },
      {
        key: "mypos" as const,
        label: "myPOS",
        description: "Hosted checkout (coming soon)",
      },
      {
        key: "revolut" as const,
        label: "Revolut",
        description: "Hosted checkout (coming soon)",
      },
    ],
    [],
  );

  const updateProviderEnabled = async (
    provider: ProviderKey,
    enabled: boolean,
  ) => {
    setError(null);
    setSuccess(null);

    if (enabled) {
      const status =
        provider === "stripe"
          ? providerStatus?.stripe
          : provider === "paypal"
            ? providerStatus?.paypal
            : provider === "mypos"
              ? providerStatus?.mypos
              : providerStatus?.revolut;

      const configured = Boolean(status?.configured);
      const stripeWebhookOk =
        provider === "stripe"
          ? Boolean(providerStatus?.stripe?.webhookSecretConfigured)
          : true;

      if (!configured) {
        setError(
          `Не можеш да активираш ${provider.toUpperCase()} без конфигурация. Попълни нужните env променливи/credentials за provider-а и refresh-ни страницата.`,
        );
        return;
      }

      if (provider === "stripe" && !stripeWebhookOk) {
        setError(
          "Stripe е configured, но STRIPE_WEBHOOK_SECRET липсва. Добави webhook secret, за да работи purchase/unlock автоматично.",
        );
        return;
      }
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const payload: Record<string, boolean> =
      provider === "stripe"
        ? { paymentsStripe: enabled }
        : provider === "paypal"
          ? { paymentsPaypal: enabled }
          : provider === "mypos"
            ? { paymentsMypos: enabled }
            : { paymentsRevolut: enabled };

    setProviderToggleBusy(provider);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/payments/providers`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok && res.status !== 204) {
        setError("Неуспешно запазване на provider настройките.");
        return;
      }

      const statusRes = await fetch(
        `${API_BASE_URL}/admin/payments/providers/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      if (statusRes.ok) {
        const statusData = (await statusRes.json()) as ProviderStatusResponse;
        setProviderStatus(statusData);
      }
      setSuccess("Provider настройките са запазени.");
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      setProviderToggleBusy(null);
    }
  };

  const updateDefaultProvider = async (nextProvider: ProviderKey) => {
    setError(null);
    setSuccess(null);

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setDefaultProviderBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/payments/providers`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentsDefaultProvider: nextProvider }),
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok && res.status !== 204) {
        setError("Неуспешно запазване на default provider.");
        return;
      }

      const statusRes = await fetch(
        `${API_BASE_URL}/admin/payments/providers/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      if (statusRes.ok) {
        const statusData = (await statusRes.json()) as ProviderStatusResponse;
        setProviderStatus(statusData);
      }

      setSuccess("Provider настройките са запазени.");
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      setDefaultProviderBusy(false);
    }
  };

  const createPaypalTestCheckout = async () => {
    setPaypalSandboxError(null);
    setPaypalSandboxCheckoutUrl("");

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const courseId = (paypalSandboxCourseId ?? "").trim();
    if (!courseId) {
      setPaypalSandboxError("Course ID е задължителен.");
      return;
    }

    setPaypalSandboxBusy(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/courses/${encodeURIComponent(courseId)}/checkout?provider=paypal`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setPaypalSandboxError(
          res.status === 403
            ? "Paid courses feature е изключен или курсът не е платен/достъпен."
            : "Неуспешно стартиране на PayPal checkout. Провери PayPal credentials.",
        );
        return;
      }

      const body = (await res.json()) as { url?: string };
      const url = (body?.url ?? "").trim();
      if (!url) {
        setPaypalSandboxError("PayPal approval url липсва.");
        return;
      }

      setPaypalSandboxCheckoutUrl(url);
    } catch {
      setPaypalSandboxError("Възникна грешка при връзката със сървъра.");
    } finally {
      setPaypalSandboxBusy(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      setProviderStatus(null);

      const token = getAccessToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      try {
        const [currRes, settingsRes, providerStatusRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/payments/currencies`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/admin/payments/settings`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/admin/payments/providers/status`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
        ]);

        if (
          currRes.status === 401 ||
          settingsRes.status === 401 ||
          providerStatusRes.status === 401
        ) {
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

        let statusData: ProviderStatusResponse | null = null;
        if (providerStatusRes.ok) {
          statusData =
            (await providerStatusRes.json()) as ProviderStatusResponse;
        }

        if (!cancelled) {
          setCurrencies(currData ?? []);
          setCurrency((settingsData.currency ?? "eur").toLowerCase());
          setPriceCents(String(settingsData.priceCents ?? 999));
          setProviderStatus(statusData);
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

  const renderProviderStatusCard = () => {
    const stripe = providerStatus?.stripe;
    const paypal = providerStatus?.paypal;
    const mypos = providerStatus?.mypos;
    const revolut = providerStatus?.revolut;
    const defaultProvider = providerStatus?.defaultProvider ?? "stripe";
    const origin = (providerStatus?.frontendOrigin ?? "").trim();
    const stripeWebhookUrl = `${API_BASE_URL}/payments/webhook`;

    const Badge = (props: {
      label: string;
      tone: "green" | "red" | "amber" | "gray";
    }) => {
      const base =
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold";
      const toneClass =
        props.tone === "green"
          ? "bg-[color:color-mix(in_srgb,var(--primary)_14%,var(--card))] text-[color:var(--primary)]"
          : props.tone === "red"
            ? "bg-[color:color-mix(in_srgb,var(--error)_14%,var(--card))] text-[color:var(--error)]"
            : props.tone === "amber"
              ? "bg-[color:color-mix(in_srgb,var(--attention)_14%,var(--card))] text-[color:var(--attention)]"
              : "bg-[color:color-mix(in_srgb,var(--foreground)_8%,var(--card))] text-[color:var(--foreground)]";
      return <span className={`${base} ${toneClass}`}>{props.label}</span>;
    };

    const stripeConfigured = Boolean(stripe?.configured);
    const stripeWebhookOk = Boolean(stripe?.webhookSecretConfigured);
    const paypalConfigured = Boolean(paypal?.configured);
    const myposConfigured = Boolean(mypos?.configured);
    const revolutConfigured = Boolean(revolut?.configured);

    return (
      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
            Provider status
          </h2>
          <InfoTooltip
            label="Provider status info"
            title="Provider status"
            description="Това показва дали backend-ът има настроени credentials за Stripe/PayPal и в какъв режим работи (test/live, sandbox/live). Secret-и не се показват."
          />
        </div>

        {!providerStatus ? (
          <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-80">
            Status is not available.
          </p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,var(--card))] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    Stripe
                  </div>
                  <Badge
                    label={stripeConfigured ? "configured" : "missing"}
                    tone={stripeConfigured ? "green" : "red"}
                  />
                </div>
                <div className="mt-3 space-y-2 text-sm text-[color:var(--foreground)]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">Enabled</span>
                    <Badge
                      label={Boolean(stripe?.enabled) ? "on" : "off"}
                      tone={Boolean(stripe?.enabled) ? "green" : "red"}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">Mode</span>
                    <Badge
                      label={stripe?.mode ?? "-"}
                      tone={
                        stripe?.mode === "live"
                          ? "amber"
                          : stripe?.mode === "test"
                            ? "gray"
                            : "gray"
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">Webhook secret</span>
                    <Badge
                      label={stripeWebhookOk ? "set" : "missing"}
                      tone={stripeWebhookOk ? "green" : "red"}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                      Webhook URL
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <div className="min-w-0 flex-1 break-all text-sm text-[color:var(--foreground)]">
                        {stripeWebhookUrl}
                      </div>
                      <button
                        type="button"
                        onClick={() => void copyToClipboard(stripeWebhookUrl)}
                        className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-semibold"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,var(--card))] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    Default provider
                  </div>
                  <Badge label={defaultProvider} tone="gray" />
                </div>
                <div className="mt-3 space-y-2 text-sm text-[color:var(--foreground)]">
                  <ListboxSelect
                    ariaLabel="Default provider"
                    value={providerStatus?.defaultProvider ?? "stripe"}
                    disabled={defaultProviderBusy || saving}
                    onChange={(next) =>
                      void updateDefaultProvider(next as ProviderKey)
                    }
                    buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] disabled:opacity-70"
                    options={[
                      { value: "stripe", label: "Stripe" },
                      { value: "paypal", label: "PayPal" },
                      { value: "mypos", label: "myPOS" },
                      { value: "revolut", label: "Revolut" },
                    ]}
                  />
                  <p className="text-xs text-[color:var(--foreground)] opacity-60">
                    Използва се като default при checkout (ако FE не подаде
                    explicit provider).
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,var(--card))] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    PayPal
                  </div>
                  <Badge
                    label={paypalConfigured ? "configured" : "missing"}
                    tone={paypalConfigured ? "green" : "red"}
                  />
                </div>
                <div className="mt-3 space-y-2 text-sm text-[color:var(--foreground)]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">Enabled</span>
                    <Badge
                      label={Boolean(paypal?.enabled) ? "on" : "off"}
                      tone={Boolean(paypal?.enabled) ? "green" : "red"}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">Mode</span>
                    <Badge
                      label={paypal?.mode ?? "-"}
                      tone={paypal?.mode === "live" ? "amber" : "gray"}
                    />
                  </div>

                  {paypalConfigured && paypal?.mode === "sandbox" ? (
                    <div className="rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--attention)_10%,var(--card))] px-3 py-2 text-xs text-[color:var(--attention)]">
                      Sandbox mode: плащанията са тестови.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,var(--card))] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    myPOS
                  </div>
                  <Badge
                    label={myposConfigured ? "configured" : "missing"}
                    tone={myposConfigured ? "green" : "red"}
                  />
                </div>
                <div className="mt-3 space-y-2 text-sm text-[color:var(--foreground)]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">Enabled</span>
                    <Badge
                      label={Boolean(mypos?.enabled) ? "on" : "off"}
                      tone={Boolean(mypos?.enabled) ? "green" : "red"}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">Mode</span>
                    <Badge
                      label={mypos?.mode ?? "-"}
                      tone={mypos?.mode === "live" ? "amber" : "gray"}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,var(--card))] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    Revolut
                  </div>
                  <Badge
                    label={revolutConfigured ? "configured" : "missing"}
                    tone={revolutConfigured ? "green" : "red"}
                  />
                </div>
                <div className="mt-3 space-y-2 text-sm text-[color:var(--foreground)]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">Enabled</span>
                    <Badge
                      label={Boolean(revolut?.enabled) ? "on" : "off"}
                      tone={Boolean(revolut?.enabled) ? "green" : "red"}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">Mode</span>
                    <Badge
                      label={revolut?.mode ?? "-"}
                      tone={revolut?.mode === "live" ? "amber" : "gray"}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,var(--card))] px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                  Frontend
                </div>
                <div className="mt-3 text-sm text-[color:var(--foreground)]">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    Origin
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <div className="min-w-0 flex-1 break-all">
                      {origin || "-"}
                    </div>
                    {origin ? (
                      <button
                        type="button"
                        onClick={() => void copyToClipboard(origin)}
                        className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-semibold"
                      >
                        Copy
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {stripeConfigured && !stripeWebhookOk ? (
              <div className="mt-4 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--error)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--error)]">
                Stripe е configured, но `STRIPE_WEBHOOK_SECRET` липсва. Checkout
                ще работи, но purchase/unlock може да не се записва автоматично
                без webhook.
              </div>
            ) : null}
          </>
        )}
      </div>
    );
  };

  const createMyposTestCheckout = async () => {
    setMyposSandboxError(null);
    setMyposSandboxCheckoutUrl("");

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const courseId = (myposSandboxCourseId ?? "").trim();
    if (!courseId) {
      setMyposSandboxError("Course ID е задължителен.");
      return;
    }

    setMyposSandboxBusy(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/courses/${encodeURIComponent(courseId)}/checkout?provider=mypos`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setMyposSandboxError(
          res.status === 403
            ? "Paid courses feature е изключен или курсът не е платен/достъпен."
            : "Неуспешно стартиране на myPOS checkout. Възможно е provider-ът да е изключен или да не е имплементиран.",
        );
        return;
      }

      const body = (await res.json()) as { url?: string };
      const url = (body?.url ?? "").trim();
      if (!url) {
        setMyposSandboxError("myPOS url липсва.");
        return;
      }

      setMyposSandboxCheckoutUrl(url);
    } catch {
      setMyposSandboxError("Възникна грешка при връзката със сървъра.");
    } finally {
      setMyposSandboxBusy(false);
    }
  };

  const createRevolutTestCheckout = async () => {
    setRevolutSandboxError(null);
    setRevolutSandboxCheckoutUrl("");

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const courseId = (revolutSandboxCourseId ?? "").trim();
    if (!courseId) {
      setRevolutSandboxError("Course ID е задължителен.");
      return;
    }

    setRevolutSandboxBusy(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/courses/${encodeURIComponent(courseId)}/checkout?provider=revolut`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setRevolutSandboxError(
          res.status === 403
            ? "Paid courses feature е изключен или курсът не е платен/достъпен."
            : "Неуспешно стартиране на Revolut checkout. Възможно е provider-ът да е изключен или да не е имплементиран.",
        );
        return;
      }

      const body = (await res.json()) as { url?: string };
      const url = (body?.url ?? "").trim();
      if (!url) {
        setRevolutSandboxError("Revolut url липсва.");
        return;
      }

      setRevolutSandboxCheckoutUrl(url);
    } catch {
      setRevolutSandboxError("Възникна грешка при връзката със сървъра.");
    } finally {
      setRevolutSandboxBusy(false);
    }
  };

  const fetchWebhookEvents = async () => {
    setEventsError(null);
    setRetryNotice(null);

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const normalizedLimitRaw = (eventsLimit ?? "").trim();
    const limit = Number(normalizedLimitRaw);
    const limitQuery =
      Number.isFinite(limit) && limit > 0 ? `&limit=${Math.round(limit)}` : "";

    setEventsBusy(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/payments/webhook-events?status=${encodeURIComponent(eventsStatus)}${limitQuery}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setEventsError("Неуспешно зареждане на webhook events.");
        return;
      }

      const data = (await res.json()) as AdminStripeWebhookEvent[];
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setEventsError("Възникна грешка при връзката със сървъра.");
    } finally {
      setEventsBusy(false);
    }
  };

  const retryWebhookEvent = async (eventId: string) => {
    setRetryNotice(null);
    setEventsError(null);

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const id = (eventId ?? "").trim();
    if (!id) return;

    setRetryingEventId(id);
    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/payments/webhook-events/${encodeURIComponent(id)}/retry`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setEventsError("Неуспешен retry на webhook event.");
        return;
      }

      const data = (await res.json()) as RetryWebhookEventResponse;
      const msg =
        data?.status === "processed"
          ? "Retry: processed."
          : data?.status === "failed"
            ? `Retry: failed${data.errorMessage ? ` (${data.errorMessage})` : ""}.`
            : "Retry: unknown result.";
      setRetryNotice(msg);

      await fetchWebhookEvents();
    } catch {
      setEventsError("Възникна грешка при връзката със сървъра.");
    } finally {
      setRetryingEventId(null);
    }
  };

  const createTestCheckout = async () => {
    setSandboxError(null);
    setSandboxCheckoutUrl("");

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const courseId = (sandboxCourseId ?? "").trim();
    if (!courseId) {
      setSandboxError("Course ID е задължителен.");
      return;
    }

    setSandboxBusy(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/courses/${encodeURIComponent(courseId)}/checkout`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setSandboxError(
          res.status === 403
            ? "Paid courses feature е изключен или курсът не е платен/достъпен."
            : "Неуспешно стартиране на checkout. Провери дали Stripe е конфигуриран.",
        );
        return;
      }

      const body = (await res.json()) as { url?: string };
      const url = (body?.url ?? "").trim();
      if (!url) {
        setSandboxError("Неуспешно стартиране на checkout (липсва url). ");
        return;
      }

      setSandboxCheckoutUrl(url);
    } catch {
      setSandboxError("Възникна грешка при връзката със сървъра.");
    } finally {
      setSandboxBusy(false);
    }
  };

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
        <AdminBreadcrumbs
          items={[
            { label: "Админ табло", href: "/admin" },
            { label: "Payments" },
          ]}
        />
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold text-[color:var(--foreground)]">
            Payments
          </h1>
          <InfoTooltip
            label="Payments info"
            title="Payments"
            description="Настройки и инструменти за payment provider-и. Stripe е първият provider; тук ще добавяме и други."
          />
        </div>
        <p className="text-sm text-[color:var(--foreground)] opacity-80">
          Settings + sandbox tools per provider.
        </p>
      </header>

      {loading && (
        <p className="text-sm text-[color:var(--foreground)] opacity-80">
          Зареждане...
        </p>
      )}

      {!loading && error && (
        <div className="rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--error)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--error)]">
          {error}
        </div>
      )}

      {!loading && success && (
        <div className="rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--primary)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--primary)]">
          {success}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <aside className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
              Providers
            </h2>
            <div className="mt-3 space-y-2">
              {providers.map((p) => {
                const active = p.key === selectedProvider;
                const enabled =
                  p.key === "stripe"
                    ? Boolean(providerStatus?.stripe?.enabled)
                    : p.key === "paypal"
                      ? Boolean(providerStatus?.paypal?.enabled)
                      : p.key === "mypos"
                        ? Boolean(providerStatus?.mypos?.enabled)
                        : Boolean(providerStatus?.revolut?.enabled);
                const disableToggle =
                  providerToggleBusy !== null || !providerStatus || loading;
                return (
                  <div
                    key={p.key}
                    className={
                      "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition " +
                      (active
                        ? "border-[color:var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_12%,var(--card))] text-[color:var(--foreground)]"
                        : "border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--foreground)] hover:bg-[color:color-mix(in_srgb,var(--foreground)_4%,var(--card))]")
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedProvider(p.key)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs text-[color:var(--foreground)] opacity-60">
                        {p.description}
                      </div>
                    </button>
                    <ToggleSwitch
                      checked={enabled}
                      disabled={disableToggle}
                      label={`${p.label} enabled`}
                      onChange={(next) =>
                        void updateProviderEnabled(p.key, next)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="lg:col-span-2 space-y-4">
            {selectedProvider === "stripe" ? (
              <>
                {renderProviderStatusCard()}

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Stripe Settings
                        </h2>
                        <InfoTooltip
                          label="Stripe settings info"
                          title="Stripe Settings"
                          description="Глобални настройки за Stripe: default currency и default price (fallback), използвани при Checkout когато курсът няма индивидуална цена."
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        Used when creating a Stripe Checkout session.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-[color:var(--foreground)] opacity-80">
                        Currency (ISO 4217)
                      </label>
                      <div className="mt-2">
                        <ListboxSelect
                          ariaLabel="Currency (ISO 4217)"
                          value={currency.toLowerCase()}
                          disabled={saving}
                          onChange={(next) => setCurrency(next.toLowerCase())}
                          buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)] disabled:opacity-60"
                          options={currencySelectOptions.length > 0 ? currencySelectOptions : [{ value: currency.toLowerCase(), label: currency.toUpperCase() || "---" }]}
                        />
                      </div>
                      <p className="mt-2 text-xs text-[color:var(--foreground)] opacity-70">
                        Example: EUR, USD.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Price (cents)
                      </label>
                      <input
                        value={priceCents}
                        onChange={(e) => setPriceCents(e.target.value)}
                        inputMode="numeric"
                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                        placeholder="999"
                        disabled={saving}
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Example: 999 = 9.99 {currency.toUpperCase()}.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={onSave}
                      disabled={saving}
                      className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm hover:opacity-90 disabled:opacity-70"
                      style={{
                        backgroundColor: "var(--primary)",
                        borderColor: "var(--primary)",
                        color: "var(--on-primary)",
                      }}
                    >
                      {saving ? "Запазване..." : "Запази"}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Sandbox
                    </h2>
                    <InfoTooltip
                      label="Payments sandbox info"
                      title="Sandbox"
                      description="Генерира Stripe Checkout URL за конкретен курс (изисква courseId). Полезно за бърз end-to-end тест на Checkout flow."
                    />
                  </div>

                  {sandboxError ? (
                    <div className="mt-3 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--error)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--error)]">
                      {sandboxError}
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Course ID (UUID)
                    </label>
                    <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                      <input
                        value={sandboxCourseId}
                        onChange={(e) => setSandboxCourseId(e.target.value)}
                        disabled={sandboxBusy}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                        placeholder="e.g. 9b2e..."
                      />
                      <button
                        type="button"
                        onClick={createTestCheckout}
                        disabled={sandboxBusy}
                        className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm hover:opacity-90 disabled:opacity-70"
                        style={{
                          backgroundColor: "var(--primary)",
                          borderColor: "var(--primary)",
                          color: "var(--on-primary)",
                        }}
                      >
                        {sandboxBusy ? "Working..." : "Create test checkout"}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Use an existing paid course id.
                    </p>
                  </div>

                  {sandboxCheckoutUrl ? (
                    <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Checkout URL
                      </div>
                      <div className="mt-2 break-all text-sm text-gray-900">
                        {sandboxCheckoutUrl}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void copyToClipboard(sandboxCheckoutUrl)
                          }
                          className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-semibold"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(sandboxCheckoutUrl, "_blank")
                          }
                          className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-semibold"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Webhook Ops
                    </h2>
                    <InfoTooltip
                      label="Webhook ops info"
                      title="Webhook Ops"
                      description="Admin tooling за webhook events: преглед на failed/received/processed и retry на конкретен Stripe eventId."
                    />
                  </div>

                  {eventsError ? (
                    <div className="mt-3 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--error)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--error)]">
                      {eventsError}
                    </div>
                  ) : null}

                  {retryNotice ? (
                    <div className="mt-3 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--primary)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--primary)]">
                      {retryNotice}
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <div className="mt-2">
                        <ListboxSelect
                          ariaLabel="Webhook events status"
                          value={eventsStatus}
                          disabled={eventsBusy}
                          onChange={(next) =>
                            setEventsStatus(next as StripeWebhookEventStatus)
                          }
                          buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none disabled:opacity-70"
                          options={[
                            { value: "failed", label: "failed" },
                            { value: "received", label: "received" },
                            { value: "processed", label: "processed" },
                          ]}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Limit
                      </label>
                      <div className="mt-2">
                        <ListboxSelect
                          ariaLabel="Webhook events limit"
                          value={eventsLimit}
                          disabled={eventsBusy}
                          onChange={(next) => setEventsLimit(next)}
                          buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none disabled:opacity-70"
                          options={[
                            { value: "10", label: "10" },
                            { value: "20", label: "20" },
                            { value: "50", label: "50" },
                            { value: "100", label: "100" },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => void fetchWebhookEvents()}
                        disabled={eventsBusy}
                        className="be-btn-ghost inline-flex w-full items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-70"
                      >
                        {eventsBusy ? "Loading..." : "Refresh"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={exportWebhookEventsCsv}
                      disabled={events.length === 0}
                      className="be-btn-ghost rounded-lg border px-3 py-2 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Export CSV
                    </button>
                  </div>

                  <div className="mt-4 overflow-auto rounded-md border border-gray-200">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        <tr>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Event</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">Created</th>
                          <th className="px-3 py-2">Processed</th>
                          <th className="px-3 py-2">Error</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {events.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-3 py-3 text-sm text-gray-600"
                            >
                              No events loaded.
                            </td>
                          </tr>
                        ) : (
                          events.map((e) => (
                            <tr key={e.id} className="bg-white">
                              <td className="px-3 py-2 font-semibold">
                                {e.status}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {e.eventId}
                              </td>
                              <td className="px-3 py-2">{e.eventType}</td>
                              <td className="px-3 py-2">
                                {formatDateTime(e.createdAt)}
                              </td>
                              <td className="px-3 py-2">
                                {formatDateTime(e.processedAt)}
                              </td>
                              <td className="px-3 py-2">
                                {(e.errorMessage ?? "").trim() || "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void retryWebhookEvent(e.eventId)
                                  }
                                  disabled={retryingEventId === e.eventId}
                                  className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-70"
                                >
                                  {retryingEventId === e.eventId
                                    ? "Retrying..."
                                    : "Retry"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : selectedProvider === "paypal" ? (
              <>
                {renderProviderStatusCard()}

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      PayPal
                    </h2>
                    <InfoTooltip
                      label="PayPal info"
                      title="PayPal"
                      description="PayPal Orders (sandbox): генерира approval URL и при success callback прави capture + записва purchase."
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Sandbox tooling: create an approval URL for a given paid
                    course.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      PayPal Sandbox
                    </h2>
                    <InfoTooltip
                      label="PayPal sandbox info"
                      title="PayPal sandbox"
                      description="Генерира PayPal approval URL чрез /courses/:courseId/checkout?provider=paypal. Изисква валидни PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET + PAYPAL_MODE=sandbox в BE env."
                    />
                  </div>

                  {paypalSandboxError ? (
                    <div className="mt-3 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--error)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--error)]">
                      {paypalSandboxError}
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Course ID (UUID)
                      </label>
                      <input
                        value={paypalSandboxCourseId}
                        onChange={(e) =>
                          setPaypalSandboxCourseId(e.target.value)
                        }
                        disabled={paypalSandboxBusy}
                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                        placeholder="e.g. 9b2e..."
                      />
                    </div>
                    <div className="flex items-end gap-3">
                      <button
                        type="button"
                        onClick={createPaypalTestCheckout}
                        disabled={paypalSandboxBusy}
                        className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm hover:opacity-90 disabled:opacity-70"
                        style={{
                          backgroundColor: "var(--primary)",
                          borderColor: "var(--primary)",
                          color: "var(--on-primary)",
                        }}
                      >
                        {paypalSandboxBusy
                          ? "Working..."
                          : "Create PayPal checkout"}
                      </button>
                    </div>
                  </div>

                  {paypalSandboxCheckoutUrl ? (
                    <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Approval URL
                      </div>
                      <div className="mt-2 break-all text-sm text-gray-900">
                        {paypalSandboxCheckoutUrl}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void copyToClipboard(paypalSandboxCheckoutUrl)
                          }
                          className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-semibold"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(paypalSandboxCheckoutUrl, "_blank")
                          }
                          className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-semibold"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : selectedProvider === "mypos" ? (
              <>
                {renderProviderStatusCard()}

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      myPOS
                    </h2>
                    <InfoTooltip
                      label="myPOS info"
                      title="myPOS"
                      description="myPOS provider: ще поддържа hosted checkout. Тук можеш да го активираш/деактивираш и да тестваш sandbox URL (след като интеграцията е готова)."
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Sandbox tooling: create a test checkout URL for a given paid
                    course.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      myPOS Sandbox
                    </h2>
                    <InfoTooltip
                      label="myPOS sandbox info"
                      title="myPOS sandbox"
                      description="Генерира myPOS checkout URL чрез /courses/:courseId/checkout?provider=mypos. Изисква активиран provider + конфигурация в BE env (MYPOS_*)."
                    />
                  </div>

                  {myposSandboxError ? (
                    <div className="mt-3 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--error)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--error)]">
                      {myposSandboxError}
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Course ID (UUID)
                      </label>
                      <input
                        value={myposSandboxCourseId}
                        onChange={(e) =>
                          setMyposSandboxCourseId(e.target.value)
                        }
                        disabled={myposSandboxBusy}
                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                        placeholder="e.g. 9b2e..."
                      />
                    </div>
                    <div className="flex items-end gap-3">
                      <button
                        type="button"
                        onClick={createMyposTestCheckout}
                        disabled={myposSandboxBusy}
                        className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm hover:opacity-90 disabled:opacity-70"
                        style={{
                          backgroundColor: "var(--primary)",
                          borderColor: "var(--primary)",
                          color: "var(--on-primary)",
                        }}
                      >
                        {myposSandboxBusy
                          ? "Working..."
                          : "Create myPOS checkout"}
                      </button>
                    </div>
                  </div>

                  {myposSandboxCheckoutUrl ? (
                    <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Checkout URL
                      </div>
                      <div className="mt-2 break-all text-sm text-gray-900">
                        {myposSandboxCheckoutUrl}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void copyToClipboard(myposSandboxCheckoutUrl)
                          }
                          className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-semibold"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(myposSandboxCheckoutUrl, "_blank")
                          }
                          className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-semibold"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : selectedProvider === "revolut" ? (
              <>
                {renderProviderStatusCard()}

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Revolut
                    </h2>
                    <InfoTooltip
                      label="Revolut info"
                      title="Revolut"
                      description="Revolut provider: ще поддържа hosted checkout. Тук можеш да го активираш/деактивираш и да тестваш sandbox URL (след като интеграцията е готова)."
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Sandbox tooling: create a test checkout URL for a given paid
                    course.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Revolut Sandbox
                    </h2>
                    <InfoTooltip
                      label="Revolut sandbox info"
                      title="Revolut sandbox"
                      description="Генерира Revolut checkout URL чрез /courses/:courseId/checkout?provider=revolut. Изисква активиран provider + конфигурация в BE env (REVOLUT_*)."
                    />
                  </div>

                  {revolutSandboxError ? (
                    <div className="mt-3 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--error)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--error)]">
                      {revolutSandboxError}
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Course ID (UUID)
                      </label>
                      <input
                        value={revolutSandboxCourseId}
                        onChange={(e) =>
                          setRevolutSandboxCourseId(e.target.value)
                        }
                        disabled={revolutSandboxBusy}
                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                        placeholder="e.g. 9b2e..."
                      />
                    </div>
                    <div className="flex items-end gap-3">
                      <button
                        type="button"
                        onClick={createRevolutTestCheckout}
                        disabled={revolutSandboxBusy}
                        className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm hover:opacity-90 disabled:opacity-70"
                        style={{
                          backgroundColor: "var(--primary)",
                          borderColor: "var(--primary)",
                          color: "var(--on-primary)",
                        }}
                      >
                        {revolutSandboxBusy
                          ? "Working..."
                          : "Create Revolut checkout"}
                      </button>
                    </div>
                  </div>

                  {revolutSandboxCheckoutUrl ? (
                    <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Checkout URL
                      </div>
                      <div className="mt-2 break-all text-sm text-gray-900">
                        {revolutSandboxCheckoutUrl}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void copyToClipboard(revolutSandboxCheckoutUrl)
                          }
                          className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-semibold"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(revolutSandboxCheckoutUrl, "_blank")
                          }
                          className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-semibold"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  {providers.find((p) => p.key === selectedProvider)?.label ??
                    "Provider"}
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  This provider is not implemented yet.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
