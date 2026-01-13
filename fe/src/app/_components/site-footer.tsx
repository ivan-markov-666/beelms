"use client";

import Image from "next/image";
import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import * as Fa6Icons from "react-icons/fa6";
import * as SiIcons from "react-icons/si";
import { useCurrentLang } from "../../i18n/useCurrentLang";
import { t } from "../../i18n/t";
import { buildApiUrl } from "../api-url";
import {
  getPublicSettings,
  type PublicSettings,
} from "../_data/public-settings";

type EffectiveTheme = "light" | "dark";

function getEffectiveTheme(): EffectiveTheme {
  if (typeof window === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return "dark";
  if (attr === "light") return "light";
  const prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M22 12.06C22 6.504 17.523 2 12 2S2 6.504 2 12.06c0 5.02 3.657 9.183 8.438 9.94v-7.034H7.898v-2.906h2.54V9.845c0-2.52 1.492-3.914 3.777-3.914 1.094 0 2.238.197 2.238.197v2.475h-1.26c-1.242 0-1.63.776-1.63 1.572v1.885h2.773l-.443 2.906h-2.33V22c4.78-.757 8.437-4.92 8.437-9.94z" />
    </svg>
  );
}

type FooterCustomIconKey = NonNullable<
  NonNullable<PublicSettings["branding"]>["footerSocialLinks"]
>[number]["iconKey"];

const FOOTER_CUSTOM_ICON_MAP: Record<
  Exclude<FooterCustomIconKey, null | undefined>,
  { lib: "si" | "fa6"; name: string }
> = {
  whatsapp: { lib: "si", name: "SiWhatsapp" },
  messenger: { lib: "si", name: "SiMessenger" },
  signal: { lib: "si", name: "SiSignal" },
  skype: { lib: "si", name: "SiSkype" },
  imessage: { lib: "si", name: "SiImessage" },
  wechat: { lib: "si", name: "SiWechat" },
  line: { lib: "si", name: "SiLine" },
  kakaotalk: { lib: "si", name: "SiKakaotalk" },
  threema: { lib: "si", name: "SiThreema" },
  icq: { lib: "si", name: "SiIcq" },
  instagram: { lib: "si", name: "SiInstagram" },
  tiktok: { lib: "si", name: "SiTiktok" },
  snapchat: { lib: "si", name: "SiSnapchat" },
  pinterest: { lib: "si", name: "SiPinterest" },
  threads: { lib: "si", name: "SiThreads" },
  bereal: { lib: "si", name: "SiBereal" },
  tumblr: { lib: "si", name: "SiTumblr" },
  bluesky: { lib: "si", name: "SiBluesky" },
  mastodon: { lib: "si", name: "SiMastodon" },
  vk: { lib: "si", name: "SiVk" },
  zoom: { lib: "si", name: "SiZoom" },
  teams: { lib: "si", name: "SiMicrosoftteams" },
  slack: { lib: "si", name: "SiSlack" },
  "google-meet": { lib: "si", name: "SiGooglemeet" },
  "google-chat": { lib: "si", name: "SiGooglechat" },
  reddit: { lib: "si", name: "SiReddit" },
  twitch: { lib: "si", name: "SiTwitch" },
  quora: { lib: "si", name: "SiQuora" },
  clubhouse: { lib: "si", name: "SiClubhouse" },
  tinder: { lib: "si", name: "SiTinder" },
  github: { lib: "si", name: "SiGithub" },
  npm: { lib: "si", name: "SiNpm" },
  maven: { lib: "si", name: "SiApachemaven" },
  nuget: { lib: "si", name: "SiNuget" },
  pypi: { lib: "si", name: "SiPypi" },
  linkedin: { lib: "si", name: "SiLinkedin" },
  discord: { lib: "si", name: "SiDiscord" },
  telegram: { lib: "si", name: "SiTelegram" },
  viber: { lib: "si", name: "SiViber" },
  phone: { lib: "fa6", name: "FaPhone" },
  location: { lib: "fa6", name: "FaLocationDot" },
  globe: { lib: "fa6", name: "FaGlobe" },
  link: { lib: "fa6", name: "FaLink" },
};

const getFooterSocialIconComponent = (
  iconKey: FooterCustomIconKey,
): ComponentType<{ className?: string }> => {
  if (!iconKey) return Fa6Icons.FaLink;
  const meta = FOOTER_CUSTOM_ICON_MAP[iconKey as Exclude<typeof iconKey, null>];
  if (!meta) return Fa6Icons.FaLink;
  const lib =
    meta.lib === "fa6"
      ? (Fa6Icons as Record<string, unknown>)
      : (SiIcons as Record<string, unknown>);
  const comp = lib[meta.name];
  return typeof comp === "function"
    ? (comp as ComponentType<{ className?: string }>)
    : Fa6Icons.FaLink;
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2H21l-6.52 7.455L22.5 22h-6.8l-5.32-6.94L4.38 22H1.62l7.02-8.02L1.5 2h6.97l4.81 6.25L18.244 2zm-1.19 18h1.52L7.37 3.92H5.74L17.055 20z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M21.6 7.2a3.01 3.01 0 0 0-2.12-2.13C17.64 4.6 12 4.6 12 4.6s-5.64 0-7.48.47A3.01 3.01 0 0 0 2.4 7.2 31.7 31.7 0 0 0 2 12s.16 3.03.4 4.8a3.01 3.01 0 0 0 2.12 2.13c1.84.47 7.48.47 7.48.47s5.64 0 7.48-.47a3.01 3.01 0 0 0 2.12-2.13c.24-1.77.4-4.8.4-4.8s-.16-3.03-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
    </svg>
  );
}

export function SiteFooter({
  initialPublicSettings,
  initialCustomPages,
}: {
  initialPublicSettings?: PublicSettings | null;
  initialCustomPages?: Array<{ slug: string; title: string }>;
}) {
  const lang = useCurrentLang();
  const [publicSettings, setPublicSettings] = useState<PublicSettings | null>(
    () => initialPublicSettings ?? null,
  );
  const [customPages, setCustomPages] = useState<
    Array<{ slug: string; title: string }>
  >(() => initialCustomPages ?? []);
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() =>
    getEffectiveTheme(),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const initPublicSettings = async () => {
      try {
        const s = await getPublicSettings();
        if (cancelled) return;
        setPublicSettings(s);
      } catch {
        if (cancelled) return;
        setPublicSettings((prev) => prev);
      }
    };

    void initPublicSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const initCustomPages = async () => {
      try {
        const query = lang ? `?lang=${encodeURIComponent(lang)}` : "";
        const res = await fetch(`${buildApiUrl("/pages/custom")}${query}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) setCustomPages((prev) => prev);
          return;
        }

        const data = (await res.json()) as Array<{
          slug?: string;
          title?: string;
        }>;

        if (cancelled) return;

        const safe = Array.isArray(data)
          ? data
              .map((p) => ({
                slug: (p.slug ?? "").trim().toLowerCase(),
                title: (p.title ?? "").trim(),
              }))
              .filter((p) => Boolean(p.slug))
          : [];

        setCustomPages(safe);
      } catch {
        if (!cancelled) setCustomPages((prev) => prev);
      }
    };

    void initCustomPages();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      setEffectiveTheme(getEffectiveTheme());
    };

    update();
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, []);

  const gdprLegalEnabled = publicSettings?.features?.gdprLegal !== false;
  const termsPageEnabled = publicSettings?.features?.pageTerms !== false;
  const privacyPageEnabled = publicSettings?.features?.pagePrivacy !== false;
  const cookiePolicyPageEnabled =
    publicSettings?.features?.pageCookiePolicy !== false;
  const imprintPageEnabled = publicSettings?.features?.pageImprint !== false;
  const accessibilityPageEnabled =
    publicSettings?.features?.pageAccessibility !== false;
  const contactPageEnabled = publicSettings?.features?.pageContact !== false;
  const faqPageEnabled = publicSettings?.features?.pageFaq !== false;
  const supportPageEnabled = publicSettings?.features?.pageSupport !== false;

  const pageLinksBySlug = publicSettings?.branding?.pageLinks?.bySlug ?? null;
  const footerLinkEnabledForSlug = (slug: string): boolean => {
    const rec = pageLinksBySlug?.[slug];
    return rec?.url !== false && rec?.footer === true;
  };

  const customFooterLinks = customPages
    .filter((p) => footerLinkEnabledForSlug(p.slug))
    .slice(0, 8);

  const poweredByBeeLms = publicSettings?.branding?.poweredByBeeLms ?? null;
  const poweredByEnabled = poweredByBeeLms?.enabled === true;
  const poweredByUrl = (poweredByBeeLms?.url ?? "").trim();

  const footerSocialLinks =
    publicSettings?.branding?.footerSocialLinks?.filter(
      (link) => Boolean(link?.url) && link?.enabled !== false,
    ) ?? [];

  return (
    <footer className="mt-12 border-t border-[color:var(--border)] bg-[color:var(--card)] px-4 py-6 text-xs text-[color:var(--foreground)] opacity-80">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 text-center">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {footerLinkEnabledForSlug("about") ? (
            <Link
              href="/about"
              className="hover:opacity-90 text-[color:var(--primary)]"
            >
              {t(lang, "common", "footerAboutLink")}
            </Link>
          ) : null}
          {gdprLegalEnabled &&
            termsPageEnabled &&
            footerLinkEnabledForSlug("terms") && (
              <>
                <span className="hidden opacity-60 sm:inline">|</span>
                <Link
                  href="/legal/terms"
                  className="hover:opacity-90 text-[color:var(--primary)]"
                >
                  {t(lang, "common", "legalFooterTermsLink")}
                </Link>
              </>
            )}
          {gdprLegalEnabled &&
            privacyPageEnabled &&
            footerLinkEnabledForSlug("privacy") && (
              <>
                <span className="hidden opacity-60 sm:inline">|</span>
                <Link
                  href="/legal/privacy"
                  className="hover:opacity-90 text-[color:var(--primary)]"
                >
                  {t(lang, "common", "legalFooterPrivacyLink")}
                </Link>
              </>
            )}

          {gdprLegalEnabled &&
            cookiePolicyPageEnabled &&
            footerLinkEnabledForSlug("cookie-policy") && (
              <>
                <span className="hidden opacity-60 sm:inline">|</span>
                <Link
                  href="/legal/cookie-policy"
                  className="hover:opacity-90 text-[color:var(--primary)]"
                >
                  Cookie policy
                </Link>
              </>
            )}

          {gdprLegalEnabled &&
            imprintPageEnabled &&
            footerLinkEnabledForSlug("imprint") && (
              <>
                <span className="hidden opacity-60 sm:inline">|</span>
                <Link
                  href="/legal/imprint"
                  className="hover:opacity-90 text-[color:var(--primary)]"
                >
                  Imprint
                </Link>
              </>
            )}

          {gdprLegalEnabled &&
            accessibilityPageEnabled &&
            footerLinkEnabledForSlug("accessibility") && (
              <>
                <span className="hidden opacity-60 sm:inline">|</span>
                <Link
                  href="/legal/accessibility"
                  className="hover:opacity-90 text-[color:var(--primary)]"
                >
                  Accessibility
                </Link>
              </>
            )}

          {faqPageEnabled && footerLinkEnabledForSlug("faq") ? (
            <>
              <span className="hidden opacity-60 sm:inline">|</span>
              <Link
                href="/faq"
                className="hover:opacity-90 text-[color:var(--primary)]"
              >
                FAQ
              </Link>
            </>
          ) : null}

          {supportPageEnabled && footerLinkEnabledForSlug("support") ? (
            <>
              <span className="hidden opacity-60 sm:inline">|</span>
              <Link
                href="/support"
                className="hover:opacity-90 text-[color:var(--primary)]"
              >
                Support
              </Link>
            </>
          ) : null}

          {contactPageEnabled && footerLinkEnabledForSlug("contact") ? (
            <>
              <span className="hidden opacity-60 sm:inline">|</span>
              <Link
                href="/contact"
                className="hover:opacity-90 text-[color:var(--primary)]"
              >
                {t(lang, "common", "footerContactLink")}
              </Link>
            </>
          ) : null}

          {customFooterLinks.map((p) => (
            <span key={p.slug} className="inline-flex items-center gap-x-4">
              <span className="hidden opacity-60 sm:inline">|</span>
              <Link
                href={`/p/${p.slug}`}
                className="hover:opacity-90 text-[color:var(--primary)]"
                prefetch={false}
              >
                {p.title || p.slug}
              </Link>
            </span>
          ))}
        </nav>

        {poweredByEnabled || footerSocialLinks.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {poweredByEnabled ? (
              <a
                href={poweredByUrl || "#"}
                target={poweredByUrl ? "_blank" : undefined}
                rel={poweredByUrl ? "noreferrer" : undefined}
                className="inline-flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-2 py-1 text-xs hover:opacity-90"
                style={{
                  color: poweredByUrl ? "var(--primary)" : "var(--foreground)",
                }}
                onClick={(e) => {
                  if (!poweredByUrl) {
                    e.preventDefault();
                  }
                }}
              >
                <span className="text-xs font-medium">Powered by BeeLMS</span>
              </a>
            ) : null}

            {footerSocialLinks.map((link) => {
              const iconUrl =
                effectiveTheme === "dark"
                  ? link.iconDarkUrl || null
                  : link.iconLightUrl || null;

              return (
                <a
                  key={link.id}
                  href={link.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-2 py-1 text-xs hover:text-[color:var(--primary)]"
                >
                  {iconUrl ? (
                    <Image
                      src={iconUrl}
                      alt={link.label ?? link.type}
                      className="h-4 w-4"
                      width={16}
                      height={16}
                      unoptimized
                    />
                  ) : link.type === "facebook" ? (
                    <FacebookIcon className="h-4 w-4" />
                  ) : link.type === "youtube" ? (
                    <YouTubeIcon className="h-4 w-4" />
                  ) : link.type === "x" ? (
                    <XIcon className="h-4 w-4" />
                  ) : (
                    (() => {
                      const Icon = getFooterSocialIconComponent(
                        link.iconKey ?? null,
                      );
                      return <Icon className="h-4 w-4" />;
                    })()
                  )}
                  <span className="text-xs font-medium">
                    {link.label ??
                      (link.type === "x"
                        ? "X"
                        : link.type === "facebook"
                          ? "Facebook"
                          : link.type === "youtube"
                            ? "YouTube"
                            : "Link")}
                  </span>
                </a>
              );
            })}
          </div>
        ) : null}
      </div>
    </footer>
  );
}
