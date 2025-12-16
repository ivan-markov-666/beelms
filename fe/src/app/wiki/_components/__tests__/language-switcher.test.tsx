import { fireEvent, render, screen } from "@testing-library/react";
import { LanguageSwitcher } from "../language-switcher";
import * as nextNavigation from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const useRouterMock = nextNavigation.useRouter as jest.Mock;
const usePathnameMock = nextNavigation.usePathname as jest.Mock;
const useSearchParamsMock = nextNavigation.useSearchParams as jest.Mock;

function makeSearchParams(query: string) {
  return new URLSearchParams(query) as unknown as URLSearchParams;
}

describe("LanguageSwitcher", () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    useRouterMock.mockReturnValue({ push: pushMock });
    pushMock.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders dropdown with supported languages and selects current lang from URL", () => {
    usePathnameMock.mockReturnValue("/wiki");
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=en"));

    render(<LanguageSwitcher />);

    const select = screen.getByLabelText("Език на съдържанието");
    expect(select).toBeInTheDocument();
    expect((select as HTMLSelectElement).value).toBe("en");

    const options = screen.getAllByRole("option").map((opt) => opt.textContent);
    expect(options).toEqual(["BG", "EN", "DE"]);
  });

  it("updates lang and removes page param when switching language on /wiki", () => {
    usePathnameMock.mockReturnValue("/wiki");
    useSearchParamsMock.mockReturnValue(
      makeSearchParams("lang=bg&page=2&q=test"),
    );

    render(<LanguageSwitcher />);

    const select = screen.getByLabelText("Език на съдържанието");
    fireEvent.change(select, { target: { value: "en" } });

    expect(pushMock).toHaveBeenCalledTimes(1);
    const [url] = pushMock.mock.calls[0] as [string];

    expect(url.startsWith("/wiki")).toBe(true);
    expect(url).toContain("lang=en");
    expect(url).toContain("q=test");
    expect(url).not.toContain("page=");
  });

  it("updates lang and preserves other params on non-wiki pages", () => {
    usePathnameMock.mockReturnValue("/profile");
    useSearchParamsMock.mockReturnValue(
      makeSearchParams("lang=bg&foo=bar"),
    );

    render(<LanguageSwitcher />);

    const select = screen.getByLabelText("Език на съдържанието");
    fireEvent.change(select, { target: { value: "en" } });

    expect(pushMock).toHaveBeenCalledTimes(1);
    const [url] = pushMock.mock.calls[0] as [string];

    expect(url.startsWith("/profile")).toBe(true);
    expect(url).toContain("lang=en");
    expect(url).toContain("foo=bar");
  });

  it("does not navigate when selecting the already active language", () => {
    usePathnameMock.mockReturnValue("/wiki");
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));

    render(<LanguageSwitcher />);

    const select = screen.getByLabelText("Език на съдържанието");
    fireEvent.change(select, { target: { value: "bg" } });

    expect(pushMock).not.toHaveBeenCalled();
  });
});
