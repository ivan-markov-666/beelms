import { render, screen } from "@testing-library/react";
import WikiArticlePage from "../[slug]/page";
import WikiArticleError from "../[slug]/error";
import { notFound } from "next/navigation";

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    notFound: jest.fn(() => {
      throw new Error("not found");
    }),
  };
});

function mockFetchSequence(
  responses: Array<{ data: unknown; ok?: boolean; status?: number }>,
) {
  global.fetch = jest.fn().mockImplementation(async () => {
    const next = responses.shift();
    if (!next) {
      throw new Error("Unexpected fetch call");
    }

    return {
      ok: next.ok ?? true,
      status: next.status ?? 200,
      json: async () => next.data,
    } as unknown as Response;
  });
}

describe("WikiArticlePage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders wiki article detail from API", async () => {
    mockFetchSequence([
      {
        data: {
          id: "1",
          slug: "getting-started",
          language: "bg",
          title: "Начало с BeeLMS",
          content: "Съдържание на статията",
          status: "active",
          updatedAt: "2025-11-25T00:00:00.000Z",
        },
      },
      {
        data: {
          helpfulYes: 0,
          helpfulNo: 0,
          total: 0,
        },
      },
      {
        data: [],
      },
    ]);

    const ui = await WikiArticlePage({
      params: { slug: "getting-started" },
    });
    render(ui);

    expect(screen.getByText("Начало с BeeLMS")).toBeInTheDocument();
    expect(screen.getByText("Съдържание на статията")).toBeInTheDocument();
    expect(screen.getByText("← Назад към Wiki")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сподели" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Принтирай" }),
    ).toBeInTheDocument();
  });

  it("passes lang query param to the API when provided", async () => {
    mockFetchSequence([
      {
        data: {
          id: "1",
          slug: "getting-started",
          language: "en",
          title: "Getting started with BeeLMS (EN)",
          content: "Article content EN",
          status: "active",
          updatedAt: "2025-11-25T00:00:00.000Z",
        },
      },
      {
        data: {
          helpfulYes: 0,
          helpfulNo: 0,
          total: 0,
        },
      },
      {
        data: [],
      },
    ]);

    const ui = await WikiArticlePage({
      params: { slug: "getting-started" },
      searchParams: { lang: "en" },
    });
    render(ui);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/api/wiki/articles/getting-started");
    expect(url).toContain("lang=en");
  });

  it("calls notFound when article is missing (404)", async () => {
    const notFoundMock = notFound as unknown as jest.Mock;

    mockFetchSequence([
      {
        data: {},
        ok: false,
        status: 404,
      },
      {
        data: {},
      },
    ]);

    await expect(
      WikiArticlePage({
        params: { slug: "missing-article" },
      }),
    ).rejects.toThrow("not found");

    expect(notFoundMock).toHaveBeenCalled();
  });

  it("renders error state UI via error boundary component", () => {
    const error = new Error("Failed to load Wiki article");
    const reset = jest.fn();

    render(<WikiArticleError error={error} reset={reset} />);

    expect(
      screen.getByText("Възникна проблем при зареждане на статията"),
    ).toBeInTheDocument();
    expect(screen.getByText("Към списъка със статии")).toBeInTheDocument();
  });
});
