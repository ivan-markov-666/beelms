"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        parameters: Record<string, unknown>,
      ) => number;
      reset: (opt_widget_id?: number) => void;
    };
    __beelmsRecaptchaLoadingPromise?: Promise<void>;
  }
}

function loadRecaptchaScript(lang: string | null): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.grecaptcha) {
    return Promise.resolve();
  }

  if (window.__beelmsRecaptchaLoadingPromise) {
    return window.__beelmsRecaptchaLoadingPromise;
  }

  window.__beelmsRecaptchaLoadingPromise = new Promise<void>(
    (resolve, reject) => {
      const existing = document.querySelector(
        'script[data-beelms-recaptcha="true"]',
      ) as HTMLScriptElement | null;

      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject());
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.defer = true;
      script.dataset.beelmsRecaptcha = "true";

      const url = new URL("https://www.google.com/recaptcha/api.js");
      url.searchParams.set("render", "explicit");
      if (lang && lang.trim().length > 0) {
        url.searchParams.set("hl", lang.trim());
      }

      script.src = url.toString();
      script.onload = () => resolve();
      script.onerror = () => reject();

      document.head.appendChild(script);
    },
  );

  return window.__beelmsRecaptchaLoadingPromise;
}

export function RecaptchaWidget(props: {
  siteKey: string;
  lang?: string;
  disabled?: boolean;
  onTokenChange: (token: string | null) => void;
}) {
  const { siteKey, lang, disabled, onTokenChange } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const run = async () => {
      try {
        await loadRecaptchaScript(lang ?? null);

        if (cancelled) return;
        if (!window.grecaptcha) return;
        if (!containerRef.current) return;

        if (widgetIdRef.current !== null) {
          window.grecaptcha.reset(widgetIdRef.current);
          onTokenChange(null);
          return;
        }

        widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: unknown) => {
            if (cancelled) return;
            onTokenChange(typeof token === "string" ? token : null);
          },
          "expired-callback": () => {
            if (cancelled) return;
            onTokenChange(null);
          },
          "error-callback": () => {
            if (cancelled) return;
            onTokenChange(null);
          },
        });
      } catch {
        if (!cancelled) {
          onTokenChange(null);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [lang, onTokenChange, siteKey]);

  return (
    <div
      className={disabled ? "pointer-events-none opacity-70" : undefined}
      aria-disabled={disabled}
    >
      <div ref={containerRef} />
    </div>
  );
}
