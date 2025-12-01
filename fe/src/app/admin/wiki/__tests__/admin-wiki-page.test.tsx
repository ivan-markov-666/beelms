import { render, screen, waitFor } from "@testing-library/react";
import AdminWikiPage from "../page";

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

    expect(await screen.findByText("Admin Wiki")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("getting-started")).toBeInTheDocument();
      expect(screen.getByText("Начало с QA4Free")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    const link = screen.getByText("getting-started").closest("a");
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "/wiki/getting-started");
    expect(link).toHaveAttribute("target", "_blank");
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
