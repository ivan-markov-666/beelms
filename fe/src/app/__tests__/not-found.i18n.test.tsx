import { render, screen } from "@testing-library/react";

const headersMock = jest.fn();
const cookiesMock = jest.fn();

jest.mock("next/headers", () => ({
  headers: async () => headersMock(),
  cookies: async () => cookiesMock(),
}));

type PublicSettingsPayload = {
  branding?: {
    notFoundTitle?: string | null;
    notFoundMarkdown?: string | null;
    notFoundTitleByLang?: Record<string, string | null> | null;
    notFoundMarkdownByLang?: Record<string, string | null> | null;
  };
  languages?: {
    supported?: string[];
    default?: string;
  };
};

const getPublicSettingsMock = jest.fn<Promise<PublicSettingsPayload>, []>();

jest.mock("../_data/public-settings", () => ({
  getPublicSettings: async () => getPublicSettingsMock(),
}));

describe("not-found i18n", () => {
  beforeEach(() => {
    headersMock.mockReset();
    cookiesMock.mockReset();
    getPublicSettingsMock.mockReset();
  });

  it("uses x-ui-lang to pick byLang title/markdown over global", async () => {
    headersMock.mockReturnValue(new Headers([["x-ui-lang", "en"]]));
    getPublicSettingsMock.mockResolvedValue({
      branding: {
        notFoundTitle: "BG title",
        notFoundMarkdown: "BG md",
        notFoundTitleByLang: { en: "EN title" },
        notFoundMarkdownByLang: { en: "EN md" },
      },
      languages: { supported: ["bg", "en"], default: "bg" },
    });

    const { default: NotFound } = await import("../not-found");
    const element = await NotFound();

    render(element);

    expect(screen.getByText("EN title")).toBeInTheDocument();
    expect(screen.getByText("EN md")).toBeInTheDocument();
    expect(screen.queryByText("BG title")).toBeNull();
    expect(screen.queryByText("BG md")).toBeNull();
  });

  it("falls back to global title/markdown when lang override is missing", async () => {
    headersMock.mockReturnValue(new Headers([["x-ui-lang", "en"]]));
    getPublicSettingsMock.mockResolvedValue({
      branding: {
        notFoundTitle: "Global title",
        notFoundMarkdown: "Global md",
        notFoundTitleByLang: { bg: "BG only" },
        notFoundMarkdownByLang: null,
      },
      languages: { supported: ["bg", "en"], default: "bg" },
    });

    const { default: NotFound } = await import("../not-found");
    const element = await NotFound();

    render(element);

    expect(screen.getByText("Global title")).toBeInTheDocument();
    expect(screen.getByText("Global md")).toBeInTheDocument();
  });

  it("falls back to ui_lang cookie when x-ui-lang header is missing", async () => {
    headersMock.mockReturnValue(new Headers());
    cookiesMock.mockReturnValue({
      get: (name: string) => (name === "ui_lang" ? { value: "en" } : undefined),
    });
    getPublicSettingsMock.mockRejectedValue(new Error("settings down"));

    const { default: NotFound } = await import("../not-found");
    const element = await NotFound();

    render(element);

    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The page you are looking for does not exist or has been moved.",
      ),
    ).toBeInTheDocument();
  });
});
