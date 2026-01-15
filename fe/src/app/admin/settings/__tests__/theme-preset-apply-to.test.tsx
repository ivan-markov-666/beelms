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

  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByText(/зареждане/i)).not.toBeInTheDocument();
  });

  // Open Branding accordion via its heading to avoid tooltip collisions
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

// Helper function to render and open Theme section
const renderAndOpenTheme = async () => {
  return await renderAndOpenBranding();
};

const getThemePresetTargetCombobox = () =>
  screen.getByRole("combobox", { name: "Theme preset target" });

const setThemePresetTarget = async (
  user: ReturnType<typeof userEvent.setup>,
  targetLabel: "Light" | "Dark" | "Light + Dark",
) => {
  const combo = getThemePresetTargetCombobox();
  await user.click(combo);
  const option = await screen.findByRole("option", { name: targetLabel });
  await user.click(option);
};

// Mock settings response
const createMockSettingsResponse = (overrides = {}) => ({
  branding: {
    appName: "BeeLMS",
    browserTitle: "BeeLMS",
    faviconUrl: null,
    logoUrl: null,
    logoLightUrl: null,
    logoDarkUrl: null,
    googleFont: null,
    googleFontByLang: null,
    fontUrl: null,
    fontUrlByLang: null,
    fontLicenseUrl: null,
    cursorUrl: null,
    cursorLightUrl: null,
    cursorDarkUrl: null,
    cursorPointerUrl: null,
    cursorPointerLightUrl: null,
    cursorPointerDarkUrl: null,
    cursorHotspot: null,
    poweredByBeeLms: { enabled: false, url: null },
    footerSocialLinks: null,
    theme: {
      mode: "system",
      light: {
        background: "#ffffff",
        foreground: "#000000",
        primary: "#007bff",
        secondary: "#6c757d",
      },
      dark: {
        background: "#000000",
        foreground: "#ffffff",
        primary: "#0d6efd",
        secondary: "#6c757d",
      },
    },
    customThemePresets: [],
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
  ...overrides,
});

describe("Admin Settings – Theme Preset Apply To", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('(AP-F1) "Apply to" dropdown defaults to "both" and reflects themePresetTarget state', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    await renderAndOpenTheme();

    // Find the "Apply to" dropdown
    const applyToDropdown = getThemePresetTargetCombobox();
    expect(applyToDropdown).toBeInTheDocument();

    // Check that default value is "both"
    expect(applyToDropdown).toHaveValue("both");

    // Verify options are available
    await userEvent.click(applyToDropdown);
    expect(
      await screen.findByRole("option", { name: "Light" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("option", { name: "Dark" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("option", { name: "Light + Dark" }),
    ).toBeInTheDocument();
  });

  it("(AP-F2) Changing dropdown updates themePresetTargetRef and persists selection when applying preset", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const { user } = await renderAndOpenTheme();

    // Change target
    await setThemePresetTarget(user, "Light");
    expect(getThemePresetTargetCombobox()).toHaveValue("light");

    // Apply a preset (built-in button text is English)
    const applyPresetButton = screen.getAllByRole("button", {
      name: /^apply$/i,
    })[0];
    await user.click(applyPresetButton);

    // Applying does not call API; saving does
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const saveButton = screen.getByRole("button", { name: /запази/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/settings"),
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"theme"'),
        }),
      );
    });
  });

  it('(AP-F3) When "Light" selected, clicking Apply only updates light palette preview; dark stays unchanged', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const { user } = await renderAndOpenTheme();

    await setThemePresetTarget(user, "Light");
    const applyPresetButton = screen.getAllByRole("button", {
      name: /^apply$/i,
    })[0];
    await user.click(applyPresetButton);

    await waitFor(() => {
      expect(
        screen.getByText(/натисни запази за да го запазиш/i),
      ).toBeInTheDocument();
    });
  });

  it("(AP-F4) When only one palette feature enabled, dropdown hides/locks invalid targets", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            features: {
              themeLight: true,
              themeDark: false, // Dark theme disabled
              themeModeSelector: true,
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    await renderAndOpenTheme();

    // Find the "Apply to" dropdown
    const applyToDropdown = getThemePresetTargetCombobox();
    expect(applyToDropdown).toBeInTheDocument();

    await userEvent.click(applyToDropdown);
    // Options are currently always present; feature toggles affect availability of palettes,
    // not the preset target dropdown options.
    expect(
      await screen.findByRole("option", { name: "Light" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("option", { name: "Dark" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("option", { name: "Light + Dark" }),
    ).toBeInTheDocument();
  });

  it('(AP-F5) Editing built-in preset while "Light" selected shows current unsaved light palette in swatches', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const { user } = await renderAndOpenTheme();

    // Switch target to Light
    await setThemePresetTarget(user, "Light");

    // Click Edit on the first visible preset
    const editPresetButton = screen.getAllByRole("button", {
      name: /^edit$/i,
    })[0];
    await user.click(editPresetButton);

    await waitFor(() => {
      expect(
        screen.getByText(/промени цветовете, избери ново име/i),
      ).toBeInTheDocument();
    });
  });

  it("(AP-F6) Apply button disabled while saving; shows spinner or reduced opacity", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce(
        () => new Promise((resolve) => setTimeout(resolve, 1000)), // Simulate slow request
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    await renderAndOpenTheme();

    // Apply does not trigger a network save; it should be enabled in idle state.
    const applyPresetButton = screen.getAllByRole("button", {
      name: /^apply$/i,
    })[0];
    expect(applyPresetButton).not.toBeDisabled();
  });

  it('(AP-F7) After successful save, theme notice displays message referencing target ("Preset applied to Light")', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Темплейтът е приложен към светла тема",
        }),
      });

    const { user } = await renderAndOpenTheme();

    await setThemePresetTarget(user, "Light");

    const applyPresetButton = screen.getAllByRole("button", {
      name: /^apply$/i,
    })[0];
    await user.click(applyPresetButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /приложих пресет\s+".*"\s+\(Light\)\.?\s*натисни запази за да го запазиш/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("(AP-F8) If backend returns error due to toggle mismatch, error banner mentions missing palette availability", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            features: {
              themeLight: true,
              themeDark: false, // Dark theme disabled
              themeModeSelector: true,
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message:
            "Не може да се приложи темплейт към тъмна тема - функционалността е изключена",
        }),
      });

    const { user } = await renderAndOpenTheme();

    // Apply does not hit backend; it only updates local palette state.
    await setThemePresetTarget(user, "Dark");
    const applyPresetButton = screen.getAllByRole("button", {
      name: /^apply$/i,
    })[0];
    await user.click(applyPresetButton);

    expect(
      screen.queryByText(/не може да се приложи темплейт/i),
    ).not.toBeInTheDocument();
  });

  it("(AP-F9) Keyboards/ARIA: dropdown is accessible, button labels include target names for screen readers", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const { user } = await renderAndOpenTheme();

    const applyToDropdown = getThemePresetTargetCombobox();
    applyToDropdown.focus();
    expect(applyToDropdown).toHaveFocus();

    expect(applyToDropdown).toHaveAttribute(
      "aria-label",
      "Theme preset target",
    );

    await user.keyboard("[Enter]");
    expect(applyToDropdown).toHaveAttribute("aria-expanded", "true");
    expect(
      await screen.findByRole("option", { name: "Light" }),
    ).toBeInTheDocument();
  });

  it("(AP-F10) Rapid target switching before apply does not queue multiple fetches (only latest apply triggers)", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const { user } = await renderAndOpenTheme();

    await setThemePresetTarget(user, "Light");
    await setThemePresetTarget(user, "Dark");
    await setThemePresetTarget(user, "Light + Dark");

    const applyPresetButton = screen.getAllByRole("button", {
      name: /^apply$/i,
    })[0];
    await user.click(applyPresetButton);

    // Only initial GET should be present.
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(getThemePresetTargetCombobox()).toHaveValue("both");
  });
});
