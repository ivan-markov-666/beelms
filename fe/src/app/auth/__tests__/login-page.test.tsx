import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "../login/page";
import { ACCESS_TOKEN_KEY } from "../../auth-token";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams = "lang=bg";

const startGoogleOAuth = jest.fn();
const startFacebookOAuth = jest.fn();
const startGithubOAuth = jest.fn();
const startLinkedinOAuth = jest.fn();

jest.mock("../social-login", () => ({
  DEFAULT_SOCIAL_REDIRECT: "/wiki",
  normalizeSocialRedirectPath:
    jest.requireActual("../social-login").normalizeSocialRedirectPath,
  startGoogleOAuth: (...args: unknown[]) => startGoogleOAuth(...args),
  startFacebookOAuth: (...args: unknown[]) => startFacebookOAuth(...args),
  startGithubOAuth: (...args: unknown[]) => startGithubOAuth(...args),
  startLinkedinOAuth: (...args: unknown[]) => startLinkedinOAuth(...args),
}));

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
      prefetch: jest.fn(),
    }),
    useSearchParams: () => new URLSearchParams(mockSearchParams),
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
    mockSearchParams = "lang=bg";
  });

  it("starts LinkedIn OAuth when LinkedIn button is clicked", async () => {
    mockSearchParams = "lang=bg&redirect=/home";
    render(<LoginPage />);

    const linkedinButton = await screen.findByRole("button", {
      name: "Вход с LinkedIn",
    });

    fireEvent.click(linkedinButton);

    await waitFor(() => {
      expect(startLinkedinOAuth).toHaveBeenCalledWith({
        redirectPath: "/home",
      });
    });
    expect(
      screen.getByRole("button", { name: "Свързване..." }),
    ).toBeInTheDocument();
  });

  it("renders email and password fields", async () => {
    render(<LoginPage />);

    expect(await screen.findByLabelText("Имейл")).toBeInTheDocument();
    expect(await screen.findByLabelText(/Парола/)).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Вход" }),
    ).toBeInTheDocument();
  });

  it("shows validation errors and does not submit when email is invalid", async () => {
    global.fetch = jest.fn();
    render(<LoginPage />);

    const emailInput = await screen.findByLabelText("Имейл");
    const passwordInput = await screen.findByLabelText(/Парола/);
    const submitButton = await screen.findByRole("button", { name: "Вход" });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Моля, въведете валиден имейл адрес."),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("logs in successfully, stores token and redirects to /wiki", async () => {
    mockFetchOnce(
      { accessToken: "test-token", tokenType: "Bearer" },
      true,
      200,
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Имейл");
    const passwordInput = screen.getByLabelText(/Парола/);
    const submitButton = screen.getByRole("button", { name: "Вход" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/wiki");
    });

    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("test-token");
  });

  it("shows error message when credentials are invalid", async () => {
    mockFetchOnce({}, false, 401);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Имейл");
    const passwordInput = screen.getByLabelText(/Парола/);
    const submitButton = screen.getByRole("button", { name: "Вход" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrong" } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Невалидни данни за вход."),
    ).toBeInTheDocument();
  });

  it("starts Google OAuth when Google button is clicked", async () => {
    mockSearchParams = "lang=bg&redirect=/courses";
    render(<LoginPage />);

    const googleButton = await screen.findByRole("button", {
      name: "Вход с Google",
    });

    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(startGoogleOAuth).toHaveBeenCalledWith({
        redirectPath: "/courses",
      });
    });
    expect(
      screen.getByRole("button", { name: "Свързване..." }),
    ).toBeInTheDocument();
  });

  it("starts Facebook OAuth when Facebook button is clicked", async () => {
    mockSearchParams = "lang=bg&redirect=/profile";
    render(<LoginPage />);

    const facebookButton = await screen.findByRole("button", {
      name: "Вход с Facebook",
    });

    fireEvent.click(facebookButton);

    await waitFor(() => {
      expect(startFacebookOAuth).toHaveBeenCalledWith({
        redirectPath: "/profile",
      });
    });
    expect(
      screen.getByRole("button", { name: "Свързване..." }),
    ).toBeInTheDocument();
  });

  it("starts GitHub OAuth when GitHub button is clicked", async () => {
    mockSearchParams = "lang=bg&redirect=/dashboard";
    render(<LoginPage />);

    const githubButton = await screen.findByRole("button", {
      name: "Вход с GitHub",
    });

    fireEvent.click(githubButton);

    await waitFor(() => {
      expect(startGithubOAuth).toHaveBeenCalledWith({
        redirectPath: "/dashboard",
      });
    });
    expect(
      screen.getByRole("button", { name: "Свързване..." }),
    ).toBeInTheDocument();
  });
});
