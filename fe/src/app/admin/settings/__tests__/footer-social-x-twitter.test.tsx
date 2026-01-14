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
  xLink: { enabled: boolean; url: string | null } = {
    enabled: false,
    url: null,
  },
) => ({
  branding: {
    appName: "BeeLMS",
    poweredByBeeLms: { enabled: false, url: null },
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
    footerSocialLinks: [
      {
        id: "x",
        type: "x",
        enabled: xLink.enabled,
        url: xLink.url,
      },
      {
        id: "facebook",
        type: "facebook",
        enabled: false,
        url: null,
      },
    ],
  },
  features: {
    themeLight: true,
    themeDark: true,
    themeModeSelector: true,
  },
});

describe("Admin Settings – Footer & Social Links (X/Twitter)", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  const getXUrlInput = () => {
    const xSwitch = screen.getByRole("switch", {
      name: "Footer social x enabled",
    });

    let node: HTMLElement | null = xSwitch;
    while (node) {
      const input = within(node).queryByPlaceholderText("https://...");
      if (input) return input as HTMLInputElement;
      node = node.parentElement;
    }

    throw new Error("X URL input not found");
  };

  it("(X-F1) Toggle + URL input reflects server values", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () =>
        createMockSettingsResponse({
          enabled: true,
          url: "https://x.com/example-handle",
        }),
    });

    await renderAndOpenFooter();

    const xSwitch = screen.getByRole("switch", {
      name: "Footer social x enabled",
    });
    expect(xSwitch).toHaveAttribute("aria-checked", "true");

    const urlInput = getXUrlInput();
    expect(urlInput).toHaveValue("https://x.com/example-handle");
  });

  it("(X-F2) Inline validation: URL must be x.com or twitter.com", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        createMockSettingsResponse({ enabled: true, url: null }),
    });

    const { user } = await renderAndOpenFooter();

    const urlInput = getXUrlInput();

    // Type invalid URL
    await user.clear(urlInput);
    await user.type(urlInput, "https://malicious-site.com/fake-x");

    // Check for validation error
    await waitFor(() => {
      const errorMessage = screen.getByText(
        /URL трябва да е към x\.com или twitter\.com/i,
      );
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it("(X-F3) Save sends payload with footerSocialLinks; verify PATCH body", async () => {
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
    const xSwitch = screen.getByRole("switch", {
      name: "Footer social x enabled",
    });
    await user.click(xSwitch);

    const urlInput = getXUrlInput();
    await user.clear(urlInput);
    await user.type(urlInput, "https://x.com/updated-handle");

    // Click Save button
    const saveButton = screen.getByRole("button", { name: /запази/i });
    await user.click(saveButton);

    // Verify fetch call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/admin/settings",
        expect.objectContaining({
          method: "PATCH",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
          body: expect.stringContaining('"footerSocialLinks"'),
        }),
      );
    });
  });
});
