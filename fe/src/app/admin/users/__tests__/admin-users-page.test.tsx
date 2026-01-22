import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as nextNavigation from "next/navigation";
import AdminUsersPage from "../page";
import { ACCESS_TOKEN_KEY } from "../../../auth-token";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const useRouterMock = nextNavigation.useRouter as jest.Mock;
const usePathnameMock = nextNavigation.usePathname as jest.Mock;
const useSearchParamsMock = nextNavigation.useSearchParams as jest.Mock;

function makeSearchParams(query: string) {
  return new URLSearchParams(query) as unknown as URLSearchParams;
}

function mockFetchByUrl(
  routes: Array<{
    match: string | RegExp;
    responses: Array<{
      ok: boolean;
      status: number;
      json: () => Promise<unknown>;
      headers?: Record<string, string>;
    }>;
  }>,
) {
  global.fetch = jest.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    const route = routes.find((r) =>
      typeof r.match === "string" ? url.includes(r.match) : r.match.test(url),
    );
    const next = route?.responses.shift();
    if (!next) {
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({}),
        headers: new Headers(),
      } as unknown as Response);
    }

    return Promise.resolve({
      ok: next.ok,
      status: next.status,
      json: next.json,
      headers: new Headers(next.headers ?? {}),
    } as unknown as Response);
  });
}

function getActiveToggleRegex() {
  return /(active|актив)/i;
}

function getInactiveToggleRegex() {
  return /(inactive|неактив)/i;
}

function getRoleForAriaRegex() {
  return /(role for|роля за)/i;
}

function getUsersStatusAriaRegex() {
  return /(users status|статус на потребителите)/i;
}

function getUsersRoleAriaRegex() {
  return /(users role|роля на потребителите)/i;
}

function getViewRegex() {
  return /(view|преглед)/i;
}

describe("AdminUsersPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
    useRouterMock.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
    usePathnameMock.mockReturnValue("/admin/users");
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));
  });

  it("renders table with admin users from API", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchByUrl([
      {
        match: "/users/me",
        responses: [
          { ok: true, status: 200, json: async () => ({ id: "me" }) },
        ],
      },
      {
        match: /\/admin\/users\?/i,
        responses: [
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
        ],
      },
      {
        match: "/admin/users/stats",
        responses: [
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
        ],
      },
    ]);

    render(<AdminUsersPage />);

    expect(await screen.findByText("Admin Users")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", {
          name: getRoleForAriaRegex(),
        }),
      ).toHaveValue("admin");
      expect(
        screen.getByRole("button", { name: "Active" }),
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when there are no users", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchByUrl([
      {
        match: "/users/me",
        responses: [
          { ok: true, status: 200, json: async () => ({ id: "me" }) },
        ],
      },
      {
        match: /\/admin\/users\?/i,
        responses: [{ ok: true, status: 200, json: async () => [] }],
      },
      {
        match: "/admin/users/stats",
        responses: [
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
        ],
      },
    ]);

    render(<AdminUsersPage />);

    expect(
      await screen.findByText("Няма потребители за показване."),
    ).toBeInTheDocument();
  });

  it("shows error message when API call fails", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchByUrl([
      {
        match: "/users/me",
        responses: [
          { ok: true, status: 200, json: async () => ({ id: "me" }) },
        ],
      },
      {
        match: /\/admin\/users\?/i,
        responses: [{ ok: false, status: 500, json: async () => ({}) }],
      },
      {
        match: "/admin/users/stats",
        responses: [
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
        ],
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

    mockFetchByUrl([
      {
        match: "/users/me",
        responses: [
          { ok: true, status: 200, json: async () => ({ id: "me" }) },
        ],
      },
      {
        match: /\/admin\/users\?/i,
        responses: [
          { ok: true, status: 200, json: async () => [] },
          { ok: true, status: 200, json: async () => [] },
        ],
      },
      {
        match: "/admin/users/stats",
        responses: [
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
        ],
      },
    ]);

    const fetchMock = global.fetch as unknown as jest.Mock;

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

    mockFetchByUrl([
      {
        match: "/users/me",
        responses: [
          { ok: true, status: 200, json: async () => ({ id: "me" }) },
        ],
      },
      {
        match: /\/admin\/users\?/i,
        responses: [
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
        ],
      },
      {
        match: "/admin/users/stats",
        responses: [
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
        ],
      },
      {
        match: /\/admin\/users\/1$/i,
        responses: [
          {
            ok: true,
            status: 200,
            json: async () => ({
              id: "1",
              email: "admin@example.com",
              role: "admin",
              active: false,
              createdAt: "2025-11-25T00:00:00.000Z",
            }),
          },
        ],
      },
    ]);

    render(<AdminUsersPage />);

    const toggleButton = await screen.findByRole("button", {
      name: getActiveToggleRegex(),
    });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: getInactiveToggleRegex() }),
      ).toBeInTheDocument();
    });

    const fetchMock = global.fetch as unknown as jest.Mock;
    expect(fetchMock).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("/admin/users/1"),
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("shows error and rolls back when toggle request fails", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchByUrl([
      {
        match: "/users/me",
        responses: [
          { ok: true, status: 200, json: async () => ({ id: "me" }) },
        ],
      },
      {
        match: /\/admin\/users\?/i,
        responses: [
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
        ],
      },
      {
        match: "/admin/users/stats",
        responses: [
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
        ],
      },
      {
        match: /\/admin\/users\/1$/i,
        responses: [{ ok: false, status: 500, json: async () => ({}) }],
      },
    ]);

    render(<AdminUsersPage />);

    const toggleButton = await screen.findByRole("button", {
      name: getActiveToggleRegex(),
    });
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
        screen.getByRole("button", { name: getActiveToggleRegex() }),
      ).toBeInTheDocument();
    });

    const fetchMock = global.fetch as unknown as jest.Mock;
    expect(fetchMock).toHaveBeenCalled();
  });

  it("calls API with status filter when status dropdown changes", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchByUrl([
      {
        match: "/users/me",
        responses: [
          { ok: true, status: 200, json: async () => ({ id: "me" }) },
        ],
      },
      {
        match: /\/admin\/users\?/i,
        responses: [
          { ok: true, status: 200, json: async () => [] },
          { ok: true, status: 200, json: async () => [] },
        ],
      },
      {
        match: "/admin/users/stats",
        responses: [
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
        ],
      },
    ]);

    const fetchMock = global.fetch as unknown as jest.Mock;

    render(<AdminUsersPage />);

    await screen.findByText("Admin Users");

    const statusSelect = await screen.findByRole("combobox", {
      name: getUsersStatusAriaRegex(),
    });
    await userEvent.click(statusSelect);
    await userEvent.click(
      await screen.findByRole("option", {
        name: "Active",
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringContaining("status=active"),
        expect.any(Object),
      );
    });
  });

  it("calls API with role filter when role dropdown changes", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchByUrl([
      {
        match: "/users/me",
        responses: [
          { ok: true, status: 200, json: async () => ({ id: "me" }) },
        ],
      },
      {
        match: /\/admin\/users\?/i,
        responses: [
          { ok: true, status: 200, json: async () => [] },
          { ok: true, status: 200, json: async () => [] },
        ],
      },
      {
        match: "/admin/users/stats",
        responses: [
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
        ],
      },
    ]);

    const fetchMock = global.fetch as unknown as jest.Mock;

    render(<AdminUsersPage />);

    await screen.findByText("Admin Users");

    const roleSelect = await screen.findByRole("combobox", {
      name: getUsersRoleAriaRegex(),
    });
    await userEvent.click(roleSelect);
    await userEvent.click(
      await screen.findByRole("option", {
        name: "Admin",
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringContaining("role=admin"),
        expect.any(Object),
      );
    });
  });

  it("renders avatar initials, ID and View action in the table", async () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    mockFetchByUrl([
      {
        match: "/users/me",
        responses: [
          { ok: true, status: 200, json: async () => ({ id: "me" }) },
        ],
      },
      {
        match: /\/admin\/users\?/i,
        responses: [
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
        ],
      },
      {
        match: "/admin/users/stats",
        responses: [
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
        ],
      },
    ]);

    render(<AdminUsersPage />);

    expect(await screen.findByText("john.doe@example.com")).toBeInTheDocument();

    // Avatar initials derived from local part of email
    expect(screen.getByText("JD")).toBeInTheDocument();

    // ID label under the email
    expect(screen.getByText("ID: 1")).toBeInTheDocument();

    const viewButton = screen.getByRole("button", { name: getViewRegex() });
    fireEvent.click(viewButton);

    expect(
      await screen.findByRole("dialog", { name: /данни за потребителя/i }),
    ).toBeInTheDocument();

    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
    expect(screen.getByText("User ID")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
