"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ANALYTICS_CONSENT_KEY,
  type AnalyticsConsentValue,
} from "./analytics-consent-banner";
import { getApiBaseUrl } from "../api-url";

const API_BASE_URL = getApiBaseUrl();

const VISITOR_ID_COOKIE = "beelms_visitor_id";

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

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (!p) continue;
    const idx = p.indexOf("=");
    if (idx <= 0) continue;
    const k = p.slice(0, idx);
    if (k === name) {
      return decodeURIComponent(p.slice(idx + 1));
    }
  }
  return null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAgeSeconds}`,
    "Path=/",
    "SameSite=Lax",
  ];
  if (secure) {
    parts.push("Secure");
  }
  document.cookie = parts.join("; ");
}

function generateVisitorId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID().replace(/-/g, "");
    } catch {
      return generateVisitorIdFallback();
    }
  }

  return generateVisitorIdFallback();
}

function generateVisitorIdFallback(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getOrCreateVisitorId(): string {
  const existing = getCookie(VISITOR_ID_COOKIE);
  if (existing && existing.length >= 8) {
    return existing;
  }

  const created = generateVisitorId();
  setCookie(VISITOR_ID_COOKIE, created, 365 * 24 * 60 * 60);
  return created;
}

async function postTrack(payload: {
  visitorId: string;
  path: string;
  referrer?: string;
}): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/analytics/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {}
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consentVersion, setConsentVersion] = useState(0);

  const lastTrackedPathRef = useRef<string | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onConsentChange = () => {
      setConsentVersion((v) => v + 1);
      lastTrackedPathRef.current = null;
    };

    window.addEventListener(
      "beelms_analytics_consent_changed",
      onConsentChange,
    );
    return () => {
      window.removeEventListener(
        "beelms_analytics_consent_changed",
        onConsentChange,
      );
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const consent = readConsent();
    if (consent !== "granted") {
      return;
    }

    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    if (!path) {
      return;
    }

    if (lastTrackedPathRef.current === path) {
      return;
    }

    const visitorId = getOrCreateVisitorId();

    const currentUrl = window.location.href;
    const referrer = lastUrlRef.current ?? document.referrer ?? undefined;

    lastTrackedPathRef.current = path;
    lastUrlRef.current = currentUrl;

    void postTrack({ visitorId, path, referrer });
  }, [pathname, searchParams, consentVersion]);

  return null;
}
