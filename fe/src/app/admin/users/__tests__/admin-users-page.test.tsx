import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as nextNavigation from "next/navigation";
import AdminUsersPage from "../page";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

const useSearchParamsMock = nextNavigation.useSearchParams as jest.Mock;

function makeSearchParams(query: string) {
  return new URLSearchParams(query) as unknown as URLSearchParams;
}

function mockFetchSequence(responses: Array<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>) {
  global.fetch = jest
    .fn()
    .mockImplementation(() =>
      Promise.resolve(responses.shift() as unknown as Response),
    );
}

describe("AdminUsersPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));
  });

  it("renders table with admin users from API", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");

    mockFetchSequence([
      {
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "1",
            email: "admin@example.com",
            role: "admin",
            active: true,
            createdAt: "2025-11-25T00:00:00.000Z",
          },
        ],
      },
    ]);

    render(<AdminUsersPage />);

    expect(await screen.findByText("Admin Users")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
      expect(screen.getByText("admin")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Active" }),
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when there are no users", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");

    mockFetchSequence([
      {
        ok: true,
        status: 200,
        json: async () => [],
      },
    ]);

    render(<AdminUsersPage />);

    expect(
      await screen.findByText("Няма потребители за показване."),
    ).toBeInTheDocument();
  });

  it("shows error message when API call fails", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");

    mockFetchSequence([
      {
        ok: false,
        status: 500,
        json: async () => [],
      },
    ]);

    render(<AdminUsersPage />);

    expect(
      await screen.findByText(
        "Възникна грешка при зареждане на списъка с потребители.",
      ),
    ).toBeInTheDocument();
  });

  it("filters users by email when search is submitted", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");

    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    } as unknown as Response);

    global.fetch = fetchMock;

    render(<AdminUsersPage />);

    const input = await screen.findByPlaceholderText("Търсене по email...");
    fireEvent.change(input, { target: { value: "admin@example.com" } });

    const button = screen.getByRole("button", { name: "Търси" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringContaining("/admin/users?q=admin%40example.com"),
        expect.any(Object),
      );
    });
  });

  it("toggles user active flag when button is clicked", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");

    const fetchMock = jest
      .fn()
      // initial GET
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "1",
            email: "admin@example.com",
            role: "admin",
            active: true,
            createdAt: "2025-11-25T00:00:00.000Z",
          },
        ],
      } as unknown as Response)
      // PATCH
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: "1",
          email: "admin@example.com",
          role: "admin",
          active: false,
          createdAt: "2025-11-25T00:00:00.000Z",
        }),
      } as unknown as Response);

    global.fetch = fetchMock;

    render(<AdminUsersPage />);

    const toggleButton = await screen.findByRole("button", { name: "Active" });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Inactive" }),
      ).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("/admin/users/1"),
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("shows error and rolls back when toggle request fails", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");

    const fetchMock = jest
      .fn()
      // initial GET
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "1",
            email: "admin@example.com",
            role: "admin",
            active: true,
            createdAt: "2025-11-25T00:00:00.000Z",
          },
        ],
      } as unknown as Response)
      // failing PATCH
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as unknown as Response);

    global.fetch = fetchMock;

    render(<AdminUsersPage />);

    const toggleButton = await screen.findByRole("button", { name: "Active" });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Неуспешно обновяване на статуса на потребителя. Моля, опитайте отново.",
        ),
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Active" }),
      ).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
