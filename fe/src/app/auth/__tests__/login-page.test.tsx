import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "../login/page";
import { ACCESS_TOKEN_KEY } from "../../auth-token";
import type { SocialOAuthAuthorizeError } from "../social-login";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams = "lang=bg";

const startGoogleOAuth = jest.fn();
const startFacebookOAuth = jest.fn();
const startGithubOAuth = jest.fn();
const startLinkedinOAuth = jest.fn();

let mockPublicSettings: {
  features: {
    socialGoogle: boolean;
    socialFacebook: boolean;
    socialGithub: boolean;
    socialLinkedin: boolean;
  };
} | null = {
  features: {
    socialGoogle: true,
    socialFacebook: true,
    socialGithub: true,
    socialLinkedin: true,
  },
};

jest.mock("../social-login", () => {
  const actualSocialLogin = jest.requireActual("../social-login");
  return {
    ...actualSocialLogin,
    startGoogleOAuth: (...args: unknown[]) => startGoogleOAuth(...args),
    startFacebookOAuth: (...args: unknown[]) => startFacebookOAuth(...args),
    startGithubOAuth: (...args: unknown[]) => startGithubOAuth(...args),
    startLinkedinOAuth: (...args: unknown[]) => startLinkedinOAuth(...args),
  };
});

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

jest.mock("../../_hooks/use-public-settings", () => ({
  usePublicSettings: () => ({
    settings: mockPublicSettings,
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

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
    mockPublicSettings = {
      features: {
        socialGoogle: true,
        socialFacebook: true,
        socialGithub: true,
        socialLinkedin: true,
      },
    };
  });

  it("starts LinkedIn OAuth when LinkedIn button is clicked", async () => {
    mockSearchParams = "lang=bg&redirect=/home";
    render(<LoginPage />);

    const linkedinButton = await screen.findByRole("button", {
      name: /linkedin/i,
    });

    fireEvent.click(linkedinButton);

    await waitFor(() => {
      expect(startLinkedinOAuth).toHaveBeenCalledWith({
        redirectPath: "/home",
      });
    });
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
      name: /google/i,
    });

    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(startGoogleOAuth).toHaveBeenCalledWith({
        redirectPath: "/courses",
      });
    });
  });

  it("starts Facebook OAuth when Facebook button is clicked", async () => {
    mockSearchParams = "lang=bg&redirect=/profile";
    render(<LoginPage />);

    const facebookButton = await screen.findByRole("button", {
      name: /facebook/i,
    });

    fireEvent.click(facebookButton);

    await waitFor(() => {
      expect(startFacebookOAuth).toHaveBeenCalledWith({
        redirectPath: "/profile",
      });
      expect(
        screen.getByRole("button", { name: "Свързване..." }),
      ).toBeInTheDocument();
    });
  });

  it("starts GitHub OAuth when GitHub button is clicked", async () => {
    mockSearchParams = "lang=bg&redirect=/dashboard";
    render(<LoginPage />);

    const githubButton = await screen.findByRole("button", {
      name: /github/i,
    });

    fireEvent.click(githubButton);

    await waitFor(() => {
      expect(startGithubOAuth).toHaveBeenCalledWith({
        redirectPath: "/dashboard",
      });
      expect(
        screen.getByRole("button", { name: "Свързване..." }),
      ).toBeInTheDocument();
    });
  });

  it("shows social unavailable message when all providers disabled", async () => {
    mockPublicSettings = {
      features: {
        socialGoogle: false,
        socialFacebook: false,
        socialGithub: false,
        socialLinkedin: false,
      },
    };

    render(<LoginPage />);

    expect(
      await screen.findByText(
        "Социалните входове са изключени от администратора. Продължете с имейл и парола.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /Вход с/ }),
    ).not.toBeInTheDocument();
  });

  it("shows disabled message when backend returns disabled error", async () => {
    const error = new Error("disabled") as SocialOAuthAuthorizeError;
    error.provider = "google";
    error.code = "disabled";
    error.name = "SocialOAuthAuthorizeError";
    startGoogleOAuth.mockRejectedValueOnce(error);

    render(<LoginPage />);

    const googleButton = await screen.findByRole("button", {
      name: "Вход с Google",
    });
    fireEvent.click(googleButton);

    expect(
      await screen.findByText(
        "Входът с Google е временно изключен от администратора.",
      ),
    ).toBeInTheDocument();
  });
});
