import { render, screen } from "@testing-library/react";
import * as nextNavigation from "next/navigation";
import { HeaderNav } from "../header-nav";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

const useSearchParamsMock = nextNavigation.useSearchParams as jest.Mock;

function makeSearchParams(query: string) {
  return new URLSearchParams(query) as unknown as URLSearchParams;
}

describe("HeaderNav i18n", () => {
  it("renders BG labels when lang=bg", () => {
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));

    render(<HeaderNav />);

    expect(screen.getByRole("link", { name: "Wiki" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Вход" })).toBeInTheDocument();
  });

  it("renders EN labels when lang=en", () => {
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=en"));

    render(<HeaderNav />);

    expect(screen.getByRole("link", { name: "Wiki" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
  });
});
