import { render, screen } from "@testing-library/react";
import PrivacyPage from "../privacy/page";
import TermsPage from "../terms/page";

describe("Legal pages", () => {
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
