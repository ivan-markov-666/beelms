"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAccessToken } from "../../auth-token";
import { buildApiUrl } from "../../api-url";
import { usePublicSettings } from "../../_hooks/use-public-settings";

const STRIPE_PAYMENTS_ENABLED =
  process.env.NEXT_PUBLIC_STRIPE_PAYMENTS === "true";

const PAYPAL_PAYMENTS_ENABLED =
  process.env.NEXT_PUBLIC_PAYPAL_PAYMENTS === "true";

const MYPOS_PAYMENTS_ENABLED =
  process.env.NEXT_PUBLIC_MYPOS_PAYMENTS === "true";

const REVOLUT_PAYMENTS_ENABLED =
  process.env.NEXT_PUBLIC_REVOLUT_PAYMENTS === "true";

const DEFAULT_PAYMENT_PROVIDER = (
  process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? "stripe"
)
  .trim()
  .toLowerCase();

type PaymentProvider = "stripe" | "paypal" | "mypos" | "revolut";

function normalizeProvider(value: unknown): PaymentProvider {
  if (typeof value !== "string") {
    return "stripe";
  }
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "paypal" ||
    normalized === "mypos" ||
    normalized === "revolut"
  ) {
    return normalized;
  }
  return "stripe";
}

function buildRuntimeProviderConfig(
  settings:
    | {
        paymentsStripe?: boolean;
        paymentsPaypal?: boolean;
        paymentsMypos?: boolean;
        paymentsRevolut?: boolean;
        paymentsDefaultProvider?: string;
      }
    | null
    | undefined,
): {
  enabled: Record<PaymentProvider, boolean>;
  defaultProvider: PaymentProvider;
} {
  if (!settings) {
    return {
      enabled: {
        stripe: STRIPE_PAYMENTS_ENABLED,
        paypal: PAYPAL_PAYMENTS_ENABLED,
        mypos: MYPOS_PAYMENTS_ENABLED,
        revolut: REVOLUT_PAYMENTS_ENABLED,
      },
      defaultProvider: normalizeProvider(DEFAULT_PAYMENT_PROVIDER),
    };
  }

  const stripeEnabled = settings.paymentsStripe !== false;
  const paypalEnabled = settings.paymentsPaypal !== false;
  const myposEnabled = settings.paymentsMypos === true;
  const revolutEnabled = settings.paymentsRevolut === true;

  const defaultProvider = normalizeProvider(settings.paymentsDefaultProvider);
  const enabled: Record<PaymentProvider, boolean> = {
    stripe: stripeEnabled,
    paypal: paypalEnabled,
    mypos: myposEnabled,
    revolut: revolutEnabled,
  };

  const defaultEnabled = enabled[defaultProvider];
  const fallback = stripeEnabled
    ? "stripe"
    : paypalEnabled
      ? "paypal"
      : myposEnabled
        ? "mypos"
        : revolutEnabled
          ? "revolut"
          : "stripe";

  return {
    enabled,
    defaultProvider: defaultEnabled ? defaultProvider : fallback,
  };
}

function formatPrice(currency: string, priceCents: number): string {
  const normalizedCurrency = currency.trim().toUpperCase();
  const amount = priceCents / 100;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizedCurrency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${normalizedCurrency}`;
  }
}

export function EnrollCourseButton({
  courseId,
  isPaid,
  currency,
  priceCents,
}: {
  courseId: string;
  isPaid: boolean;
  currency?: string | null;
  priceCents?: number | null;
}) {
  const { settings: publicSettings } = usePublicSettings();
  const runtime = buildRuntimeProviderConfig(publicSettings?.features);
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [phase, setPhase] = useState<"idle" | "unlocking" | "enrolling">(
    "idle",
  );
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHasToken(!!getAccessToken());
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    let cancelled = false;

    const checkEnrolled = async () => {
      try {
        const res = await fetch(buildApiUrl("/users/me/courses"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          setHasToken(false);
          return;
        }

        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as Array<{ id: string }>;
        if (!cancelled) {
          setEnrolled(data.some((c) => c.id === courseId));
        }
      } catch {}
    };

    void checkEnrolled();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const purchaseIfNeeded = async (accessToken: string) => {
    if (!isPaid) {
      return true;
    }

    const provider = runtime.defaultProvider;
    const paymentsEnabled = runtime.enabled[provider];

    if (!paymentsEnabled) {
      setError("Плащането не е налично.");
      setPhase("idle");
      return false;
    }

    setPhase("unlocking");

    const query = provider === "stripe" ? "" : `?provider=${provider}`;
    const res = await fetch(
      buildApiUrl(`/courses/${courseId}/checkout${query}`),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (res.status === 401) {
      setHasToken(false);
      setError("Няма активна сесия. Моля, влезте отново.");
      setPhase("idle");
      return false;
    }

    if (!res.ok) {
      setError(
        provider === "paypal"
          ? "Плащането не е налично (PayPal не е конфигуриран). "
          : provider === "mypos"
            ? "Плащането не е налично (myPOS не е конфигуриран). "
            : provider === "revolut"
              ? "Плащането не е налично (Revolut не е конфигуриран). "
              : "Плащането не е налично (Stripe не е конфигуриран). ",
      );
      setPhase("idle");
      return false;
    }

    const body = (await res.json()) as { url?: string };
    if (!body.url) {
      setError("Неуспешно стартиране на плащането.");
      setPhase("idle");
      return false;
    }

    window.location.href = body.url;
    return false;
  };

  const enroll = async () => {
    setError(null);
    setSuccess(null);

    const accessToken = getAccessToken();

    if (!accessToken) {
      setHasToken(false);
      return;
    }

    setPhase("enrolling");

    try {
      if (isPaid) {
        const purchased = await purchaseIfNeeded(accessToken);
        if (!purchased) {
          return;
        }

        setPhase("enrolling");
      }

      const res = await fetch(buildApiUrl(`/courses/${courseId}/enroll`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.status === 401) {
        setHasToken(false);
        setError("Няма активна сесия. Моля, влезте отново.");
        setPhase("idle");
        return;
      }

      if (res.status === 403) {
        setError("Курсът е платен и не е отключен (Payment required).");
        setPhase("idle");
        return;
      }

      if (!res.ok && res.status !== 204) {
        setError("Записването в курса не беше успешно. Опитайте отново.");
        setPhase("idle");
        return;
      }

      setSuccess(
        isPaid
          ? "Курсът е отключен и записването е успешно."
          : "Записването е успешно.",
      );
      setEnrolled(true);
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      setPhase("idle");
    }
  };

  if (hasToken === false) {
    return (
      <Link
        href="/auth/login"
        className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1"
        style={{
          backgroundColor: "var(--primary)",
          borderColor: "var(--primary)",
          color: "var(--on-primary)",
        }}
      >
        Вход за записване
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={enroll}
        disabled={phase !== "idle" || enrolled}
        className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 disabled:opacity-70"
        style={{
          backgroundColor: "var(--primary)",
          borderColor: "var(--primary)",
          color: "var(--on-primary)",
        }}
      >
        {phase === "unlocking"
          ? "Отключване..."
          : phase === "enrolling"
            ? "Записване..."
            : enrolled
              ? "Enrolled"
              : isPaid
                ? runtime.enabled[runtime.defaultProvider]
                  ? typeof priceCents === "number" && !!currency
                    ? `Pay ${formatPrice(currency, priceCents)} & Enroll`
                    : "Pay & Enroll"
                  : "Unlock & Enroll"
                : "Enroll"}
      </button>

      {success && (
        <p className="text-sm text-[color:var(--primary)]">{success}</p>
      )}
      {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}

      {success && (
        <Link
          href="/my-courses"
          className="text-sm text-[color:var(--primary)] hover:opacity-90"
        >
          Виж My Courses →
        </Link>
      )}
    </div>
  );
}
