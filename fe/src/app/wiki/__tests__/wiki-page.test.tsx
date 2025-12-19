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
        title: "Начало с BeeLMS",
        status: "active",
        updatedAt: "2025-11-25T00:00:00.000Z",
      },
    ]);

    const ui = await WikiPage();
    render(ui);

    expect(screen.getByText("Wiki")).toBeInTheDocument();
    expect(screen.getByText("Начало с BeeLMS")).toBeInTheDocument();
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

  it("passes search and language filters to the API URL", async () => {
    mockFetchOnce([]);

    const ui = await WikiPage({
      searchParams: { q: "начало", lang: "bg" },
    });
    render(ui);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/api/wiki/articles");
    expect(url).toContain("q=%D0%BD%D0%B0%D1%87%D0%B0%D0%BB%D0%BE");
    expect(url).toContain("lang=bg");
  });

  it("renders no-results state when filters are applied and there are no articles", async () => {
    mockFetchOnce([]);

    const ui = await WikiPage({
      searchParams: { q: "няма-резултати" },
    });
    render(ui);

    expect(
      screen.getByText("Няма намерени статии според зададените критерии."),
    ).toBeInTheDocument();
  });

  it("passes page and pageSize to the API URL", async () => {
    mockFetchOnce([]);

    const ui = await WikiPage({
      searchParams: { page: "2" },
    });
    render(ui);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/api/wiki/articles");
    expect(url).toContain("page=2");
    expect(url).toContain("pageSize=20");
  });

  it("builds pagination links that preserve search and language filters", async () => {
    mockFetchOnce([
      {
        id: "1",
        slug: "getting-started",
        language: "bg",
        title: "Начало с BeeLMS",
        status: "active",
        updatedAt: "2025-11-25T00:00:00.000Z",
      },
    ]);

    const ui = await WikiPage({
      searchParams: { q: "test", lang: "bg", page: "2" },
    });
    render(ui);

    const prevLink = screen.getByText("Предишна").closest("a");

    expect(prevLink).not.toBeNull();

    const href = prevLink?.getAttribute("href") ?? "";
    expect(href).toContain("/wiki");
    expect(href).toContain("q=test");
    expect(href).toContain("lang=bg");
  });
});
