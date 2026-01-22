"use client";

import Image from "next/image";
import type { SocialProvider } from "../social-login";

const FALLBACK_INITIALS: Record<SocialProvider, string> = {
  google: "G",
  facebook: "f",
  github: "GH",
  linkedin: "in",
};

export function SocialIcon({
  provider,
  iconUrl,
}: {
  provider: SocialProvider;
  iconUrl: string | null;
}) {
  let fallback: React.ReactNode = (
    <span className="be-social-icon-badge">{FALLBACK_INITIALS[provider]}</span>
  );

  if (!iconUrl && provider === "github") {
    fallback = (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.93c.58.11.79-.25.79-.56 0-.27-.01-.98-.02-1.92-3.2.7-3.87-1.54-3.87-1.54-.52-1.3-1.28-1.65-1.28-1.65-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.04 1.78 2.73 1.27 3.39.97.11-.75.41-1.27.75-1.57-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.3 1.18-3.11-.12-.29-.51-1.48.11-3.09 0 0 .96-.31 3.16 1.19a10.9 10.9 0 0 1 5.75 0c2.2-1.5 3.15-1.19 3.15-1.19.63 1.61.24 2.8.12 3.09.74.81 1.18 1.85 1.18 3.11 0 4.41-2.69 5.39-5.25 5.67.43.37.82 1.1.82 2.23 0 1.62-.02 2.92-.02 3.32 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
        />
      </svg>
    );
  }

  return (
    <span className="be-social-icon" aria-hidden="true">
      {iconUrl ? (
        <Image
          src={iconUrl}
          alt=""
          width={20}
          height={20}
          className="h-4 w-4 object-contain"
        />
      ) : (
        fallback
      )}
    </span>
  );
}
