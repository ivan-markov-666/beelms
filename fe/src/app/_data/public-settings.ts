import { buildApiUrl } from "../api-url";

type HeaderMenuItem = {
  id: string;
  label?: string | null;
  labelByLang?: Record<string, string | null> | null;
  href: string;
  enabled?: boolean;
  clickable?: boolean;
  newTab?: boolean;
  children?: HeaderMenuItem[] | null;
};

export type PublicSettings = {
  branding: {
    appName: string;
    browserTitle?: string | null;
    notFoundTitle?: string | null;
    notFoundMarkdown?: string | null;
    notFoundTitleByLang?: Record<string, string | null> | null;
    notFoundMarkdownByLang?: Record<string, string | null> | null;
    loginSocialUnavailableMessageEnabled?: boolean;
    loginSocialResetPasswordHintEnabled?: boolean;
    registerSocialUnavailableMessageEnabled?: boolean;
    headerMenu?: {
      enabled?: boolean;
      items?: HeaderMenuItem[] | null;
    } | null;
    pageLinks?: {
      enabled?: boolean;
      bySlug?: Record<
        string,
        {
          url?: boolean;
          header?: boolean;
          footer?: boolean;
        }
      > | null;
    } | null;
    poweredByBeeLms?: {
      enabled?: boolean;
      url?: string | null;
    } | null;
    cursorUrl?: string | null;
    cursorLightUrl?: string | null;
    cursorDarkUrl?: string | null;
    cursorPointerUrl?: string | null;
    cursorPointerLightUrl?: string | null;
    cursorPointerDarkUrl?: string | null;
    cursorHotspot?: {
      x?: number | null;
      y?: number | null;
    } | null;
    faviconUrl?: string | null;
    googleFont?: string | null;
    googleFontByLang?: Record<string, string | null> | null;
    fontUrl?: string | null;
    fontUrlByLang?: Record<string, string | null> | null;
    fontLicenseUrl?: string | null;
    fontLicenseUrlByLang?: Record<string, string | null> | null;
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
        fieldAlertBg?: string | null;
        fieldAlertBorder?: string | null;
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
        fieldAlertBg?: string | null;
        fieldAlertBorder?: string | null;
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

    footerSocialLinks?: Array<{
      id: string;
      type: "facebook" | "x" | "youtube" | "custom";
      label?: string | null;
      url?: string | null;
      enabled?: boolean;
      iconKey?:
        | "whatsapp"
        | "messenger"
        | "signal"
        | "skype"
        | "imessage"
        | "wechat"
        | "line"
        | "kakaotalk"
        | "threema"
        | "icq"
        | "instagram"
        | "tiktok"
        | "snapchat"
        | "pinterest"
        | "threads"
        | "bereal"
        | "tumblr"
        | "bluesky"
        | "mastodon"
        | "vk"
        | "zoom"
        | "teams"
        | "slack"
        | "google-meet"
        | "google-chat"
        | "reddit"
        | "twitch"
        | "quora"
        | "clubhouse"
        | "tinder"
        | "github"
        | "npm"
        | "maven"
        | "nuget"
        | "pypi"
        | "linkedin"
        | "discord"
        | "telegram"
        | "viber"
        | "phone"
        | "location"
        | "link"
        | "globe"
        | null;
      iconLightUrl?: string | null;
      iconDarkUrl?: string | null;
    }> | null;

    socialLoginIcons?: Partial<
      Record<
        "google" | "facebook" | "github" | "linkedin",
        { lightUrl?: string | null; darkUrl?: string | null }
      >
    > | null;
  };
  features: {
    wiki: boolean;
    wikiPublic: boolean;
    courses: boolean;
    coursesPublic: boolean;
    myCourses: boolean;
    profile: boolean;
    accessibilityWidget: boolean;
    seo: boolean;
    themeLight: boolean;
    themeDark: boolean;
    themeModeSelector: boolean;
    auth: boolean;
    authLogin: boolean;
    authRegister: boolean;
    auth2fa: boolean;
    captcha: boolean;
    captchaLogin: boolean;
    captchaRegister: boolean;
    captchaForgotPassword: boolean;
    captchaChangePassword: boolean;
    paidCourses: boolean;
    paymentsStripe: boolean;
    paymentsPaypal: boolean;
    paymentsMypos: boolean;
    paymentsRevolut: boolean;
    paymentsDefaultProvider?: "stripe" | "paypal" | "mypos" | "revolut";
    gdprLegal: boolean;
    pageTerms: boolean;
    pagePrivacy: boolean;
    pageCookiePolicy: boolean;
    pageImprint: boolean;
    pageAccessibility: boolean;
    pageContact: boolean;
    pageFaq: boolean;
    pageSupport: boolean;
    pageNotFound: boolean;
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
    icons?: Record<
      string,
      { lightUrl?: string | null; darkUrl?: string | null } | null
    > | null;
    flagPicker?: {
      global?: string | null;
      byLang?: Record<string, string | null> | null;
    } | null;
  };
  seo?: {
    baseUrl?: string | null;
    titleTemplate?: string | null;
    defaultTitle?: string | null;
    defaultDescription?: string | null;
    robots?: {
      index?: boolean;
    } | null;
    sitemap?: {
      enabled?: boolean;
      includeWiki?: boolean;
      includeCourses?: boolean;
      includeLegal?: boolean;
    } | null;
  } | null;
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
