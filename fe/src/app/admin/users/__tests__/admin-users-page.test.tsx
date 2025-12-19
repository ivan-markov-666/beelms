import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as nextNavigation from "next/navigation";
import AdminUsersPage from "../page";
import { ACCESS_TOKEN_KEY } from "../../../auth-token";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

const useSearchParamsMock = nextNavigation.useSearchParams as jest.Mock;

function makeSearchParams(query: string) {
  return new URLSearchParams(query) as unknown as URLSearchParams;
}

function mockFetchSequence(
  responses: Array<{
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
  }>,
) {
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
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

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
      {
        ok: true,
        status: 200,
        json: async () => ({
          totalUsers: 1,
          activeUsers: 1,
          deactivatedUsers: 0,
          adminUsers: 1,
        }),
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
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchSequence([
      {
        ok: true,
        status: 200,
        json: async () => [],
      },
      {
        ok: true,
        status: 200,
        json: async () => ({
          totalUsers: 0,
          activeUsers: 0,
          deactivatedUsers: 0,
          adminUsers: 0,
        }),
      },
    ]);

    render(<AdminUsersPage />);

    expect(
      await screen.findByText("Няма потребители за показване."),
    ).toBeInTheDocument();
  });

  it("shows error message when API call fails", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchSequence([
      {
        ok: false,
        status: 500,
        json: async () => [],
      },
      {
        ok: true,
        status: 200,
        json: async () => ({
          totalUsers: 0,
          activeUsers: 0,
          deactivatedUsers: 0,
          adminUsers: 0,
        }),
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
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    const fetchMock = jest
      .fn()
      // initial users list
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as unknown as Response)
      // stats
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          totalUsers: 0,
          activeUsers: 0,
          deactivatedUsers: 0,
          adminUsers: 0,
        }),
      } as unknown as Response)
      // filtered users list
      .mockResolvedValueOnce({
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
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

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
      // stats GET
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          totalUsers: 1,
          activeUsers: 1,
          deactivatedUsers: 0,
          adminUsers: 1,
        }),
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

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("/admin/users/1"),
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("shows error and rolls back when toggle request fails", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

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
      // stats GET
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          totalUsers: 1,
          activeUsers: 1,
          deactivatedUsers: 0,
          adminUsers: 1,
        }),
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

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("calls API with status filter when status dropdown changes", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    const fetchMock = jest
      .fn()
      // initial users list
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as unknown as Response)
      // stats
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          totalUsers: 0,
          activeUsers: 0,
          deactivatedUsers: 0,
          adminUsers: 0,
        }),
      } as unknown as Response)
      // users list with status filter
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as unknown as Response);

    global.fetch = fetchMock;

    render(<AdminUsersPage />);

    await screen.findByText("Admin Users");

    const statusSelect = await screen.findByDisplayValue("All Status");
    fireEvent.change(statusSelect, { target: { value: "active" } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringContaining("status=active"),
        expect.any(Object),
      );
    });
  });

  it("calls API with role filter when role dropdown changes", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    const fetchMock = jest
      .fn()
      // initial users list
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as unknown as Response)
      // stats
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          totalUsers: 0,
          activeUsers: 0,
          deactivatedUsers: 0,
          adminUsers: 0,
        }),
      } as unknown as Response)
      // users list with role filter
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as unknown as Response);

    global.fetch = fetchMock;

    render(<AdminUsersPage />);

    await screen.findByText("Admin Users");

    const roleSelect = await screen.findByDisplayValue("All Roles");
    fireEvent.change(roleSelect, { target: { value: "admin" } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringContaining("role=admin"),
        expect.any(Object),
      );
    });
  });

  it("renders avatar initials, ID and View action in the table", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchSequence([
      {
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "1",
            email: "john.doe@example.com",
            role: "admin",
            active: true,
            createdAt: "2025-11-25T00:00:00.000Z",
          },
        ],
      },
      {
        ok: true,
        status: 200,
        json: async () => ({
          totalUsers: 1,
          activeUsers: 1,
          deactivatedUsers: 0,
          adminUsers: 1,
        }),
      },
    ]);

    const alertSpy = jest
      .spyOn(window, "alert")
      .mockImplementation(() => undefined);

    render(<AdminUsersPage />);

    expect(await screen.findByText("john.doe@example.com")).toBeInTheDocument();

    // Avatar initials derived from local part of email
    expect(screen.getByText("JD")).toBeInTheDocument();

    // ID label under the email
    expect(screen.getByText("ID: 1")).toBeInTheDocument();

    const viewButton = screen.getByRole("button", { name: "View" });
    fireEvent.click(viewButton);

    expect(alertSpy).toHaveBeenCalledTimes(1);
    alertSpy.mockRestore();
  });
});
