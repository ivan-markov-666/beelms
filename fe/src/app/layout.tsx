import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Suspense } from "react";
import "./globals.css";
import "@fontsource/inter/latin.css";
import "@fontsource/inter/latin-ext.css";
import "@fontsource/inter/cyrillic.css";
import "@fontsource/inter/cyrillic-ext.css";
import "@fontsource/roboto/latin.css";
import "@fontsource/roboto/latin-ext.css";
import "@fontsource/roboto/cyrillic.css";
import "@fontsource/roboto/cyrillic-ext.css";
import "@fontsource/open-sans/latin.css";
import "@fontsource/open-sans/latin-ext.css";
import "@fontsource/open-sans/cyrillic.css";
import "@fontsource/open-sans/cyrillic-ext.css";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import "@fontsource/montserrat/latin.css";
import "@fontsource/montserrat/latin-ext.css";
import "@fontsource/montserrat/cyrillic.css";
import "@fontsource/montserrat/cyrillic-ext.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/700.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/700.css";
import "@fontsource/merriweather/400.css";
import "@fontsource/merriweather/700.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/noto-serif/400.css";
import "@fontsource/noto-serif/700.css";
import { HeaderNav } from "./_components/header-nav";
import { SiteFooter } from "./_components/site-footer";
import { AnalyticsConsentBanner } from "./_components/analytics-consent-banner";
import { AnalyticsTracker } from "./_components/analytics-tracker";
import { normalizeLang } from "../i18n/config";
import { buildApiUrl } from "./api-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const GOOGLE_FONT_MAP: Record<
  string,
  { cssName: string; fallback: "sans-serif" | "serif" }
> = {
  inter: { cssName: "Inter", fallback: "sans-serif" },
  roboto: { cssName: "Roboto", fallback: "sans-serif" },
  "open-sans": { cssName: "Open Sans", fallback: "sans-serif" },
  lato: { cssName: "Lato", fallback: "sans-serif" },
  montserrat: { cssName: "Montserrat", fallback: "sans-serif" },
  poppins: { cssName: "Poppins", fallback: "sans-serif" },
  nunito: { cssName: "Nunito", fallback: "sans-serif" },
  merriweather: { cssName: "Merriweather", fallback: "serif" },
  "playfair-display": { cssName: "Playfair Display", fallback: "serif" },
  "noto-sans": { cssName: "Noto Sans", fallback: "sans-serif" },
  "noto-serif": { cssName: "Noto Serif", fallback: "serif" },
};

async function fetchPublicSettingsForMetadata(): Promise<{
  branding?: {
    appName?: string;
    browserTitle?: string | null;
    cursorUrl?: string | null;
    cursorLightUrl?: string | null;
    cursorDarkUrl?: string | null;
    cursorHotspot?: {
      x?: number | null;
      y?: number | null;
    } | null;
    faviconUrl?: string | null;
    googleFont?: string | null;
    googleFontByLang?: Record<string, string> | null;
    fontUrl?: string | null;
    fontUrlByLang?: Record<string, string> | null;
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
}> {
  try {
    const res = await fetch(buildApiUrl("/public/settings"), {
      cache: "no-store",
    });
    if (!res.ok) {
      return {};
    }
    return (await res.json()) as {
      branding?: {
        appName?: string;
        browserTitle?: string | null;
        cursorUrl?: string | null;
        faviconUrl?: string | null;
        googleFont?: string | null;
        googleFontByLang?: Record<string, string> | null;
        fontUrl?: string | null;
        fontUrlByLang?: Record<string, string> | null;
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
    };
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchPublicSettingsForMetadata();
  const branding = data.branding;

  const faviconUrl = branding?.faviconUrl ?? null;

  const title =
    (branding?.browserTitle ?? null) || (branding?.appName ?? null) || "BeeLMS";

  const ogTitle =
    (branding?.openGraph?.title ?? null) ||
    (branding?.browserTitle ?? null) ||
    (branding?.appName ?? null) ||
    title;
  const socialDescription = branding?.socialDescription ?? undefined;
  const socialImageUrl = branding?.socialImage?.imageUrl ?? undefined;
  const ogDescription =
    branding?.openGraph?.description ?? socialDescription ?? undefined;
  const ogImageUrl =
    branding?.openGraph?.imageUrl ?? socialImageUrl ?? undefined;

  const twitterTitle =
    (branding?.twitter?.title ?? null) ||
    (branding?.browserTitle ?? null) ||
    (branding?.appName ?? null) ||
    title;
  const twitterDescription =
    branding?.twitter?.description ?? ogDescription ?? undefined;
  const twitterImageUrl =
    branding?.twitter?.imageUrl ?? ogImageUrl ?? undefined;
  const twitterCardRaw =
    (branding?.twitter?.card ?? null) || "summary_large_image";
  const twitterCardIsSummary =
    twitterCardRaw === "summary" || twitterCardRaw === "summary_large_image";
  const twitterApp = branding?.twitter?.app ?? null;
  const twitterPlayer = branding?.twitter?.player ?? null;
  const hasTwitterAppMinimum =
    Boolean((twitterApp?.name ?? "").trim()) &&
    Boolean((twitterApp?.id?.iphone ?? "").trim());
  const hasTwitterPlayerMinimum =
    Boolean((twitterPlayer?.url ?? "").trim()) &&
    typeof twitterPlayer?.width === "number" &&
    typeof twitterPlayer?.height === "number";

  const twitterCardIsApp = twitterCardRaw === "app";
  const twitterCardIsPlayer = twitterCardRaw === "player";
  const twitterCardIsValidApp = twitterCardIsApp && hasTwitterAppMinimum;
  const twitterCardIsValidPlayer =
    twitterCardIsPlayer && hasTwitterPlayerMinimum;
  const shouldEmitTwitterOther =
    twitterCardIsValidApp || twitterCardIsValidPlayer;
  const fallbackToSummaryLargeImage =
    (twitterCardIsApp && !twitterCardIsValidApp) ||
    (twitterCardIsPlayer && !twitterCardIsValidPlayer);

  const baseTwitterOther: Record<string, string> = {
    "twitter:title": twitterTitle,
    ...(twitterDescription
      ? { "twitter:description": twitterDescription }
      : {}),
    ...(twitterImageUrl ? { "twitter:image": twitterImageUrl } : {}),
  };

  const twitterOther: Record<string, string> = {};
  if (twitterCardIsValidApp) {
    Object.assign(twitterOther, baseTwitterOther, {
      "twitter:card": "app",
    });

    const name = (twitterApp?.name ?? "").trim();
    if (name) {
      twitterOther["twitter:app:name:iphone"] = name;
      twitterOther["twitter:app:name:ipad"] = name;
      twitterOther["twitter:app:name:googleplay"] = name;
    }
    const iphoneId = (twitterApp?.id?.iphone ?? "").trim();
    const ipadId = (twitterApp?.id?.ipad ?? "").trim();
    const googleplayId = (twitterApp?.id?.googleplay ?? "").trim();
    if (iphoneId) twitterOther["twitter:app:id:iphone"] = iphoneId;
    if (ipadId) twitterOther["twitter:app:id:ipad"] = ipadId;
    if (googleplayId) twitterOther["twitter:app:id:googleplay"] = googleplayId;

    const iphoneUrl = (twitterApp?.url?.iphone ?? "").trim();
    const ipadUrl = (twitterApp?.url?.ipad ?? "").trim();
    const googleplayUrl = (twitterApp?.url?.googleplay ?? "").trim();
    if (iphoneUrl) twitterOther["twitter:app:url:iphone"] = iphoneUrl;
    if (ipadUrl) twitterOther["twitter:app:url:ipad"] = ipadUrl;
    if (googleplayUrl)
      twitterOther["twitter:app:url:googleplay"] = googleplayUrl;
  } else if (twitterCardIsValidPlayer) {
    Object.assign(twitterOther, baseTwitterOther, {
      "twitter:card": "player",
      "twitter:player": (twitterPlayer?.url ?? "").trim(),
      "twitter:player:width": String(twitterPlayer?.width),
      "twitter:player:height": String(twitterPlayer?.height),
    });
    const stream = (twitterPlayer?.stream ?? "").trim();
    const streamContentType = (twitterPlayer?.streamContentType ?? "").trim();
    if (stream) {
      twitterOther["twitter:player:stream"] = stream;
    }
    if (streamContentType) {
      twitterOther["twitter:player:stream:content_type"] = streamContentType;
    }
  }

  const twitterMetadata =
    twitterCardIsSummary || fallbackToSummaryLargeImage
      ? {
          title: twitterTitle,
          description: twitterDescription,
          card: (fallbackToSummaryLargeImage
            ? "summary_large_image"
            : (twitterCardRaw as "summary" | "summary_large_image")) as
            | "summary"
            | "summary_large_image",
          images: twitterImageUrl ? [twitterImageUrl] : undefined,
        }
      : undefined;

  const other = shouldEmitTwitterOther ? twitterOther : undefined;

  return {
    title,
    description: ogDescription ?? twitterDescription,
    ...(faviconUrl
      ? {
          icons: {
            icon: [{ url: faviconUrl }],
          },
        }
      : {}),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
    },
    ...(twitterMetadata ? { twitter: twitterMetadata } : {}),
    ...(other ? { other } : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const lang = normalizeLang(h.get("x-ui-lang"));
  const publicSettings = await fetchPublicSettingsForMetadata();
  const themeModeRaw = publicSettings.branding?.theme?.mode ?? "system";
  const themeMode =
    themeModeRaw === "light" ||
    themeModeRaw === "dark" ||
    themeModeRaw === "system"
      ? themeModeRaw
      : "system";

  const userThemeStorageKey = "beelms.themeMode";
  const themeInitScript = `(() => {
    try {
      const v = localStorage.getItem(${JSON.stringify(userThemeStorageKey)});
      if (v === "light" || v === "dark" || v === "system") {
        document.documentElement.setAttribute("data-theme", v);
      }
    } catch {}
  })();`;

  const lightPalette = publicSettings.branding?.theme?.light ?? null;
  const darkPalette = publicSettings.branding?.theme?.dark ?? null;

  const themeValue = (value: string | null | undefined, fallback: string) => {
    const trimmed = (value ?? "").trim();
    return trimmed.length > 0 ? trimmed : fallback;
  };

  const themeLight = {
    background: themeValue(lightPalette?.background, "#ffffff"),
    foreground: themeValue(lightPalette?.foreground, "#171717"),
    primary: themeValue(lightPalette?.primary, "#16a34a"),
    secondary: themeValue(lightPalette?.secondary, "#2563eb"),
    error: themeValue(lightPalette?.error, "#dc2626"),
    card: themeValue(lightPalette?.card, "#ffffff"),
    border: themeValue(lightPalette?.border, "#e5e7eb"),
    scrollThumb: themeValue(lightPalette?.scrollThumb, "#86efac"),
    scrollTrack: themeValue(lightPalette?.scrollTrack, "#f0fdf4"),
    fieldOkBg: themeValue(lightPalette?.fieldOkBg, "#f0fdf4"),
    fieldOkBorder: themeValue(lightPalette?.fieldOkBorder, "#dcfce7"),
    fieldErrorBg: themeValue(lightPalette?.fieldErrorBg, "#fef2f2"),
    fieldErrorBorder: themeValue(lightPalette?.fieldErrorBorder, "#fee2e2"),
  };

  const themeDark = {
    background: themeValue(darkPalette?.background, "#0a0a0a"),
    foreground: themeValue(darkPalette?.foreground, "#ededed"),
    primary: themeValue(darkPalette?.primary, "#22c55e"),
    secondary: themeValue(darkPalette?.secondary, "#60a5fa"),
    error: themeValue(darkPalette?.error, "#f87171"),
    card: themeValue(darkPalette?.card, "#111827"),
    border: themeValue(darkPalette?.border, "#374151"),
    scrollThumb: themeValue(darkPalette?.scrollThumb, "#16a34a"),
    scrollTrack: themeValue(darkPalette?.scrollTrack, "#0b2a16"),
    fieldOkBg: themeValue(darkPalette?.fieldOkBg, "#052e16"),
    fieldOkBorder: themeValue(darkPalette?.fieldOkBorder, "#14532d"),
    fieldErrorBg: themeValue(darkPalette?.fieldErrorBg, "#450a0a"),
    fieldErrorBorder: themeValue(darkPalette?.fieldErrorBorder, "#7f1d1d"),
  };

  const themeCss = `
  :root {
    --theme-light-background: ${themeLight.background};
    --theme-light-foreground: ${themeLight.foreground};
    --theme-light-primary: ${themeLight.primary};
    --theme-light-secondary: ${themeLight.secondary};
    --theme-light-error: ${themeLight.error};
    --theme-light-card: ${themeLight.card};
    --theme-light-border: ${themeLight.border};
    --theme-light-scroll-thumb: ${themeLight.scrollThumb};
    --theme-light-scroll-track: ${themeLight.scrollTrack};
    --theme-light-field-ok-bg: ${themeLight.fieldOkBg};
    --theme-light-field-ok-border: ${themeLight.fieldOkBorder};
    --theme-light-field-error-bg: ${themeLight.fieldErrorBg};
    --theme-light-field-error-border: ${themeLight.fieldErrorBorder};

    --theme-dark-background: ${themeDark.background};
    --theme-dark-foreground: ${themeDark.foreground};
    --theme-dark-primary: ${themeDark.primary};
    --theme-dark-secondary: ${themeDark.secondary};
    --theme-dark-error: ${themeDark.error};
    --theme-dark-card: ${themeDark.card};
    --theme-dark-border: ${themeDark.border};
    --theme-dark-scroll-thumb: ${themeDark.scrollThumb};
    --theme-dark-scroll-track: ${themeDark.scrollTrack};
    --theme-dark-field-ok-bg: ${themeDark.fieldOkBg};
    --theme-dark-field-ok-border: ${themeDark.fieldOkBorder};
    --theme-dark-field-error-bg: ${themeDark.fieldErrorBg};
    --theme-dark-field-error-border: ${themeDark.fieldErrorBorder};
  }

  html[data-theme="light"] {
    color-scheme: light;
    --background: var(--theme-light-background);
    --foreground: var(--theme-light-foreground);
    --primary: var(--theme-light-primary);
    --secondary: var(--theme-light-secondary);
    --error: var(--theme-light-error);
    --card: var(--theme-light-card);
    --border: var(--theme-light-border);
    --scroll-thumb: var(--theme-light-scroll-thumb);
    --scroll-track: var(--theme-light-scroll-track);
    --field-ok-bg: var(--theme-light-field-ok-bg);
    --field-ok-border: var(--theme-light-field-ok-border);
    --field-error-bg: var(--theme-light-field-error-bg);
    --field-error-border: var(--theme-light-field-error-border);
  }

  html[data-theme="dark"] {
    color-scheme: dark;
    --background: var(--theme-dark-background);
    --foreground: var(--theme-dark-foreground);
    --primary: var(--theme-dark-primary);
    --secondary: var(--theme-dark-secondary);
    --error: var(--theme-dark-error);
    --card: var(--theme-dark-card);
    --border: var(--theme-dark-border);
    --scroll-thumb: var(--theme-dark-scroll-thumb);
    --scroll-track: var(--theme-dark-scroll-track);
    --field-ok-bg: var(--theme-dark-field-ok-bg);
    --field-ok-border: var(--theme-dark-field-ok-border);
    --field-error-bg: var(--theme-dark-field-error-bg);
    --field-error-border: var(--theme-dark-field-error-border);
  }

  html[data-theme="system"] {
    color-scheme: light;
    --background: var(--theme-light-background);
    --foreground: var(--theme-light-foreground);
    --primary: var(--theme-light-primary);
    --secondary: var(--theme-light-secondary);
    --error: var(--theme-light-error);
    --card: var(--theme-light-card);
    --border: var(--theme-light-border);
    --scroll-thumb: var(--theme-light-scroll-thumb);
    --scroll-track: var(--theme-light-scroll-track);
    --field-ok-bg: var(--theme-light-field-ok-bg);
    --field-ok-border: var(--theme-light-field-ok-border);
    --field-error-bg: var(--theme-light-field-error-bg);
    --field-error-border: var(--theme-light-field-error-border);
  }

  @media (prefers-color-scheme: dark) {
    html[data-theme="system"] {
      color-scheme: dark;
      --background: var(--theme-dark-background);
      --foreground: var(--theme-dark-foreground);
      --primary: var(--theme-dark-primary);
      --secondary: var(--theme-dark-secondary);
      --error: var(--theme-dark-error);
      --card: var(--theme-dark-card);
      --border: var(--theme-dark-border);
      --scroll-thumb: var(--theme-dark-scroll-thumb);
      --scroll-track: var(--theme-dark-scroll-track);
      --field-ok-bg: var(--theme-dark-field-ok-bg);
      --field-ok-border: var(--theme-dark-field-ok-border);
      --field-error-bg: var(--theme-dark-field-error-bg);
      --field-error-border: var(--theme-dark-field-error-border);
    }
  }
  `;
  const cursorUrl = publicSettings.branding?.cursorUrl ?? null;
  const cursorLightUrl = publicSettings.branding?.cursorLightUrl ?? null;
  const cursorDarkUrl = publicSettings.branding?.cursorDarkUrl ?? null;
  const cursorHotspotX = publicSettings.branding?.cursorHotspot?.x ?? null;
  const cursorHotspotY = publicSettings.branding?.cursorHotspot?.y ?? null;
  const globalFontUrl = publicSettings.branding?.fontUrl ?? null;
  const globalGoogleFontKey = publicSettings.branding?.googleFont ?? null;
  const fontUrlByLang = publicSettings.branding?.fontUrlByLang ?? null;
  const googleFontByLang = publicSettings.branding?.googleFontByLang ?? null;

  const langFontUrl = fontUrlByLang?.[lang] ?? null;
  const langGoogleFontKey = googleFontByLang?.[lang] ?? null;

  const effectiveFontUrl = langFontUrl || globalFontUrl;
  const effectiveGoogleFontKey = !effectiveFontUrl
    ? langGoogleFontKey || globalGoogleFontKey
    : null;

  const googleFontEntry =
    effectiveGoogleFontKey && GOOGLE_FONT_MAP[effectiveGoogleFontKey]
      ? GOOGLE_FONT_MAP[effectiveGoogleFontKey]
      : null;

  const resolvedLightCursor = cursorLightUrl ?? cursorUrl;
  const resolvedDarkCursor = cursorDarkUrl ?? cursorUrl;
  const hasCursor = Boolean(resolvedLightCursor || resolvedDarkCursor);

  return (
    <html lang={lang} data-theme={themeMode} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <style>{themeCss}</style>
        {effectiveFontUrl ? (
          <style>{`@font-face { font-family: "BrandingFont"; src: url("${effectiveFontUrl}"); font-display: swap; } :root { --font-sans: "BrandingFont"; --font-geist-sans: "BrandingFont"; } body { font-family: var(--font-sans), Arial, Helvetica, sans-serif !important; }`}</style>
        ) : googleFontEntry ? (
          <style>{`:root { --font-sans: "${googleFontEntry.cssName}"; --font-geist-sans: "${googleFontEntry.cssName}"; } body { font-family: var(--font-sans), ${googleFontEntry.fallback}, system-ui, -apple-system, "Segoe UI", sans-serif !important; }`}</style>
        ) : null}
        {hasCursor ? (
          <style>{`
          html[data-theme="light"],
          html[data-theme="light"] body {
            cursor: url("${resolvedLightCursor ?? resolvedDarkCursor}") ${typeof cursorHotspotX === "number" ? cursorHotspotX : 8} ${typeof cursorHotspotY === "number" ? cursorHotspotY : 8}, auto !important;
          }
          html[data-theme="light"] a,
          html[data-theme="light"] button,
          html[data-theme="light"] [role="button"],
          html[data-theme="light"] input,
          html[data-theme="light"] select,
          html[data-theme="light"] textarea,
          html[data-theme="light"] label,
          html[data-theme="light"] .cursor-pointer {
            cursor: url("${resolvedLightCursor ?? resolvedDarkCursor}") ${typeof cursorHotspotX === "number" ? cursorHotspotX : 8} ${typeof cursorHotspotY === "number" ? cursorHotspotY : 8}, pointer !important;
          }

          html[data-theme="dark"],
          html[data-theme="dark"] body {
            cursor: url("${resolvedDarkCursor ?? resolvedLightCursor}") ${typeof cursorHotspotX === "number" ? cursorHotspotX : 8} ${typeof cursorHotspotY === "number" ? cursorHotspotY : 8}, auto !important;
          }
          html[data-theme="dark"] a,
          html[data-theme="dark"] button,
          html[data-theme="dark"] [role="button"],
          html[data-theme="dark"] input,
          html[data-theme="dark"] select,
          html[data-theme="dark"] textarea,
          html[data-theme="dark"] label,
          html[data-theme="dark"] .cursor-pointer {
            cursor: url("${resolvedDarkCursor ?? resolvedLightCursor}") ${typeof cursorHotspotX === "number" ? cursorHotspotX : 8} ${typeof cursorHotspotY === "number" ? cursorHotspotY : 8}, pointer !important;
          }

          html[data-theme="system"],
          html[data-theme="system"] body {
            cursor: url("${resolvedLightCursor ?? resolvedDarkCursor}") ${typeof cursorHotspotX === "number" ? cursorHotspotX : 8} ${typeof cursorHotspotY === "number" ? cursorHotspotY : 8}, auto !important;
          }
          html[data-theme="system"] a,
          html[data-theme="system"] button,
          html[data-theme="system"] [role="button"],
          html[data-theme="system"] input,
          html[data-theme="system"] select,
          html[data-theme="system"] textarea,
          html[data-theme="system"] label,
          html[data-theme="system"] .cursor-pointer {
            cursor: url("${resolvedLightCursor ?? resolvedDarkCursor}") ${typeof cursorHotspotX === "number" ? cursorHotspotX : 8} ${typeof cursorHotspotY === "number" ? cursorHotspotY : 8}, pointer !important;
          }

          @media (prefers-color-scheme: dark) {
            html[data-theme="system"],
            html[data-theme="system"] body {
              cursor: url("${resolvedDarkCursor ?? resolvedLightCursor}") ${typeof cursorHotspotX === "number" ? cursorHotspotX : 8} ${typeof cursorHotspotY === "number" ? cursorHotspotY : 8}, auto !important;
            }
            html[data-theme="system"] a,
            html[data-theme="system"] button,
            html[data-theme="system"] [role="button"],
            html[data-theme="system"] input,
            html[data-theme="system"] select,
            html[data-theme="system"] textarea,
            html[data-theme="system"] label,
            html[data-theme="system"] .cursor-pointer {
              cursor: url("${resolvedDarkCursor ?? resolvedLightCursor}") ${typeof cursorHotspotX === "number" ? cursorHotspotX : 8} ${typeof cursorHotspotY === "number" ? cursorHotspotY : 8}, pointer !important;
            }
          }
          `}</style>
        ) : null}
        <div className="flex min-h-screen flex-col bg-gray-50">
          <Suspense fallback={null}>
            <HeaderNav />
          </Suspense>
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <div className="flex-1">{children}</div>
          <Suspense fallback={null}>
            <SiteFooter />
          </Suspense>
          <Suspense fallback={null}>
            <AnalyticsConsentBanner />
          </Suspense>
        </div>
      </body>
    </html>
  );
}
