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

function mockFetchOnce(data: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
  } as unknown as Response);
}

describe("WikiArticlePage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders wiki article detail from API", async () => {
    mockFetchOnce(
      {
        id: "1",
        slug: "getting-started",
        language: "bg",
        title: "Начало с QA4Free",
        content: "Съдържание на статията",
        status: "active",
        updatedAt: "2025-11-25T00:00:00.000Z",
      },
      true,
      200,
    );

    const ui = await WikiArticlePage({
      params: { slug: "getting-started" },
    });
    render(ui);

    expect(screen.getByText("Начало с QA4Free")).toBeInTheDocument();
    expect(screen.getByText("Съдържание на статията")).toBeInTheDocument();
    expect(screen.getByText("← Назад към Wiki")).toBeInTheDocument();
  });

  it("calls notFound when article is missing (404)", async () => {
    const notFoundMock = notFound as jest.Mock;

    mockFetchOnce({}, false, 404);

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
