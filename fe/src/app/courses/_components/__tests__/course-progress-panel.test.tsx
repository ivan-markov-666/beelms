import { render, screen } from "@testing-library/react";
import { CourseProgressPanel } from "../course-progress-panel";
import { ACCESS_TOKEN_KEY } from "../../../auth-token";

describe("CourseProgressPanel", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
  });

  it("renders progress and Certificate CTA at 100%", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        totalItems: 2,
        completedItems: 2,
        progressPercent: 100,
        items: [
          {
            id: "item-1",
            title: "Intro",
            itemType: "wiki",
            wikiSlug: "intro",
            completed: true,
            completedAt: "2025-01-01T00:00:00.000Z",
          },
          {
            id: "item-2",
            title: "Next",
            itemType: "wiki",
            wikiSlug: "next",
            completed: true,
            completedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
      }),
    } as unknown as Response);

    render(<CourseProgressPanel courseId="course-1" courseLanguage="en" />);

    expect(await screen.findByText("Прогрес")).toBeInTheDocument();
    expect(await screen.findByText("100%")).toBeInTheDocument();

    expect(await screen.findByText("Завършени: 2/2")).toBeInTheDocument();

    expect(
      await screen.findByRole("link", { name: "Certificate" }),
    ).toHaveAttribute("href", "/my-courses/course-1/certificate");

    expect(await screen.findByText("Intro")).toBeInTheDocument();
  });

  it("shows enrollment required message on 403", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    } as unknown as Response);

    render(<CourseProgressPanel courseId="course-1" courseLanguage="en" />);

    expect(
      await screen.findByText("Запиши се в курса, за да виждаш прогреса."),
    ).toBeInTheDocument();
  });
});
