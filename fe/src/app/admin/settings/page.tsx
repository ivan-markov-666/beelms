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
  socialGoogle: boolean;
  socialFacebook: boolean;
  socialGithub: boolean;
  socialLinkedin: boolean;
  infraRedis: boolean;
  infraRabbitmq: boolean;
  infraMonitoring: boolean;
  infraErrorTracking: boolean;
};

type InstanceLanguages = {
  supported: string[];
  default: string;
};

type SocialProvider = "google" | "facebook" | "github" | "linkedin";

type SocialProviderCredentialResponse = {
  clientId: string | null;
  redirectUri: string | null;
  hasClientSecret: boolean;
  notes: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
};

type SocialProviderCredentialRequest = {
  clientId?: string | null;
  clientSecret?: string | null;
  redirectUri?: string | null;
  notes?: string | null;
};

type SocialCredentialFormState = {
  clientId: string;
  redirectUri: string;
  clientSecretInput: string;
  hasClientSecret: boolean;
  clearSecret: boolean;
  notes: string;
  updatedBy: string | null;
  updatedAt: string | null;
};

type SocialFieldErrors = {
  clientId?: string;
  redirectUri?: string;
  clientSecret?: string;
};

type SocialFieldKey = keyof SocialFieldErrors;

type SocialProviderStatus = {
  enabled: boolean;
  configured: boolean;
};

type SocialProviderTestResultResponse = {
  provider: SocialProvider;
  ok: boolean;
  checkedAt: string;
  latencyMs: number;
  httpStatus: number;
  endpoint: string;
};

type SocialTestState = {
  status: "idle" | "loading" | "success" | "error";
  message: string | null;
  details?: SocialProviderTestResultResponse | null;
  errorDetails?: string | null;
};

type AdminSettingsResponse = {
  branding: InstanceBranding;
  features: InstanceFeatures;
  languages: InstanceLanguages;
  socialProviders: Record<SocialProvider, SocialProviderStatus>;
  socialCredentials: Partial<
    Record<SocialProvider, SocialProviderCredentialResponse>
  >;
};

const SOCIAL_PROVIDERS: SocialProvider[] = [
  "google",
  "facebook",
  "github",
  "linkedin",
];

const SOCIAL_PROVIDER_LABELS: Record<SocialProvider, string> = {
  google: "Google",
  facebook: "Facebook",
  github: "GitHub",
  linkedin: "LinkedIn",
};

const SOCIAL_PROVIDER_SCOPE_HINTS: Record<SocialProvider, string> = {
  google: "Scopes: openid profile email",
  facebook: "Scopes: email public_profile",
  github: "Scopes: user:email read:user",
  linkedin: "Scopes: r_emailaddress r_liteprofile",
};

const SOCIAL_PROVIDER_REDIRECT_HINTS: Record<SocialProvider, string> = {
  google: `${API_BASE_URL}/auth/google/callback`,
  facebook: `${API_BASE_URL}/auth/facebook/callback`,
  github: `${API_BASE_URL}/auth/github/callback`,
  linkedin: `${API_BASE_URL}/auth/linkedin/callback`,
};

function buildSocialCredentialState(
  data?: Partial<Record<SocialProvider, SocialProviderCredentialResponse>>,
): Record<SocialProvider, SocialCredentialFormState> {
  return SOCIAL_PROVIDERS.reduce(
    (acc, provider) => {
      const server = data?.[provider];
      acc[provider] = {
        clientId: server?.clientId ?? "",
        redirectUri: server?.redirectUri ?? "",
        clientSecretInput: "",
        hasClientSecret: Boolean(server?.hasClientSecret),
        clearSecret: false,
        notes: server?.notes ?? "",
        updatedBy: server?.updatedBy ?? null,
        updatedAt: server?.updatedAt ?? null,
      };
      return acc;
    },
    {} as Record<SocialProvider, SocialCredentialFormState>,
  );
}

function buildSocialFieldErrors(): Record<SocialProvider, SocialFieldErrors> {
  return SOCIAL_PROVIDERS.reduce(
    (acc, provider) => {
      acc[provider] = {};
      return acc;
    },
    {} as Record<SocialProvider, SocialFieldErrors>,
  );
}

function buildSocialTestStates(): Record<SocialProvider, SocialTestState> {
  return SOCIAL_PROVIDERS.reduce(
    (acc, provider) => {
      acc[provider] = {
        status: "idle",
        message: null,
        details: null,
        errorDetails: null,
      };
      return acc;
    },
    {} as Record<SocialProvider, SocialTestState>,
  );
}

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

function isValidRedirectUrl(value: string): boolean {
  if (!value) {
    return false;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
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
  const [socialGoogle, setSocialGoogle] = useState<boolean>(true);
  const [socialFacebook, setSocialFacebook] = useState<boolean>(true);
  const [socialGithub, setSocialGithub] = useState<boolean>(true);
  const [socialLinkedin, setSocialLinkedin] = useState<boolean>(true);
  const [infraRedis, setInfraRedis] = useState<boolean>(false);
  const [infraRabbitmq, setInfraRabbitmq] = useState<boolean>(false);
  const [infraMonitoring, setInfraMonitoring] = useState<boolean>(true);
  const [infraErrorTracking, setInfraErrorTracking] = useState<boolean>(false);
  const [socialStatuses, setSocialStatuses] = useState<Record<
    SocialProvider,
    SocialProviderStatus
  > | null>(null);
  const [socialCredentialForms, setSocialCredentialForms] = useState<
    Record<SocialProvider, SocialCredentialFormState>
  >(() => buildSocialCredentialState());
  const [socialFieldErrors, setSocialFieldErrors] = useState<
    Record<SocialProvider, SocialFieldErrors>
  >(() => buildSocialFieldErrors());
  const [socialTestStates, setSocialTestStates] = useState<
    Record<SocialProvider, SocialTestState>
  >(() => buildSocialTestStates());

  const socialFeatureStates = useMemo(
    () => ({
      google: socialGoogle,
      facebook: socialFacebook,
      github: socialGithub,
      linkedin: socialLinkedin,
    }),
    [socialGoogle, socialFacebook, socialGithub, socialLinkedin],
  );

  const socialFeatureSetters: Record<SocialProvider, (value: boolean) => void> =
    {
      google: setSocialGoogle,
      facebook: setSocialFacebook,
      github: setSocialGithub,
      linkedin: setSocialLinkedin,
    };

  const socialInlineWarnings = useMemo(() => {
    return SOCIAL_PROVIDERS.reduce(
      (acc, provider) => {
        const warnings: string[] = [];
        const enabled = socialFeatureStates[provider];
        if (!enabled) {
          acc[provider] = warnings;
          return acc;
        }

        const form = socialCredentialForms[provider];
        const label = SOCIAL_PROVIDER_LABELS[provider];
        const clientId = form.clientId.trim();
        const redirectUri = form.redirectUri.trim();
        const hasNewSecret = form.clientSecretInput.trim().length > 0;
        const hasStoredSecret = form.hasClientSecret && !form.clearSecret;

        if (!clientId) {
          warnings.push(`Попълни Client ID за ${label}, за да остане активен.`);
        }

        if (!redirectUri) {
          warnings.push(
            `Попълни Redirect URL за ${label}, за да остане активен.`,
          );
        }

        if (form.clearSecret) {
          warnings.push(
            `Активиран доставчик не може да има изтрит secret. Въведи нов secret или изключи ${label}.`,
          );
        } else if (!hasNewSecret && !hasStoredSecret) {
          warnings.push(
            `Добави Client secret за ${label}, за да работи OAuth потока.`,
          );
        }

        acc[provider] = warnings;
        return acc;
      },
      {} as Record<SocialProvider, string[]>,
    );
  }, [socialCredentialForms, socialFeatureStates]);

  const clearSocialFieldError = (
    provider: SocialProvider,
    field: SocialFieldKey,
  ) => {
    setSocialFieldErrors((prev) => {
      const current = prev[provider];
      if (!current?.[field]) {
        return prev;
      }
      return {
        ...prev,
        [provider]: {
          ...current,
          [field]: undefined,
        },
      };
    });
  };

  const setSocialFieldError = (
    provider: SocialProvider,
    field: SocialFieldKey,
    message: string,
  ) => {
    setSocialFieldErrors((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: message,
      },
    }));
  };

  const validateRedirectUri = (provider: SocialProvider, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      clearSocialFieldError(provider, "redirectUri");
      return true;
    }
    if (!isValidRedirectUrl(trimmed)) {
      setSocialFieldError(
        provider,
        "redirectUri",
        "Въведи валиден URL (започва с https:// или http://).",
      );
      return false;
    }
    clearSocialFieldError(provider, "redirectUri");
    return true;
  };

  const confirmDeleteStoredSecret = (provider: SocialProvider) => {
    const label = SOCIAL_PROVIDER_LABELS[provider];
    const confirmed = window.confirm(
      `Сигурен ли си, че искаш да изтриеш съхранения secret за ${label}? Това действие е необратимо и влиза в сила при запазване.`,
    );
    if (!confirmed) {
      return;
    }
    setSocialCredentialForms((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        clearSecret: true,
        clientSecretInput: "",
      },
    }));
    clearSocialFieldError(provider, "clientSecret");
  };

  const cancelSecretDeletion = (provider: SocialProvider) => {
    setSocialCredentialForms((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        clearSecret: false,
      },
    }));
  };

  const handleResetProviderFields = (provider: SocialProvider) => {
    const label = SOCIAL_PROVIDER_LABELS[provider];
    const confirmed = window.confirm(
      `Ще изтриеш всички OAuth стойности (Client ID, Redirect URL, secret, бележки) за ${label}. Това действие е необратимо и влиза в сила при запазване. Продължаваш ли?`,
    );
    if (!confirmed) {
      return;
    }
    setSocialCredentialForms((prev) => {
      const current = prev[provider];
      const shouldClearSecret = current.hasClientSecret
        ? true
        : current.clearSecret;
      return {
        ...prev,
        [provider]: {
          ...current,
          clientId: "",
          redirectUri: "",
          clientSecretInput: "",
          notes: "",
          clearSecret: shouldClearSecret,
        },
      };
    });
    clearSocialFieldError(provider, "clientId");
    clearSocialFieldError(provider, "redirectUri");
    clearSocialFieldError(provider, "clientSecret");
  };

  const handleTestConnection = async (provider: SocialProvider) => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setSocialTestStates((prev) => ({
      ...prev,
      [provider]: {
        status: "loading",
        message: "Тествам връзката...",
        details: null,
        errorDetails: null,
      },
    }));

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/social/${provider}/test`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const raw = await res.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = null;
        }
        const payload = parsed as {
          message?: string;
          details?: unknown;
        } | null;
        const message =
          payload?.message ?? `HTTP ${res.status} · неуспешен тест`;
        const detailSource =
          payload?.details ?? payload ?? (raw.length ? raw : null);
        const detailString =
          typeof detailSource === "string"
            ? detailSource
            : detailSource
              ? JSON.stringify(detailSource, null, 2)
              : null;

        setSocialTestStates((prev) => ({
          ...prev,
          [provider]: {
            status: "error",
            message,
            details: null,
            errorDetails: detailString,
          },
        }));
        return;
      }

      const data =
        (await res.json()) as SocialProviderTestResultResponse | null;

      setSocialTestStates((prev) => ({
        ...prev,
        [provider]: {
          status: "success",
          message: data?.checkedAt
            ? `Успех · ${new Date(data.checkedAt).toLocaleString()} · ${Math.round(
                data.latencyMs,
              )}ms`
            : "Успешен тест",
          details: data,
          errorDetails: null,
        },
      }));
    } catch (err) {
      setSocialTestStates((prev) => ({
        ...prev,
        [provider]: {
          status: "error",
          message:
            err instanceof Error ? err.message.slice(0, 200) : "Неуспешен тест",
          details: null,
          errorDetails: err instanceof Error ? err.message : null,
        },
      }));
    }
  };

  const handleToggleSocialProvider = (
    provider: SocialProvider,
    nextValue: boolean,
  ) => {
    if (!nextValue) {
      const label = SOCIAL_PROVIDER_LABELS[provider];
      const confirmed = window.confirm(
        `Изключването на ${label} ще спре възможността потребителите да влизат с този доставчик. Продължаваш ли?`,
      );
      if (!confirmed) {
        return;
      }
    }
    socialFeatureSetters[provider](nextValue);
  };

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
        setSocialGoogle(f?.socialGoogle !== false);
        setSocialFacebook(f?.socialFacebook !== false);
        setSocialGithub(f?.socialGithub !== false);
        setSocialLinkedin(f?.socialLinkedin !== false);
        setInfraRedis(Boolean(f?.infraRedis));
        setInfraRabbitmq(Boolean(f?.infraRabbitmq));
        setInfraMonitoring(f?.infraMonitoring !== false);
        setInfraErrorTracking(Boolean(f?.infraErrorTracking));

        setInitialFeatures(f ?? null);
        setSocialStatuses(data.socialProviders ?? null);
        setSocialCredentialForms(
          buildSocialCredentialState(data.socialCredentials),
        );
        setSocialTestStates(buildSocialTestStates());

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
    const nextFieldErrors = buildSocialFieldErrors();
    let hasFieldErrors = false;

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
    const socialDisables: string[] = [];
    if (initialFeatures?.socialGoogle !== false && socialGoogle === false) {
      socialDisables.push("Google");
    }
    if (initialFeatures?.socialFacebook !== false && socialFacebook === false) {
      socialDisables.push("Facebook");
    }
    if (initialFeatures?.socialGithub !== false && socialGithub === false) {
      socialDisables.push("GitHub");
    }
    if (initialFeatures?.socialLinkedin !== false && socialLinkedin === false) {
      socialDisables.push("LinkedIn");
    }

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

    for (const provider of SOCIAL_PROVIDERS) {
      const enabled = socialFeatureStates[provider];
      if (!enabled) continue;
      const form = socialCredentialForms[provider];
      const label = SOCIAL_PROVIDER_LABELS[provider];
      const clientId = form.clientId.trim();
      const redirectUri = form.redirectUri.trim();
      const hasNewSecret = form.clientSecretInput.trim().length > 0;
      const hasStoredSecret = form.hasClientSecret && !form.clearSecret;

      if (!clientId) {
        nextFieldErrors[provider].clientId =
          `Въведи Client ID за ${label}, за да го активираш.`;
        hasFieldErrors = true;
      }

      if (!redirectUri) {
        nextFieldErrors[provider].redirectUri =
          `Въведи Redirect URL за ${label}, за да го активираш.`;
        hasFieldErrors = true;
      }

      if (form.clearSecret) {
        nextFieldErrors[provider].clientSecret =
          `Не можеш да изтриеш secret за активиран ${label}. Изключи доставчика или въведи нов secret.`;
        hasFieldErrors = true;
      } else if (!hasNewSecret && !hasStoredSecret) {
        nextFieldErrors[provider].clientSecret =
          `Въведи Client secret за ${label}, за да го активираш.`;
        hasFieldErrors = true;
      }
    }

    setSocialFieldErrors(nextFieldErrors);

    if (hasFieldErrors) {
      return;
    }

    setSaving(true);

    const socialCredentialPayload: Partial<
      Record<SocialProvider, SocialProviderCredentialRequest>
    > = {};

    for (const provider of SOCIAL_PROVIDERS) {
      const form = socialCredentialForms[provider];
      const payload: SocialProviderCredentialRequest = {};

      const normalizedClientId = form.clientId.trim();
      payload.clientId =
        normalizedClientId.length > 0 ? normalizedClientId : null;

      const normalizedRedirect = form.redirectUri.trim();
      payload.redirectUri =
        normalizedRedirect.length > 0 ? normalizedRedirect : null;

      const normalizedNotes = form.notes.trim();
      payload.notes = normalizedNotes.length > 0 ? normalizedNotes : null;

      if (form.clientSecretInput.trim().length > 0) {
        payload.clientSecret = form.clientSecretInput.trim();
      } else if (form.clearSecret) {
        payload.clientSecret = null;
      }

      if (
        typeof payload.clientId !== "undefined" ||
        typeof payload.clientSecret !== "undefined" ||
        typeof payload.redirectUri !== "undefined" ||
        typeof payload.notes !== "undefined"
      ) {
        socialCredentialPayload[provider] = payload;
      }
    }

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
            socialGoogle,
            socialFacebook,
            socialGithub,
            socialLinkedin,
            infraRedis,
            infraRabbitmq,
            infraMonitoring,
            infraErrorTracking,
          },
          languages: {
            supported: supportedLangs,
            default: nextDefaultLang,
          },
          socialCredentials:
            Object.keys(socialCredentialPayload).length > 0
              ? socialCredentialPayload
              : undefined,
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
      setSocialStatuses(updated.socialProviders ?? null);
      setSocialCredentialForms(
        buildSocialCredentialState(updated.socialCredentials),
      );

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
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
            <h2 className="text-lg font-semibold text-gray-900">
              Social login & OAuth креденшъли
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Тук администрираш кои социални доставчици (Google, Facebook,
              GitHub, LinkedIn) са достъпни за потребителите и задаваш техните
              OAuth креденшъли. Активирането чрез чекбокса „Активирай“ показва
              нужните полета за Client ID, Redirect URL и Client secret. Ако
              липсва някоя стойност, попадналият потребител ще вижда подсказка
              да използва reset password, затова увери се, че всички данни са
              попълнени и актуални преди да запазиш.
            </p>

            <div className="mt-4 space-y-5">
              {SOCIAL_PROVIDERS.map((provider) => {
                const form = socialCredentialForms[provider];
                const status = socialStatuses?.[provider];
                const label = SOCIAL_PROVIDER_LABELS[provider];
                const configured = status?.configured ?? false;
                const enabled = socialFeatureStates[provider];
                const trimmedClientId = form.clientId.trim();
                const trimmedRedirectUri = form.redirectUri.trim();
                const trimmedNotes = form.notes.trim();
                const hasSecretInput = form.clientSecretInput.trim().length > 0;
                const hasStoredSecret =
                  form.hasClientSecret && !form.clearSecret;
                const canTestConnection =
                  enabled &&
                  trimmedClientId.length > 0 &&
                  trimmedRedirectUri.length > 0 &&
                  (hasSecretInput || hasStoredSecret);
                const hasAnyStoredValue =
                  trimmedClientId.length > 0 ||
                  trimmedRedirectUri.length > 0 ||
                  trimmedNotes.length > 0 ||
                  hasStoredSecret ||
                  hasSecretInput ||
                  form.clearSecret;
                const secretBadgeClasses = form.clearSecret
                  ? "bg-yellow-100 text-yellow-700"
                  : form.hasClientSecret
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600";
                const secretBadgeText = form.clearSecret
                  ? "за изтриване"
                  : form.hasClientSecret
                    ? "запазен"
                    : "липсва";
                const statusDescription = configured
                  ? enabled
                    ? "Настроен и активен"
                    : "Настроен"
                  : "⚠ Не е конфигуриран – ще се използват env fallback-и ако има";
                const testState = socialTestStates[provider];
                const cardColorClasses = enabled
                  ? "border-green-100 bg-green-50"
                  : "border-red-100 bg-red-50";
                return (
                  <div
                    key={provider}
                    className={`rounded-lg border p-4 shadow-sm transition-colors ${cardColorClasses}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) =>
                              handleToggleSocialProvider(
                                provider,
                                e.target.checked,
                              )
                            }
                            disabled={saving}
                          />
                          Активирай
                        </label>
                        <div>
                          <p className="text-base font-medium text-gray-900">
                            {label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {statusDescription}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${secretBadgeClasses}`}
                      >
                        Secret: {secretBadgeText}
                      </span>
                    </div>
                    {hasAnyStoredValue ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleResetProviderFields(provider)}
                          disabled={saving}
                          className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Изчисти всички стойности
                        </button>
                      </div>
                    ) : null}
                    {canTestConnection ? (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleTestConnection(provider)}
                          disabled={testState.status === "loading"}
                          className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {testState.status === "loading"
                            ? "Тествам..."
                            : "Тествай връзката"}
                        </button>
                        {testState.message ? (
                          <span
                            className={`text-xs ${
                              testState.status === "success"
                                ? "text-green-700"
                                : testState.status === "error"
                                  ? "text-red-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {testState.message}
                            {testState.status === "success" &&
                            testState.details?.endpoint
                              ? ` · ${testState.details.endpoint}`
                              : ""}
                          </span>
                        ) : null}
                        {testState.status === "error" &&
                        testState.errorDetails ? (
                          <pre className="w-full whitespace-pre-wrap rounded-md bg-red-50 p-2 text-xs text-red-700">
                            {testState.errorDetails}
                          </pre>
                        ) : null}
                      </div>
                    ) : null}
                    {form.updatedBy || form.updatedAt ? (
                      <p className="mt-2 text-xs text-gray-500">
                        Последна промяна:{" "}
                        {form.updatedAt
                          ? new Date(form.updatedAt).toLocaleString()
                          : "—"}{" "}
                        · {form.updatedBy ?? "неизвестен потребител"}
                      </p>
                    ) : null}
                    {socialInlineWarnings[provider]?.length ? (
                      <div className="mt-3 space-y-1 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
                        {socialInlineWarnings[provider].map((warning, idx) => (
                          <p key={`${provider}-warning-${idx}`}>{warning}</p>
                        ))}
                      </div>
                    ) : null}

                    {enabled ? (
                      <>
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Бележки / инструкции (само за админи)
                          </label>
                          <textarea
                            value={form.notes}
                            onChange={(e) =>
                              setSocialCredentialForms((prev) => ({
                                ...prev,
                                [provider]: {
                                  ...prev[provider],
                                  notes: e.target.value,
                                },
                              }))
                            }
                            rows={3}
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="Пример: Креденшъли в 1Password → BeeLMS Social creds. Или инструкции за запитване към IT."
                            disabled={saving}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Тези бележки не се виждат от потребители – използвай
                            ги за вътрешни инструкции, контакти или къде се
                            съхраняват OAuth ключовете.
                          </p>
                        </div>

                        <div className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                          {SOCIAL_PROVIDER_SCOPE_HINTS[provider]}
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Client ID
                            </label>
                            <input
                              value={form.clientId}
                              onChange={(e) =>
                                setSocialCredentialForms((prev) => ({
                                  ...prev,
                                  [provider]: {
                                    ...prev[provider],
                                    clientId: e.target.value,
                                  },
                                }))
                              }
                              onBlur={() =>
                                clearSocialFieldError(provider, "clientId")
                              }
                              onInput={() =>
                                clearSocialFieldError(provider, "clientId")
                              }
                              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder="например 123.apps.googleusercontent.com"
                              spellCheck={false}
                              disabled={saving}
                            />
                            {socialFieldErrors[provider]?.clientId && (
                              <p className="mt-1 text-xs text-red-600">
                                {socialFieldErrors[provider]?.clientId}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Redirect URL
                            </label>
                            <input
                              value={form.redirectUri}
                              onChange={(e) =>
                                setSocialCredentialForms((prev) => ({
                                  ...prev,
                                  [provider]: {
                                    ...prev[provider],
                                    redirectUri: e.target.value,
                                  },
                                }))
                              }
                              onBlur={() =>
                                validateRedirectUri(provider, form.redirectUri)
                              }
                              onInput={(e) =>
                                validateRedirectUri(
                                  provider,
                                  e.currentTarget.value,
                                )
                              }
                              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder={
                                SOCIAL_PROVIDER_REDIRECT_HINTS[provider]
                              }
                              spellCheck={false}
                              disabled={saving}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Пример: {SOCIAL_PROVIDER_REDIRECT_HINTS[provider]}
                            </p>
                            {socialFieldErrors[provider]?.redirectUri && (
                              <p className="mt-1 text-xs text-red-600">
                                {socialFieldErrors[provider]?.redirectUri}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Client secret (въвеждане на нова стойност)
                          </label>
                          <input
                            type="password"
                            value={form.clientSecretInput}
                            disabled={
                              saving ||
                              (form.hasClientSecret && !form.clearSecret)
                            }
                            onChange={(e) =>
                              setSocialCredentialForms((prev) => ({
                                ...prev,
                                [provider]: {
                                  ...prev[provider],
                                  clientSecretInput: e.target.value,
                                  clearSecret: false,
                                },
                              }))
                            }
                            onInput={() =>
                              clearSocialFieldError(provider, "clientSecret")
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder={
                              form.hasClientSecret
                                ? "•••••• (въведи нов secret, за да го замениш)"
                                : "няма записан secret"
                            }
                            autoComplete="new-password"
                          />
                          {socialFieldErrors[provider]?.clientSecret && (
                            <p className="mt-1 text-xs text-red-600">
                              {socialFieldErrors[provider]?.clientSecret}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            Стойността се изпраща еднократно и не се съхранява
                            във фронтенда. За да зададеш нов secret, първо
                            използвай „Изтрий запазения secret“, което ще
                            позволи въвеждане на нова стойност.
                          </p>
                          {form.hasClientSecret && !form.clearSecret ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                              <span>Съществува записан secret.</span>
                              <button
                                type="button"
                                onClick={() =>
                                  confirmDeleteStoredSecret(provider)
                                }
                                disabled={saving}
                                className="inline-flex items-center rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Изтрий запазения secret
                              </button>
                            </div>
                          ) : null}
                          {form.clearSecret ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
                              <span>
                                Secret ще бъде изтрит при запазване на
                                настройките.
                              </span>
                              <button
                                type="button"
                                onClick={() => cancelSecretDeletion(provider)}
                                disabled={saving}
                                className="inline-flex items-center rounded-md border border-yellow-300 px-2 py-1 text-xs font-semibold text-yellow-900 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Отмени
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <p className="mt-4 text-xs text-gray-500">
                        За да редактираш и съхраниш креденшъли за {label},
                        активирай доставчика.
                      </p>
                    )}
                  </div>
                );
              })}
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
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
