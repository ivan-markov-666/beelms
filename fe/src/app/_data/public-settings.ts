import { buildApiUrl } from "../api-url";

export type PublicSettings = {
  branding: {
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
    } | null;
  };
  features: {
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
  languages: {
    supported: string[];
    default: string;
  };
};

export async function getPublicSettings(
  init?: RequestInit,
): Promise<PublicSettings> {
  const res = await fetch(buildApiUrl("/public/settings"), {
    cache: "no-store",
    ...init,
  });

  if (!res.ok) {
    throw new Error(`Failed to load public settings: ${res.status}`);
  }

  return (await res.json()) as PublicSettings;
}
