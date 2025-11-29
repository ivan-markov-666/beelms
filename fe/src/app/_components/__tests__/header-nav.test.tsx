import { render, screen, waitFor } from "@testing-library/react";
import * as nextNavigation from "next/navigation";
import { HeaderNav } from "../header-nav";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

const useSearchParamsMock = nextNavigation.useSearchParams as jest.Mock;
const usePathnameMock = nextNavigation.usePathname as jest.Mock;

function makeSearchParams(query: string) {
  return new URLSearchParams(query) as unknown as URLSearchParams;
}

describe("HeaderNav i18n", () => {
  it("renders BG labels when lang=bg", async () => {
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));
    usePathnameMock.mockReturnValue("/wiki");

    render(<HeaderNav />);

    expect(screen.getByRole("link", { name: "Wiki" })).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Вход" }),
    ).toBeInTheDocument();
  });

  it("renders EN labels when lang=en", async () => {
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=en"));
    usePathnameMock.mockReturnValue("/wiki");

    render(<HeaderNav />);

    expect(screen.getByRole("link", { name: "Wiki" })).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Sign in" }),
    ).toBeInTheDocument();
  });

  it("hides login link when an access token is present", async () => {
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));
    usePathnameMock.mockReturnValue("/wiki");

    window.localStorage.setItem("qa4free_access_token", "test-token");

    render(<HeaderNav />);

    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: "Вход" }),
      ).not.toBeInTheDocument();
    });

    window.localStorage.removeItem("qa4free_access_token");
  });
});
