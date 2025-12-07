import { render, screen, waitFor } from "@testing-library/react";
import AdminLayout from "../layout";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
      prefetch: jest.fn(),
    }),
  };
});

describe("AdminLayout", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
  });

  it("renders admin content for admin user", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "admin-id",
        email: "admin@example.com",
        createdAt: "2024-01-01T00:00:00.000Z",
        role: "admin",
      }),
    } as unknown as Response);

    render(
      <AdminLayout>
        <div>Admin content</div>
      </AdminLayout>,
    );

    await waitFor(() => {
      expect(screen.getByText("Admin content")).toBeInTheDocument();
    });
    expect(
      screen.queryByText("Нямате достъп до Admin зоната"),
    ).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to login when token is missing", async () => {
    global.fetch = jest.fn();

    render(
      <AdminLayout>
        <div>Admin content</div>
      </AdminLayout>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("shows Access denied page for non-admin user", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "user-id",
        email: "user@example.com",
        createdAt: "2024-01-01T00:00:00.000Z",
        role: "user",
      }),
    } as unknown as Response);

    render(
      <AdminLayout>
        <div>Admin content</div>
      </AdminLayout>,
    );

    expect(
      await screen.findByText("Нямате достъп до Admin зоната"),
    ).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
