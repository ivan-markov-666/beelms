import { fireEvent, render, screen } from "@testing-library/react";
import { LanguageSwitcher } from "../language-switcher";
import * as nextNavigation from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const usePathnameMock = nextNavigation.usePathname as jest.Mock;
const useSearchParamsMock = nextNavigation.useSearchParams as jest.Mock;

function makeSearchParams(query: string) {
  return new URLSearchParams(query) as unknown as URLSearchParams;
}

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    // reset cookie between tests
    document.cookie = "ui_lang=; Path=/; Max-Age=0; SameSite=Lax";
    document.body.innerHTML = "";
    Object.defineProperty(window, "location", {
      value: { assign: jest.fn() },
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders dropdown with supported languages and selects current lang from URL", () => {
    usePathnameMock.mockReturnValue("/wiki");
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=en"));

    render(<LanguageSwitcher />);

    const trigger = screen.getByRole("button", {
      name: "Език на съдържанието",
    });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("EN");

    fireEvent.click(trigger);

    const listbox = screen.getByRole("listbox", {
      name: "Език на съдържанието",
    });
    expect(listbox).toBeInTheDocument();

    const options = screen.getAllByRole("option").map((opt) => opt.textContent);
    expect(options).toEqual(["BG", "EN", "DE"]);
  });

  it("updates lang and removes page param when switching language on /wiki", () => {
    usePathnameMock.mockReturnValue("/wiki");
    useSearchParamsMock.mockReturnValue(
      makeSearchParams("lang=bg&page=2&q=test"),
    );

    render(<LanguageSwitcher />);

    const trigger = screen.getByRole("button", {
      name: "Език на съдържанието",
    });
    expect(trigger).toHaveTextContent("BG");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "EN" }));

    expect(document.cookie).toContain("ui_lang=en");

    expect(window.location.assign).toHaveBeenCalledTimes(1);
    expect(window.location.assign).toHaveBeenCalledWith("/wiki?lang=en&q=test");
  });

  it("updates lang and preserves other params on non-wiki pages", () => {
    usePathnameMock.mockReturnValue("/profile");
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg&foo=bar"));

    render(<LanguageSwitcher />);

    const trigger = screen.getByRole("button", {
      name: "Език на съдържанието",
    });
    expect(trigger).toHaveTextContent("BG");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "EN" }));

    expect(window.location.assign).toHaveBeenCalledTimes(1);
    expect(window.location.assign).toHaveBeenCalledWith(
      "/profile?lang=en&foo=bar",
    );
  });

  it("does not navigate when selecting the already active language", () => {
    usePathnameMock.mockReturnValue("/wiki");
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));

    render(<LanguageSwitcher />);

    const trigger = screen.getByRole("button", {
      name: "Език на съдържанието",
    });
    expect(trigger).toHaveTextContent("BG");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "BG" }));

    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("forces a full navigation when switching language on the not-found page", () => {
    usePathnameMock.mockReturnValue("/test404");
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));
    document.body.innerHTML = '<main data-page="not-found"></main>';

    render(<LanguageSwitcher />);

    const trigger = screen.getByRole("button", {
      name: "Език на съдържанието",
    });
    expect(trigger).toHaveTextContent("BG");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "EN" }));

    expect(window.location.assign).toHaveBeenCalledTimes(1);
    expect(window.location.assign).toHaveBeenCalledWith("/test404?lang=en");
  });
});
