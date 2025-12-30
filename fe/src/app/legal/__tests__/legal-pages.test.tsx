import { render, screen } from "@testing-library/react";
import PrivacyPage from "../privacy/page";
import TermsPage from "../terms/page";

describe("Legal pages", () => {
  const mockLegalPage = {
    slug: "terms",
    title: "Legal page",
    contentMarkdown: "# Heading\n\nSome content",
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    const globalWithFetch = global as typeof global & {
      fetch: jest.Mock;
    };

    globalWithFetch.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockLegalPage,
    } as Response);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders Privacy/GDPR page title", async () => {
    const ui = await PrivacyPage({ searchParams: { lang: "bg" } });
    render(ui);

    expect(
      screen.getByText("Политика за поверителност и GDPR"),
    ).toBeInTheDocument();
  });

  it("renders Terms of Use page title", async () => {
    const ui = await TermsPage({ searchParams: { lang: "bg" } });
    render(ui);

    expect(screen.getByText("Условия за ползване")).toBeInTheDocument();
  });
});
