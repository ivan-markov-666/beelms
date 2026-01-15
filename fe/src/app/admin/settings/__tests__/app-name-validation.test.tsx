import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.setTimeout(30000);

// Mock dependencies
const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: () => mockRouter,
  };
});

jest.mock("../../../auth-token", () => ({
  getAccessToken: jest.fn(() => "mock-token"),
}));

jest.mock("../../../api-url", () => ({
  getApiBaseUrl: jest.fn(() => "http://localhost:3000"),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

// Helper function to render the AdminSettingsPage
const renderAdminSettingsPage = async () => {
  const AdminSettingsPage = (await import("../page")).default;

  return render(<AdminSettingsPage />);
};

// Helper function to render and open Branding accordion
const renderAndOpenBranding = async () => {
  const user = userEvent.setup();
  const renderResult = await renderAdminSettingsPage();

  // Wait for main settings fetch to complete by waiting for Branding heading
  const brandingHeading = await screen.findByRole("heading", {
    name: /branding/i,
  });
  const brandingAccordion = brandingHeading.closest("button");
  if (!brandingAccordion) {
    throw new Error("Branding accordion button not found");
  }
  await user.click(brandingAccordion);

  // Wait for the App name input to become visible
  await waitFor(() => {
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });
    expect(appNameInput).toBeInTheDocument();
  });

  return { ...renderResult, user };
};

// Helper to mock successful API response
const mockSuccessfulResponse = (appName = "BeeLMS") => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      branding: {
        appName,
        browserTitle: "BeeLMS",
        loginSocialUnavailableMessageEnabled: true,
        loginSocialResetPasswordHintEnabled: true,
        registerSocialUnavailableMessageEnabled: true,
        pageLinks: {
          enabled: true,
          bySlug: {
            terms: { footer: true },
            privacy: { footer: true },
            "cookie-policy": { footer: true },
            imprint: { footer: true },
            accessibility: { footer: true },
            contact: { footer: true },
            faq: { footer: true },
            support: { footer: true },
          },
        },
        poweredByBeeLms: { enabled: false, url: null },
        cursorUrl: null,
        cursorLightUrl: null,
        cursorDarkUrl: null,
        cursorPointerUrl: null,
        cursorPointerLightUrl: null,
        cursorPointerDarkUrl: null,
        cursorHotspot: null,
        faviconUrl: null,
        googleFont: null,
        googleFontByLang: null,
        fontUrl: null,
        fontUrlByLang: null,
        footerSocialLinks: null,
        logoUrl: null,
        logoLightUrl: null,
        logoDarkUrl: null,
        primaryColor: null,
        socialImage: null,
        socialDescription: null,
        openGraph: null,
        twitter: null,
      },
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
        auth2fa: false,
        captcha: false,
        captchaLogin: false,
        captchaRegister: false,
        captchaForgotPassword: false,
        captchaChangePassword: false,
        paidCourses: true,
        paymentsStripe: true,
        paymentsPaypal: true,
        paymentsMypos: false,
        paymentsRevolut: false,
        gdprLegal: true,
        pageTerms: true,
        pagePrivacy: true,
        pageCookiePolicy: true,
        pageImprint: true,
        pageAccessibility: true,
        pageContact: true,
        pageFaq: true,
        pageSupport: true,
        pageNotFound: true,
        socialGoogle: true,
        socialFacebook: true,
        socialGithub: true,
        socialLinkedin: true,
        infraRedis: false,
        infraRedisUrl: null,
        infraRabbitmq: false,
        infraRabbitmqUrl: null,
        infraMonitoring: true,
        infraMonitoringUrl: "https://example.com/monitoring",
        infraErrorTracking: false,
        infraErrorTrackingUrl: null,
      },
      languages: {
        supported: ["bg"],
        default: "bg",
        icons: null,
        flagPicker: null,
      },
      seo: {
        baseUrl: null,
        titleTemplate: "{page} | {site}",
        defaultTitle: null,
        defaultDescription: null,
        robots: { index: true },
        sitemap: {
          enabled: true,
          includeWiki: true,
          includeCourses: true,
          includeLegal: true,
        },
      },
      socialCredentials: null,
    }),
  });
};

// Helper to mock failed API response
const mockFailedResponse = (errorMessage = "Validation failed") => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 400,
    json: async () => ({ message: errorMessage }),
  });
};

describe("Admin Settings – App Name (F1-F8)", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockFetch.mockReset();
  });

  it("(F1) Initial render reflects server value", async () => {
    // Arrange
    await mockSuccessfulResponse("Server App Name");

    // Act
    await renderAndOpenBranding();

    // Assert
    await waitFor(() => {
      const appNameInput = screen.getByLabelText(/^App name$/i, {
        selector: "input",
      });
      expect(appNameInput).toHaveValue("Server App Name");
    });
  });

  it("(F2) Client-side trimming before save", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    // Mock successful save
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Act
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });
    const saveButton = screen.getByRole("button", { name: /запази/i });

    await user.clear(appNameInput);
    await user.type(appNameInput, "  Trimmed App Name  ");
    await user.click(saveButton);

    // Assert - the trimmed value should be sent to API
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"appName":"Trimmed App Name"'),
        }),
      );
    });
  });

  it("(F3) Min length error messaging", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    // Act
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });
    await user.clear(appNameInput);
    await user.type(appNameInput, "A"); // Only 1 character (min is 2)

    // Assert
    await waitFor(() => {
      const errorMessage = screen.getByText(/поне \d+ символа/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it("(F4) Max length error", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    // Act
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });
    await user.clear(appNameInput);
    await user.type(appNameInput, "A".repeat(33)); // 33 characters (max is 32)

    // Assert
    await waitFor(() => {
      expect(appNameInput).toHaveValue("A".repeat(32));
      expect(
        screen.getByText(/characters:\s*32\s*\/\s*32/i),
      ).toBeInTheDocument();
    });
  });

  it("(F5) Invalid character rejection", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    // Act
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });
    await user.clear(appNameInput);
    await user.type(appNameInput, "Invalid\u0007Chars"); // Contains control character

    // Assert
    await waitFor(() => {
      const errorMessage = screen.getByText(
        /не може да съдържа.*control символи/i,
      );
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it("(F6) Alphanumeric requirement", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    // Act
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });
    await user.clear(appNameInput);
    await user.type(appNameInput, "--"); // Only punctuation, no alphanumeric

    // Assert
    await waitFor(() => {
      const errorMessage = screen.getByText(
        /трябва да съдържа поне една буква или цифра/i,
      );
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it("(F7) Successful save flow", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    // Mock successful save
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Act
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });
    const saveButton = screen.getByRole("button", { name: /запази/i });

    await user.clear(appNameInput);
    await user.type(appNameInput, "Valid App Name");
    await user.click(saveButton);

    // Assert
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"appName":"Valid App Name"'),
        }),
      );
    });

    // Check for success indication (could be toast, message, etc.)
    await waitFor(() => {
      expect(screen.getByText(/настройките са запазени/i)).toBeInTheDocument();
      expect(
        screen.queryByText(/неуспешно запазване на настройките\./i),
      ).not.toBeInTheDocument();
    });
  });

  it("(F8) Backend validation surfaced to UI", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    // Mock backend validation failure
    mockFailedResponse("App name contains invalid characters");

    // Act
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });
    const saveButton = screen.getByRole("button", { name: /запази/i });

    await user.clear(appNameInput);
    await user.type(appNameInput, "<script>alert(1)</script>");
    await user.click(saveButton);

    // Assert
    await waitFor(() => {
      const errorMessage = screen.getByText(
        /Неуспешно запазване на настройките\./i,
      );
      expect(errorMessage).toBeInTheDocument();
    });
  });
});
