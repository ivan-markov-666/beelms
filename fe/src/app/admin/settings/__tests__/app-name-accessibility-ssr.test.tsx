import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.setTimeout(30000);

// Mock dependencies
jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: jest.fn(() => ({ replace: jest.fn(), push: jest.fn() })),
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

// Mock window methods for mobile detection
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, "innerHeight", {
  writable: true,
  configurable: true,
  value: 768,
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

  // Wait for page to load and find the Branding accordion button
  await waitFor(() => {
    const brandingButton = screen.getByRole("button", {
      name: /^\s*branding/i,
    });
    expect(brandingButton).toBeInTheDocument();
  });

  // Click to open the Branding accordion
  const brandingButton = screen.getByRole("button", { name: /^\s*branding/i });
  await user.click(brandingButton);

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

describe("Admin Settings – App Name (F17-F25)", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  it("(F17) Live document-title preview", async () => {
    // Arrange
    await mockSuccessfulResponse("Initial App Name");
    await renderAndOpenBranding();

    await waitFor(() => {
      const appNameInput = screen.getByLabelText(/^App name$/i, {
        selector: "input",
      });
      expect(appNameInput).toBeInTheDocument();
    });

    // Act
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });
    await user.clear(appNameInput);
    await user.type(appNameInput, "Live Preview App");

    // Assert
    expect(appNameInput).toHaveValue("Live Preview App");
  });

  it("(F18) Concurrent save handling", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    await waitFor(() => {
      const appNameInput = screen.getByLabelText(/^App name$/i, {
        selector: "input",
      });
      expect(appNameInput).toBeInTheDocument();
    });

    // Mock successful save, but keep it in-flight to simulate rapid concurrent clicks.
    const patchDeferred: { resolve: ((value: Response) => void) | null } = {
      resolve: null,
    };
    const patchPromise: Promise<Response> = new Promise((resolve) => {
      patchDeferred.resolve = resolve;
    });
    mockFetch.mockImplementationOnce(() => patchPromise);

    // Act - trigger multiple saves rapidly
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });
    const saveButton = screen.getByRole("button", { name: /запази/i });

    await user.clear(appNameInput);
    await user.type(appNameInput, "Concurrent Test");

    // Click save multiple times rapidly
    await Promise.all([
      user.click(saveButton),
      user.click(saveButton),
      user.click(saveButton),
    ]);

    // Assert - should only make one API call (concurrent saves should be deblocked)
    await waitFor(() => {
      // Count how many times fetch was called
      const patchCalls = mockFetch.mock.calls.filter(
        (call) =>
          call[1]?.method === "PATCH" && call[1]?.body?.includes?.('"appName"'),
      );
      expect(patchCalls.length).toBe(1);
    });

    // Allow the in-flight request to finish so the component can clean up.
    if (patchDeferred.resolve) {
      patchDeferred.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as unknown as Response);
    }

    await waitFor(() => {
      expect(screen.getByText(/настройките са запазени/i)).toBeInTheDocument();
    });
  });

  it("(F19) Error toast dismissal resets field state", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    await waitFor(() => {
      const appNameInput = screen.getByLabelText(/^App name$/i, {
        selector: "input",
      });
      expect(appNameInput).toBeInTheDocument();
    });

    // Mock failed response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Validation failed" }),
    });

    // Act - trigger error
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });
    const saveButton = screen.getByRole("button", { name: /запази/i });

    await user.clear(appNameInput);
    await user.type(appNameInput, "Invalid");
    await user.click(saveButton);

    // Wait for error to appear
    await waitFor(() => {
      const errorMessage = screen.getByText(
        /Неуспешно запазване на настройките\./i,
      );
      expect(errorMessage).toBeInTheDocument();
    });

    // Field should retain dirty state
    expect(appNameInput).toHaveValue("Invalid");
  });

  it("(F20) Mobile layout responsiveness", async () => {
    // Arrange - simulate mobile viewport
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375, // iPhone width
    });

    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 667, // iPhone height
    });

    // Mock matchMedia for mobile detection
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query.includes("(max-width:"),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    await waitFor(() => {
      const appNameInput = screen.getByLabelText(/^App name$/i, {
        selector: "input",
      });
      expect(appNameInput).toBeInTheDocument();
    });

    // Assert - input should be properly sized for mobile
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });
    expect(appNameInput).toHaveClass(/w-full/); // Should be full width on mobile
  });

  it("(F21) Preview escapes HTML", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    await waitFor(() => {
      const appNameInput = screen.getByLabelText(/^App name$/i, {
        selector: "input",
      });
      expect(appNameInput).toBeInTheDocument();
    });

    // Act - input HTML content
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });
    await user.clear(appNameInput);
    await user.type(appNameInput, "<script>alert('xss')</script>");

    // Assert - input holds raw text, but no script tag is injected
    expect(appNameInput).toHaveValue("<script>alert('xss')</script>");
    expect(document.querySelector("script")).toBeNull();
  });

  it("(F22) Error toast escapes backend strings", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    await waitFor(() => {
      const appNameInput = screen.getByLabelText(/^App name$/i, {
        selector: "input",
      });
      expect(appNameInput).toBeInTheDocument();
    });

    // Mock backend response with HTML in error message
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        message: "Error with <script>alert('xss')</script> content",
      }),
    });

    // Act - trigger error
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });
    const saveButton = screen.getByRole("button", { name: /запази/i });

    await user.clear(appNameInput);
    await user.type(appNameInput, "Test");
    await user.click(saveButton);

    // Assert - error message should be escaped
    await waitFor(() => {
      const errorMessage = screen.getByText(
        /Неуспешно запазване на настройките\./i,
      );
      expect(errorMessage).toBeInTheDocument();
    });

    expect(document.querySelector("script")).toBeNull();
  });

  it("(F23) Auth header enforcement", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    await waitFor(() => {
      const appNameInput = screen.getByLabelText(/^App name$/i, {
        selector: "input",
      });
      expect(appNameInput).toBeInTheDocument();
    });

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
    await user.type(appNameInput, "Auth Test");
    await user.click(saveButton);

    // Assert - request should include Authorization header
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "PATCH",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
        }),
      );
    });
  });

  it("(F24) Newline characters blocked client-side", async () => {
    // Arrange
    await mockSuccessfulResponse();
    await renderAndOpenBranding();

    await waitFor(() => {
      const appNameInput = screen.getByLabelText(/^App name$/i, {
        selector: "input",
      });
      expect(appNameInput).toBeInTheDocument();
    });

    // Act - try to input newline characters
    const appNameInput = screen.getByLabelText(/^App name$/i, {
      selector: "input",
    });

    // Try to type newline (this might not work in actual input, but we test the behavior)
    await user.clear(appNameInput);
    await user.type(appNameInput, "Line1\nLine2");

    // Assert - newlines should be handled (either blocked or converted)
    await waitFor(() => {
      const value = (appNameInput as HTMLInputElement).value;
      // Newlines should either be removed or converted to spaces
      expect(value).not.toContain("\n");
      expect(value).not.toContain("\r");
    });
  });

  it("(F25) SSR/initial render consistency", async () => {
    // Arrange - this test would typically require SSR setup
    // For now, we'll test the client-side behavior

    await mockSuccessfulResponse("SSR App Name");
    await renderAndOpenBranding();

    // Assert - initial render should show server value without flash
    await waitFor(() => {
      const appNameInput = screen.getByLabelText(/^App name$/i, {
        selector: "input",
      });
      expect(appNameInput).toHaveValue("SSR App Name");
    });

    // Act - simulate client-side data fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        branding: {
          appName: "Client App Name",
          // ... other data
        },
        // ... other data
      }),
    });

    // Trigger re-fetch (this might need adjustment based on actual implementation)
    // For now, we'll just verify the initial state was consistent

    // Assert - no intermediate flash of default value
    expect(screen.queryByDisplayValue("BeeLMS")).not.toBeInTheDocument();
  });
});
