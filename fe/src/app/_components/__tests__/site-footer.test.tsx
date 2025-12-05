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

  it("renders footer links matching wireframe navigation", () => {
    render(<SiteFooter />);

    const aboutLink = screen.getByRole("link", {
      name: "About",
    });
    const privacyLink = screen.getByRole("link", {
      name: "Политика за поверителност (Privacy/GDPR)",
    });
    const contactLink = screen.getByRole("link", { name: "Contact" });

    expect(aboutLink).toHaveAttribute("href", "/about");
    expect(privacyLink).toHaveAttribute("href", "/legal/privacy");
    expect(contactLink).toHaveAttribute("href", "/contact");
  });
});
