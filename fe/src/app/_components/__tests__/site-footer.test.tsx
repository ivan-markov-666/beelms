import { render, screen } from "@testing-library/react";
import * as nextNavigation from "next/navigation";
import { SiteFooter } from "../site-footer";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

const useSearchParamsMock = nextNavigation.useSearchParams as jest.Mock;

function makeSearchParams(query: string) {
  return new URLSearchParams(query) as unknown as URLSearchParams;
}

describe("SiteFooter", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));
  });

  it("renders footer links to legal pages", () => {
    render(<SiteFooter />);

    const privacyLink = screen.getByRole("link", {
      name: "Политика за поверителност (Privacy/GDPR)",
    });
    const termsLink = screen.getByRole("link", { name: "Условия за ползване" });

    expect(privacyLink).toHaveAttribute("href", "/legal/privacy");
    expect(termsLink).toHaveAttribute("href", "/legal/terms");
  });
});
