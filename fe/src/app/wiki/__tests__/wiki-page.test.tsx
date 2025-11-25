import { render, screen } from "@testing-library/react";
import WikiPage from "../page";

function mockFetchOnce(data: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => data,
  } as unknown as Response);
}

describe("WikiPage", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders list of wiki articles from API", async () => {
    mockFetchOnce([
      {
        id: "1",
        slug: "getting-started",
        language: "bg",
        title: "Начало с QA4Free",
        status: "active",
        updatedAt: "2025-11-25T00:00:00.000Z",
      },
    ]);

    const ui = await WikiPage();
    render(ui);

    expect(screen.getByText("Wiki")).toBeInTheDocument();
    expect(screen.getByText("Начало с QA4Free")).toBeInTheDocument();
  });

  it("renders empty state when there are no articles", async () => {
    mockFetchOnce([]);

    const ui = await WikiPage();
    render(ui);

    expect(
      screen.getByText("Все още няма публикувани статии."),
    ).toBeInTheDocument();
  });

  it("renders error state when API call fails", async () => {
    mockFetchOnce([], false);

    const ui = await WikiPage();
    render(ui);

    expect(
      screen.getByText(
        "Възникна проблем при зареждане на статиите. Опитайте отново по-късно.",
      ),
    ).toBeInTheDocument();
  });
});
