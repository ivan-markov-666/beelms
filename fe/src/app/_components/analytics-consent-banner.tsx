"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCurrentLang } from "../../i18n/useCurrentLang";
import { t } from "../../i18n/t";

export const ANALYTICS_CONSENT_KEY = "beelms_analytics_consent";
export type AnalyticsConsentValue = "granted" | "denied";

function readConsent(): AnalyticsConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (v === "granted" || v === "denied") return v;
    return null;
  } catch {
    return null;
  }
}

function writeConsent(value: AnalyticsConsentValue): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    return;
  }
}

type ConsentState = AnalyticsConsentValue | null | "loading";

export function AnalyticsConsentBanner() {
  const lang = useCurrentLang();
  const [consent, setConsent] = useState<ConsentState>("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handle = window.requestAnimationFrame(() => {
      setConsent(readConsent());
    });
    return () => {
      window.cancelAnimationFrame(handle);
    };
  }, []);

  const visible = useMemo(() => consent === null, [consent]);

  const accept = () => {
    writeConsent("granted");
    setConsent("granted");
    try {
      window.dispatchEvent(new Event("beelms_analytics_consent_changed"));
    } catch {}
  };

  const decline = () => {
    writeConsent("denied");
    setConsent("denied");
    try {
      window.dispatchEvent(new Event("beelms_analytics_consent_changed"));
    } catch {}
  };

  if (consent === "loading" || !visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-900">
            {t(lang, "common", "analyticsConsentTitle")}
          </p>
          <p className="text-xs text-gray-700">
            {t(lang, "common", "analyticsConsentBody")}{" "}
            <Link
              href="/legal/privacy"
              className="font-medium text-green-700 hover:text-green-800"
            >
              {t(lang, "common", "analyticsConsentPrivacyLink")}
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
            onClick={decline}
          >
            {t(lang, "common", "analyticsConsentDecline")}
          </button>
          <button
            type="button"
            className="rounded-md bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700"
            onClick={accept}
          >
            {t(lang, "common", "analyticsConsentAccept")}
          </button>
        </div>
      </div>
    </div>
  );
}
