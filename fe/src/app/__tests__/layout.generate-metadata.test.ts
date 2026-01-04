import type { Metadata } from "next";

type TwitterCardShape = {
  card?: string;
};

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

jest.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

jest.mock("../_components/header-nav", () => ({
  HeaderNav: () => null,
}));

jest.mock("../_components/site-footer", () => ({
  SiteFooter: () => null,
}));

jest.mock("../_components/analytics-consent-banner", () => ({
  AnalyticsConsentBanner: () => null,
}));

jest.mock("../_components/analytics-tracker", () => ({
  AnalyticsTracker: () => null,
}));

type PublicSettingsPayload = {
  branding?: {
    appName?: string;
    browserTitle?: string | null;
    socialDescription?: string | null;
    socialImage?: { imageUrl?: string | null } | null;
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

function mockPublicSettings(payload: PublicSettingsPayload) {
  global.fetch = jest.fn().mockImplementation(async (input: RequestInfo) => {
    const url = String(input);
    if (url.includes("/public/settings")) {
      return {
        ok: true,
        status: 200,
        json: async () => payload,
      } as unknown as Response;
    }

    return {
      ok: false,
      status: 404,
      json: async () => ({}),
    } as unknown as Response;
  });
}

describe("generateMetadata (social meta)", () => {
  afterEach(() => {
    jest.resetAllMocks();
    delete process.env["NEXT_PUBLIC_API_BASE_URL"];
  });

  it("uses shared socialDescription/socialImage as OG + Twitter fallbacks", async () => {
    mockPublicSettings({
      branding: {
        appName: "BeeLMS",
        browserTitle: null,
        socialDescription: "Shared desc",
        socialImage: { imageUrl: "https://cdn.example/shared.png" },
        openGraph: null,
        twitter: null,
      },
    });

    const { generateMetadata } = await import("../layout");
    const metadata = (await generateMetadata()) as Metadata;

    expect(metadata.openGraph?.description).toBe("Shared desc");
    expect(metadata.openGraph?.images).toEqual([
      { url: "https://cdn.example/shared.png" },
    ]);

    expect(metadata.twitter?.description).toBe("Shared desc");
    expect(metadata.twitter?.images).toEqual([
      "https://cdn.example/shared.png",
    ]);
    expect(
      (metadata.twitter as unknown as TwitterCardShape | undefined)?.card,
    ).toBe("summary_large_image");
  });

  it("emits twitter app card tags via metadata.other when app is valid", async () => {
    mockPublicSettings({
      branding: {
        appName: "BeeLMS",
        browserTitle: "BeeLMS",
        socialDescription: "Shared desc",
        socialImage: { imageUrl: "https://cdn.example/shared.png" },
        openGraph: null,
        twitter: {
          card: "app",
          title: "Twitter title",
          description: "Twitter desc",
          imageUrl: "https://cdn.example/twitter.png",
          app: {
            name: "Bee App",
            id: { iphone: "bee://iphone" },
            url: { iphone: "https://apps.apple.com/app/bee" },
          },
        },
      },
    });

    const { generateMetadata } = await import("../layout");
    const metadata = (await generateMetadata()) as Metadata;

    expect(metadata.twitter).toBeUndefined();
    expect(metadata.other).toBeDefined();

    const other = metadata.other as Record<string, string>;
    expect(other["twitter:card"]).toBe("app");
    expect(other["twitter:title"]).toBe("Twitter title");
    expect(other["twitter:description"]).toBe("Twitter desc");
    expect(other["twitter:image"]).toBe("https://cdn.example/twitter.png");

    expect(other["twitter:app:name:iphone"]).toBe("Bee App");
    expect(other["twitter:app:id:iphone"]).toBe("bee://iphone");
    expect(other["twitter:app:url:iphone"]).toBe(
      "https://apps.apple.com/app/bee",
    );
  });

  it("falls back to summary_large_image when twitter app card is incomplete", async () => {
    mockPublicSettings({
      branding: {
        appName: "BeeLMS",
        browserTitle: "BeeLMS",
        socialDescription: "Shared desc",
        socialImage: { imageUrl: "https://cdn.example/shared.png" },
        openGraph: null,
        twitter: {
          card: "app",
          title: "Twitter title",
          app: {
            name: "Bee App",
            id: { iphone: "" },
          },
        },
      },
    });

    const { generateMetadata } = await import("../layout");
    const metadata = (await generateMetadata()) as Metadata;

    expect(metadata.other).toBeUndefined();
    expect(
      (metadata.twitter as unknown as TwitterCardShape | undefined)?.card,
    ).toBe("summary_large_image");
  });

  it("emits twitter player card tags via metadata.other when player is valid", async () => {
    mockPublicSettings({
      branding: {
        appName: "BeeLMS",
        browserTitle: "BeeLMS",
        socialDescription: "Shared desc",
        socialImage: { imageUrl: "https://cdn.example/shared.png" },
        openGraph: null,
        twitter: {
          card: "player",
          title: "Twitter title",
          player: {
            url: "https://player.example/embed",
            width: 640,
            height: 360,
            stream: "https://stream.example/video.m3u8",
            streamContentType: "application/x-mpegURL",
          },
        },
      },
    });

    const { generateMetadata } = await import("../layout");
    const metadata = (await generateMetadata()) as Metadata;

    expect(metadata.twitter).toBeUndefined();
    expect(metadata.other).toBeDefined();

    const other = metadata.other as Record<string, string>;
    expect(other["twitter:card"]).toBe("player");
    expect(other["twitter:player"]).toBe("https://player.example/embed");
    expect(other["twitter:player:width"]).toBe("640");
    expect(other["twitter:player:height"]).toBe("360");
    expect(other["twitter:player:stream"]).toBe(
      "https://stream.example/video.m3u8",
    );
    expect(other["twitter:player:stream:content_type"]).toBe(
      "application/x-mpegURL",
    );
  });
});
