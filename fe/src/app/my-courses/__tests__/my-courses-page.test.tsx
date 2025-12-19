import { render, screen } from "@testing-library/react";
import * as nextNavigation from "next/navigation";
import MyCoursesPage from "../page";
import { ACCESS_TOKEN_KEY } from "../../auth-token";

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: jest.fn(),
  };
});

const useRouterMock = nextNavigation.useRouter as jest.Mock;

function mockFetchCourses(data: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
  } as unknown as Response);
}

describe("MyCoursesPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();

    useRouterMock.mockReturnValue({ replace: jest.fn() });
  });

  it("renders Paid badge and Certificate CTA for completed course", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchCourses([
      {
        id: "course-1",
        title: "Paid Course",
        description: "desc",
        language: "en",
        status: "active",
        isPaid: true,
        enrollmentStatus: "completed",
        progressPercent: 100,
        enrolledAt: "2025-01-01T00:00:00.000Z",
      },
    ]);

    render(<MyCoursesPage />);

    expect(await screen.findByText("Paid Course")).toBeInTheDocument();
    expect(await screen.findByText("Paid")).toBeInTheDocument();

    const certificateLink = await screen.findByRole("link", {
      name: "Certificate →",
    });
    expect(certificateLink).toHaveAttribute(
      "href",
      "/my-courses/course-1/certificate",
    );
  });

  it("renders Free badge and Start CTA for not started course", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchCourses([
      {
        id: "course-2",
        title: "Free Course",
        description: "desc",
        language: "bg",
        status: "active",
        isPaid: false,
        enrollmentStatus: "not_started",
        progressPercent: 0,
        enrolledAt: "2025-01-01T00:00:00.000Z",
      },
    ]);

    render(<MyCoursesPage />);

    expect(await screen.findByText("Free Course")).toBeInTheDocument();
    expect(await screen.findByText("Free")).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Започни →" }),
    ).toBeInTheDocument();
  });
});
