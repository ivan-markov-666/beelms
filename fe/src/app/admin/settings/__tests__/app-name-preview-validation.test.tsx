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

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

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
    const appNameInput = screen.getByRole("textbox", { name: /app name/i });
    expect(appNameInput).toBeInTheDocument();
  });

  return { ...renderResult, user };
};

const getAppNameInput = () => screen.getByRole("textbox", { name: /app name/i });

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

describe("Admin Settings – App Name (F9-F16)", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  it("(F9) Preview components update", async () => {
    // Arrange
    await mockSuccessfulResponse("Initial App Name");
    await renderAndOpenBranding();

    // Act
    const appNameInput = getAppNameInput();
    await user.clear(appNameInput);
    await user.type(appNameInput, "Updated App Name");

    // Assert
    expect(appNameInput).toHaveValue("Updated App Name");
  });

  it("(F10) Save persists app name via PATCH /admin/settings", async () => {
    mockFetch.mockClear();

    await mockSuccessfulResponse("BeeLMS");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...(await (async () => ({
          branding: { appName: "Updated App Name" },
        }))()),
      }),
    });

    await renderAndOpenBranding();

    const appNameInput = getAppNameInput();
    await user.clear(appNameInput);
    await user.type(appNameInput, "Updated App Name");

    const saveButton = screen.getByRole("button", { name: /запази/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/admin/settings",
        expect.objectContaining({
          method: "PATCH",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
          body: expect.stringContaining('"appName":"Updated App Name"'),
        }),
      );
    });
  });

  it("(F15) Internationalized placeholder", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    // Act & Assert - check for internationalized placeholder
    const appNameInput = getAppNameInput();

    // The placeholder should be internationalized
    expect(appNameInput).toHaveAttribute("placeholder");
    expect(appNameInput.getAttribute("placeholder")).toBeTruthy();
  });

  it("(F16) Maxlength attribute enforcement", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    // Act & Assert - check if maxlength attribute is set
    const appNameInput = getAppNameInput();

    // The input should have maxlength attribute (32 characters)
    expect(appNameInput).toHaveAttribute("maxlength", "32");

    // Test that input cannot exceed maxlength
    await user.clear(appNameInput);
    await user.type(appNameInput, "A".repeat(40)); // Try to type 40 characters

    // Should only have 32 characters
    expect(appNameInput).toHaveValue("A".repeat(32));
  });
});
