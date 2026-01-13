import { render, screen } from "@testing-library/react";
import * as nextNavigation from "next/navigation";
import AdminWikiPage from "../page";
import { ACCESS_TOKEN_KEY } from "../../../auth-token";

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

function mockFetchOnce(data: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
  } as unknown as Response);
}

describe("AdminWikiPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
    useRouterMock.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
    usePathnameMock.mockReturnValue("/admin/wiki");
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));
  });

  it("renders table with admin wiki articles from API", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchOnce([
      {
        id: "1",
        slug: "getting-started",
        title: "Начало с BeeLMS",
        status: "active",
        updatedAt: "2025-11-25T00:00:00.000Z",
      },
    ]);

    render(<AdminWikiPage />);

    expect(
      await screen.findByRole("heading", { name: "Wiki Management" }),
    ).toBeInTheDocument();

    expect(await screen.findByText("getting-started")).toBeInTheDocument();
    expect(await screen.findByText("Начало с BeeLMS")).toBeInTheDocument();

    const editLink = screen.getByRole("link", { name: "Edit" });
    expect(editLink).toHaveAttribute(
      "href",
      "/admin/wiki/getting-started/edit",
    );

    const versionsLink = screen.getByRole("link", { name: "Versions" });
    expect(versionsLink).toHaveAttribute(
      "href",
      "/admin/wiki/getting-started/edit#versions",
    );
  });

  it("shows empty state when there are no articles", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchOnce([]);

    render(<AdminWikiPage />);

    expect(
      await screen.findByText("Няма Wiki статии за показване."),
    ).toBeInTheDocument();
  });

  it("shows error message when API call fails", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchOnce([], false, 500);

    render(<AdminWikiPage />);

    expect(
      await screen.findByText(
        "Възникна грешка при зареждане на Admin Wiki списъка.",
      ),
    ).toBeInTheDocument();
  });

  it("shows error when token is missing", async () => {
    mockFetchOnce([]);

    render(<AdminWikiPage />);

    expect(
      await screen.findByText(
        "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
      ),
    ).toBeInTheDocument();
  });
});
