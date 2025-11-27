import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "../login/page";

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

function mockFetchOnce(data: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
  } as unknown as Response);
}

describe("LoginPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
  });

  it("renders email and password fields", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText("Имейл")).toBeInTheDocument();
    expect(screen.getByLabelText("Парола")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Вход" })).toBeInTheDocument();
  });

  it("shows validation errors and does not submit when email is invalid", async () => {
    global.fetch = jest.fn();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Имейл");
    const passwordInput = screen.getByLabelText("Парола");
    const submitButton = screen.getByRole("button", { name: "Вход" });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Моля, въведете валиден имейл адрес."),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("logs in successfully, stores token and redirects to /wiki", async () => {
    mockFetchOnce({ accessToken: "test-token", tokenType: "Bearer" }, true, 200);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Имейл");
    const passwordInput = screen.getByLabelText("Парола");
    const submitButton = screen.getByRole("button", { name: "Вход" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/wiki");
    });

    expect(window.localStorage.getItem("qa4free_access_token")).toBe(
      "test-token",
    );
  });

  it("shows error message when credentials are invalid", async () => {
    mockFetchOnce({}, false, 401);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Имейл");
    const passwordInput = screen.getByLabelText("Парола");
    const submitButton = screen.getByRole("button", { name: "Вход" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrong" } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Невалидни данни за вход."),
    ).toBeInTheDocument();
  });
});
