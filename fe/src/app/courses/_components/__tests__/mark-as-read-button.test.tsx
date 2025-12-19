import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkAsReadButton } from "../mark-as-read-button";
import { ACCESS_TOKEN_KEY } from "../../../auth-token";

describe("MarkAsReadButton", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
  });

  it("refreshes progress after marking and shows Certificate CTA when progress reaches 100%", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          totalItems: 1,
          completedItems: 0,
          progressPercent: 0,
          items: [
            {
              id: "item-1",
              title: "Intro",
              itemType: "wiki",
              wikiSlug: "intro",
              completed: false,
              completedAt: null,
            },
          ],
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          totalItems: 1,
          completedItems: 1,
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
          ],
        }),
      } as unknown as Response);

    render(<MarkAsReadButton courseId="course-1" wikiSlug="intro" />);

    const user = userEvent.setup();

    const button = await screen.findByRole("button", {
      name: "Маркирай като прочетено",
    });

    await user.click(button);

    expect(await screen.findByText("Прочетено")).toBeInTheDocument();

    expect(
      await screen.findByRole("link", { name: "Certificate" }),
    ).toHaveAttribute("href", "/my-courses/course-1/certificate");
  });
});
