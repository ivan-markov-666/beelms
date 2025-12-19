import { render, screen, waitFor } from "@testing-library/react";
import * as nextNavigation from "next/navigation";
import AdminHomePage from "../page";
import { ACCESS_TOKEN_KEY } from "../../auth-token";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

const useSearchParamsMock = nextNavigation.useSearchParams as jest.Mock;

function makeSearchParams(query: string) {
  return new URLSearchParams(query) as unknown as URLSearchParams;
}

describe("AdminHomePage (Dashboard)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));
  });

  it("renders metrics card with total users from API", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    global.fetch = jest.fn().mockImplementation((input: RequestInfo) => {
      const url = typeof input === "string" ? input : String(input);

      if (url.includes("/admin/metrics/overview")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            totalUsers: 42,
            totalArticles: 0,
            topArticles: [],
          }),
        } as unknown as Response);
      }

      if (url.includes("/admin/activity")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [],
        } as unknown as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as unknown as Response);
    });

    render(<AdminHomePage />);

    expect(
      await screen.findByRole("heading", { name: /Админ табло/ }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Регистрирани потребители")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });

  it("shows error message when metrics API call fails", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    global.fetch = jest.fn().mockImplementation((input: RequestInfo) => {
      const url = typeof input === "string" ? input : String(input);

      if (url.includes("/admin/metrics/overview")) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({}),
        } as unknown as Response);
      }

      if (url.includes("/admin/activity")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [],
        } as unknown as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as unknown as Response);
    });

    render(<AdminHomePage />);

    expect(
      await screen.findByText("Неуспешно зареждане на метрики."),
    ).toBeInTheDocument();
  });

  it("renders quick links to admin wiki and users", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    global.fetch = jest.fn().mockImplementation((input: RequestInfo) => {
      const url = typeof input === "string" ? input : String(input);

      if (url.includes("/admin/metrics/overview")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            totalUsers: 1,
            totalArticles: 0,
            topArticles: [],
          }),
        } as unknown as Response);
      }

      if (url.includes("/admin/activity")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [],
        } as unknown as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as unknown as Response);
    });

    render(<AdminHomePage />);

    await screen.findByText("Регистрирани потребители");

    const wikiLink = screen.getByRole("link", { name: "Wiki" });
    const usersLink = screen.getByRole("link", { name: "Потребители" });

    expect(wikiLink).toHaveAttribute("href", "/admin/wiki");
    expect(usersLink).toHaveAttribute("href", "/admin/users");
  });
});
