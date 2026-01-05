"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEventHandler, MouseEvent, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";
import { AdminBreadcrumbs } from "../_components/admin-breadcrumbs";

const API_BASE_URL = getApiBaseUrl();

type InstanceBranding = {
  appName: string;
  browserTitle?: string | null;
  cursorUrl?: string | null;
  cursorLightUrl?: string | null;
  cursorDarkUrl?: string | null;
  cursorHotspot?: {
    x?: number | null;
    y?: number | null;
  } | null;
  faviconUrl?: string | null;
  fontUrl?: string | null;
  theme?: {
    mode?: "light" | "dark" | "system" | null;
    light?: {
      background?: string | null;
      foreground?: string | null;
      primary?: string | null;
      secondary?: string | null;
      error?: string | null;
      card?: string | null;
      border?: string | null;
      scrollThumb?: string | null;
      scrollTrack?: string | null;
      fieldOkBg?: string | null;
      fieldOkBorder?: string | null;
      fieldErrorBg?: string | null;
      fieldErrorBorder?: string | null;
    } | null;
    dark?: {
      background?: string | null;
      foreground?: string | null;
      primary?: string | null;
      secondary?: string | null;
      error?: string | null;
      card?: string | null;
      border?: string | null;
      scrollThumb?: string | null;
      scrollTrack?: string | null;
      fieldOkBg?: string | null;
      fieldOkBorder?: string | null;
      fieldErrorBg?: string | null;
      fieldErrorBorder?: string | null;
    } | null;
  } | null;
  logoUrl?: string | null;
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
  primaryColor?: string | null;
  socialDescription?: string | null;
  socialImage?: {
    imageUrl?: string | null;
  } | null;
  openGraph?: {
    title?: string | null;
    description?: string | null;
    imageUrl?: string | null;
  } | null;
  twitter?: {
    title?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    card?: string | null;
    app?: {
      name?: string | null;
      id?: {
        iphone?: string | null;
        ipad?: string | null;
        googleplay?: string | null;
      } | null;
      url?: {
        iphone?: string | null;
        ipad?: string | null;
        googleplay?: string | null;
      } | null;
    } | null;
    player?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
      stream?: string | null;
      streamContentType?: string | null;
    } | null;
  } | null;
};

type InstanceFeatures = {
  wiki: boolean;
  wikiPublic: boolean;
  courses: boolean;
  coursesPublic: boolean;
  myCourses: boolean;
  profile: boolean;
  auth: boolean;
  authLogin: boolean;
  authRegister: boolean;
  captcha: boolean;
  captchaLogin: boolean;
  captchaRegister: boolean;
  captchaForgotPassword: boolean;
  captchaChangePassword: boolean;
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

type SocialMetadataSnapshot = {
  browserTitle: string;
  socialImageUrl: string;
  socialDescription: string;
  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImageUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImageUrl: string;
  twitterCard: string;
  twitterAppName: string;
  twitterAppIdIphone: string;
  twitterAppIdIpad: string;
  twitterAppIdGooglePlay: string;
  twitterAppUrlIphone: string;
  twitterAppUrlIpad: string;
  twitterAppUrlGooglePlay: string;
  twitterPlayerUrl: string;
  twitterPlayerWidth: string;
  twitterPlayerHeight: string;
  twitterPlayerStream: string;
  twitterPlayerStreamContentType: string;
  previewOrigin: string;
};

type SocialFieldKey = keyof SocialFieldErrors;

type SocialProviderStatus = {
  enabled: boolean;
  configured: boolean;
};

type SocialImagePurpose = "shared" | "open-graph" | "twitter";

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
  facebook: "Facebook",
  github: "GitHub",
  google: "Google",
  linkedin: "LinkedIn",
};

const FEATURE_TOGGLE_INFO: Record<
  string,
  { title: string; description: string; impact: string; risk?: string }
> = {
  wiki: {
    title: "Wiki",
    description:
      "Пълен switch за Wiki (публичен). Използвай го, ако искаш да скриеш Wiki изцяло от потребителите.",
    impact:
      "OFF скрива Wiki навигацията и всички публични /wiki страници връщат 404. Admin Wiki остава достъпен.",
    risk: "Потребителите губят достъп до документация/помощни материали и може да се увеличат запитванията към поддръжката.",
  },
  wikiPublic: {
    title: "Wiki public",
    description:
      "Публичният Wiki модул – статии, категории и търсене без вход.",
    impact:
      "Ако е OFF, линковете към Wiki се скриват, а всички /wiki страници връщат 404 и студентите вече не могат да четат помощни материали.",
    risk: "Може да загубиш самопомощ канал и да увеличиш натоварването на поддръжката.",
  },
  courses: {
    title: "Courses",
    description: "Навигацията и страниците за курсове (листинг + детайли).",
    impact:
      "OFF скрива Courses навигацията, а опитите за достъп връщат 404, така че студентите не могат да записват или разглеждат курсове.",
    risk: "Потребителите ще приемат платформата за счупена и може да загубиш приходи от платени курсове.",
  },
  coursesPublic: {
    title: "Courses public",
    description: "Публичен каталог за курсове (list + detail) без login.",
    impact:
      "OFF прави /courses и /course-categories недостъпни (404) за всички. Записването и My Courses могат да останат налични за вече вписани потребители.",
    risk: "Нови потребители няма да могат да разглеждат каталога и да откриват курсове.",
  },
  myCourses: {
    title: "My Courses",
    description:
      "Персонализираният раздел за записани курсове и прогрес (изисква login).",
    impact:
      "OFF връща 404 за /my-courses и свързаните user endpoints (users/me/courses, curriculum progress, enroll/certificate).",
    risk: "Потребителите няма да могат да продължат започнати курсове и да виждат прогрес/сертификати.",
  },
  profile: {
    title: "Profile",
    description:
      "Профилен раздел на потребителя (email, change-password, export).",
    impact:
      "OFF скрива /profile и спира user actions като change-password и email update (връща 404 на съответните endpoints).",
    risk: "Потребителите губят self-service управление на акаунта и ще се нуждаят от support.",
  },
  auth: {
    title: "Auth (risk)",
    description:
      "Master switch за всички auth endpoints (login/register/reset/social).",
    impact:
      "OFF спира всеки auth поток и връща 404/403 – реално никой освен админите с активна сесия няма да може да използва системата.",
    risk: "Неправилна употреба води до пълно изключване на платформата за потребителите.",
  },
  authLogin: {
    title: "Auth: Login (users)",
    description: "Контролира входа на стандартни потребители (role=user).",
    impact:
      "OFF връща 403 при login за студенти, но админ/инструктор роли все още могат да се вписват.",
    risk: "Потребителите ще останат извън системата и ще създават incident tickets, ако промяната не е планирана.",
  },
  authRegister: {
    title: "Auth: Register + Reset password",
    description:
      "Регистрация, забравена парола и reset процеси (email токени).",
    impact:
      "OFF показва съобщение в UI и връща 404 за register/forgot/reset API – нови акаунти и възстановяване на пароли стават невъзможни.",
    risk: "Забравилите паролата си потребители ще бъдат блокирани до повторно активиране.",
  },
  captcha: {
    title: "Captcha (global)",
    description:
      "Глобален switch за captcha. Ако е OFF, всички captcha под-опции се изключват.",
    impact: "OFF изключва captcha защита във всички auth/profile flows.",
    risk: "Повишен риск от bot/spam атаки, brute-force и злоупотреби.",
  },
  captchaLogin: {
    title: "Captcha: Login",
    description:
      "Captcha защита при login (може да се активира при подозрителни опити).",
    impact:
      "Когато е ON, backend може да изисква captchaToken при login според защитната логика.",
  },
  captchaRegister: {
    title: "Captcha: Register",
    description: "Captcha защита при регистрация.",
    impact: "Когато е ON, register изисква captchaToken.",
  },
  captchaForgotPassword: {
    title: "Captcha: Forgot password",
    description: "Captcha защита при forgot-password.",
    impact: "Когато е ON, forgot-password изисква captchaToken.",
  },
  captchaChangePassword: {
    title: "Captcha: Change password",
    description: "Captcha защита при смяна на парола в профила.",
    impact: "Когато е ON, change-password изисква captchaToken.",
  },
  paidCourses: {
    title: "Paid courses",
    description: "Показване на платени курсове, checkout/плащане и статуси.",
    impact:
      "OFF скрива всички CTA за плащане и маркира курсовете като недостъпни за покупка.",
    risk: "Временно спиране на приходи – използвай само при инциденти с плащания.",
  },
  gdprLegal: {
    title: "GDPR / Legal (risk)",
    description:
      "Навигация към Terms/Privacy + GDPR инструменти (export/delete).",
    impact:
      "OFF скрива правните страници и disable-ва GDPR self-service действия.",
    risk: "Може да доведе до регулаторни нарушения – увери се, че имаш друго покритие.",
  },
  infraMonitoring: {
    title: "Infra: Monitoring",
    description:
      "UI елементи, които показват статус на мониторинг/health endpoints.",
    impact:
      "OFF скрива мониторинг карти и прекратява автоматичните ping панели.",
    risk: "Няма директен риск, но DevOps губи видимост за здравето на системата.",
  },
  infraRedis: {
    title: "Infra: Redis",
    description: "Обозначава наличен Redis cache за сесии/опашки.",
    impact:
      "OFF кара приложението да избегне Redis функции и да използва in-memory fallback (по-бавно и по-рисково при рестарт).",
    risk: "Повече latency и потенциална загуба на сесии при рестартиране.",
  },
  infraRabbitmq: {
    title: "Infra: RabbitMQ",
    description: "Флаг дали е налична background queue за асинхронни задачи.",
    impact:
      "OFF принуждава приложенията да изпълняват задачи синхронно или да ги пропускат.",
    risk: "Изпращането на имейли/нотификации може да спре, а UI операции ще се забавят.",
  },
  infraErrorTracking: {
    title: "Infra: Error tracking",
    description:
      "Индикация, че външен error-tracking (Sentry и т.н.) е активен.",
    impact: "OFF скрива линковете към тракера и спира автоматичните репорти.",
    risk: "Инцидентите няма да бъдат логнати централизирано – разчитай на логове.",
  },
};

type FeatureToggleKey = keyof typeof FEATURE_TOGGLE_INFO;

function FeatureToggleLabel({
  label,
  featureKey,
}: {
  label: string;
  featureKey: FeatureToggleKey;
}) {
  const info = FEATURE_TOGGLE_INFO[featureKey];
  if (!info) {
    return (
      <div className="flex flex-1 items-center justify-between gap-2">
        <span className="text-sm text-gray-800">{label}</span>
      </div>
    );
  }

  const stopPropagation = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="flex flex-1 items-start justify-between gap-2">
      <span className="text-sm text-gray-800">{label}</span>
      <button
        type="button"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onMouseUp={stopPropagation}
        className="group relative ml-auto inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-[11px] font-semibold text-gray-600 transition hover:border-green-500 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label={`${info.title} информация`}
      >
        ?
        <div className="pointer-events-none absolute right-0 top-6 z-20 hidden w-72 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 shadow-xl group-hover:block group-focus-visible:block">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-500">
            {info.title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-gray-800">
            {info.description}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            <span className="font-semibold text-gray-900">Влияние:</span>{" "}
            {info.impact}
          </p>
          {info.risk && (
            <p className="mt-2 text-sm leading-relaxed text-red-700">
              <span className="font-semibold text-red-800">Риск:</span>{" "}
              {info.risk}
            </p>
          )}
        </div>
      </button>
    </div>
  );
}

export function StatusBadge({
  variant,
  label,
}: {
  variant: "ok" | "missing" | "fallback";
  label: string;
}) {
  const classes =
    variant === "ok"
      ? "border-green-200 bg-green-50 text-green-700"
      : variant === "fallback"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-red-200 bg-red-50 text-red-700";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${classes}`}
    >
      {label}
    </span>
  );
}

export function InfoTooltip({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: ReactNode;
}) {
  const stopPropagation = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <button
      type="button"
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      className="group relative inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-[11px] font-semibold text-gray-600 transition hover:border-green-500 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
      aria-label={label}
    >
      ?
      <div className="pointer-events-none absolute right-0 top-6 z-20 hidden w-80 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 shadow-xl group-hover:block group-focus-visible:block">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </p>
        <div className="mt-2 text-sm leading-relaxed text-gray-800">
          {description}
        </div>
      </div>
    </button>
  );
}

export function SocialPreviewCard({
  platform,
  title,
  description,
  imageUrl,
  domain,
  twitterCardType,
  twitterAppName,
  twitterPlayerUrl,
  twitterPlayerWidth,
  twitterPlayerHeight,
}: {
  platform: "facebook" | "twitter";
  title: string;
  description: string;
  imageUrl?: string | null;
  domain: string;
  twitterCardType?: string | null;
  twitterAppName?: string | null;
  twitterPlayerUrl?: string | null;
  twitterPlayerWidth?: number | null;
  twitterPlayerHeight?: number | null;
}) {
  const isTwitter = platform === "twitter";
  const effectiveTwitterCard = isTwitter
    ? twitterCardType && twitterCardType.length > 0
      ? twitterCardType
      : "summary_large_image"
    : null;
  const isTwitterCompactCard = effectiveTwitterCard === "summary";
  const isTwitterAppCard = effectiveTwitterCard === "app";
  const isTwitterPlayerCard = effectiveTwitterCard === "player";
  const layoutIsRow = !isTwitter || isTwitterCompactCard;
  const imageShellClass = !isTwitter
    ? "h-40 w-full md:h-44 md:w-1/2"
    : isTwitterCompactCard
      ? "h-40 w-full md:h-40 md:w-1/3"
      : "h-48 w-full";
  const contentClass = !isTwitter
    ? "flex flex-1 flex-col px-4 py-3"
    : isTwitterCompactCard
      ? "flex flex-1 flex-col px-4 py-3 md:w-2/3"
      : "flex flex-1 flex-col px-4 py-3";

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <span>
          {isTwitter ? "Twitter / X preview" : "Facebook / LinkedIn preview"}
        </span>
        {isTwitter && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
            Card: {effectiveTwitterCard}
          </span>
        )}
      </div>
      <div className={`flex flex-col ${layoutIsRow ? "md:flex-row" : ""}`}>
        <div className={imageShellClass}>
          <div
            className={`relative h-full w-full overflow-hidden rounded-none border-b border-gray-100 ${
              layoutIsRow ? "md:border-b-0 md:border-r" : ""
            } ${imageUrl ? "" : "flex items-center justify-center bg-gray-100"}`}
            style={
              imageUrl
                ? {
                    backgroundImage: `url(${imageUrl})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }
                : undefined
            }
          >
            {isTwitterPlayerCard ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60">
                  <span className="ml-0.5 text-base font-bold text-white">
                    ▶
                  </span>
                </div>
              </div>
            ) : null}

            {!imageUrl && !isTwitterPlayerCard && (
              <span className="text-xs font-medium text-gray-500">
                Няма изображение
              </span>
            )}
          </div>
        </div>
        <div className={contentClass}>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">
            {domain || "example.com"}
          </p>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {title || "Добави заглавие"}
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {description ||
              "Добави описание, за да завършиш social preview картата."}
          </p>

          {isTwitterAppCard ? (
            <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                App card
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {twitterAppName?.trim()
                  ? `Install / Open: ${twitterAppName.trim()}`
                  : "Install / Open: (липсва App name)"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Twitter показва CTA към App Store / Google Play.
              </p>
            </div>
          ) : null}

          {isTwitterPlayerCard ? (
            <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Player card
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {twitterPlayerWidth && twitterPlayerHeight
                  ? `Player: ${twitterPlayerWidth}×${twitterPlayerHeight}`
                  : "Player: (липсват размери)"}
              </p>
              <p className="mt-1 break-all text-xs text-gray-500">
                {twitterPlayerUrl?.trim()
                  ? twitterPlayerUrl.trim()
                  : "(липсва Player URL)"}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
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
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        checked
          ? "border-green-500 bg-green-600"
          : "border-gray-300 bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function AccordionSection({
  title,
  description,
  open,
  onToggle,
  children,
  headerAdornment,
}: {
  title: string;
  description?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  headerAdornment?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 px-5 py-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start justify-between gap-4 text-left"
        >
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
            {description ? (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            ) : null}
          </div>
          <span
            className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-transform ${
              open ? "rotate-180" : "rotate-0"
            }`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>
        <div className="flex flex-shrink-0 items-start pt-1">
          {headerAdornment ? headerAdornment : null}
        </div>
      </div>
      {open ? <div className="px-5 pb-5">{children}</div> : null}
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmEnabled,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmEnabled: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmEnabled}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

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

  const themeStorageKey = "beelms.themeMode";
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [uiThemeMode, setUiThemeMode] = useState<"light" | "dark" | "system">(
    () => {
      if (typeof window === "undefined") return "system";
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "light" || attr === "dark" || attr === "system") {
        return attr;
      }
      try {
        const v = localStorage.getItem(themeStorageKey);
        if (v === "light" || v === "dark" || v === "system") {
          return v;
        }
      } catch {
        // ignore
      }
      return "system";
    },
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const mqlHandler = () => {
      setSystemPrefersDark(mql.matches);
    };

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", mqlHandler);
    } else {
      mql.addListener(mqlHandler);
    }

    const observer = new MutationObserver(() => {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "light" || attr === "dark" || attr === "system") {
        setUiThemeMode(attr);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const storageHandler = (e: StorageEvent) => {
      if (e.key !== themeStorageKey) return;
      const v = e.newValue;
      if (v === "light" || v === "dark" || v === "system") {
        setUiThemeMode(v);
      }
    };
    window.addEventListener("storage", storageHandler);

    mqlHandler();

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", storageHandler);
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", mqlHandler);
      } else {
        mql.removeListener(mqlHandler);
      }
    };
  }, []);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const [authRiskModalOpen, setAuthRiskModalOpen] = useState(false);
  const [authRiskAcknowledged, setAuthRiskAcknowledged] = useState(false);

  const [initialFeatures, setInitialFeatures] =
    useState<InstanceFeatures | null>(null);

  const [appName, setAppName] = useState<string>("BeeLMS");
  const [browserTitle, setBrowserTitle] = useState<string>("");
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const faviconFileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoLightUrl, setLogoLightUrl] = useState<string>("");
  const logoLightFileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoDarkUrl, setLogoDarkUrl] = useState<string>("");
  const logoDarkFileInputRef = useRef<HTMLInputElement | null>(null);
  const [fontUrl, setFontUrl] = useState<string>("");
  const fontFileInputRef = useRef<HTMLInputElement | null>(null);
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(
    "system",
  );
  const [themeLight, setThemeLight] = useState<Record<string, string>>({
    background: "#ffffff",
    foreground: "#171717",
    primary: "#16a34a",
    secondary: "#2563eb",
    error: "#dc2626",
    card: "#ffffff",
    border: "#e5e7eb",
    scrollThumb: "#86efac",
    scrollTrack: "#f0fdf4",
    fieldOkBg: "#f0fdf4",
    fieldOkBorder: "#dcfce7",
    fieldErrorBg: "#fef2f2",
    fieldErrorBorder: "#fee2e2",
  });
  const [themeDark, setThemeDark] = useState<Record<string, string>>({
    background: "#0a0a0a",
    foreground: "#ededed",
    primary: "#22c55e",
    secondary: "#60a5fa",
    error: "#f87171",
    card: "#111827",
    border: "#374151",
    scrollThumb: "#16a34a",
    scrollTrack: "#0b2a16",
    fieldOkBg: "#052e16",
    fieldOkBorder: "#14532d",
    fieldErrorBg: "#450a0a",
    fieldErrorBorder: "#7f1d1d",
  });
  const [savedThemeLight, setSavedThemeLight] = useState<
    Record<string, string>
  >({
    background: "#ffffff",
    foreground: "#171717",
    primary: "#16a34a",
    secondary: "#2563eb",
    error: "#dc2626",
    card: "#ffffff",
    border: "#e5e7eb",
    scrollThumb: "#86efac",
    scrollTrack: "#f0fdf4",
    fieldOkBg: "#f0fdf4",
    fieldOkBorder: "#dcfce7",
    fieldErrorBg: "#fef2f2",
    fieldErrorBorder: "#fee2e2",
  });
  const [savedThemeDark, setSavedThemeDark] = useState<Record<string, string>>({
    background: "#0a0a0a",
    foreground: "#ededed",
    primary: "#22c55e",
    secondary: "#60a5fa",
    error: "#f87171",
    card: "#111827",
    border: "#374151",
    scrollThumb: "#16a34a",
    scrollTrack: "#0b2a16",
    fieldOkBg: "#052e16",
    fieldOkBorder: "#14532d",
    fieldErrorBg: "#450a0a",
    fieldErrorBorder: "#7f1d1d",
  });
  const [themeLightRedo, setThemeLightRedo] = useState<
    Partial<Record<string, string>>
  >({});
  const [themeDarkRedo, setThemeDarkRedo] = useState<
    Partial<Record<string, string>>
  >({});

  const mergeThemePalette = (
    prev: Record<string, string>,
    incoming: Record<string, string | null | undefined> | null | undefined,
  ): Record<string, string> => {
    const next = { ...prev };
    for (const [key, value] of Object.entries(incoming ?? {})) {
      if (typeof value === "string") {
        next[key] = value;
      }
    }
    return next;
  };
  const [cursorUrl, setCursorUrl] = useState<string>("");
  const [cursorLightUrl, setCursorLightUrl] = useState<string>("");
  const [cursorDarkUrl, setCursorDarkUrl] = useState<string>("");
  const [cursorHotspotX, setCursorHotspotX] = useState<string>("");
  const [cursorHotspotY, setCursorHotspotY] = useState<string>("");
  const cursorFileInputRef = useRef<HTMLInputElement | null>(null);
  const cursorLightFileInputRef = useRef<HTMLInputElement | null>(null);
  const cursorDarkFileInputRef = useRef<HTMLInputElement | null>(null);
  const [cursorHotspotTestPos, setCursorHotspotTestPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [cursorHotspotTestClickPos, setCursorHotspotTestClickPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const cursorHotspotPersistedRef = useRef<{ x: string; y: string } | null>(
    null,
  );
  const [cursorHotspotPersistStatus, setCursorHotspotPersistStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [socialDescription, setSocialDescription] = useState<string>("");
  const [socialImageUrl, setSocialImageUrl] = useState<string>("");
  const socialImageInputRef = useRef<HTMLInputElement | null>(null);
  const [openGraphTitle, setOpenGraphTitle] = useState<string>("");
  const [openGraphDescription, setOpenGraphDescription] = useState<string>("");
  const [openGraphImageUrl, setOpenGraphImageUrl] = useState<string>("");
  const openGraphImageInputRef = useRef<HTMLInputElement | null>(null);
  const [twitterTitle, setTwitterTitle] = useState<string>("");
  const [twitterDescription, setTwitterDescription] = useState<string>("");
  const [twitterImageUrl, setTwitterImageUrl] = useState<string>("");
  const twitterImageInputRef = useRef<HTMLInputElement | null>(null);
  const [twitterCard, setTwitterCard] = useState<string>("summary_large_image");
  const [twitterAppName, setTwitterAppName] = useState<string>("");
  const [twitterAppIdIphone, setTwitterAppIdIphone] = useState<string>("");
  const [twitterAppIdIpad, setTwitterAppIdIpad] = useState<string>("");
  const [twitterAppIdGooglePlay, setTwitterAppIdGooglePlay] =
    useState<string>("");
  const [twitterAppUrlIphone, setTwitterAppUrlIphone] = useState<string>("");
  const [twitterAppUrlIpad, setTwitterAppUrlIpad] = useState<string>("");
  const [twitterAppUrlGooglePlay, setTwitterAppUrlGooglePlay] =
    useState<string>("");
  const [twitterPlayerUrl, setTwitterPlayerUrl] = useState<string>("");
  const [twitterPlayerWidth, setTwitterPlayerWidth] = useState<string>("");
  const [twitterPlayerHeight, setTwitterPlayerHeight] = useState<string>("");
  const [twitterPlayerStream, setTwitterPlayerStream] = useState<string>("");
  const [twitterPlayerStreamContentType, setTwitterPlayerStreamContentType] =
    useState<string>("");
  const [uploadingSocialImagePurpose, setUploadingSocialImagePurpose] =
    useState<SocialImagePurpose | null>(null);
  const [previewOrigin, setPreviewOrigin] = useState<string>(
    "https://example.com",
  );
  const [showMetaTagsSnippet, setShowMetaTagsSnippet] =
    useState<boolean>(false);
  const previewOriginRef = useRef<string>(previewOrigin);
  const [socialMetadataLastSaved, setSocialMetadataLastSaved] =
    useState<SocialMetadataSnapshot | null>(null);
  const [metaFetchStatus, setMetaFetchStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [metaFetchMessage, setMetaFetchMessage] = useState<string | null>(null);

  useEffect(() => {
    previewOriginRef.current = previewOrigin;
  }, [previewOrigin]);
  const normalizedPreviewUrl = useMemo(() => {
    const trimmed = previewOrigin.trim();
    if (!trimmed) {
      return "https://example.com";
    }
    try {
      const parsed = new URL(trimmed);
      if (
        !parsed.protocol ||
        parsed.protocol === "http:" ||
        parsed.protocol === "https:"
      ) {
        return parsed.toString();
      }
      return `https://${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return "https://example.com";
    }
  }, [previewOrigin]);
  const previewDomain = useMemo(() => {
    try {
      return new URL(normalizedPreviewUrl).hostname;
    } catch {
      return "example.com";
    }
  }, [normalizedPreviewUrl]);
  const isUploadingOgImage = uploadingSocialImagePurpose === "open-graph";
  const isUploadingTwitterImage = uploadingSocialImagePurpose === "twitter";
  const isUploadingSharedImage = uploadingSocialImagePurpose === "shared";
  const baseTitle = (browserTitle.trim() || appName || "").trim() || "BeeLMS";
  const baseDescription =
    socialDescription.trim().length > 0
      ? socialDescription.trim()
      : "Добави описание, за да изглежда добре при споделяне.";
  const ogPreviewTitle =
    openGraphTitle.trim().length > 0 ? openGraphTitle.trim() : baseTitle;
  const ogPreviewDescription =
    openGraphDescription.trim().length > 0
      ? openGraphDescription.trim()
      : baseDescription;
  const fallbackSocialImage =
    socialImageUrl.trim().length > 0 ? socialImageUrl.trim() : null;
  const ogPreviewImage =
    openGraphImageUrl.trim().length > 0
      ? openGraphImageUrl.trim()
      : fallbackSocialImage;
  const twitterPreviewTitle =
    twitterTitle.trim().length > 0 ? twitterTitle.trim() : ogPreviewTitle;
  const twitterPreviewDescription =
    twitterDescription.trim().length > 0
      ? twitterDescription.trim()
      : ogPreviewDescription;
  const twitterPreviewImage =
    twitterImageUrl.trim().length > 0
      ? twitterImageUrl.trim()
      : fallbackSocialImage;
  const ogSectionHasContent = Boolean(
    openGraphTitle.trim().length ||
    openGraphDescription.trim().length ||
    openGraphImageUrl.trim().length,
  );
  const twitterSectionHasContent = Boolean(
    twitterTitle.trim().length ||
    twitterDescription.trim().length ||
    twitterImageUrl.trim().length ||
    (twitterCard.trim().length > 0 && twitterCard !== "summary_large_image") ||
    twitterAppName.trim().length ||
    twitterAppIdIphone.trim().length ||
    twitterAppIdIpad.trim().length ||
    twitterAppIdGooglePlay.trim().length ||
    twitterAppUrlIphone.trim().length ||
    twitterAppUrlIpad.trim().length ||
    twitterAppUrlGooglePlay.trim().length ||
    twitterPlayerUrl.trim().length ||
    twitterPlayerWidth.trim().length ||
    twitterPlayerHeight.trim().length ||
    twitterPlayerStream.trim().length ||
    twitterPlayerStreamContentType.trim().length,
  );
  const twitterAppHasMinimum =
    twitterAppName.trim().length > 0 && twitterAppIdIphone.trim().length > 0;
  const twitterPlayerHasMinimum =
    twitterPlayerUrl.trim().length > 0 &&
    Number.isFinite(Number(twitterPlayerWidth.trim())) &&
    Number.isFinite(Number(twitterPlayerHeight.trim()));

  const twitterPlayerWidthNumber = Number.isFinite(
    Number(twitterPlayerWidth.trim()),
  )
    ? Number(twitterPlayerWidth.trim())
    : null;
  const twitterPlayerHeightNumber = Number.isFinite(
    Number(twitterPlayerHeight.trim()),
  )
    ? Number(twitterPlayerHeight.trim())
    : null;

  const twitterAppNameMissing =
    twitterCard === "app" && twitterAppName.trim().length === 0;
  const twitterAppIdIphoneMissing =
    twitterCard === "app" && twitterAppIdIphone.trim().length === 0;
  const twitterPlayerUrlMissing =
    twitterCard === "player" && twitterPlayerUrl.trim().length === 0;
  const twitterPlayerWidthMissing =
    twitterCard === "player" &&
    (!Number.isFinite(Number(twitterPlayerWidth.trim())) ||
      Number(twitterPlayerWidth.trim()) <= 0);
  const twitterPlayerHeightMissing =
    twitterCard === "player" &&
    (!Number.isFinite(Number(twitterPlayerHeight.trim())) ||
      Number(twitterPlayerHeight.trim()) <= 0);

  const twitterAppMissingFields = useMemo(() => {
    const fields: string[] = [];
    if (twitterAppNameMissing) fields.push("App name");
    if (twitterAppIdIphoneMissing) fields.push("App ID (iPhone)");
    return fields;
  }, [twitterAppIdIphoneMissing, twitterAppNameMissing]);

  const twitterPlayerMissingFields = useMemo(() => {
    const fields: string[] = [];
    if (twitterPlayerUrlMissing) fields.push("Player URL");
    if (twitterPlayerWidthMissing)
      fields.push("Player width (положително число)");
    if (twitterPlayerHeightMissing)
      fields.push("Player height (положително число)");
    return fields;
  }, [
    twitterPlayerHeightMissing,
    twitterPlayerUrlMissing,
    twitterPlayerWidthMissing,
  ]);

  const socialInputClassOk =
    "mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";
  const socialInputClassError =
    "mt-2 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

  const escapeMetaValue = (value: string) => {
    return value
      .replace(/\r?\n/g, " ")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .trim();
  };

  const socialMetaTagsSnippet = useMemo(() => {
    const ogTitleOut = escapeMetaValue(ogPreviewTitle || "");
    const ogDescriptionOut = escapeMetaValue(ogPreviewDescription || "");
    const ogImageOut = ogPreviewImage ? escapeMetaValue(ogPreviewImage) : "";

    const twitterTitleOut = escapeMetaValue(twitterPreviewTitle || "");
    const twitterDescriptionOut = escapeMetaValue(
      twitterPreviewDescription || "",
    );
    const twitterImageOut = twitterPreviewImage
      ? escapeMetaValue(twitterPreviewImage)
      : "";

    const isSummary = twitterCard === "summary";
    const isApp = twitterCard === "app";
    const isPlayer = twitterCard === "player";
    const effectiveTwitterCard = isSummary
      ? "summary"
      : isApp
        ? twitterAppHasMinimum
          ? "app"
          : "summary_large_image"
        : isPlayer
          ? twitterPlayerHasMinimum
            ? "player"
            : "summary_large_image"
          : "summary_large_image";

    const lines: string[] = [];
    if (ogTitleOut)
      lines.push(`<meta property="og:title" content="${ogTitleOut}" />`);
    if (ogDescriptionOut)
      lines.push(
        `<meta property="og:description" content="${ogDescriptionOut}" />`,
      );
    if (ogImageOut)
      lines.push(`<meta property="og:image" content="${ogImageOut}" />`);

    lines.push(
      `<meta name="twitter:card" content="${effectiveTwitterCard}" />`,
    );
    if (twitterTitleOut)
      lines.push(`<meta name="twitter:title" content="${twitterTitleOut}" />`);
    if (twitterDescriptionOut)
      lines.push(
        `<meta name="twitter:description" content="${twitterDescriptionOut}" />`,
      );
    if (twitterImageOut)
      lines.push(`<meta name="twitter:image" content="${twitterImageOut}" />`);

    if (effectiveTwitterCard === "app") {
      const appNameOut = escapeMetaValue(twitterAppName || "");
      const idIphoneOut = escapeMetaValue(twitterAppIdIphone || "");
      const idIpadOut = escapeMetaValue(twitterAppIdIpad || "");
      const idGooglePlayOut = escapeMetaValue(twitterAppIdGooglePlay || "");
      const urlIphoneOut = escapeMetaValue(twitterAppUrlIphone || "");
      const urlIpadOut = escapeMetaValue(twitterAppUrlIpad || "");
      const urlGooglePlayOut = escapeMetaValue(twitterAppUrlGooglePlay || "");

      if (appNameOut)
        lines.push(
          `<meta name="twitter:app:name:iphone" content="${appNameOut}" />`,
        );
      if (appNameOut)
        lines.push(
          `<meta name="twitter:app:name:ipad" content="${appNameOut}" />`,
        );
      if (appNameOut)
        lines.push(
          `<meta name="twitter:app:name:googleplay" content="${appNameOut}" />`,
        );
      if (idIphoneOut)
        lines.push(
          `<meta name="twitter:app:id:iphone" content="${idIphoneOut}" />`,
        );
      if (idIpadOut)
        lines.push(
          `<meta name="twitter:app:id:ipad" content="${idIpadOut}" />`,
        );
      if (idGooglePlayOut)
        lines.push(
          `<meta name="twitter:app:id:googleplay" content="${idGooglePlayOut}" />`,
        );
      if (urlIphoneOut)
        lines.push(
          `<meta name="twitter:app:url:iphone" content="${urlIphoneOut}" />`,
        );
      if (urlIpadOut)
        lines.push(
          `<meta name="twitter:app:url:ipad" content="${urlIpadOut}" />`,
        );
      if (urlGooglePlayOut)
        lines.push(
          `<meta name="twitter:app:url:googleplay" content="${urlGooglePlayOut}" />`,
        );
    }

    if (effectiveTwitterCard === "player") {
      const playerUrlOut = escapeMetaValue(twitterPlayerUrl || "");
      const playerStreamOut = escapeMetaValue(twitterPlayerStream || "");
      const playerStreamTypeOut = escapeMetaValue(
        twitterPlayerStreamContentType || "",
      );

      if (playerUrlOut)
        lines.push(`<meta name="twitter:player" content="${playerUrlOut}" />`);
      if (twitterPlayerWidthNumber)
        lines.push(
          `<meta name="twitter:player:width" content="${twitterPlayerWidthNumber}" />`,
        );
      if (twitterPlayerHeightNumber)
        lines.push(
          `<meta name="twitter:player:height" content="${twitterPlayerHeightNumber}" />`,
        );
      if (playerStreamOut)
        lines.push(
          `<meta name="twitter:player:stream" content="${playerStreamOut}" />`,
        );
      if (playerStreamTypeOut)
        lines.push(
          `<meta name="twitter:player:stream:content_type" content="${playerStreamTypeOut}" />`,
        );
    }

    return lines.join("\n");
  }, [
    ogPreviewDescription,
    ogPreviewImage,
    ogPreviewTitle,
    twitterAppHasMinimum,
    twitterAppIdGooglePlay,
    twitterAppIdIpad,
    twitterAppIdIphone,
    twitterAppName,
    twitterAppUrlGooglePlay,
    twitterAppUrlIpad,
    twitterAppUrlIphone,
    twitterCard,
    twitterPlayerHasMinimum,
    twitterPlayerHeightNumber,
    twitterPlayerStream,
    twitterPlayerStreamContentType,
    twitterPlayerUrl,
    twitterPlayerWidthNumber,
    twitterPreviewDescription,
    twitterPreviewImage,
    twitterPreviewTitle,
  ]);

  const validatorLinks = useMemo(() => {
    const encoded = encodeURIComponent(normalizedPreviewUrl);
    return {
      facebook: `https://developers.facebook.com/tools/debug/?q=${encoded}`,
      linkedin: `https://www.linkedin.com/post-inspector/inspect/${encoded}`,
      twitter: `https://cards-dev.twitter.com/validator?url=${encoded}`,
    };
  }, [normalizedPreviewUrl]);

  const currentSocialMetadataSnapshot = useMemo<SocialMetadataSnapshot>(() => {
    return {
      browserTitle,
      socialImageUrl,
      socialDescription,
      openGraphTitle,
      openGraphDescription,
      openGraphImageUrl,
      twitterTitle,
      twitterDescription,
      twitterImageUrl,
      twitterCard,
      twitterAppName,
      twitterAppIdIphone,
      twitterAppIdIpad,
      twitterAppIdGooglePlay,
      twitterAppUrlIphone,
      twitterAppUrlIpad,
      twitterAppUrlGooglePlay,
      twitterPlayerUrl,
      twitterPlayerWidth,
      twitterPlayerHeight,
      twitterPlayerStream,
      twitterPlayerStreamContentType,
      previewOrigin,
    };
  }, [
    browserTitle,
    openGraphDescription,
    openGraphImageUrl,
    openGraphTitle,
    previewOrigin,
    socialDescription,
    socialImageUrl,
    twitterAppIdGooglePlay,
    twitterAppIdIpad,
    twitterAppIdIphone,
    twitterAppName,
    twitterAppUrlGooglePlay,
    twitterAppUrlIpad,
    twitterAppUrlIphone,
    twitterCard,
    twitterDescription,
    twitterImageUrl,
    twitterPlayerHeight,
    twitterPlayerStream,
    twitterPlayerStreamContentType,
    twitterPlayerUrl,
    twitterPlayerWidth,
    twitterTitle,
  ]);

  const socialMetadataSnapshotFromState = (): SocialMetadataSnapshot => {
    return {
      browserTitle,
      socialImageUrl,
      socialDescription,
      openGraphTitle,
      openGraphDescription,
      openGraphImageUrl,
      twitterTitle,
      twitterDescription,
      twitterImageUrl,
      twitterCard,
      twitterAppName,
      twitterAppIdIphone,
      twitterAppIdIpad,
      twitterAppIdGooglePlay,
      twitterAppUrlIphone,
      twitterAppUrlIpad,
      twitterAppUrlGooglePlay,
      twitterPlayerUrl,
      twitterPlayerWidth,
      twitterPlayerHeight,
      twitterPlayerStream,
      twitterPlayerStreamContentType,
      previewOrigin,
    };
  };

  const applySocialMetadataSnapshot = (snapshot: SocialMetadataSnapshot) => {
    setBrowserTitle(snapshot.browserTitle);
    setSocialImageUrl(snapshot.socialImageUrl);
    setSocialDescription(snapshot.socialDescription);
    setOpenGraphTitle(snapshot.openGraphTitle);
    setOpenGraphDescription(snapshot.openGraphDescription);
    setOpenGraphImageUrl(snapshot.openGraphImageUrl);
    setTwitterTitle(snapshot.twitterTitle);
    setTwitterDescription(snapshot.twitterDescription);
    setTwitterImageUrl(snapshot.twitterImageUrl);
    setTwitterCard(snapshot.twitterCard);
    setTwitterAppName(snapshot.twitterAppName);
    setTwitterAppIdIphone(snapshot.twitterAppIdIphone);
    setTwitterAppIdIpad(snapshot.twitterAppIdIpad);
    setTwitterAppIdGooglePlay(snapshot.twitterAppIdGooglePlay);
    setTwitterAppUrlIphone(snapshot.twitterAppUrlIphone);
    setTwitterAppUrlIpad(snapshot.twitterAppUrlIpad);
    setTwitterAppUrlGooglePlay(snapshot.twitterAppUrlGooglePlay);
    setTwitterPlayerUrl(snapshot.twitterPlayerUrl);
    setTwitterPlayerWidth(snapshot.twitterPlayerWidth);
    setTwitterPlayerHeight(snapshot.twitterPlayerHeight);
    setTwitterPlayerStream(snapshot.twitterPlayerStream);
    setTwitterPlayerStreamContentType(snapshot.twitterPlayerStreamContentType);
    setPreviewOrigin(snapshot.previewOrigin);
  };

  const isSocialMetadataDirty = useMemo(() => {
    if (!socialMetadataLastSaved) {
      return false;
    }
    return (
      JSON.stringify(currentSocialMetadataSnapshot) !==
      JSON.stringify(socialMetadataLastSaved)
    );
  }, [currentSocialMetadataSnapshot, socialMetadataLastSaved]);

  const handleUndoSocialMetadataChanges = () => {
    if (!socialMetadataLastSaved) {
      return;
    }
    applySocialMetadataSnapshot(socialMetadataLastSaved);
    setError(null);
    setSuccess(
      "Върнах промените в Browser & Social metadata. Натисни Save ако искаш да ги запазиш отново.",
    );
  };

  const handleFetchMetadataFromUrl = async () => {
    setError(null);
    setSuccess(null);
    setMetaFetchStatus("loading");
    setMetaFetchMessage(null);

    try {
      const url = normalizedPreviewUrl;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "text/html",
        },
      });

      if (!res.ok) {
        setMetaFetchStatus("error");
        setMetaFetchMessage(
          `HTTP ${res.status} · Неуспешно зареждане на HTML.`,
        );
        return;
      }

      const html = await res.text();
      if (typeof DOMParser === "undefined") {
        setMetaFetchStatus("error");
        setMetaFetchMessage("DOMParser не е наличен в този браузър контекст.");
        return;
      }

      const doc = new DOMParser().parseFromString(html, "text/html");
      const readMeta = (selector: string): string => {
        const el = doc.querySelector(selector) as HTMLMetaElement | null;
        const content = el?.getAttribute("content");
        return (content ?? "").trim();
      };

      const nextOgTitle = readMeta('meta[property="og:title"]');
      const nextOgDescription = readMeta('meta[property="og:description"]');
      const nextOgImage = readMeta('meta[property="og:image"]');

      const nextTwitterTitle = readMeta('meta[name="twitter:title"]');
      const nextTwitterDescription = readMeta(
        'meta[name="twitter:description"]',
      );
      const nextTwitterImage = readMeta('meta[name="twitter:image"]');
      const nextTwitterCard = readMeta('meta[name="twitter:card"]');

      if (nextOgTitle) setOpenGraphTitle(nextOgTitle);
      if (nextOgDescription) setOpenGraphDescription(nextOgDescription);
      if (nextOgImage) setOpenGraphImageUrl(nextOgImage);
      if (nextTwitterTitle) setTwitterTitle(nextTwitterTitle);
      if (nextTwitterDescription) setTwitterDescription(nextTwitterDescription);
      if (nextTwitterImage) setTwitterImageUrl(nextTwitterImage);
      if (nextTwitterCard) setTwitterCard(nextTwitterCard);

      if (!browserTitle.trim()) {
        const docTitle = (doc.querySelector("title")?.textContent ?? "").trim();
        if (docTitle) {
          setBrowserTitle(docTitle);
        }
      }

      const foundAny =
        nextOgTitle ||
        nextOgDescription ||
        nextOgImage ||
        nextTwitterTitle ||
        nextTwitterDescription ||
        nextTwitterImage ||
        nextTwitterCard;

      setMetaFetchStatus("success");
      setMetaFetchMessage(
        foundAny
          ? "Изтеглих meta tags от URL. Провери стойностите и натисни Save."
          : "URL се зареди, но не намерих OG/Twitter meta tags в HTML.",
      );
    } catch (err) {
      setMetaFetchStatus("error");
      setMetaFetchMessage(
        err instanceof TypeError
          ? "Неуспешно fetch-ване на URL (вероятно CORS блокировка). Опитай с друг URL или използвай backend proxy."
          : err instanceof Error
            ? err.message
            : "Неуспешно fetch-ване на URL.",
      );
    }
  };

  const handleCursorLightFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (cursorLightUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/cursor-light`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        const payload = (await res.json()) as { message?: string };
        setError(payload?.message ?? "Неуспешно качване на cursor файла.");
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на cursor файла.");
        return;
      }

      setCursorLightUrl(data.url);
      await persistBrandingField(
        { cursorLightUrl: data.url },
        "Cursor (light) файлът е качен и запазен. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на cursor файла.",
      );
    }
  };

  const handleCursorDarkFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (cursorDarkUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/cursor-dark`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        const payload = (await res.json()) as { message?: string };
        setError(payload?.message ?? "Неуспешно качване на cursor файла.");
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на cursor файла.");
        return;
      }

      setCursorDarkUrl(data.url);
      await persistBrandingField(
        { cursorDarkUrl: data.url },
        "Cursor (dark) файлът е качен и запазен. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на cursor файла.",
      );
    }
  };

  const handleBrandingFaviconUploadClick = () => {
    if (faviconFileInputRef.current) {
      faviconFileInputRef.current.value = "";
      faviconFileInputRef.current.click();
    }
  };

  const handleBrandingLogoUploadClick = () => {
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = "";
      logoFileInputRef.current.click();
    }
  };

  const handleBrandingLogoLightUploadClick = () => {
    if (logoLightFileInputRef.current) {
      logoLightFileInputRef.current.value = "";
      logoLightFileInputRef.current.click();
    }
  };

  const handleBrandingLogoDarkUploadClick = () => {
    if (logoDarkFileInputRef.current) {
      logoDarkFileInputRef.current.value = "";
      logoDarkFileInputRef.current.click();
    }
  };

  const handleBrandingFontUploadClick = () => {
    if (fontFileInputRef.current) {
      fontFileInputRef.current.value = "";
      fontFileInputRef.current.click();
    }
  };

  const persistBrandingField = async (
    patch: Record<string, unknown>,
    successMessage: string,
  ) => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: "PATCH",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branding: patch,
        }),
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setError("Неуспешно запазване на branding настройките.");
        return;
      }

      const updated = (await res.json()) as AdminSettingsResponse;
      setFaviconUrl(updated.branding?.faviconUrl ?? "");
      setFontUrl(updated.branding?.fontUrl ?? "");
      setLogoUrl(updated.branding?.logoUrl ?? "");
      setLogoLightUrl(updated.branding?.logoLightUrl ?? "");
      setLogoDarkUrl(updated.branding?.logoDarkUrl ?? "");
      {
        const modeRaw = updated.branding?.theme?.mode ?? "system";
        const mode =
          modeRaw === "light" || modeRaw === "dark" || modeRaw === "system"
            ? modeRaw
            : "system";
        setThemeMode(mode);
        setThemeLight((prev) =>
          mergeThemePalette(prev, updated.branding?.theme?.light),
        );
        setThemeDark((prev) =>
          mergeThemePalette(prev, updated.branding?.theme?.dark),
        );
      }
      setCursorUrl(updated.branding?.cursorUrl ?? "");
      setCursorLightUrl(updated.branding?.cursorLightUrl ?? "");
      setCursorDarkUrl(updated.branding?.cursorDarkUrl ?? "");
      setCursorHotspotX(
        typeof updated.branding?.cursorHotspot?.x === "number"
          ? String(updated.branding.cursorHotspot.x)
          : "",
      );
      setCursorHotspotY(
        typeof updated.branding?.cursorHotspot?.y === "number"
          ? String(updated.branding.cursorHotspot.y)
          : "",
      );
      cursorHotspotPersistedRef.current = {
        x:
          typeof updated.branding?.cursorHotspot?.x === "number"
            ? String(updated.branding.cursorHotspot.x)
            : "",
        y:
          typeof updated.branding?.cursorHotspot?.y === "number"
            ? String(updated.branding.cursorHotspot.y)
            : "",
      };
      setSuccess(successMessage);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Неуспешно запазване на branding.",
      );
    }
  };

  const handleBrandingFaviconFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (faviconUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/favicon`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на favicon.";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на favicon.");
        return;
      }

      setFaviconUrl(data.url);
      await persistBrandingField(
        { faviconUrl: data.url },
        "Favicon е качен и запазен. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Неуспешно качване на favicon.",
      );
    }
  };

  const handleBrandingLogoFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (logoUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings/branding/logo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на logo.";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на logo.");
        return;
      }

      setLogoUrl(data.url);
      await persistBrandingField(
        { logoUrl: data.url },
        "Logo е качено и запазено. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Неуспешно качване на logo.",
      );
    }
  };

  const handleBrandingLogoLightFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (logoLightUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/logo-light`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на logo (light).";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на logo (light). ");
        return;
      }

      setLogoLightUrl(data.url);
      await persistBrandingField(
        { logoLightUrl: data.url },
        "Logo (light) е качено и запазено. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на logo (light).",
      );
    }
  };

  const handleBrandingLogoDarkFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (logoDarkUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/logo-dark`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на logo (dark).";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на logo (dark). ");
        return;
      }

      setLogoDarkUrl(data.url);
      await persistBrandingField(
        { logoDarkUrl: data.url },
        "Logo (dark) е качено и запазено. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на logo (dark).",
      );
    }
  };

  const handleBrandingFontFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (fontUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings/branding/font`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на font файла.";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на font файла.");
        return;
      }

      setFontUrl(data.url);
      await persistBrandingField(
        { fontUrl: data.url },
        "Font файлът е качен и запазен. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Неуспешно качване на font файла.",
      );
    }
  };
  const metadataSectionAccent = (filled: boolean) =>
    filled ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50";

  const [wiki, setWiki] = useState<boolean>(true);
  const [wikiPublic, setWikiPublic] = useState<boolean>(true);
  const [courses, setCourses] = useState<boolean>(true);
  const [coursesPublic, setCoursesPublic] = useState<boolean>(true);
  const [myCourses, setMyCourses] = useState<boolean>(true);
  const [profile, setProfile] = useState<boolean>(true);
  const [auth, setAuth] = useState<boolean>(true);
  const [authLogin, setAuthLogin] = useState<boolean>(true);
  const [authRegister, setAuthRegister] = useState<boolean>(true);
  const [captcha, setCaptcha] = useState<boolean>(false);
  const [captchaLogin, setCaptchaLogin] = useState<boolean>(false);
  const [captchaRegister, setCaptchaRegister] = useState<boolean>(false);
  const [captchaForgotPassword, setCaptchaForgotPassword] =
    useState<boolean>(false);
  const [captchaChangePassword, setCaptchaChangePassword] =
    useState<boolean>(false);
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

  const handleUseCurrentOrigin = () => {
    if (typeof window === "undefined") {
      return;
    }
    setPreviewOrigin(window.location.origin);
  };

  const handleUseLocalhostPreview = () => {
    setPreviewOrigin("http://localhost:3001/");
  };

  const copyToClipboardFallback = (text: string) => {
    if (typeof document === "undefined") {
      throw new Error("Clipboard unavailable");
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  const handleCopyMetaTags = async () => {
    setError(null);
    setSuccess(null);
    try {
      const payload = socialMetaTagsSnippet.trim();
      if (!payload) {
        setError("Няма meta tags за копиране.");
        return;
      }

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        copyToClipboardFallback(payload);
      }
      setSuccess("Meta tags са копирани в clipboard.");
    } catch {
      setError("Неуспешно копиране в clipboard.");
    }
  };

  const handleResetSocialMetadata = () => {
    const ok = window.confirm(
      "Reset social metadata? Това ще изчисти полетата за споделяне (shared/OG/Twitter).",
    );
    if (!ok) return;

    setBrowserTitle("");
    setSocialImageUrl("");
    setSocialDescription("");
    setOpenGraphTitle("");
    setOpenGraphDescription("");
    setOpenGraphImageUrl("");
    setTwitterTitle("");
    setTwitterDescription("");
    setTwitterImageUrl("");
    setTwitterCard("summary_large_image");

    setTwitterAppName("");
    setTwitterAppIdIphone("");
    setTwitterAppIdIpad("");
    setTwitterAppIdGooglePlay("");
    setTwitterAppUrlIphone("");
    setTwitterAppUrlIpad("");
    setTwitterAppUrlGooglePlay("");

    setTwitterPlayerUrl("");
    setTwitterPlayerWidth("");
    setTwitterPlayerHeight("");
    setTwitterPlayerStream("");
    setTwitterPlayerStreamContentType("");

    setPreviewOrigin("https://example.com");
    setError(null);
    setSuccess(
      "Social metadata полетата са нулирани. Натисни Save за да влезе в сила.",
    );
  };
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

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

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

  const [supportedLangs, setSupportedLangs] = useState<string[]>([
    "bg",
    "en",
    "de",
  ]);
  const [languageDraft, setLanguageDraft] = useState<string>("");
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
          cache: "no-store",
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
        setBrowserTitle(data.branding?.browserTitle ?? "");
        setSocialDescription(data.branding?.socialDescription ?? "");
        setFaviconUrl(data.branding?.faviconUrl ?? "");
        setFontUrl(data.branding?.fontUrl ?? "");
        setLogoUrl(data.branding?.logoUrl ?? "");
        setLogoLightUrl(data.branding?.logoLightUrl ?? "");
        setLogoDarkUrl(data.branding?.logoDarkUrl ?? "");
        {
          const modeRaw = data.branding?.theme?.mode ?? "system";
          const mode =
            modeRaw === "light" || modeRaw === "dark" || modeRaw === "system"
              ? modeRaw
              : "system";
          setThemeMode(mode);
          setThemeLight((prev) => {
            const next = mergeThemePalette(prev, data.branding?.theme?.light);
            setSavedThemeLight(next);
            setThemeLightRedo({});
            return next;
          });
          setThemeDark((prev) => {
            const next = mergeThemePalette(prev, data.branding?.theme?.dark);
            setSavedThemeDark(next);
            setThemeDarkRedo({});
            return next;
          });
        }
        setCursorUrl(data.branding?.cursorUrl ?? "");
        setCursorLightUrl(data.branding?.cursorLightUrl ?? "");
        setCursorDarkUrl(data.branding?.cursorDarkUrl ?? "");
        setCursorHotspotX(
          typeof data.branding?.cursorHotspot?.x === "number"
            ? String(data.branding.cursorHotspot.x)
            : "",
        );
        setCursorHotspotY(
          typeof data.branding?.cursorHotspot?.y === "number"
            ? String(data.branding.cursorHotspot.y)
            : "",
        );
        cursorHotspotPersistedRef.current = {
          x:
            typeof data.branding?.cursorHotspot?.x === "number"
              ? String(data.branding.cursorHotspot.x)
              : "",
          y:
            typeof data.branding?.cursorHotspot?.y === "number"
              ? String(data.branding.cursorHotspot.y)
              : "",
        };
        setSocialImageUrl(data.branding?.socialImage?.imageUrl ?? "");
        setOpenGraphTitle(data.branding?.openGraph?.title ?? "");
        setOpenGraphDescription(data.branding?.openGraph?.description ?? "");
        setOpenGraphImageUrl(data.branding?.openGraph?.imageUrl ?? "");
        setTwitterTitle(data.branding?.twitter?.title ?? "");
        setTwitterDescription(data.branding?.twitter?.description ?? "");
        setTwitterImageUrl(data.branding?.twitter?.imageUrl ?? "");
        setTwitterCard(data.branding?.twitter?.card ?? "summary_large_image");
        setTwitterAppName(data.branding?.twitter?.app?.name ?? "");
        setTwitterAppIdIphone(data.branding?.twitter?.app?.id?.iphone ?? "");
        setTwitterAppIdIpad(data.branding?.twitter?.app?.id?.ipad ?? "");
        setTwitterAppIdGooglePlay(
          data.branding?.twitter?.app?.id?.googleplay ?? "",
        );
        setTwitterAppUrlIphone(data.branding?.twitter?.app?.url?.iphone ?? "");
        setTwitterAppUrlIpad(data.branding?.twitter?.app?.url?.ipad ?? "");
        setTwitterAppUrlGooglePlay(
          data.branding?.twitter?.app?.url?.googleplay ?? "",
        );
        setTwitterPlayerUrl(data.branding?.twitter?.player?.url ?? "");
        setTwitterPlayerWidth(
          data.branding?.twitter?.player?.width != null
            ? String(data.branding.twitter.player.width)
            : "",
        );
        setTwitterPlayerHeight(
          data.branding?.twitter?.player?.height != null
            ? String(data.branding.twitter.player.height)
            : "",
        );
        setTwitterPlayerStream(data.branding?.twitter?.player?.stream ?? "");
        setTwitterPlayerStreamContentType(
          data.branding?.twitter?.player?.streamContentType ?? "",
        );

        setSocialMetadataLastSaved({
          browserTitle: data.branding?.browserTitle ?? "",
          socialImageUrl: data.branding?.socialImage?.imageUrl ?? "",
          socialDescription: data.branding?.socialDescription ?? "",
          openGraphTitle: data.branding?.openGraph?.title ?? "",
          openGraphDescription: data.branding?.openGraph?.description ?? "",
          openGraphImageUrl: data.branding?.openGraph?.imageUrl ?? "",
          twitterTitle: data.branding?.twitter?.title ?? "",
          twitterDescription: data.branding?.twitter?.description ?? "",
          twitterImageUrl: data.branding?.twitter?.imageUrl ?? "",
          twitterCard: data.branding?.twitter?.card ?? "summary_large_image",
          twitterAppName: data.branding?.twitter?.app?.name ?? "",
          twitterAppIdIphone: data.branding?.twitter?.app?.id?.iphone ?? "",
          twitterAppIdIpad: data.branding?.twitter?.app?.id?.ipad ?? "",
          twitterAppIdGooglePlay:
            data.branding?.twitter?.app?.id?.googleplay ?? "",
          twitterAppUrlIphone: data.branding?.twitter?.app?.url?.iphone ?? "",
          twitterAppUrlIpad: data.branding?.twitter?.app?.url?.ipad ?? "",
          twitterAppUrlGooglePlay:
            data.branding?.twitter?.app?.url?.googleplay ?? "",
          twitterPlayerUrl: data.branding?.twitter?.player?.url ?? "",
          twitterPlayerWidth:
            data.branding?.twitter?.player?.width != null
              ? String(data.branding.twitter.player.width)
              : "",
          twitterPlayerHeight:
            data.branding?.twitter?.player?.height != null
              ? String(data.branding.twitter.player.height)
              : "",
          twitterPlayerStream: data.branding?.twitter?.player?.stream ?? "",
          twitterPlayerStreamContentType:
            data.branding?.twitter?.player?.streamContentType ?? "",
          previewOrigin: previewOriginRef.current,
        });

        const f = data.features;
        setWiki(f?.wiki !== false);
        setWikiPublic(f?.wikiPublic !== false);
        setCourses(f?.courses !== false);
        setCoursesPublic(f?.coursesPublic !== false);
        setMyCourses(f?.myCourses !== false);
        setProfile(f?.profile !== false);
        setAuth(f?.auth !== false);
        setAuthLogin(f?.authLogin !== false);
        setAuthRegister(f?.authRegister !== false);
        setCaptcha(Boolean(f?.captcha));
        setCaptchaLogin(Boolean(f?.captchaLogin));
        setCaptchaRegister(Boolean(f?.captchaRegister));
        setCaptchaForgotPassword(Boolean(f?.captchaForgotPassword));
        setCaptchaChangePassword(Boolean(f?.captchaChangePassword));
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
        setSupportedLangs(Array.isArray(l?.supported) ? l.supported : ["bg"]);
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

  const handleSave = async () => {
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

    const normalizeNullableString = (value: string): string | null => {
      const trimmed = (value ?? "").trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const normalizeNullableHex = (value: string): string | null => {
      const trimmed = (value ?? "").trim();
      if (!trimmed) return null;
      return trimmed;
    };

    const normalizeNullableNumber = (value: string): number | null => {
      const trimmed = (value ?? "").trim();
      if (!trimmed) return null;
      const num = Number(trimmed);
      return Number.isFinite(num) ? num : null;
    };

    const nextBrowserTitle = normalizeNullableString(browserTitle);
    const nextFaviconUrl = normalizeNullableString(faviconUrl);
    const nextFontUrl = normalizeNullableString(fontUrl);
    const nextLogoUrl = normalizeNullableString(logoUrl);
    const nextLogoLightUrl = normalizeNullableString(logoLightUrl);
    const nextLogoDarkUrl = normalizeNullableString(logoDarkUrl);
    const nextCursorUrl = normalizeNullableString(cursorUrl);
    const nextCursorLightUrl = normalizeNullableString(cursorLightUrl);
    const nextCursorDarkUrl = normalizeNullableString(cursorDarkUrl);
    const nextCursorHotspotX = normalizeNullableNumber(cursorHotspotX);
    const nextCursorHotspotY = normalizeNullableNumber(cursorHotspotY);
    const nextSocialImageUrl = normalizeNullableString(socialImageUrl);
    const nextSocialDescription = normalizeNullableString(socialDescription);
    const nextOpenGraphTitle = normalizeNullableString(openGraphTitle);
    const nextOpenGraphDescription =
      normalizeNullableString(openGraphDescription);
    const nextOpenGraphImageUrl = normalizeNullableString(openGraphImageUrl);
    const nextTwitterTitle = normalizeNullableString(twitterTitle);
    const nextTwitterDescription = normalizeNullableString(twitterDescription);
    const nextTwitterImageUrl = normalizeNullableString(twitterImageUrl);
    const nextTwitterCard = normalizeNullableString(twitterCard);
    const nextTwitterAppName = normalizeNullableString(twitterAppName);
    const nextTwitterAppIdIphone = normalizeNullableString(twitterAppIdIphone);
    const nextTwitterAppIdIpad = normalizeNullableString(twitterAppIdIpad);
    const nextTwitterAppIdGooglePlay = normalizeNullableString(
      twitterAppIdGooglePlay,
    );
    const nextTwitterAppUrlIphone =
      normalizeNullableString(twitterAppUrlIphone);
    const nextTwitterAppUrlIpad = normalizeNullableString(twitterAppUrlIpad);
    const nextTwitterAppUrlGooglePlay = normalizeNullableString(
      twitterAppUrlGooglePlay,
    );
    const nextTwitterPlayerUrl = normalizeNullableString(twitterPlayerUrl);
    const twitterPlayerWidthNumber = Number(twitterPlayerWidth.trim());
    const twitterPlayerHeightNumber = Number(twitterPlayerHeight.trim());
    const nextTwitterPlayerWidth = Number.isFinite(twitterPlayerWidthNumber)
      ? twitterPlayerWidthNumber
      : null;
    const nextTwitterPlayerHeight = Number.isFinite(twitterPlayerHeightNumber)
      ? twitterPlayerHeightNumber
      : null;
    const nextTwitterPlayerStream =
      normalizeNullableString(twitterPlayerStream);
    const nextTwitterPlayerStreamContentType = normalizeNullableString(
      twitterPlayerStreamContentType,
    );

    const nextTwitterApp =
      nextTwitterAppName ||
      nextTwitterAppIdIphone ||
      nextTwitterAppIdIpad ||
      nextTwitterAppIdGooglePlay ||
      nextTwitterAppUrlIphone ||
      nextTwitterAppUrlIpad ||
      nextTwitterAppUrlGooglePlay
        ? {
            name: nextTwitterAppName,
            id:
              nextTwitterAppIdIphone ||
              nextTwitterAppIdIpad ||
              nextTwitterAppIdGooglePlay
                ? {
                    iphone: nextTwitterAppIdIphone,
                    ipad: nextTwitterAppIdIpad,
                    googleplay: nextTwitterAppIdGooglePlay,
                  }
                : null,
            url:
              nextTwitterAppUrlIphone ||
              nextTwitterAppUrlIpad ||
              nextTwitterAppUrlGooglePlay
                ? {
                    iphone: nextTwitterAppUrlIphone,
                    ipad: nextTwitterAppUrlIpad,
                    googleplay: nextTwitterAppUrlGooglePlay,
                  }
                : null,
          }
        : null;

    const nextTwitterPlayer =
      nextTwitterPlayerUrl ||
      nextTwitterPlayerWidth != null ||
      nextTwitterPlayerHeight != null ||
      nextTwitterPlayerStream ||
      nextTwitterPlayerStreamContentType
        ? {
            url: nextTwitterPlayerUrl,
            width: nextTwitterPlayerWidth,
            height: nextTwitterPlayerHeight,
            stream: nextTwitterPlayerStream,
            streamContentType: nextTwitterPlayerStreamContentType,
          }
        : null;

    const nextSocialImage =
      nextSocialImageUrl === null
        ? null
        : nextSocialImageUrl
          ? { imageUrl: nextSocialImageUrl }
          : undefined;

    const nextCursorHotspot =
      nextCursorHotspotX === null && nextCursorHotspotY === null
        ? null
        : {
            ...(nextCursorHotspotX !== null ? { x: nextCursorHotspotX } : {}),
            ...(nextCursorHotspotY !== null ? { y: nextCursorHotspotY } : {}),
          };

    const nextOpenGraph =
      nextOpenGraphTitle || nextOpenGraphDescription || nextOpenGraphImageUrl
        ? {
            title: nextOpenGraphTitle,
            description: nextOpenGraphDescription,
            imageUrl: nextOpenGraphImageUrl,
          }
        : null;

    const nextTwitter =
      nextTwitterTitle ||
      nextTwitterDescription ||
      nextTwitterImageUrl ||
      nextTwitterCard ||
      nextTwitterApp ||
      nextTwitterPlayer
        ? {
            title: nextTwitterTitle,
            description: nextTwitterDescription,
            imageUrl: nextTwitterImageUrl,
            card: nextTwitterCard,
            app: nextTwitterApp,
            player: nextTwitterPlayer,
          }
        : null;

    const nextThemeLight = {
      background: normalizeNullableHex(themeLight.background),
      foreground: normalizeNullableHex(themeLight.foreground),
      primary: normalizeNullableHex(themeLight.primary),
      secondary: normalizeNullableHex(themeLight.secondary),
      error: normalizeNullableHex(themeLight.error),
      card: normalizeNullableHex(themeLight.card),
      border: normalizeNullableHex(themeLight.border),
      scrollThumb: normalizeNullableHex(themeLight.scrollThumb),
      scrollTrack: normalizeNullableHex(themeLight.scrollTrack),
      fieldOkBg: normalizeNullableHex(themeLight.fieldOkBg),
      fieldOkBorder: normalizeNullableHex(themeLight.fieldOkBorder),
      fieldErrorBg: normalizeNullableHex(themeLight.fieldErrorBg),
      fieldErrorBorder: normalizeNullableHex(themeLight.fieldErrorBorder),
    };
    const nextThemeDark = {
      background: normalizeNullableHex(themeDark.background),
      foreground: normalizeNullableHex(themeDark.foreground),
      primary: normalizeNullableHex(themeDark.primary),
      secondary: normalizeNullableHex(themeDark.secondary),
      error: normalizeNullableHex(themeDark.error),
      card: normalizeNullableHex(themeDark.card),
      border: normalizeNullableHex(themeDark.border),
      scrollThumb: normalizeNullableHex(themeDark.scrollThumb),
      scrollTrack: normalizeNullableHex(themeDark.scrollTrack),
      fieldOkBg: normalizeNullableHex(themeDark.fieldOkBg),
      fieldOkBorder: normalizeNullableHex(themeDark.fieldOkBorder),
      fieldErrorBg: normalizeNullableHex(themeDark.fieldErrorBg),
      fieldErrorBorder: normalizeNullableHex(themeDark.fieldErrorBorder),
    };

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
    const wasAuthLoginEnabled = initialFeatures?.authLogin !== false;
    const wasAuthRegisterEnabled = initialFeatures?.authRegister !== false;
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

    if (wasAuthLoginEnabled && authLogin === false) {
      const ok = window.confirm(
        "Сигурен ли си, че искаш да изключиш Login за потребители? Админ/учителски роли ще могат да се вписват, но стандартните потребители няма да могат.",
      );
      if (!ok) return;
    }

    if (wasAuthRegisterEnabled && authRegister === false) {
      const ok = window.confirm(
        "Сигурен ли си, че искаш да изключиш Register + Reset password? Това ще спре регистрацията и reset потока за пароли.",
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
            browserTitle: nextBrowserTitle,
            faviconUrl: nextFaviconUrl,
            fontUrl: nextFontUrl,
            theme: {
              mode: themeMode,
              light: nextThemeLight,
              dark: nextThemeDark,
            },
            logoUrl: nextLogoUrl,
            logoLightUrl: nextLogoLightUrl,
            logoDarkUrl: nextLogoDarkUrl,
            cursorUrl: nextCursorUrl,
            cursorLightUrl: nextCursorLightUrl,
            cursorDarkUrl: nextCursorDarkUrl,
            cursorHotspot: nextCursorHotspot,
            socialImage: nextSocialImage,
            openGraph: nextOpenGraph,
            twitter: nextTwitter,
            socialDescription: nextSocialDescription,
          },
          features: {
            wiki,
            wikiPublic,
            courses,
            coursesPublic,
            myCourses,
            profile,
            auth,
            authLogin,
            authRegister,
            captcha,
            captchaLogin,
            captchaRegister,
            captchaForgotPassword,
            captchaChangePassword,
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
      setFaviconUrl(updated.branding?.faviconUrl ?? "");
      setFontUrl(updated.branding?.fontUrl ?? "");
      setLogoUrl(updated.branding?.logoUrl ?? "");
      setLogoLightUrl(updated.branding?.logoLightUrl ?? "");
      setLogoDarkUrl(updated.branding?.logoDarkUrl ?? "");
      setCursorUrl(updated.branding?.cursorUrl ?? "");
      setCursorLightUrl(updated.branding?.cursorLightUrl ?? "");
      setCursorDarkUrl(updated.branding?.cursorDarkUrl ?? "");
      setCursorHotspotX(
        typeof updated.branding?.cursorHotspot?.x === "number"
          ? String(updated.branding.cursorHotspot.x)
          : "",
      );
      setCursorHotspotY(
        typeof updated.branding?.cursorHotspot?.y === "number"
          ? String(updated.branding.cursorHotspot.y)
          : "",
      );

      setSocialMetadataLastSaved(socialMetadataSnapshotFromState());

      setSuccess("Настройките са запазени.");
      setSavedThemeLight(themeLight);
      setSavedThemeDark(themeDark);
      setThemeLightRedo({});
      setThemeDarkRedo({});
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      setSaving(false);
    }
  };

  const handleCursorUploadClick = () => {
    if (cursorFileInputRef.current) {
      cursorFileInputRef.current.value = "";
      cursorFileInputRef.current.click();
    }
  };

  const handleCursorLightUploadClick = () => {
    if (cursorLightFileInputRef.current) {
      cursorLightFileInputRef.current.value = "";
      cursorLightFileInputRef.current.click();
    }
  };

  const handleCursorDarkUploadClick = () => {
    if (cursorDarkFileInputRef.current) {
      cursorDarkFileInputRef.current.value = "";
      cursorDarkFileInputRef.current.click();
    }
  };

  const persistCursorHotspot = async () => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const xRaw = (cursorHotspotX ?? "").trim();
    const yRaw = (cursorHotspotY ?? "").trim();
    const snapshot = { x: xRaw, y: yRaw };
    const prev = cursorHotspotPersistedRef.current;
    if (prev && prev.x === snapshot.x && prev.y === snapshot.y) {
      return;
    }

    const toNullableInt = (value: string): number | null => {
      if (!value) return null;
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    const x = toNullableInt(xRaw);
    const y = toNullableInt(yRaw);
    const cursorHotspot =
      x === null && y === null
        ? null
        : {
            ...(x !== null ? { x } : {}),
            ...(y !== null ? { y } : {}),
          };

    try {
      setCursorHotspotPersistStatus("saving");

      const brandingPayload: Record<string, unknown> = {
        cursorHotspot,
      };
      const cursorUrlTrimmed = (cursorUrl ?? "").trim();
      if (cursorUrlTrimmed.length > 0) {
        brandingPayload.cursorUrl = cursorUrlTrimmed;
      }

      const persistRes = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: "PATCH",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branding: {
            ...brandingPayload,
          },
        }),
      });

      if (persistRes.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!persistRes.ok) {
        setCursorHotspotPersistStatus("error");
        return;
      }

      const updated = (await persistRes.json()) as AdminSettingsResponse;
      setCursorUrl(updated.branding?.cursorUrl ?? "");
      setCursorHotspotX(
        typeof updated.branding?.cursorHotspot?.x === "number"
          ? String(updated.branding.cursorHotspot.x)
          : "",
      );
      setCursorHotspotY(
        typeof updated.branding?.cursorHotspot?.y === "number"
          ? String(updated.branding.cursorHotspot.y)
          : "",
      );
      cursorHotspotPersistedRef.current = snapshot;
      setCursorHotspotPersistStatus("saved");
      window.setTimeout(() => {
        setCursorHotspotPersistStatus((current) =>
          current === "saved" ? "idle" : current,
        );
      }, 1200);
    } catch {
      setCursorHotspotPersistStatus("error");
    }
  };

  const handleCursorFileSelected: ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);

      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/cursor`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        const payload = (await res.json()) as { message?: string };
        setError(payload?.message ?? "Неуспешно качване на cursor файла.");
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на cursor файла.");
        return;
      }

      setCursorUrl(data.url);

      try {
        const persistRes = await fetch(`${API_BASE_URL}/admin/settings`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            branding: {
              cursorUrl: data.url,
            },
          }),
        });

        if (persistRes.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (!persistRes.ok) {
          setSuccess(
            "Cursor файлът е качен. Натисни Save за да го запазиш (автоматичното запазване не успя).",
          );
          return;
        }

        const updated = (await persistRes.json()) as AdminSettingsResponse;
        setCursorUrl(updated.branding?.cursorUrl ?? "");
        setCursorHotspotX(
          typeof updated.branding?.cursorHotspot?.x === "number"
            ? String(updated.branding.cursorHotspot.x)
            : "",
        );
        setCursorHotspotY(
          typeof updated.branding?.cursorHotspot?.y === "number"
            ? String(updated.branding.cursorHotspot.y)
            : "",
        );
        setSuccess(
          "Cursor файлът е качен и запазен. Refesh-ни страницата за да се приложи навсякъде.",
        );
      } catch {
        setSuccess(
          "Cursor файлът е качен. Натисни Save за да го запазиш (автоматичното запазване не успя).",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на cursor файла.",
      );
    }
  };

  const handleSocialImageUploadClick = (purpose: SocialImagePurpose) => {
    const ref =
      purpose === "twitter"
        ? twitterImageInputRef.current
        : purpose === "open-graph"
          ? openGraphImageInputRef.current
          : socialImageInputRef.current;
    if (ref) {
      ref.value = "";
      ref.click();
    }
  };

  const handleSocialImageFileSelected =
    (purpose: SocialImagePurpose): ChangeEventHandler<HTMLInputElement> =>
    async (event) => {
      const files = event.target.files;
      if (!files || files.length === 0) {
        return;
      }

      const token = getAccessToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      setError(null);
      setSuccess(null);
      setUploadingSocialImagePurpose(purpose);

      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("purpose", purpose);

      let previousUrl = "";
      if (purpose === "twitter") {
        previousUrl = twitterImageUrl.trim();
      } else if (purpose === "open-graph") {
        previousUrl = openGraphImageUrl.trim();
      } else {
        previousUrl = socialImageUrl.trim();
      }
      if (previousUrl.length > 0) {
        formData.append("previousUrl", previousUrl);
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/admin/settings/branding/social-image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (!res.ok) {
          let message = "Неуспешно качване на social изображението.";
          try {
            const payload = (await res.json()) as { message?: string };
            if (payload?.message) {
              message = payload.message;
            }
          } catch {
            // ignore json errors
          }
          setError(message);
          return;
        }

        const data = (await res.json()) as { url: string };
        if (purpose === "twitter") {
          setTwitterImageUrl(data.url);
        } else if (purpose === "open-graph") {
          setOpenGraphImageUrl(data.url);
        } else {
          setSocialImageUrl(data.url);
        }
        setSuccess("Изображението е качено. Натисни Save за да влезе в сила.");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Неуспешно качване на social изображението.",
        );
      } finally {
        setUploadingSocialImagePurpose(null);
      }
    };

  const effectiveUiTheme =
    uiThemeMode === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : uiThemeMode;
  const resolvedCursorUrl =
    effectiveUiTheme === "dark"
      ? (cursorDarkUrl ?? "").trim() || (cursorUrl ?? "").trim()
      : (cursorLightUrl ?? "").trim() || (cursorUrl ?? "").trim();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <AdminBreadcrumbs
          items={[
            { label: "Админ табло", href: "/admin" },
            { label: "Settings" },
          ]}
        />
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
          <AccordionSection
            title="Branding"
            description="Настройки за идентичност."
            open={Boolean(openSections.branding)}
            onToggle={() => toggleSection("branding")}
          >
            <div className="mt-4 max-w-md">
              <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                <span className="flex items-center gap-2">
                  <span>App name</span>
                  <InfoTooltip
                    label="App name info"
                    title="App name"
                    description="Името на системата. Показва се в header-а (ако няма logo) и се използва като fallback за заглавия."
                  />
                </span>
              </label>
              <input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="BeeLMS"
                disabled={saving}
              />
            </div>

            <div className="mt-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span>Theme</span>
                <InfoTooltip
                  label="Theme info"
                  title="Theme"
                  description="Цветова схема за целия сайт. Light/Dark палитрите се използват според режима (или system настройката)."
                />
              </p>
              <div className="mt-3 max-w-md">
                <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-2">
                    <span>Mode</span>
                    <InfoTooltip
                      label="Theme mode info"
                      title="Theme mode"
                      description="system следва OS/browser настройката. light/dark форсират конкретен режим."
                    />
                  </span>
                </label>
                <select
                  value={themeMode}
                  onChange={(e) =>
                    setThemeMode(e.target.value as "light" | "dark" | "system")
                  }
                  disabled={saving}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="system">system</option>
                  <option value="light">light</option>
                  <option value="dark">dark</option>
                </select>
              </div>

              <div className="mt-4 grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <p className="text-sm font-semibold text-gray-900">Light</p>
                  <div className="mt-3 space-y-3">
                    {(
                      [
                        ["background", "Background"],
                        ["foreground", "Foreground"],
                        ["primary", "Primary"],
                        ["secondary", "Secondary"],
                        ["error", "Error"],
                        ["card", "Card"],
                        ["border", "Border"],
                        ["scrollThumb", "Scroll thumb"],
                        ["scrollTrack", "Scroll track"],
                        ["fieldOkBg", "Selected/OK bg"],
                        ["fieldOkBorder", "Selected/OK border"],
                        ["fieldErrorBg", "Missing/Error bg"],
                        ["fieldErrorBorder", "Missing/Error border"],
                      ] as Array<[string, string]>
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center justify-between gap-3 text-sm text-gray-700"
                      >
                        <span>{label}</span>
                        <div className="flex items-center gap-2">
                          {themeLight[key] !== savedThemeLight[key] ? (
                            <button
                              type="button"
                              onClick={() => {
                                setThemeLightRedo((prev) => ({
                                  ...prev,
                                  [key]: themeLight[key] ?? "",
                                }));
                                setThemeLight((prev) => ({
                                  ...prev,
                                  [key]: savedThemeLight[key] ?? prev[key],
                                }));
                              }}
                              disabled={saving}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`${label} reset`}
                              title="↩ Reset to saved"
                            >
                              ↩
                            </button>
                          ) : null}
                          {typeof themeLightRedo[key] === "string" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setThemeLight((prev) => ({
                                  ...prev,
                                  [key]: themeLightRedo[key] ?? prev[key],
                                }));
                                setThemeLightRedo((prev) => {
                                  const next = { ...prev };
                                  delete next[key];
                                  return next;
                                });
                              }}
                              disabled={saving}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`${label} redo`}
                              title="↪ Redo"
                            >
                              ↪
                            </button>
                          ) : null}
                          <input
                            type="color"
                            value={themeLight[key] ?? "#000000"}
                            onChange={(e) => {
                              const value = e.target.value;
                              setThemeLightRedo((prev) => {
                                if (typeof prev[key] === "undefined")
                                  return prev;
                                const next = { ...prev };
                                delete next[key];
                                return next;
                              });
                              setThemeLight((prev) => ({
                                ...prev,
                                [key]: value,
                              }));
                            }}
                            disabled={saving}
                            className="h-9 w-14 rounded border border-gray-300 bg-white"
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <p className="text-sm font-semibold text-gray-900">Dark</p>
                  <div className="mt-3 space-y-3">
                    {(
                      [
                        ["background", "Background"],
                        ["foreground", "Foreground"],
                        ["primary", "Primary"],
                        ["secondary", "Secondary"],
                        ["error", "Error"],
                        ["card", "Card"],
                        ["border", "Border"],
                        ["scrollThumb", "Scroll thumb"],
                        ["scrollTrack", "Scroll track"],
                        ["fieldOkBg", "Selected/OK bg"],
                        ["fieldOkBorder", "Selected/OK border"],
                        ["fieldErrorBg", "Missing/Error bg"],
                        ["fieldErrorBorder", "Missing/Error border"],
                      ] as Array<[string, string]>
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center justify-between gap-3 text-sm text-gray-700"
                      >
                        <span>{label}</span>
                        <div className="flex items-center gap-2">
                          {themeDark[key] !== savedThemeDark[key] ? (
                            <button
                              type="button"
                              onClick={() => {
                                setThemeDarkRedo((prev) => ({
                                  ...prev,
                                  [key]: themeDark[key] ?? "",
                                }));
                                setThemeDark((prev) => ({
                                  ...prev,
                                  [key]: savedThemeDark[key] ?? prev[key],
                                }));
                              }}
                              disabled={saving}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`${label} reset`}
                              title="↩ Reset to saved"
                            >
                              ↩
                            </button>
                          ) : null}
                          {typeof themeDarkRedo[key] === "string" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setThemeDark((prev) => ({
                                  ...prev,
                                  [key]: themeDarkRedo[key] ?? prev[key],
                                }));
                                setThemeDarkRedo((prev) => {
                                  const next = { ...prev };
                                  delete next[key];
                                  return next;
                                });
                              }}
                              disabled={saving}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`${label} redo`}
                              title="↪ Redo"
                            >
                              ↪
                            </button>
                          ) : null}
                          <input
                            type="color"
                            value={themeDark[key] ?? "#000000"}
                            onChange={(e) => {
                              const value = e.target.value;
                              setThemeDarkRedo((prev) => {
                                if (typeof prev[key] === "undefined")
                                  return prev;
                                const next = { ...prev };
                                delete next[key];
                                return next;
                              });
                              setThemeDark((prev) => ({
                                ...prev,
                                [key]: value,
                              }));
                            }}
                            disabled={saving}
                            className="h-9 w-14 rounded border border-gray-300 bg-white"
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Промяната важи за целия сайт (вкл. admin). За system режим се
                ползва настройката на OS/browser.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-900">Favicon</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleBrandingFaviconUploadClick}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload favicon
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void persistBrandingField(
                      { faviconUrl: null },
                      "Favicon е премахнат.",
                    );
                  }}
                  disabled={saving || faviconUrl.trim().length === 0}
                  className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
                <input
                  ref={faviconFileInputRef}
                  type="file"
                  accept="image/png,image/x-icon,image/vnd.microsoft.icon"
                  className="hidden"
                  onChange={handleBrandingFaviconFileSelected}
                />
                {faviconUrl ? (
                  <a
                    href={faviconUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                    aria-label="Favicon preview"
                    title="Open favicon"
                  >
                    <Image
                      src={faviconUrl}
                      alt="Favicon"
                      width={24}
                      height={24}
                      className="h-6 w-6"
                      unoptimized
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">(default)</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Препоръка: PNG/ICO, квадратна иконка (напр. 32x32 или 48x48),
                компресирана.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-900">Logo</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleBrandingLogoUploadClick}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload logo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void persistBrandingField(
                      { logoUrl: null },
                      "Logo е премахнато.",
                    );
                  }}
                  disabled={saving || logoUrl.trim().length === 0}
                  className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/*,.svg"
                  className="hidden"
                  onChange={handleBrandingLogoFileSelected}
                />
                {logoUrl ? (
                  <a
                    href={logoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                    aria-label="Logo preview"
                    title="Open logo"
                  >
                    <Image
                      src={logoUrl}
                      alt="Logo"
                      width={160}
                      height={40}
                      className="h-10 w-auto"
                      unoptimized
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">(disabled)</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Препоръка: PNG/SVG, прозрачен фон, ширина ~120-200px (или high
                quality), компресирано.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-900">
                Logo (Light)
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleBrandingLogoLightUploadClick}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload logo (light)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void persistBrandingField(
                      { logoLightUrl: null },
                      "Logo (light) е премахнато.",
                    );
                  }}
                  disabled={saving || logoLightUrl.trim().length === 0}
                  className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
                <input
                  ref={logoLightFileInputRef}
                  type="file"
                  accept="image/*,.svg"
                  className="hidden"
                  onChange={handleBrandingLogoLightFileSelected}
                />
                {logoLightUrl ? (
                  <a
                    href={logoLightUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                    aria-label="Logo light preview"
                    title="Open logo (light)"
                  >
                    <Image
                      src={logoLightUrl}
                      alt="Logo light"
                      width={160}
                      height={40}
                      className="h-10 w-auto"
                      unoptimized
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">(fallback)</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Показва се при Light тема. Ако няма зададено, системата ползва
                fallback logo.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-900">Logo (Dark)</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleBrandingLogoDarkUploadClick}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload logo (dark)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void persistBrandingField(
                      { logoDarkUrl: null },
                      "Logo (dark) е премахнато.",
                    );
                  }}
                  disabled={saving || logoDarkUrl.trim().length === 0}
                  className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
                <input
                  ref={logoDarkFileInputRef}
                  type="file"
                  accept="image/*,.svg"
                  className="hidden"
                  onChange={handleBrandingLogoDarkFileSelected}
                />
                {logoDarkUrl ? (
                  <a
                    href={logoDarkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                    aria-label="Logo dark preview"
                    title="Open logo (dark)"
                  >
                    <Image
                      src={logoDarkUrl}
                      alt="Logo dark"
                      width={160}
                      height={40}
                      className="h-10 w-auto"
                      unoptimized
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">(fallback)</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Показва се при Dark тема. Ако няма зададено, системата ползва
                fallback logo.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-900">Font</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleBrandingFontUploadClick}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload font
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void persistBrandingField(
                      { fontUrl: null },
                      "Font е премахнат.",
                    );
                  }}
                  disabled={saving || fontUrl.trim().length === 0}
                  className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
                <input
                  ref={fontFileInputRef}
                  type="file"
                  accept=".woff2,.woff,.ttf,.otf"
                  className="hidden"
                  onChange={handleBrandingFontFileSelected}
                />
                {fontUrl ? (
                  <a
                    href={fontUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-green-700 hover:underline"
                  >
                    Font file
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">(default)</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Препоръка: WOFF2 (най-добре), иначе WOFF/TTF/OTF. До ~2MB.
              </p>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-900">Cursor</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCursorUploadClick}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload cursor icon
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void persistBrandingField(
                      { cursorUrl: null },
                      "Cursor е премахнат.",
                    );
                  }}
                  disabled={saving || cursorUrl.trim().length === 0}
                  className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
                <input
                  ref={cursorFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCursorFileSelected}
                />
                {cursorUrl ? (
                  <a
                    href={cursorUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                    aria-label="Cursor image preview"
                    title="Open cursor image"
                  >
                    <Image
                      src={cursorUrl}
                      alt="Cursor"
                      width={28}
                      height={28}
                      className="h-7 w-7"
                      unoptimized
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">(disabled)</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Препоръка: PNG, малка иконка (между 32x32 и 50x50). След upload
                натисни Save и refresh-нете страницата.
              </p>

              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-900">
                  Cursor (Light)
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCursorLightUploadClick}
                    disabled={saving}
                    className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Upload cursor (light)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void persistBrandingField(
                        { cursorLightUrl: null },
                        "Cursor (light) е премахнат.",
                      );
                    }}
                    disabled={saving || cursorLightUrl.trim().length === 0}
                    className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove
                  </button>
                  <input
                    ref={cursorLightFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCursorLightFileSelected}
                  />
                  {cursorLightUrl ? (
                    <a
                      href={cursorLightUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                      aria-label="Cursor light image preview"
                      title="Open cursor (light) image"
                    >
                      <Image
                        src={cursorLightUrl}
                        alt="Cursor light"
                        width={28}
                        height={28}
                        className="h-7 w-7"
                        unoptimized
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500">(fallback)</span>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-900">
                  Cursor (Dark)
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCursorDarkUploadClick}
                    disabled={saving}
                    className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Upload cursor (dark)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void persistBrandingField(
                        { cursorDarkUrl: null },
                        "Cursor (dark) е премахнат.",
                      );
                    }}
                    disabled={saving || cursorDarkUrl.trim().length === 0}
                    className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove
                  </button>
                  <input
                    ref={cursorDarkFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCursorDarkFileSelected}
                  />
                  {cursorDarkUrl ? (
                    <a
                      href={cursorDarkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                      aria-label="Cursor dark image preview"
                      title="Open cursor (dark) image"
                    >
                      <Image
                        src={cursorDarkUrl}
                        alt="Cursor dark"
                        width={28}
                        height={28}
                        className="h-7 w-7"
                        unoptimized
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500">(fallback)</span>
                  )}
                </div>
              </div>

              <div className="mt-3 grid max-w-md grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    Hotspot X
                    <InfoTooltip
                      label="Cursor hotspot X"
                      title="Cursor hotspot X"
                      description="Пикселно изместване по хоризонтал от горния ляв ъгъл на иконата до точката на клик."
                    />
                  </label>
                  <input
                    value={cursorHotspotX}
                    onChange={(e) => setCursorHotspotX(e.target.value)}
                    onBlur={() => {
                      void persistCursorHotspot();
                    }}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="напр. 8"
                    disabled={saving}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    Hotspot Y
                    <InfoTooltip
                      label="Cursor hotspot Y"
                      title="Cursor hotspot Y"
                      description="Пикселно изместване по вертикал от горния ляв ъгъл на иконата до точката на клик."
                    />
                  </label>
                  <input
                    value={cursorHotspotY}
                    onChange={(e) => setCursorHotspotY(e.target.value)}
                    onBlur={() => {
                      void persistCursorHotspot();
                    }}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="напр. 8"
                    disabled={saving}
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="mt-2 max-w-md text-xs text-gray-500">
                {cursorHotspotPersistStatus === "saving" ? (
                  <span>Saving…</span>
                ) : cursorHotspotPersistStatus === "saved" ? (
                  <span className="font-semibold text-green-700">Saved</span>
                ) : cursorHotspotPersistStatus === "error" ? (
                  <span className="font-semibold text-red-700">
                    Save failed
                  </span>
                ) : (
                  <span> </span>
                )}
              </div>

              <div className="mt-4 max-w-md rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Hotspot tester
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Движи мишката в кутията: червената точка показва реалната
                      точка на клик (hotspot). Иконката се рисува с отместването
                      X/Y.
                    </p>
                  </div>
                  <InfoTooltip
                    label="Hotspot tester info"
                    title="Как да тествам hotspot-а?"
                    description={
                      <div className="space-y-2">
                        <p>1) Настрой Hotspot X/Y.</p>
                        <p>
                          2) В кутията отдолу целта е червената точка да съвпада
                          с мястото, което визуално считаш за “връх” на курсора.
                        </p>
                        <p>
                          3) Ако изглежда изместено, промени X/Y и пробвай пак.
                        </p>
                      </div>
                    }
                  />
                </div>

                <div
                  className="relative mt-3 h-40 w-full rounded-md border border-dashed border-gray-300 bg-gray-50"
                  style={{ cursor: resolvedCursorUrl ? "none" : "default" }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setCursorHotspotTestPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onMouseLeave={() => setCursorHotspotTestPos(null)}
                  onClick={() => {
                    if (cursorHotspotTestPos) {
                      setCursorHotspotTestClickPos(cursorHotspotTestPos);
                    }
                  }}
                >
                  <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-400" />

                  {resolvedCursorUrl && cursorHotspotTestPos ? (
                    (() => {
                      const xRaw = Number((cursorHotspotX ?? "").trim());
                      const yRaw = Number((cursorHotspotY ?? "").trim());
                      const hotspotX = Number.isFinite(xRaw) ? xRaw : 8;
                      const hotspotY = Number.isFinite(yRaw) ? yRaw : 8;
                      return (
                        <>
                          <div
                            className="pointer-events-none absolute h-2 w-2 rounded-full bg-red-600"
                            style={{
                              left: cursorHotspotTestPos.x,
                              top: cursorHotspotTestPos.y,
                              transform: "translate(-50%, -50%)",
                            }}
                          />
                          <Image
                            src={resolvedCursorUrl}
                            alt="Cursor test"
                            width={32}
                            height={32}
                            className="pointer-events-none absolute"
                            style={{
                              left: cursorHotspotTestPos.x - hotspotX,
                              top: cursorHotspotTestPos.y - hotspotY,
                            }}
                            unoptimized
                          />
                        </>
                      );
                    })()
                  ) : (
                    <div className="absolute left-3 top-3 text-xs text-gray-500">
                      {resolvedCursorUrl
                        ? "Движи мишката вътре за визуализация"
                        : "Качи cursor icon (или light/dark) за да тестваш hotspot"}
                    </div>
                  )}
                </div>

                {cursorHotspotTestClickPos ? (
                  <p className="mt-2 text-xs text-gray-600">
                    Last click: x={Math.round(cursorHotspotTestClickPos.x)}, y=
                    {Math.round(cursorHotspotTestClickPos.y)}
                  </p>
                ) : null}
              </div>
            </div>
          </AccordionSection>

          <AccordionSection
            title="Browser & Social metadata"
            description="Управлява браузър title, споделена social снимка/описание, Open Graph/Twitter специфики, live preview и validator помощници."
            headerAdornment={
              <InfoTooltip
                label="Какво включва Browser & Social metadata"
                title="Browser & Social metadata"
                description={
                  <div className="space-y-2">
                    <p className="text-sm">
                      Настрой задаването на meta тагове при споделяне на
                      платформата в социални мрежи.
                    </p>
                    <ul className="list-inside list-disc text-sm leading-relaxed">
                      <li>Качи fallback social изображение и описание.</li>
                      <li>
                        Поддържай Open Graph и Twitter карти (summary, app,
                        player).
                      </li>
                      <li>
                        Виж live preview + meta snippet и бързи линкове към
                        външни валидатори.
                      </li>
                    </ul>
                  </div>
                }
              />
            }
            open={Boolean(openSections.metadata)}
            onToggle={() => toggleSection("metadata")}
          >
            <div className="mt-4 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-gray-500">
                  Промените в тази секция влизат в сила след Save.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleUndoSocialMetadataChanges}
                    disabled={
                      saving ||
                      !socialMetadataLastSaved ||
                      !isSocialMetadataDirty
                    }
                    className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Undo changes
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSocialMetadata}
                    disabled={saving}
                    className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reset social metadata
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Guidelines
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Практични препоръки за да изглежда добре при споделяне.
                    </p>
                  </div>
                  <StatusBadge
                    variant={
                      ogSectionHasContent || twitterSectionHasContent
                        ? "ok"
                        : "missing"
                    }
                    label={
                      ogSectionHasContent || twitterSectionHasContent
                        ? "HAS META"
                        : "EMPTY"
                    }
                  />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-gray-700 md:grid-cols-2">
                  <div>
                    <p className="font-semibold text-gray-900">Images</p>
                    <p className="mt-1">
                      1200×630px (1.91:1), JPG/PNG/WEBP, ≤1MB.
                    </p>
                    <p className="mt-1">Избягвай прозрачност за OG.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Text</p>
                    <p className="mt-1">
                      Title: ~50–70 символа (не е твърд лимит).
                    </p>
                    <p className="mt-1">Description: ~120–200 символа.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Twitter cards</p>
                    <p className="mt-1">
                      summary / summary_large_image: стандартни preview карти.
                    </p>
                    <p className="mt-1">
                      app: за мобилни приложения (App IDs).
                    </p>
                    <p className="mt-1">
                      player: за embedded video/audio (player URL + размери).
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Fallbacks</p>
                    <p className="mt-1">
                      Shared image/description се ползват ако OG/Twitter са
                      празни.
                    </p>
                    <p className="mt-1">
                      За app/player без задължителни полета падаме на
                      summary_large_image.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      <span>Browser title</span>
                      <InfoTooltip
                        label="Browser title info"
                        title="Browser title"
                        description="Това е заглавието в браузър таба. Използва се и като база, ако OG/Twitter title са празни."
                      />
                    </span>
                    <StatusBadge
                      variant={
                        browserTitle.trim().length > 0 ? "ok" : "fallback"
                      }
                      label={browserTitle.trim().length > 0 ? "SET" : "APPNAME"}
                    />
                  </label>
                  <input
                    value={browserTitle}
                    onChange={(e) => setBrowserTitle(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="BeeLMS"
                    disabled={saving}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ако е празно, ще се използва App name.
                  </p>
                </div>
                <div>
                  <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      <span>Shared social image (fallback)</span>
                      <InfoTooltip
                        label="Shared social image info"
                        title="Shared social image"
                        description="Общо изображение при споделяне. Използва се, ако OG или Twitter image липсват."
                      />
                    </span>
                    <StatusBadge
                      variant={
                        socialImageUrl.trim().length > 0 ? "ok" : "missing"
                      }
                      label={socialImageUrl.trim().length > 0 ? "SET" : "EMPTY"}
                    />
                  </label>
                  <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                    <input
                      value={socialImageUrl}
                      onChange={(e) => setSocialImageUrl(e.target.value)}
                      className="w-full flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="https://..."
                      disabled={saving}
                    />
                    <div className="flex flex-shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSocialImageUploadClick("shared")}
                        disabled={saving || isUploadingSharedImage}
                        className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUploadingSharedImage ? "Качване..." : "Upload image"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSocialImageUrl("")}
                        disabled={saving || socialImageUrl.length === 0}
                        className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <input
                    ref={socialImageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleSocialImageFileSelected("shared")}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Общ fallback за всяка платформа. Препоръки: 1200x630px,
                    JPG/PNG/WEBP, ≤1MB.
                  </p>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-2">
                    <span>Shared social description</span>
                    <InfoTooltip
                      label="Shared social description info"
                      title="Shared social description"
                      description="Общо описание при споделяне. Използва се, ако OG или Twitter description липсват."
                    />
                  </span>
                  <StatusBadge
                    variant={
                      socialDescription.trim().length > 0 ? "ok" : "missing"
                    }
                    label={
                      socialDescription.trim().length > 0 ? "SET" : "EMPTY"
                    }
                  />
                </label>
                <textarea
                  value={socialDescription}
                  onChange={(e) => setSocialDescription(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Използва се, когато OG/Twitter description са празни."
                  disabled={saving}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Общ fallback текст. Ако OG или Twitter description са празни,
                  ще се използва това описание.
                </p>
              </div>

              <div
                className={`rounded-lg border px-4 py-4 transition-colors ${metadataSectionAccent(
                  ogSectionHasContent,
                )}`}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Open Graph
                  </p>
                  <p className="text-xs text-gray-500">
                    Използва се от Facebook/LinkedIn и други платформи.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span>OG title</span>
                        <InfoTooltip
                          label="OG title info"
                          title="OG title"
                          description="Заглавие за Open Graph (Facebook/LinkedIn). Ако е празно, падаме към Browser title."
                        />
                      </span>
                      <StatusBadge
                        variant={
                          openGraphTitle.trim().length > 0 ? "ok" : "fallback"
                        }
                        label={
                          openGraphTitle.trim().length > 0 ? "SET" : "BASE"
                        }
                      />
                    </label>
                    <input
                      value={openGraphTitle}
                      onChange={(e) => setOpenGraphTitle(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="(по желание)"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span>OG image URL</span>
                        <InfoTooltip
                          label="OG image info"
                          title="OG image"
                          description="Специално изображение за Open Graph. Ако липсва, използваме Shared social image."
                        />
                      </span>
                      <StatusBadge
                        variant={
                          openGraphImageUrl.trim().length > 0
                            ? "ok"
                            : socialImageUrl.trim().length > 0
                              ? "fallback"
                              : "missing"
                        }
                        label={
                          openGraphImageUrl.trim().length > 0
                            ? "SET"
                            : socialImageUrl.trim().length > 0
                              ? "SHARED"
                              : "EMPTY"
                        }
                      />
                    </label>
                    <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                      <input
                        value={openGraphImageUrl}
                        onChange={(e) => setOpenGraphImageUrl(e.target.value)}
                        className="w-full flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="https://..."
                        disabled={saving}
                      />
                      <div className="flex flex-shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSocialImageUploadClick("open-graph")
                          }
                          disabled={saving || isUploadingOgImage}
                          className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUploadingOgImage ? "Качване..." : "Upload image"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenGraphImageUrl("")}
                          disabled={saving || openGraphImageUrl.length === 0}
                          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <input
                      ref={openGraphImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleSocialImageFileSelected("open-graph")}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Препоръки: 1200x630px (1.91:1), JPG/PNG/WEBP, ≤1MB, без
                      прозрачност.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span>OG description</span>
                        <InfoTooltip
                          label="OG description info"
                          title="OG description"
                          description="Описание за Open Graph. Ако липсва, използваме Shared social description."
                        />
                      </span>
                      <StatusBadge
                        variant={
                          openGraphDescription.trim().length > 0
                            ? "ok"
                            : socialDescription.trim().length > 0
                              ? "fallback"
                              : "missing"
                        }
                        label={
                          openGraphDescription.trim().length > 0
                            ? "SET"
                            : socialDescription.trim().length > 0
                              ? "SHARED"
                              : "EMPTY"
                        }
                      />
                    </label>
                    <textarea
                      value={openGraphDescription}
                      onChange={(e) => setOpenGraphDescription(e.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="(по желание)"
                      disabled={saving}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <SocialPreviewCard
                      platform="facebook"
                      domain={previewDomain}
                      title={ogPreviewTitle}
                      description={ogPreviewDescription}
                      imageUrl={ogPreviewImage || undefined}
                      twitterCardType={null}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`rounded-lg border px-4 py-4 transition-colors ${metadataSectionAccent(
                  twitterSectionHasContent,
                )}`}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-gray-900">Twitter</p>
                  <p className="text-xs text-gray-500">
                    Използва се от X/Twitter cards.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span>Twitter title</span>
                        <InfoTooltip
                          label="Twitter title info"
                          title="Twitter title"
                          description="Заглавие за X/Twitter cards. Ако липсва, използваме OG title."
                        />
                      </span>
                      <StatusBadge
                        variant={
                          twitterTitle.trim().length > 0 ? "ok" : "fallback"
                        }
                        label={twitterTitle.trim().length > 0 ? "SET" : "OG"}
                      />
                    </label>
                    <input
                      value={twitterTitle}
                      onChange={(e) => setTwitterTitle(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="(по желание)"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span>Twitter image URL</span>
                        <InfoTooltip
                          label="Twitter image info"
                          title="Twitter image"
                          description="Специално изображение за X/Twitter. Ако липсва, използваме Shared social image."
                        />
                      </span>
                      <StatusBadge
                        variant={
                          twitterImageUrl.trim().length > 0
                            ? "ok"
                            : socialImageUrl.trim().length > 0
                              ? "fallback"
                              : "missing"
                        }
                        label={
                          twitterImageUrl.trim().length > 0
                            ? "SET"
                            : socialImageUrl.trim().length > 0
                              ? "SHARED"
                              : "EMPTY"
                        }
                      />
                    </label>
                    <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                      <input
                        value={twitterImageUrl}
                        onChange={(e) => setTwitterImageUrl(e.target.value)}
                        className="w-full flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="https://..."
                        disabled={saving}
                      />
                      <div className="flex flex-shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSocialImageUploadClick("twitter")
                          }
                          disabled={saving || isUploadingTwitterImage}
                          className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUploadingTwitterImage
                            ? "Качване..."
                            : "Upload image"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTwitterImageUrl("")}
                          disabled={saving || twitterImageUrl.length === 0}
                          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <input
                      ref={twitterImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleSocialImageFileSelected("twitter")}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Ако няма отделно изображение, ще се използва Shared social
                      image.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span>Twitter description</span>
                        <InfoTooltip
                          label="Twitter description info"
                          title="Twitter description"
                          description="Описание за X/Twitter. Ако липсва, падаме към OG description или Shared social description."
                        />
                      </span>
                      <StatusBadge
                        variant={
                          twitterDescription.trim().length > 0
                            ? "ok"
                            : openGraphDescription.trim().length > 0 ||
                                socialDescription.trim().length > 0
                              ? "fallback"
                              : "missing"
                        }
                        label={
                          twitterDescription.trim().length > 0
                            ? "SET"
                            : openGraphDescription.trim().length > 0
                              ? "OG"
                              : socialDescription.trim().length > 0
                                ? "SHARED"
                                : "EMPTY"
                        }
                      />
                    </label>
                    <textarea
                      value={twitterDescription}
                      onChange={(e) => setTwitterDescription(e.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="(по желание)"
                      disabled={saving}
                    />
                  </div>
                  <div className="md:col-span-2 max-w-md">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <span>Twitter card</span>
                      <InfoTooltip
                        label="Информация за Twitter cards"
                        title="Какво е Twitter card?"
                        description={
                          <div className="space-y-2">
                            <p>
                              Twitter card определя как изглежда preview-то при
                              споделяне на линк в X/Twitter.
                            </p>
                            <p>
                              <span className="font-semibold text-gray-900">
                                summary
                              </span>{" "}
                              = компактна карта (малка снимка).
                            </p>
                            <p>
                              <span className="font-semibold text-gray-900">
                                summary_large_image
                              </span>
                              = голяма снимка.
                            </p>
                            <p>
                              <span className="font-semibold text-gray-900">
                                app
                              </span>{" "}
                              = CTA към App Store/Google Play (изисква App name
                              + App ID за iPhone минимум).
                            </p>
                            <p>
                              <span className="font-semibold text-gray-900">
                                player
                              </span>{" "}
                              = embedded player (изисква Player URL +
                              width/height минимум).
                            </p>
                            <p className="text-xs text-gray-500">
                              Ако избереш app/player, но липсват задължителните
                              полета, системата автоматично ще използва
                              summary_large_image, за да не се счупи metadata.
                            </p>
                          </div>
                        }
                      />
                    </label>
                    <select
                      value={twitterCard}
                      onChange={(e) => setTwitterCard(e.target.value)}
                      disabled={saving}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="summary_large_image">
                        summary_large_image
                      </option>
                      <option value="summary">summary</option>
                      <option value="app">app</option>
                      <option value="player">player</option>
                    </select>
                  </div>

                  {twitterCard === "app" ? (
                    <div className="md:col-span-2 rounded-md border border-gray-200 bg-white p-4">
                      <p className="text-sm font-semibold text-gray-900">
                        Twitter App card
                      </p>
                      {twitterAppMissingFields.length > 0 ? (
                        <div className="mt-1 text-xs text-red-700">
                          <p className="font-semibold">
                            Липсващи задължителни полета:
                          </p>
                          <ul className="mt-1 list-disc pl-5">
                            {twitterAppMissingFields.map((field) => (
                              <li key={field}>{field}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">
                          App name + App IDs/URLs се използват за Twitter app
                          card meta.
                        </p>
                      )}
                      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            App name
                          </label>
                          <input
                            value={twitterAppName}
                            onChange={(e) => setTwitterAppName(e.target.value)}
                            className={
                              twitterAppNameMissing
                                ? socialInputClassError
                                : socialInputClassOk
                            }
                            placeholder="twitter_app"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            App ID (iPhone)
                          </label>
                          <input
                            value={twitterAppIdIphone}
                            onChange={(e) =>
                              setTwitterAppIdIphone(e.target.value)
                            }
                            className={
                              twitterAppIdIphoneMissing
                                ? socialInputClassError
                                : socialInputClassOk
                            }
                            placeholder="twitter_app://iphone"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            App ID (iPad)
                          </label>
                          <input
                            value={twitterAppIdIpad}
                            onChange={(e) =>
                              setTwitterAppIdIpad(e.target.value)
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="twitter_app://ipad"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            App ID (Google Play)
                          </label>
                          <input
                            value={twitterAppIdGooglePlay}
                            onChange={(e) =>
                              setTwitterAppIdGooglePlay(e.target.value)
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="twitter_app://googleplay"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            App URL (iPhone)
                          </label>
                          <input
                            value={twitterAppUrlIphone}
                            onChange={(e) =>
                              setTwitterAppUrlIphone(e.target.value)
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="https://iphone_url"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            App URL (iPad)
                          </label>
                          <input
                            value={twitterAppUrlIpad}
                            onChange={(e) =>
                              setTwitterAppUrlIpad(e.target.value)
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="https://ipad_url"
                            disabled={saving}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            App URL (Google Play)
                          </label>
                          <input
                            value={twitterAppUrlGooglePlay}
                            onChange={(e) =>
                              setTwitterAppUrlGooglePlay(e.target.value)
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="https://googleplay_url"
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {twitterCard === "player" ? (
                    <div className="md:col-span-2 rounded-md border border-gray-200 bg-white p-4">
                      <p className="text-sm font-semibold text-gray-900">
                        Twitter Player card
                      </p>
                      {twitterPlayerMissingFields.length > 0 ? (
                        <div className="mt-1 text-xs text-red-700">
                          <p className="font-semibold">
                            Липсващи задължителни полета:
                          </p>
                          <ul className="mt-1 list-disc pl-5">
                            {twitterPlayerMissingFields.map((field) => (
                              <li key={field}>{field}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">
                          Player URL/size се използват за embedded player card
                          meta.
                        </p>
                      )}
                      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Player URL
                          </label>
                          <input
                            value={twitterPlayerUrl}
                            onChange={(e) =>
                              setTwitterPlayerUrl(e.target.value)
                            }
                            className={
                              twitterPlayerUrlMissing
                                ? socialInputClassError
                                : socialInputClassOk
                            }
                            placeholder="https://player_url"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Player width
                          </label>
                          <input
                            value={twitterPlayerWidth}
                            onChange={(e) =>
                              setTwitterPlayerWidth(e.target.value)
                            }
                            className={
                              twitterPlayerWidthMissing
                                ? socialInputClassError
                                : socialInputClassOk
                            }
                            placeholder="640"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Player height
                          </label>
                          <input
                            value={twitterPlayerHeight}
                            onChange={(e) =>
                              setTwitterPlayerHeight(e.target.value)
                            }
                            className={
                              twitterPlayerHeightMissing
                                ? socialInputClassError
                                : socialInputClassOk
                            }
                            placeholder="360"
                            disabled={saving}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Player stream URL (optional)
                          </label>
                          <input
                            value={twitterPlayerStream}
                            onChange={(e) =>
                              setTwitterPlayerStream(e.target.value)
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="https://stream_url"
                            disabled={saving}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Stream content type (optional)
                          </label>
                          <input
                            value={twitterPlayerStreamContentType}
                            onChange={(e) =>
                              setTwitterPlayerStreamContentType(e.target.value)
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="video/mp4"
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="md:col-span-2">
                    <SocialPreviewCard
                      platform="twitter"
                      domain={previewDomain}
                      title={twitterPreviewTitle}
                      description={twitterPreviewDescription}
                      imageUrl={twitterPreviewImage || undefined}
                      twitterCardType={twitterCard}
                      twitterAppName={twitterAppName}
                      twitterPlayerUrl={twitterPlayerUrl}
                      twitterPlayerWidth={twitterPlayerWidthNumber}
                      twitterPlayerHeight={twitterPlayerHeightNumber}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Validator helpers
                  </p>
                  <p className="text-xs text-gray-500">
                    Бърз достъп до Facebook / LinkedIn / Twitter проверките.
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Preview URL за тестове
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleUseCurrentOrigin}
                        className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Use current origin
                      </button>
                      <button
                        type="button"
                        onClick={handleUseLocalhostPreview}
                        className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Use localhost:3001
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyMetaTags}
                        className="inline-flex items-center rounded border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                      >
                        Copy meta tags
                      </button>
                      <button
                        type="button"
                        onClick={handleFetchMetadataFromUrl}
                        disabled={metaFetchStatus === "loading"}
                        className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {metaFetchStatus === "loading"
                          ? "Fetching..."
                          : "Fetch from URL"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMetaTagsSnippet((prev) => !prev)}
                        className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        {showMetaTagsSnippet
                          ? "Hide meta tags"
                          : "View meta tags"}
                      </button>
                    </div>
                    <input
                      value={previewOrigin}
                      onChange={(e) => setPreviewOrigin(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="https://example.com/страница"
                    />
                    {showMetaTagsSnippet ? (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Generated meta tags (read-only)
                        </label>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusBadge
                            variant={ogPreviewImage ? "ok" : "missing"}
                            label={ogPreviewImage ? "OG IMG" : "OG IMG MISSING"}
                          />
                          <StatusBadge
                            variant={twitterPreviewImage ? "ok" : "missing"}
                            label={
                              twitterPreviewImage ? "TW IMG" : "TW IMG MISSING"
                            }
                          />
                          {twitterCard === "app" ? (
                            <StatusBadge
                              variant={twitterAppHasMinimum ? "ok" : "missing"}
                              label={
                                twitterAppHasMinimum
                                  ? "APP OK"
                                  : "APP INCOMPLETE"
                              }
                            />
                          ) : null}
                          {twitterCard === "player" ? (
                            <StatusBadge
                              variant={
                                twitterPlayerHasMinimum ? "ok" : "missing"
                              }
                              label={
                                twitterPlayerHasMinimum
                                  ? "PLAYER OK"
                                  : "PLAYER INCOMPLETE"
                              }
                            />
                          ) : null}
                        </div>
                        <textarea
                          value={socialMetaTagsSnippet}
                          readOnly
                          rows={10}
                          className="mt-2 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Това е ориентировъчен snippet за debug/validator-и.
                          Реалните meta tags се генерират автоматично от
                          приложението.
                        </p>
                      </div>
                    ) : null}
                    {metaFetchMessage ? (
                      <p
                        className={`mt-2 text-xs ${
                          metaFetchStatus === "error"
                            ? "text-red-700"
                            : metaFetchStatus === "success"
                              ? "text-green-700"
                              : "text-gray-600"
                        }`}
                      >
                        {metaFetchMessage}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-gray-500">
                      Този URL се използва за валидаторите. Използвай реалната
                      страница, която искаш да тестваш.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <a
                      href={validatorLinks.facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50"
                    >
                      Facebook Debugger
                    </a>
                    <a
                      href={validatorLinks.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50"
                    >
                      LinkedIn Inspector
                    </a>
                    <a
                      href={validatorLinks.twitter}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50"
                    >
                      Twitter Card Validator
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection
            title="Feature toggles"
            description="Изключването на feature връща 404 за публичните endpoint-и."
            open={Boolean(openSections.features)}
            onToggle={() => toggleSection("features")}
          >
            <div className="mt-4 space-y-3">
              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  wiki
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel label="Wiki" featureKey="wiki" />
                <ToggleSwitch
                  checked={wiki}
                  disabled={saving}
                  label="Wiki"
                  onChange={(next) => {
                    setWiki(next);
                    if (!next) {
                      setWikiPublic(false);
                    }
                  }}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  wikiPublic
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Wiki public"
                  featureKey="wikiPublic"
                />
                <ToggleSwitch
                  checked={wikiPublic}
                  disabled={saving || wiki === false}
                  label="Wiki public"
                  onChange={(next) => setWikiPublic(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  courses
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel label="Courses" featureKey="courses" />
                <ToggleSwitch
                  checked={courses}
                  disabled={saving}
                  label="Courses"
                  onChange={(next) => {
                    setCourses(next);
                    if (!next) {
                      setCoursesPublic(false);
                      setMyCourses(false);
                    }
                  }}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  coursesPublic
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Courses public"
                  featureKey="coursesPublic"
                />
                <ToggleSwitch
                  checked={coursesPublic}
                  disabled={saving || courses === false}
                  label="Courses public"
                  onChange={(next) => setCoursesPublic(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  myCourses
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel label="My Courses" featureKey="myCourses" />
                <ToggleSwitch
                  checked={myCourses}
                  disabled={saving || courses === false}
                  label="My Courses"
                  onChange={(next) => setMyCourses(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  profile
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel label="Profile" featureKey="profile" />
                <ToggleSwitch
                  checked={profile}
                  disabled={saving}
                  label="Profile"
                  onChange={(next) => setProfile(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  auth
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel label="Auth (risk)" featureKey="auth" />
                <ToggleSwitch
                  checked={auth}
                  disabled={saving}
                  label="Auth"
                  onChange={(next) => {
                    if (auth === true && next === false) {
                      setAuthRiskAcknowledged(false);
                      setAuthRiskModalOpen(true);
                      return;
                    }
                    setAuth(next);
                  }}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  authLogin
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Auth: Login (users)"
                  featureKey="authLogin"
                />
                <ToggleSwitch
                  checked={authLogin}
                  disabled={saving || auth === false}
                  label="Auth Login"
                  onChange={(next) => setAuthLogin(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  authRegister
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Auth: Register + Reset password"
                  featureKey="authRegister"
                />
                <ToggleSwitch
                  checked={authRegister}
                  disabled={saving || auth === false}
                  label="Auth Register"
                  onChange={(next) => setAuthRegister(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  captcha
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Captcha (global)"
                  featureKey="captcha"
                />
                <ToggleSwitch
                  checked={captcha}
                  disabled={saving}
                  label="Captcha"
                  onChange={(next) => {
                    setCaptcha(next);
                    if (!next) {
                      setCaptchaLogin(false);
                      setCaptchaRegister(false);
                      setCaptchaForgotPassword(false);
                      setCaptchaChangePassword(false);
                    }
                  }}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  captchaLogin
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Captcha: Login"
                  featureKey="captchaLogin"
                />
                <ToggleSwitch
                  checked={captchaLogin}
                  disabled={saving || captcha === false}
                  label="Captcha Login"
                  onChange={(next) => setCaptchaLogin(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  captchaRegister
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Captcha: Register"
                  featureKey="captchaRegister"
                />
                <ToggleSwitch
                  checked={captchaRegister}
                  disabled={saving || captcha === false}
                  label="Captcha Register"
                  onChange={(next) => setCaptchaRegister(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  captchaForgotPassword
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Captcha: Forgot password"
                  featureKey="captchaForgotPassword"
                />
                <ToggleSwitch
                  checked={captchaForgotPassword}
                  disabled={saving || captcha === false}
                  label="Captcha Forgot password"
                  onChange={(next) => setCaptchaForgotPassword(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  captchaChangePassword
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Captcha: Change password"
                  featureKey="captchaChangePassword"
                />
                <ToggleSwitch
                  checked={captchaChangePassword}
                  disabled={saving || captcha === false}
                  label="Captcha Change password"
                  onChange={(next) => setCaptchaChangePassword(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  paidCourses
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Paid courses"
                  featureKey="paidCourses"
                />
                <ToggleSwitch
                  checked={paidCourses}
                  disabled={saving}
                  label="Paid courses"
                  onChange={(next) => setPaidCourses(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  gdprLegal
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="GDPR / Legal (risk)"
                  featureKey="gdprLegal"
                />
                <ToggleSwitch
                  checked={gdprLegal}
                  disabled={saving}
                  label="GDPR / Legal"
                  onChange={(next) => setGdprLegal(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  infraMonitoring
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Infra: Monitoring"
                  featureKey="infraMonitoring"
                />
                <ToggleSwitch
                  checked={infraMonitoring}
                  disabled={saving}
                  label="Infra Monitoring"
                  onChange={(next) => setInfraMonitoring(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  infraRedis
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Infra: Redis"
                  featureKey="infraRedis"
                />
                <ToggleSwitch
                  checked={infraRedis}
                  disabled={saving}
                  label="Infra Redis"
                  onChange={(next) => setInfraRedis(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  infraRabbitmq
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Infra: RabbitMQ"
                  featureKey="infraRabbitmq"
                />
                <ToggleSwitch
                  checked={infraRabbitmq}
                  disabled={saving}
                  label="Infra RabbitMQ"
                  onChange={(next) => setInfraRabbitmq(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  infraErrorTracking
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Infra: Error tracking"
                  featureKey="infraErrorTracking"
                />
                <ToggleSwitch
                  checked={infraErrorTracking}
                  disabled={saving}
                  label="Infra Error tracking"
                  onChange={(next) => setInfraErrorTracking(next)}
                />
              </div>
            </div>
          </AccordionSection>

          <AccordionSection
            title="Social login & OAuth креденшъли"
            description="Тук администрираш кои социални доставчици (Google, Facebook, GitHub, LinkedIn) са достъпни за потребителите и задаваш техните OAuth креденшъли."
            open={Boolean(openSections.social)}
            onToggle={() => toggleSection("social")}
          >
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
                        <div className="mb-3 flex items-center gap-3">
                          <ToggleSwitch
                            checked={enabled}
                            disabled={saving}
                            label={`Активирай ${label}`}
                            onChange={(next) =>
                              handleToggleSocialProvider(provider, next)
                            }
                          />
                          <span className="text-sm font-medium text-gray-800">
                            Активирай
                          </span>
                        </div>
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
          </AccordionSection>

          <AccordionSection
            title="Languages"
            description="Поддържани езици (custom). Трябва да има поне 1 език, а default трябва да е сред избраните."
            open={Boolean(openSections.languages)}
            onToggle={() => toggleSection("languages")}
          >
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[240px] flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Добави language code (можеш и няколко: bg, en, de)
                  </label>
                  <input
                    value={languageDraft}
                    onChange={(e) => setLanguageDraft(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="bg, en, de"
                    disabled={saving}
                  />
                </div>
                <button
                  type="button"
                  disabled={saving || languageDraft.trim().length === 0}
                  onClick={() => {
                    const incoming = parseSupportedLangs(languageDraft);
                    if (incoming.length < 1) {
                      setLanguageDraft("");
                      return;
                    }
                    setSupportedLangs((prev) => {
                      const merged = Array.from(
                        new Set([...prev, ...incoming]),
                      );
                      return merged;
                    });
                    setLanguageDraft("");
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Добави
                </button>
              </div>

              <div className="space-y-2">
                {supportedLangs.length < 1 ? (
                  <p className="text-sm text-red-700">
                    Трябва да има поне 1 език.
                  </p>
                ) : null}
                {supportedLangs.map((code) => (
                  <div
                    key={code}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2 ${"border-green-100 bg-green-50"}`}
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {code}
                    </span>
                    <span className="ml-auto text-xs text-gray-500">
                      {code === defaultLang ? "default" : ""}
                    </span>
                    <ToggleSwitch
                      checked={true}
                      disabled={saving}
                      label={`Language ${code}`}
                      onChange={() => {
                        setSupportedLangs((prev) => {
                          const next = prev.filter((x) => x !== code);
                          if (next.length > 0 && defaultLang === code) {
                            setDefaultLang(next[0]);
                          }
                          if (next.length === 0) {
                            setDefaultLang("");
                          }
                          return next;
                        });
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700">
                  Default
                </label>
                <select
                  value={defaultLang}
                  onChange={(e) => setDefaultLang(e.target.value)}
                  disabled={saving || supportedLangs.length < 1}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">—</option>
                  {supportedLangs.map((code) => (
                    <option key={`default-${code}`} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Default трябва да е един от поддържаните езици.
                </p>
              </div>
            </div>
          </AccordionSection>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
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

      <ConfirmModal
        open={authRiskModalOpen}
        title="Изключване на Auth (risk)"
        description="Това действие може да направи системата неизползваема за потребители без активна сесия."
        confirmLabel="Turn it off!"
        cancelLabel="Cancel"
        confirmEnabled={authRiskAcknowledged && !saving}
        onCancel={() => {
          setAuthRiskModalOpen(false);
          setAuthRiskAcknowledged(false);
        }}
        onConfirm={() => {
          setAuth(false);
          setAuthLogin(false);
          setAuthRegister(false);
          setAuthRiskModalOpen(false);
          setAuthRiskAcknowledged(false);
        }}
      >
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Риск:</p>
          <p className="mt-1">
            {FEATURE_TOGGLE_INFO.auth?.risk ??
              "Изключването на auth може да блокира потребителите."}
          </p>
          <p className="mt-2">
            <span className="font-semibold">Влияние:</span>{" "}
            {FEATURE_TOGGLE_INFO.auth?.impact}
          </p>
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={authRiskAcknowledged}
            onChange={(e) => setAuthRiskAcknowledged(e.target.checked)}
          />
          Разбирам риска и искам да изключа Auth.
        </label>
      </ConfirmModal>
    </div>
  );
}
