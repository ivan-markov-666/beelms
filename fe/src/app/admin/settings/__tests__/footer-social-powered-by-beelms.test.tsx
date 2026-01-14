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

// Helper function to render and open Footer accordion
const renderAndOpenFooter = async () => {
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

// Mock settings response
const createMockSettingsResponse = (
  poweredByBeeLms: { enabled: boolean; url: string | null } = {
    enabled: false,
    url: null,
  },
) => ({
  branding: {
    appName: "BeeLMS",
    poweredByBeeLms,
    faviconUrl: null,
    logoUrl: null,
    logoLightUrl: null,
    logoDarkUrl: null,
    fontUrl: null,
    fontUrlByLang: {},
    fontLicenseUrl: null,
    cursorUrl: null,
    cursorLightUrl: null,
    cursorDarkUrl: null,
    cursorHotspot: { x: 8, y: 8 },
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
});

describe("Admin Settings – Footer & Social Links (Powered by BeeLMS)", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  const getPoweredByUrlInput = () => {
    const poweredBySwitch = screen.getByRole("switch", {
      name: "Powered by BeeLMS enabled",
    });

    let node: HTMLElement | null = poweredBySwitch;
    while (node) {
      const input = within(node).queryByPlaceholderText("https://beelms.com");
      if (input) return input as HTMLInputElement;
      node = node.parentElement;
    }

    throw new Error("Powered by URL input not found");
  };

  it("(PB-F1) Toggle + URL input reflect server values", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () =>
        createMockSettingsResponse({
          enabled: true,
          url: "https://example.com/custom-link",
        }),
    });

    await renderAndOpenFooter();

    const poweredBySwitch = screen.getByRole("switch", {
      name: "Powered by BeeLMS enabled",
    });
    expect(poweredBySwitch).toHaveAttribute("aria-checked", "true");

    const urlInput = getPoweredByUrlInput();
    expect(urlInput).toHaveValue("https://example.com/custom-link");
  });

  it("(PB-F2) Client-side URL validation shows inline error for invalid schemes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        createMockSettingsResponse({ enabled: true, url: null }),
    });

    const { user } = await renderAndOpenFooter();

    // Type invalid URL
    const urlInput = getPoweredByUrlInput();
    await user.clear(urlInput);
    await user.type(urlInput, "javascript:alert(1)");

    // Check for validation error
    await waitFor(() => {
      const errorMessage = screen.getByText(
        /Невалиден URL\. Използвай http:\/\/ или https:\/\//i,
      );
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it("(PB-F3) Save sends payload with poweredByBeeLms; verify PATCH body", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({ enabled: false, url: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const { user } = await renderAndOpenFooter();

    // Enable toggle and set URL
    const poweredBySwitch = screen.getByRole("switch", {
      name: "Powered by BeeLMS enabled",
    });
    await user.click(poweredBySwitch);

    const urlInput = getPoweredByUrlInput();
    await user.clear(urlInput);
    await user.type(urlInput, "https://example.com/updated-link");

    // Click Save button
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
          body: expect.stringContaining('"poweredByBeeLms"'),
        }),
      );
    });
  });

  it("(PB-F6) Error path (400) surfaces backend message and leaves field dirty", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({ enabled: false, url: null }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: "URL-ът е невалиден",
        }),
      });

    const { user } = await renderAndOpenFooter();

    // Enable toggle and type invalid URL
    const poweredBySwitch = screen.getByRole("switch", {
      name: "Powered by BeeLMS enabled",
    });
    await user.click(poweredBySwitch);

    const urlInput = getPoweredByUrlInput();
    await user.type(urlInput, "invalid-url");

    // Click Save button
    const saveButton = screen.getByRole("button", { name: /запази/i });
    await user.click(saveButton);

    // Wait for error message
    await waitFor(() => {
      const errorMessage = screen.getByText(/url-ът е невалиден/i);
      expect(errorMessage).toBeInTheDocument();
    });

    // Field should retain dirty state
    expect(urlInput).toHaveValue("invalid-url");
  });
});
