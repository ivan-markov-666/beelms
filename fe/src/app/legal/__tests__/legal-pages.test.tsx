import { render, screen } from "@testing-library/react";
import PrivacyPage from "../privacy/page";
import TermsPage from "../terms/page";

describe("Legal pages", () => {
  beforeEach(() => {
    const globalWithFetch = global as typeof global & {
      fetch: jest.Mock;
    };

    globalWithFetch.fetch = jest
      .fn()
      .mockImplementation(async (input: RequestInfo) => {
        const url = String(input);

        if (url.includes("/legal/privacy")) {
          return {
            ok: true,
            json: async () => ({
              slug: "privacy",
              title: "Privacy custom title",
              contentMarkdown: "# Heading\n\nSome content",
              updatedAt: new Date().toISOString(),
            }),
          } as unknown as Response;
        }

        return {
          ok: true,
          json: async () => ({
            slug: "terms",
            title: "Terms custom title",
            contentMarkdown: "# Heading\n\nSome content",
            updatedAt: new Date().toISOString(),
          }),
        } as unknown as Response;
      });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders Privacy/GDPR page title", async () => {
    const ui = await PrivacyPage({ searchParams: { lang: "bg" } });
    render(ui);

    expect(screen.getByText("Privacy custom title")).toBeInTheDocument();
  });

  it("renders Terms of Use page title", async () => {
    const ui = await TermsPage({ searchParams: { lang: "bg" } });
    render(ui);

    expect(screen.getByText("Terms custom title")).toBeInTheDocument();
  });
});
