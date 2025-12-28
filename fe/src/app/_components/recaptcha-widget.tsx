"use client";

import { useEffect, useRef, useState } from "react";

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

function buildRecaptchaUrl(args: {
  host: string;
  lang: string | null;
}): string {
  const url = new URL(`https://${args.host}/recaptcha/api.js`);
  url.searchParams.set("render", "explicit");
  if (args.lang && args.lang.trim().length > 0) {
    url.searchParams.set("hl", args.lang.trim());
  }
  return url.toString();
}

function loadRecaptchaScriptFromHost(args: {
  host: string;
  lang: string | null;
}): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.grecaptcha) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const selector = `script[data-beelms-recaptcha="true"][data-beelms-recaptcha-host="${args.host}"]`;
    const existing = document.querySelector(
      selector,
    ) as HTMLScriptElement | null;

    if (existing) {
      if (existing.dataset.beelmsRecaptchaLoaded === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.beelmsRecaptcha = "true";
    script.dataset.beelmsRecaptchaHost = args.host;

    script.src = buildRecaptchaUrl({ host: args.host, lang: args.lang });
    script.onload = () => {
      script.dataset.beelmsRecaptchaLoaded = "true";
      resolve();
    };
    script.onerror = () => reject();

    document.head.appendChild(script);
  });
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

  window.__beelmsRecaptchaLoadingPromise = (async () => {
    try {
      await loadRecaptchaScriptFromHost({ host: "www.google.com", lang });
      return;
    } catch {
      await loadRecaptchaScriptFromHost({ host: "www.recaptcha.net", lang });
    }
  })();

  return window.__beelmsRecaptchaLoadingPromise;
}

export function RecaptchaWidget(props: {
  siteKey: string;
  lang?: string;
  disabled?: boolean;
  onTokenChange: (token: string | null) => void;
}) {
  const { siteKey, lang, disabled, onTokenChange } = props;

  const [loadError, setLoadError] = useState(false);
  const [devBypassConfirmed, setDevBypassConfirmed] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    setLoadError(false);
    setDevBypassConfirmed(false);

    const run = async () => {
      try {
        await loadRecaptchaScript(lang ?? null);

        if (cancelled) return;
        if (!window.grecaptcha) return;
        if (!containerRef.current) return;

        if (typeof window.grecaptcha.render !== "function") {
          throw new Error("grecaptcha.render not available");
        }

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
          setLoadError(true);
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
      <div ref={containerRef} style={{ minHeight: 78 }} />
      {loadError && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-red-600" role="alert">
            reCAPTCHA не може да се зареди. Провери дали браузърът/мрежата не
            блокира `https://www.google.com/recaptcha/api.js` /
            `https://www.recaptcha.net/recaptcha/api.js` (напр. adblock/Brave
            shields/корпоративна мрежа) и refresh-ни страницата.
          </p>

          {process.env.NODE_ENV !== "production" &&
            process.env.NEXT_PUBLIC_RECAPTCHA_DEV_BYPASS === "true" && (
              <div className="space-y-2">
                <button
                  type="button"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={disabled}
                  onClick={() => {
                    setDevBypassConfirmed(true);
                    onTokenChange("dev-bypass");
                  }}
                >
                  Потвърди (dev bypass)
                </button>
                {devBypassConfirmed && (
                  <p className="text-xs text-green-700">
                    Потвърдено (dev bypass)
                  </p>
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
