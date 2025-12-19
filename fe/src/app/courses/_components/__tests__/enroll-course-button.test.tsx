import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnrollCourseButton } from "../enroll-course-button";
import { ACCESS_TOKEN_KEY } from "../../../auth-token";

function mockFetchPaidFlow(courseId: string) {
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.endsWith("/users/me/courses") && method === "GET") {
      return {
        ok: true,
        status: 200,
        json: async () => [],
      } as unknown as Response;
    }

    if (url.endsWith(`/courses/${courseId}/purchase`) && method === "POST") {
      return {
        ok: true,
        status: 204,
        json: async () => ({}),
      } as unknown as Response;
    }

    if (url.endsWith(`/courses/${courseId}/enroll`) && method === "POST") {
      return {
        ok: true,
        status: 204,
        json: async () => ({}),
      } as unknown as Response;
    }

    return {
      ok: false,
      status: 500,
      json: async () => ({}),
    } as unknown as Response;
  });
}

function mockFetchFreeFlow(courseId: string) {
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.endsWith("/users/me/courses") && method === "GET") {
      return {
        ok: true,
        status: 200,
        json: async () => [],
      } as unknown as Response;
    }

    if (url.endsWith(`/courses/${courseId}/enroll`) && method === "POST") {
      return {
        ok: true,
        status: 204,
        json: async () => ({}),
      } as unknown as Response;
    }

    return {
      ok: false,
      status: 500,
      json: async () => ({}),
    } as unknown as Response;
  });
}

describe("EnrollCourseButton", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
  });

  it("runs purchase then enroll for paid course", async () => {
    const user = userEvent.setup();
    const courseId = "course-1";

    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");
    mockFetchPaidFlow(courseId);

    render(<EnrollCourseButton courseId={courseId} isPaid={true} />);

    const button = await screen.findByRole("button", { name: "Unlock & Enroll" });
    await user.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(
      await screen.findByText("Курсът е отключен и записването е успешно."),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("button", { name: "Enrolled" }),
    ).toBeDisabled();

    const calls = (global.fetch as jest.Mock).mock.calls;
    const calledPurchase = calls.some(([url, init]) =>
      String(url).endsWith(`/courses/${courseId}/purchase`) &&
      ((init?.method ?? "GET") as string).toUpperCase() === "POST",
    );
    const calledEnroll = calls.some(([url, init]) =>
      String(url).endsWith(`/courses/${courseId}/enroll`) &&
      ((init?.method ?? "GET") as string).toUpperCase() === "POST",
    );

    expect(calledPurchase).toBe(true);
    expect(calledEnroll).toBe(true);
  });

  it("enrolls directly for free course", async () => {
    const user = userEvent.setup();
    const courseId = "course-2";

    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");
    mockFetchFreeFlow(courseId);

    render(<EnrollCourseButton courseId={courseId} isPaid={false} />);

    const button = await screen.findByRole("button", { name: "Enroll" });
    await user.click(button);

    expect(await screen.findByText("Записването е успешно.")).toBeInTheDocument();

    expect(
      await screen.findByRole("button", { name: "Enrolled" }),
    ).toBeDisabled();
  });
});
