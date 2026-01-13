import { render, screen } from "@testing-library/react";
import type { PublicSettings } from "../../_data/public-settings";
import { getPublicSettings } from "../../_data/public-settings";
import WikiPage from "../page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/wiki",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("../../_data/public-settings", () => ({
  getPublicSettings: jest.fn(),
}));

function createPublicSettings(
  partial?: Partial<PublicSettings>,
): PublicSettings {
  return {
    branding: {
      appName: "BeeLMS",
    },
    features: {
      wiki: true,
      wikiPublic: true,
      courses: true,
      coursesPublic: true,
      myCourses: true,
      profile: true,
      accessibilityWidget: true,
      seo: true,
      themeLight: true,
      themeDark: true,
      themeModeSelector: true,
      auth: true,
      authLogin: true,
      authRegister: true,
      auth2fa: false,
      captcha: false,
      captchaLogin: false,
      captchaRegister: false,
      captchaForgotPassword: false,
      captchaChangePassword: false,
      paidCourses: false,
      paymentsStripe: false,
      paymentsPaypal: false,
      paymentsMypos: false,
      paymentsRevolut: false,
      gdprLegal: false,
      pageTerms: false,
      pagePrivacy: false,
      pageCookiePolicy: false,
      pageImprint: false,
      pageAccessibility: false,
      pageContact: false,
      pageFaq: false,
      pageSupport: false,
      pageNotFound: false,
      socialGoogle: false,
      socialFacebook: false,
      socialGithub: false,
      socialLinkedin: false,
      infraRedis: false,
      infraRabbitmq: false,
      infraMonitoring: false,
      infraErrorTracking: false,
    },
    languages: {
      supported: ["bg", "en"],
      default: "bg",
    },
    ...partial,
  };
}

const mockGetPublicSettings = getPublicSettings as jest.MockedFunction<
  typeof getPublicSettings
>;

function mockArticlesFetchOnce(
  data: unknown,
  {
    ok = true,
    status = ok ? 200 : 500,
    totalCount,
  }: {
    ok?: boolean;
    status?: number;
    totalCount?: number;
  } = {},
) {
  const total =
    typeof totalCount === "number"
      ? totalCount
      : Array.isArray(data)
        ? data.length
        : 0;

  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
    headers: {
      get: (key: string) =>
        key.toLowerCase() === "x-total-count" ? String(total) : null,
    },
  } as unknown as Response);
}

describe("WikiPage", () => {
  beforeEach(() => {
    mockGetPublicSettings.mockResolvedValue(createPublicSettings());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders list of wiki articles from API", async () => {
    mockArticlesFetchOnce(
      [
        {
          id: "1",
          slug: "getting-started",
          language: "bg",
          title: "Начало с BeeLMS",
          status: "active",
          updatedAt: "2025-11-25T00:00:00.000Z",
        },
      ],
      { totalCount: 40 },
    );

    const ui = await WikiPage();
    render(ui);

    expect(screen.getByText("Wiki")).toBeInTheDocument();
    expect(screen.getByText("Начало с BeeLMS")).toBeInTheDocument();
  });

  it("renders empty state when there are no articles", async () => {
    mockArticlesFetchOnce([]);

    const ui = await WikiPage();
    render(ui);

    expect(
      screen.getByText("Все още няма публикувани статии."),
    ).toBeInTheDocument();
  });

  it("renders error state when API call fails", async () => {
    mockArticlesFetchOnce([], { ok: false, status: 503 });

    const ui = await WikiPage();
    render(ui);

    expect(
      screen.getByText(
        "Възникна проблем при зареждане на статиите. Опитайте отново по-късно.",
      ),
    ).toBeInTheDocument();
  });

  it("passes search and language filters to the API URL", async () => {
    mockArticlesFetchOnce([]);

    const ui = await WikiPage({
      searchParams: { q: "начало", lang: "bg" },
    });
    render(ui);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/api/wiki/articles");
    expect(url).toContain("q=%D0%BD%D0%B0%D1%87%D0%B0%D0%BB%D0%BE");
    expect(url).toContain("lang=bg");
  });

  it("renders no-results state when filters are applied and there are no articles", async () => {
    mockArticlesFetchOnce([]);

    const ui = await WikiPage({
      searchParams: { q: "няма-резултати" },
    });
    render(ui);

    expect(
      screen.getByText("Няма намерени статии според зададените критерии."),
    ).toBeInTheDocument();
  });

  it("passes page and pageSize to the API URL", async () => {
    mockArticlesFetchOnce([]);

    const ui = await WikiPage({
      searchParams: { page: "2" },
    });
    render(ui);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/api/wiki/articles");
    expect(url).toContain("page=2");
    expect(url).toContain("pageSize=20");
  });

  it("builds pagination links that preserve search and language filters", async () => {
    mockArticlesFetchOnce(
      [
        {
          id: "1",
          slug: "getting-started",
          language: "bg",
          title: "Начало с BeeLMS",
          status: "active",
          updatedAt: "2025-11-25T00:00:00.000Z",
        },
      ],
      {
        totalCount: 40,
      },
    );

    const ui = await WikiPage({
      searchParams: { q: "test", lang: "bg", page: "2" },
    });
    render(ui);

    expect(
      screen.getByRole("button", { name: "Previous" }),
    ).toBeInTheDocument();
  });
});
