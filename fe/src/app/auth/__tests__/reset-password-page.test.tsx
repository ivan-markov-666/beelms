import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ResetPasswordPage from "../reset-password/page";

const mockPush = jest.fn();

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    }),
    useSearchParams: () => new URLSearchParams("token=test-token&lang=bg"),
  };
});

const defaultPublicSettingsResponse = {
  branding: { appName: "BeeLMS" },
  features: {
    wiki: true,
    wikiPublic: true,
    courses: true,
    coursesPublic: true,
    myCourses: true,
    profile: true,
    accessibilityWidget: true,
    seo: true,
    themeLight: true,
    themeDark: true,
    themeModeSelector: true,
    auth: true,
    authLogin: true,
    authRegister: true,
    captcha: false,
    captchaLogin: false,
    captchaRegister: false,
    captchaForgotPassword: false,
    captchaChangePassword: false,
    paidCourses: true,
    gdprLegal: true,
    socialGoogle: true,
    socialFacebook: true,
    socialGithub: true,
    socialLinkedin: true,
    infraRedis: false,
    infraRabbitmq: false,
    infraMonitoring: true,
    infraErrorTracking: false,
  },
  languages: { supported: ["bg"], default: "bg" },
};

function getUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return (input as Request).url;
}

function mockSettingsOnlyFetch() {
  global.fetch = jest.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = getUrl(input);
    if (url.includes("/public/settings")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => defaultPublicSettingsResponse,
      } as Response);
    }

    throw new Error(`Unexpected fetch call to ${url}`);
  });
}

function mockFetchOnce(data: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = getUrl(input);
    if (url.includes("/public/settings")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => defaultPublicSettingsResponse,
      } as Response);
    }

    if (url.includes("/auth/reset-password")) {
      return Promise.resolve({
        ok,
        status,
        json: async () => data,
      } as Response);
    }

    throw new Error(`Unexpected fetch call to ${url}`);
  });
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("shows validation errors and does not call API for invalid form", async () => {
    mockSettingsOnlyFetch();

    render(<ResetPasswordPage />);

    const newPasswordInput = await screen.findByLabelText(/Нова парола/);
    const confirmNewPasswordInput = await screen.findByLabelText(
      /Потвърди новата парола/,
    );
    const submitButton = await screen.findByRole("button", {
      name: "Смени паролата",
    });

    fireEvent.change(newPasswordInput, { target: { value: "short" } });
    fireEvent.change(confirmNewPasswordInput, {
      target: { value: "different" },
    });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Паролата трябва да е поне 8 символа."),
    ).toBeInTheDocument();
    expect(screen.getByText("Паролите не съвпадат.")).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("submits reset password successfully and redirects to login", async () => {
    mockFetchOnce({}, true, 200);

    render(<ResetPasswordPage />);

    const newPasswordInput = await screen.findByLabelText(/Нова парола/);
    const confirmNewPasswordInput = await screen.findByLabelText(
      /Потвърди новата парола/,
    );
    const submitButton = await screen.findByRole("button", {
      name: "Смени паролата",
    });

    fireEvent.change(newPasswordInput, { target: { value: "Password1234" } });
    fireEvent.change(confirmNewPasswordInput, {
      target: { value: "Password1234" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Паролата беше сменена успешно. Ще ви пренасочим към страницата за вход...",
        ),
      ).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith("/auth/login");
      },
      { timeout: 2000 },
    );

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("shows a CTA button to go to login immediately after successful reset", async () => {
    mockFetchOnce({}, true, 200);

    render(<ResetPasswordPage />);

    const newPasswordInput = await screen.findByLabelText(/Нова парола/);
    const confirmNewPasswordInput = await screen.findByLabelText(
      /Потвърди новата парола/,
    );
    const submitButton = await screen.findByRole("button", {
      name: "Смени паролата",
    });

    fireEvent.change(newPasswordInput, { target: { value: "Password1234" } });
    fireEvent.change(confirmNewPasswordInput, {
      target: { value: "Password1234" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Паролата беше сменена успешно. Ще ви пренасочим към страницата за вход...",
        ),
      ).toBeInTheDocument();
    });

    const ctaButton = screen.getByRole("button", {
      name: "Към страницата за вход",
    });
    fireEvent.click(ctaButton);

    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });

  it("shows error message when API returns 400 for invalid or expired token", async () => {
    mockFetchOnce({}, false, 400);

    render(<ResetPasswordPage />);

    const newPasswordInput = await screen.findByLabelText(/Нова парола/);
    const confirmNewPasswordInput = await screen.findByLabelText(
      /Потвърди новата парола/,
    );
    const submitButton = await screen.findByRole("button", {
      name: "Смени паролата",
    });

    fireEvent.change(newPasswordInput, { target: { value: "Password1234" } });
    fireEvent.change(confirmNewPasswordInput, {
      target: { value: "Password1234" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Линкът за смяна на паролата е невалиден или е изтекъл. Моля, заявете нов линк от екрана 'Забравена парола'.",
        ),
      ).toBeInTheDocument();
    });

    const forgotPasswordButton = screen.getByRole("button", {
      name: /Към екрана .*Забравена парола/i,
    });
    fireEvent.click(forgotPasswordButton);

    expect(mockPush).toHaveBeenCalledWith("/auth/forgot-password");

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("shows generic error message when server returns 5xx", async () => {
    mockFetchOnce({}, false, 500);

    render(<ResetPasswordPage />);

    const newPasswordInput = await screen.findByLabelText(/Нова парола/);
    const confirmNewPasswordInput = await screen.findByLabelText(
      /Потвърди новата парола/,
    );
    const submitButton = await screen.findByRole("button", {
      name: "Смени паролата",
    });

    fireEvent.change(newPasswordInput, { target: { value: "Password1234" } });
    fireEvent.change(confirmNewPasswordInput, {
      target: { value: "Password1234" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Смяната на паролата не успя. Моля, опитайте отново по-късно.",
        ),
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
