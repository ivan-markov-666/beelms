import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "../register/page";
import type { SocialOAuthAuthorizeError } from "../social-login";

const mockPush = jest.fn();
const mockReplace = jest.fn();

const ORIGINAL_RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
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

function mockFetchOnce(data: unknown, ok = true, status = 201) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
  } as unknown as Response);
}

describe("RegisterPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();

    // Make tests deterministic: if NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set in the
    // environment, the form requires a captcha token and most tests will fail
    // because validation prevents submission.
    delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
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

  afterAll(() => {
    if (ORIGINAL_RECAPTCHA_SITE_KEY === undefined) {
      delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    } else {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = ORIGINAL_RECAPTCHA_SITE_KEY;
    }
  });

  it("shows validation errors and does not call API for invalid form", async () => {
    global.fetch = jest.fn();

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const submitButton = await screen.findByRole("button", {
      name: /^Регистрация$/,
    });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "short" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "different" } });
    // не маркираме Terms

    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Моля, въведете валиден имейл адрес."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Паролата трябва да е поне 8 символа дълга и да съдържа поне една главна буква, една малка буква, една цифра и един специален символ.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Паролите не съвпадат.")).toBeInTheDocument();
    expect(
      screen.getByText("Необходимо е да приемете условията."),
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits registration successfully and shows success message", async () => {
    mockFetchOnce(
      {
        id: "user-id",
        email: "user@example.com",
        createdAt: new Date().toISOString(),
      },
      true,
      201,
    );

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Регистрацията беше успешна. Моля, проверете имейла си и потвърдете адреса чрез получен линк. След това можете да влезете в акаунта си от страницата за вход.",
        ),
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("clears field errors when user starts typing", async () => {
    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    // Submit with empty email to trigger error
    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Моля, въведете имейл."),
    ).toBeInTheDocument();

    // Start typing in email field
    fireEvent.change(emailInput, { target: { value: "u" } });

    // Error should be cleared
    expect(screen.queryByText("Моля, въведете имейл.")).not.toBeInTheDocument();
  });

  it("shows duplicate email error when API returns 409", async () => {
    mockFetchOnce({ message: "Email already in use" }, false, 409);

    render(<RegisterPage />);

    const emailInput = screen.getByLabelText(/Имейл/);
    const passwordInput = screen.getByLabelText(/Парола/);
    const confirmPasswordInput = screen.getByLabelText(/Потвърди паролата/);
    const termsCheckbox = screen.getByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Този имейл вече е регистриран."),
    ).toBeInTheDocument();
  });

  it("terms checkbox toggles state correctly", async () => {
    render(<RegisterPage />);

    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });

    // Initially unchecked
    expect(termsCheckbox).not.toBeChecked();

    // Click to check
    fireEvent.click(termsCheckbox);
    expect(termsCheckbox).toBeChecked();

    // Click again to uncheck
    fireEvent.click(termsCheckbox);
    expect(termsCheckbox).not.toBeChecked();
  });

  it("shows captcha error when required but not provided", async () => {
    // Mock the environment variable
    const originalEnv = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Моля, потвърдете, че не сте робот."),
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();

    // Restore env
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = originalEnv;
  });

  it("shows validation error for password missing uppercase letter", async () => {
    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123!" },
    });
    fireEvent.click(termsCheckbox);

    fireEvent.click(submitButton);

    expect(
      screen.getByText("Паролата трябва да съдържа поне една главна буква."),
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error for password missing lowercase letter", async () => {
    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "PASSWORD123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "PASSWORD123!" },
    });
    fireEvent.click(termsCheckbox);

    fireEvent.click(submitButton);

    expect(
      screen.getByText("Паролата трябва да съдържа поне една малка буква."),
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error for password missing digit", async () => {
    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password!!!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password!!!" },
    });
    fireEvent.click(termsCheckbox);

    fireEvent.click(submitButton);

    expect(
      screen.getByText("Паролата трябва да съдържа поне една цифра."),
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error for password missing special character", async () => {
    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123" },
    });
    fireEvent.click(termsCheckbox);

    fireEvent.click(submitButton);

    expect(
      screen.getByText(
        "Паролата трябва да съдържа поне един специален символ.",
      ),
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits form when pressing Enter in last field", async () => {
    mockFetchOnce(
      {
        id: "user-id",
        email: "user@example.com",
        createdAt: new Date().toISOString(),
      },
      true,
      201,
    );

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    // Press Enter in the last field (confirm password)
    fireEvent.keyDown(confirmPasswordInput, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByText(
        "Регистрацията беше успешна. Моля, проверете имейла си и потвърдете адреса чрез получен линк. След това можете да влезете в акаунта си от страницата за вход.",
      ),
    ).toBeInTheDocument();
  });

  it("toggles password visibility when eye button is clicked", async () => {
    render(<RegisterPage />);

    const passwordInput = await screen.findByLabelText(/Парола/);
    const toggleButtons = screen.getAllByRole("button", {
      name: "Покажи паролата",
    });
    const toggleButton = toggleButtons[0]; // First toggle button is for password field

    // Initially should be password type
    expect(passwordInput).toHaveAttribute("type", "password");

    // Click to show password
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    // Click again to hide password
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("toggles confirm password visibility when eye button is clicked", async () => {
    render(<RegisterPage />);

    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const passwordInput = screen.getByLabelText(/Парола/);
    const toggleButtons = screen.getAllByRole("button", {
      name: "Покажи паролата",
    });
    const confirmToggleButton = toggleButtons[1]; // Second toggle button is for confirm password field

    // Initially should be password type
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    // Click to show confirm password
    fireEvent.click(confirmToggleButton);
    expect(confirmPasswordInput).toHaveAttribute("type", "text");
    expect(passwordInput).toHaveAttribute("type", "password"); // Other field unchanged

    // Click again to hide confirm password
    fireEvent.click(confirmToggleButton);
    expect(confirmPasswordInput).toHaveAttribute("type", "password");
  });

  it("shows API error for 400 status (invalid data)", async () => {
    mockFetchOnce({ message: "Invalid data" }, false, 400);

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    fireEvent.click(submitButton);

    expect(
      await screen.findByText(
        "Данните не са валидни. Моля, проверете формата и опитайте отново.",
      ),
    ).toBeInTheDocument();
  });

  it("shows generic error for 500 status", async () => {
    mockFetchOnce({ message: "Internal server error" }, false, 500);

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    fireEvent.click(submitButton);

    expect(
      await screen.findByText(
        "Регистрацията не успя. Моля, опитайте отново по-късно.",
      ),
    ).toBeInTheDocument();
  });

  it("shows network error on fetch failure", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(
      await screen.findByText("Възникна грешка при връзката със сървъра."),
    ).toBeInTheDocument();
  });

  describe("social registration buttons", () => {
    it("starts Google OAuth when Google button is clicked", async () => {
      mockSearchParams = "lang=bg&redirect=/wiki/article";
      render(<RegisterPage />);

      const googleButton = await screen.findByRole("button", {
        name: "Регистрация с Google",
      });

      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(startGoogleOAuth).toHaveBeenCalledWith({
          redirectPath: "/wiki/article",
        });
        expect(
          screen.getByRole("button", { name: "Свързване..." }),
        ).toBeInTheDocument();
      });
    });

    it("starts GitHub OAuth when GitHub button is clicked", async () => {
      mockSearchParams = "lang=bg&redirect=/courses/list";
      render(<RegisterPage />);

      const githubButton = await screen.findByRole("button", {
        name: "Регистрация с GitHub",
      });

      fireEvent.click(githubButton);

      await waitFor(() => {
        expect(startGithubOAuth).toHaveBeenCalledWith({
          redirectPath: "/courses/list",
        });
        expect(
          screen.getByRole("button", { name: "Свързване..." }),
        ).toBeInTheDocument();
      });
    });

    it("starts Facebook OAuth when Facebook button is clicked", async () => {
      mockSearchParams = "lang=bg&redirect=/profile/settings";
      render(<RegisterPage />);

      const facebookButton = await screen.findByRole("button", {
        name: "Регистрация с Facebook",
      });

      fireEvent.click(facebookButton);

      await waitFor(() => {
        expect(startFacebookOAuth).toHaveBeenCalledWith({
          redirectPath: "/profile/settings",
        });
        expect(
          screen.getByRole("button", { name: "Свързване..." }),
        ).toBeInTheDocument();
      });
    });

    it("starts LinkedIn OAuth when LinkedIn button is clicked", async () => {
      mockSearchParams = "lang=bg&redirect=/courses/list";
      render(<RegisterPage />);

      const linkedinButton = await screen.findByRole("button", {
        name: "Регистрация с LinkedIn",
      });

      fireEvent.click(linkedinButton);

      await waitFor(() => {
        expect(startLinkedinOAuth).toHaveBeenCalledWith({
          redirectPath: "/courses/list",
        });
        expect(
          screen.getByRole("button", { name: "Свързване..." }),
        ).toBeInTheDocument();
      });
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

    render(<RegisterPage />);

    expect(
      await screen.findByText(
        "Социалните регистрации са изключени от администратора. Продължете с формата по-долу.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /Регистрация с/ }),
    ).not.toBeInTheDocument();
  });

  it("shows disabled message when backend returns disabled error", async () => {
    const error = new Error("disabled") as SocialOAuthAuthorizeError;
    error.provider = "google";
    error.code = "disabled";
    error.name = "SocialOAuthAuthorizeError";
    startGoogleOAuth.mockRejectedValueOnce(error);

    render(<RegisterPage />);

    const googleButton = await screen.findByRole("button", {
      name: "Регистрация с Google",
    });
    fireEvent.click(googleButton);

    expect(
      await screen.findByText(
        "Регистрацията с Google е временно изключена от администратора.",
      ),
    ).toBeInTheDocument();
  });

  it("supports keyboard navigation with Tab", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    emailInput.focus();

    await user.tab();

    const passwordInput = screen.getByLabelText(/Парола/);
    expect(passwordInput).toHaveFocus();

    await user.tab();

    const confirmPasswordInput = screen.getByLabelText(/Потвърди паролата/);
    expect(confirmPasswordInput).toHaveFocus();
  });

  it("supports screen readers with proper ARIA attributes", async () => {
    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    // Initially no aria-describedby
    expect(emailInput).not.toHaveAttribute("aria-describedby");

    // Submit with invalid email to trigger error
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitButton);

    // Wait for error to appear
    await screen.findByText("Моля, въведете валиден имейл адрес.");

    // Now should have aria-describedby
    expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
  });

  it("prevents copy from password fields", async () => {
    render(<RegisterPage />);

    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);

    const preventDefaultSpy = jest.spyOn(Event.prototype, "preventDefault");
    preventDefaultSpy.mockClear();

    fireEvent.copy(passwordInput);
    fireEvent.copy(confirmPasswordInput);

    expect(preventDefaultSpy).toHaveBeenCalledTimes(2);

    preventDefaultSpy.mockRestore();
  });

  it("prevents copy from password fields", async () => {
    render(<RegisterPage />);

    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);

    const preventDefaultSpy = jest.spyOn(Event.prototype, "preventDefault");
    preventDefaultSpy.mockClear();

    fireEvent.copy(passwordInput);
    fireEvent.copy(confirmPasswordInput);

    expect(preventDefaultSpy).toHaveBeenCalledTimes(2);

    preventDefaultSpy.mockRestore();
  });

  it("resets form after successful registration", async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "123", email: "test@example.com" }),
    });

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    // Fill form
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    // Submit
    fireEvent.click(submitButton);

    // Wait for success
    await screen.findByText(/регистрацията (?:беше )?успешна/i);

    // Check form is cleared
    expect(emailInput).toHaveValue("");
    expect(passwordInput).toHaveValue("");
    expect(confirmPasswordInput).toHaveValue("");
    expect(termsCheckbox).not.toBeChecked();

    // Restore fetch
    global.fetch = originalFetch;
  });

  it("displays error messages with correct styling", async () => {
    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    // Submit with invalid data
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitButton);

    // Wait for error
    const errorMessage = await screen.findByText(
      "Моля, въведете валиден имейл адрес.",
    );

    // Check styling
    expect(errorMessage).toHaveClass("text-xs", "text-red-600");
    expect(errorMessage).toHaveAttribute("id", "email-error");
  });

  it("displays success message with correct styling", async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "123", email: "test@example.com" }),
    });

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    // Fill form
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    // Submit
    fireEvent.click(submitButton);

    // Wait for success message
    const successMessage = await screen.findByText(
      /регистрацията (?:беше )?успешна/i,
    );

    // Check styling
    expect(successMessage).toHaveClass("text-sm", "text-green-600");
    expect(successMessage).toHaveAttribute("role", "status");

    // Restore fetch
    global.fetch = originalFetch;
  });

  it("has correct browser autofill attributes", async () => {
    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);

    expect(emailInput).toHaveAttribute("autoComplete", "email");
    expect(passwordInput).toHaveAttribute("autoComplete", "new-password");
    expect(confirmPasswordInput).toHaveAttribute(
      "autoComplete",
      "new-password",
    );
  });

  it("shows password strength indicator", async () => {
    render(<RegisterPage />);

    const passwordInput = await screen.findByLabelText(/Парола/);

    // Weak password
    fireEvent.change(passwordInput, { target: { value: "123" } });
    expect(screen.getByText("Слаба парола")).toBeInTheDocument();

    // Medium password (length, uppercase, lowercase, digit - missing special)
    fireEvent.change(passwordInput, { target: { value: "Password1" } });
    expect(screen.getByText("Средна парола")).toBeInTheDocument();

    // Strong password (all criteria)
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    expect(screen.getByText("Силна парола")).toBeInTheDocument();

    // Clear password - no indicator
    fireEvent.change(passwordInput, { target: { value: "" } });
    expect(
      screen.queryByText(/Слаба|Средна|Силна парола/),
    ).not.toBeInTheDocument();
  });

  it("persists form data in localStorage", async () => {
    const mockData = {
      email: "saved@example.com",
      password: "SavedPass123!",
      confirmPassword: "SavedPass123!",
      acceptTerms: true,
    };

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn((key) =>
          key === "register-form-data" ? JSON.stringify(mockData) : null,
        ),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });

    // Wait for persistence to load
    await waitFor(() => {
      expect(emailInput).toHaveValue(mockData.email);
      expect(passwordInput).toHaveValue(mockData.password);
      expect(confirmPasswordInput).toHaveValue(mockData.confirmPassword);
      expect(termsCheckbox).toBeChecked();
    });
  });

  it("handles browser navigation with terms and privacy links", async () => {
    render(<RegisterPage />);

    const termsLink = screen.getByText(/Условия(та)? за ползване/i);
    const privacyLink = screen.getByText(/Политика за поверителност/i);

    fireEvent.click(termsLink);
    expect(mockPush).toHaveBeenCalledWith("/legal/terms");

    fireEvent.click(privacyLink);
    expect(mockPush).toHaveBeenCalledWith("/legal/privacy");
  });

  it("enforces input maxLength on password fields", async () => {
    render(<RegisterPage />);

    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);

    expect(passwordInput).toHaveAttribute("maxLength", "100");
    expect(confirmPasswordInput).toHaveAttribute("maxLength", "100");
  });

  it("prevents rapid form submissions", async () => {
    global.fetch = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Try to submit again while pending
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    // Still only one call
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("shows generic error for unexpected server status codes", async () => {
    mockFetchOnce({ message: "Internal server error" }, false, 502);

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    fireEvent.click(submitButton);

    expect(
      await screen.findByText(
        "Регистрацията не успя. Моля, опитайте отново по-късно.",
      ),
    ).toBeInTheDocument();
  });

  it("defers validation errors until submit", async () => {
    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.blur(emailInput);

    expect(
      screen.queryByText("Моля, въведете валиден имейл адрес."),
    ).not.toBeInTheDocument();

    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Моля, въведете валиден имейл адрес."),
    ).toBeInTheDocument();
  });

  it("allows copy from password fields", async () => {
    render(<RegisterPage />);

    const passwordInput = await screen.findByLabelText(/Парола/);

    fireEvent.change(passwordInput, { target: { value: "Password123!" } });

    fireEvent.copy(passwordInput);

    expect(passwordInput).toHaveValue("Password123!");
  });

  it("allows paste in password fields", async () => {
    render(<RegisterPage />);

    const passwordInput = await screen.findByLabelText(/Парола/);

    fireEvent.paste(passwordInput, {
      target: { value: "PastedPassword123!" },
    });

    expect(passwordInput).toHaveValue("PastedPassword123!");
  });

  it("disables submit button while request is pending", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    expect(submitButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(submitButton).toBeDisabled();

    expect(submitButton).toHaveTextContent("Изпращане...");

    act(() => {
      resolveFetch?.({
        ok: true,
        status: 201,
        json: async () => ({
          id: "user-id",
          email: "user@example.com",
          createdAt: new Date().toISOString(),
        }),
      } as unknown as Response);
    });

    await waitFor(() => expect(submitButton).not.toBeDisabled());
    expect(submitButton).toHaveTextContent("Регистрация");
  });

  it("redirects to login after successful registration", async () => {
    jest.useFakeTimers();
    mockFetchOnce(
      {
        id: "user-id",
        email: "user@example.com",
        createdAt: new Date().toISOString(),
      },
      true,
      201,
    );

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм с/i,
    });
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() =>
      expect(
        screen.getByText(
          "Регистрацията беше успешна. Моля, проверете имейла си и потвърдете адреса чрез получен линк. След това можете да влезете в акаунта си от страницата за вход.",
        ),
      ).toBeInTheDocument(),
    );

    act(() => {
      jest.advanceTimersByTime(13000);
    });

    expect(mockPush).toHaveBeenCalledWith("/auth/login");
    jest.useRealTimers();
  });

  it("handles network timeout during registration", async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error("Network timeout"));

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм/i,
    });
    const submitButton = await screen.findByRole("button", {
      name: /^Регистрация$/,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() =>
      expect(
        screen.getByText("Възникна грешка при връзката със сървъра."),
      ).toBeInTheDocument(),
    );

    global.fetch = originalFetch;
  });

  it("handles captcha expiry during registration", async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "captcha verification failed" }),
    });

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм/i,
    });
    const submitButton = await screen.findByRole("button", {
      name: /^Регистрация$/,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() =>
      expect(
        screen.getByText(
          "Данните не са валидни. Моля, проверете формата и опитайте отново.",
        ),
      ).toBeInTheDocument(),
    );

    global.fetch = originalFetch;
  });

  it("handles slow network during registration", async () => {
    jest.useFakeTimers();

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise(
          (resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      id: "1",
                      email: "test@example.com",
                      createdAt: new Date().toISOString(),
                      role: "user",
                    }),
                }),
              3000,
            ), // 3 second delay
        ),
    );

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText(/Имейл/);
    const passwordInput = await screen.findByLabelText(/Парола/);
    const confirmPasswordInput =
      await screen.findByLabelText(/Потвърди паролата/);
    const termsCheckbox = await screen.findByRole("checkbox", {
      name: /Съгласен съм/i,
    });
    const submitButton = await screen.findByRole("button", {
      name: /^Регистрация$/,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Check that loading state persists during slow network
    expect(submitButton).toBeDisabled();

    // Advance timers to complete the request
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() =>
      expect(
        screen.getByText(
          "Регистрацията беше успешна. Моля, проверете имейла си и потвърдете адреса чрез получен линк. След това можете да влезете в акаунта си от страницата за вход.",
        ),
      ).toBeInTheDocument(),
    );

    expect(submitButton).not.toBeDisabled();
    jest.useRealTimers();
    global.fetch = originalFetch;
  });
});
