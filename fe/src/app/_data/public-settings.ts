import { buildApiUrl } from "../api-url";

export type PublicSettings = {
  branding: {
    appName: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
  };
  features: {
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
