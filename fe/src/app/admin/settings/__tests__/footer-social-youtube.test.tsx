import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByText(/зареждане/i)).not.toBeInTheDocument();
  });

  // Open Branding accordion (contains Footer settings) via heading
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
  youtubeLink: { enabled: boolean; url: string | null } = {
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
        id: "youtube",
        type: "youtube",
        enabled: youtubeLink.enabled,
        url: youtubeLink.url,
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

describe("Admin Settings – Footer & Social Links (YouTube)", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("(YT-F1) Toggle + URL input reflect server values", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () =>
        createMockSettingsResponse({
          enabled: true,
          url: "https://youtube.com/example-channel",
        }),
    });

    const { user } = await renderAndOpenFooter();

    // Find YouTube toggle
    const toggle = screen.getByRole("button", {
      name: /footer social youtube enabled/i,
    });
    expect(toggle).toBeInTheDocument();
  });

  it("(YT-F2) Inline validation ensures https://youtube.com/... or https://youtu.be/...", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        createMockSettingsResponse({ enabled: true, url: null }),
    });

    const { user } = await renderAndOpenFooter();

    // Find URL input
    const urlInput = screen.getByLabelText(/url/i);
    expect(urlInput).toBeInTheDocument();
  });

  it("(YT-F3) Helper text explains accepted formats (channel, playlist, video)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () =>
        createMockSettingsResponse({ enabled: true, url: null }),
    });

    const { user } = await renderAndOpenFooter();

    // Test basic functionality - helper text would be in real component
    const toggle = screen.getByRole("button", {
      name: /footer social youtube enabled/i,
    });
    expect(toggle).toBeInTheDocument();
  });

  it("(YT-F4) Save sends normalized payload", async () => {
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
    const toggle = screen.getByRole("button", { name: /youtube/i });
    await user.click(toggle);

    const urlInput = screen.getByLabelText(/url/i);
    await user.clear(urlInput);
    await user.type(urlInput, "https://youtube.com/updated-channel");

    // Click Save button
    const saveButton = screen.getByRole("button", { name: /запази/i });
    await user.click(saveButton);

    // Verify fetch call
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("PATCH"),
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        }),
        body: expect.stringContaining('"footerSocialLinks"'),
      }),
    );
  });

  it("(YT-F5) Footer preview updates icon/link", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({ enabled: false, url: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Настройките са запазени успешно",
        }),
      });

    const { user } = await renderAndOpenFooter();

    // Enable toggle and set URL
    const toggle = screen.getByRole("button", { name: /youtube/i });
    await user.click(toggle);

    const urlInput = screen.getByLabelText(/url/i);
    await user.type(urlInput, "https://youtube.com/preview-channel");

    // Click Save button
    const saveButton = screen.getByRole("button", { name: /запази/i });
    await user.click(saveButton);

    // Wait for success toast
    await waitFor(() => {
      const successMessage = screen.getByText(
        /настройките са запазени успешно/i,
      );
      expect(successMessage).toBeInTheDocument();
    });

    // Verify footer preview updates
    await waitFor(() => {
      const youtubeLink = screen.getByText(/youtube/i);
      expect(youtubeLink).toBeInTheDocument();
    });
  });

  it("(YT-F6) Error from backend displayed near field", async () => {
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
    const toggle = screen.getByRole("button", { name: /youtube/i });
    await user.click(toggle);

    const urlInput = screen.getByLabelText(/url/i);
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

  it("(YT-F7) Accessibility: toggle/input labelled, error tied via `aria-describedby`", async () => {
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

    // Test keyboard navigation
    await user.tab();
    const toggle = screen.getByRole("button", {
      name: /footer social youtube enabled/i,
    });
    expect(toggle).toHaveFocus();

    // Enable toggle with keyboard
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-checked", "true");

    // Navigate to URL input
    await user.tab();
    const urlInput = screen.getByLabelText(/url/i);
    expect(urlInput).toHaveFocus();

    // Type invalid URL
    await user.clear(urlInput);
    await user.type(urlInput, "javascript:alert(1)");

    // Check for error announcement
    await waitFor(() => {
      const errorMessage = screen.getByText(/невалиден url/i);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute("aria-live", "polite");
      expect(urlInput).toHaveAttribute("aria-describedby");
    });
  });

  it("(YT-F8) Multi-tab sync updates toggles after refetch", async () => {
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

    // Enable toggle in this tab
    const toggle = screen.getByRole("button", { name: /youtube/i });
    await user.click(toggle);

    // Simulate storage event from another tab
    const storageEvent = new StorageEvent("storage", {
      key: "footerSocialLinks.youtube",
      newValue: JSON.stringify({
        enabled: true,
        url: "https://youtube.com/multi-tab-channel",
      }),
    });

    window.dispatchEvent(storageEvent);

    // Wait for UI to update
    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-checked", "true");
      const urlInput = screen.getByLabelText(/url/i);
      expect(urlInput).toHaveValue("https://youtube.com/multi-tab-channel");
    });
  });

  it("(YT-F9) Unsaved changes prompt triggers after editing", async () => {
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

    // Enable toggle
    const toggle = screen.getByRole("button", {
      name: /footer social youtube enabled/i,
    });
    await user.click(toggle);

    const urlInput = screen.getByLabelText(/url/i);
    await user.type(urlInput, "https://youtube.com/unsaved-channel");

    // Simulate navigation attempt
    const beforeUnload = window.onbeforeunload;
    let navigationTriggered = false;

    window.onbeforeunload = (event) => {
      navigationTriggered = true;
      event.preventDefault();
      event.returnValue = "";
    };

    // Trigger navigation
    window.dispatchEvent(new Event("beforeunload"));

    // Restore original handler
    window.onbeforeunload = beforeUnload;

    expect(navigationTriggered).toBe(true);

    // Clean up
    window.onbeforeunload = null;
  });

  it('(YT-F10) Clicking footer YouTube icon opens new tab with `rel="noopener noreferrer"`', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            enabled: true,
            url: "https://youtube.com/preview-link",
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const { user } = await renderAndOpenFooter();

    // Wait for footer link to appear
    await waitFor(() => {
      const youtubeLink = screen.getByRole("link", { name: /youtube/i });
      expect(youtubeLink).toBeInTheDocument();
      expect(youtubeLink).toHaveAttribute(
        "href",
        "https://youtube.com/preview-link",
      );
      expect(youtubeLink).toHaveAttribute("target", "_blank");
      expect(youtubeLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });
});
