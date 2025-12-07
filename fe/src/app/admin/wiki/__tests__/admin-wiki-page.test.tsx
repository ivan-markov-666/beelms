import { render, screen } from "@testing-library/react";
import * as nextNavigation from "next/navigation";
import AdminWikiPage from "../page";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

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
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));
  });

  it("renders table with admin wiki articles from API", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");

    mockFetchOnce([
      {
        id: "1",
        slug: "getting-started",
        title: "Начало с QA4Free",
        status: "active",
        updatedAt: "2025-11-25T00:00:00.000Z",
      },
    ]);

    render(<AdminWikiPage />);

    expect(
      await screen.findByRole("heading", { name: "Wiki Management" }),
    ).toBeInTheDocument();

    expect(await screen.findByText("getting-started")).toBeInTheDocument();
    expect(await screen.findByText("Начало с QA4Free")).toBeInTheDocument();

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
    window.localStorage.setItem("qa4free_access_token", "test-token");

    mockFetchOnce([]);

    render(<AdminWikiPage />);

    expect(
      await screen.findByText("Няма Wiki статии за показване."),
    ).toBeInTheDocument();
  });

  it("shows error message when API call fails", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");

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
