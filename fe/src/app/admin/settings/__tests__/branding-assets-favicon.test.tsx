import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.setTimeout(30000);

// Mock dependencies
const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

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

  return { user, renderResult };
};

// Helper function to render and open Branding Assets section
const renderAndOpenBrandingAssets = async () => {
  return await renderAndOpenBranding();
};

// Mock settings response
const createMockSettingsResponse = (faviconUrl: string | null = null) => ({
  branding: {
    appName: "BeeLMS",
    browserTitle: "BeeLMS",
    faviconUrl,
    logoUrl: null,
    logoLightUrl: null,
    logoDarkUrl: null,
    googleFont: null,
    googleFontByLang: null,
    fontUrl: null,
    fontUrlByLang: {},
    fontLicenseUrl: null,
    cursorUrl: null,
    cursorLightUrl: null,
    cursorDarkUrl: null,
    cursorPointerUrl: null,
    cursorPointerLightUrl: null,
    cursorPointerDarkUrl: null,
    cursorHotspot: { x: 8, y: 8 },
    poweredByBeeLms: { enabled: false, url: null },
    footerSocialLinks: null,
    theme: {
      mode: "system",
      light: { background: "#ffffff", foreground: "#000000" },
      dark: { background: "#000000", foreground: "#ffffff" },
    },
  },
  features: {
    themeLight: true,
    themeDark: true,
    themeModeSelector: true,
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
});

describe("Admin Settings – Branding Assets (Favicon)", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  const getFaviconControlsContainer = () => {
    const uploadButton = screen.getByRole("button", {
      name: /upload favicon/i,
    });
    const container = uploadButton.parentElement;
    if (!container) throw new Error("Expected upload button container");
    return container;
  };

  const getFaviconFileInput = () => {
    // The file input is hidden, so we locate it via DOM traversal.
    const container = getFaviconControlsContainer();

    // Fallback to querySelector because the input is hidden
    const fileInput = container.querySelector(
      'input[type="file"][accept*="image"]',
    ) as HTMLInputElement | null;
    if (!fileInput) throw new Error("Favicon file input not found");
    return fileInput;
  };

  it("(FV-F1) Selecting file triggers POST to `/admin/settings/branding/favicon`", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const { user } = await renderAndOpenBrandingAssets();

    const uploadButton = screen.getByRole("button", { name: /upload favicon/i });
    expect(uploadButton).toBeInTheDocument();

    // Simulate file selection
    const fileInput = getFaviconFileInput();
    const file = new File(["content"], "favicon.ico", { type: "image/x-icon" });

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/admin/settings/branding/favicon",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
          body: expect.any(FormData),
        }),
      );
    });
  });

  it("(FV-F2) Error path displays server message", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: "Файлът е твърде голям или има невалиден формат",
        }),
      });

    const { user } = await renderAndOpenBrandingAssets();

    const fileInput = getFaviconFileInput();
    const file = new File(["content"], "favicon.ico", { type: "image/x-icon" });

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(
        screen.getByText(/файлът е твърде голям или има невалиден формат/i),
      ).toBeInTheDocument();
    });
  });

  it("(FV-F3) On success shows Favicon preview link", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: "https://cdn.example.com/favicon.ico" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse("https://cdn.example.com/favicon.ico"),
      });

    const { user } = await renderAndOpenBrandingAssets();

    const fileInput = getFaviconFileInput();
    const file = new File(["content"], "favicon.ico", { type: "image/x-icon" });

    await user.upload(fileInput, file);

    // Wait for preview link to appear
    await waitFor(() => {
      const previewLink = screen.getByRole("link", { name: /favicon preview/i });
      expect(previewLink).toHaveAttribute("href", "https://cdn.example.com/favicon.ico");
    });
  });

  it("(FV-F4) Remove clears favicon via PATCH /admin/settings", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse("https://cdn.example.com/favicon.ico"),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(null),
      });

    const { user } = await renderAndOpenBrandingAssets();

    const previewLink = screen.getByRole("link", { name: /favicon preview/i });
    expect(previewLink).toHaveAttribute("href", "https://cdn.example.com/favicon.ico");

    const removeButton = within(getFaviconControlsContainer()).getByRole(
      "button",
      { name: /^remove$/i },
    );
    await user.click(removeButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/admin/settings",
        expect.objectContaining({
          method: "PATCH",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
          body: expect.stringContaining('"faviconUrl":null'),
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: /favicon preview/i }),
      ).not.toBeInTheDocument();
    });
  });
});
