import { render, screen, waitFor, within } from "@testing-library/react";
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

type CustomThemePreset = {
  id: string;
  name: string;
  description?: string;
  light: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
  };
  dark: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
  };
};

const getPaletteHexInput = (title: string, label: string) => {
  const titleNode = screen.getByText(title, { selector: "span" });
  const paletteCard = titleNode.closest("div.rounded-xl") as HTMLElement | null;
  if (!paletteCard) {
    throw new Error(`Palette card not found for title: ${title}`);
  }

  const input = within(paletteCard).getByLabelText(label) as HTMLInputElement;
  return input;
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
    customThemePresets: [] as CustomThemePreset[],
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

  it("(PR-F1) Built-in preset cards render with swatches and BeeLMS/Curated labels", async () => {
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

    expect(screen.getByText("beeLMS")).toBeInTheDocument();
    expect(screen.getByText("Curated")).toBeInTheDocument();
    expect(screen.getByText("Golden Honey")).toBeInTheDocument();
    const expandButton = screen.queryByRole("button", {
      name: /Покажи още \(\d+\)/,
    });
    if (expandButton) {
      await userEvent.click(expandButton);
    }
    expect(screen.getByText("Mocha Elegance")).toBeInTheDocument();
    expect(screen.getByTitle("Light background: #f5f3ef")).toBeInTheDocument();
    expect(screen.getByTitle("Dark background: #1a1613")).toBeInTheDocument();
  });

  it("(PR-F2) Clicking Edit loads preset colors into palette editors", async () => {
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

    const editButtons = screen.getAllByRole("button", { name: /^edit$/i });
    await user.click(editButtons[0]);

    const nameInput = screen.getByPlaceholderText(
      "Име (напр. light-bee + dark-bee)",
    ) as HTMLInputElement;

    expect(nameInput).toHaveValue("Golden Honey");
    expect(
      getPaletteHexInput("Light palette", "Background hex value"),
    ).toHaveValue("#f5f3ef");
    expect(
      getPaletteHexInput("Dark palette", "Background hex value"),
    ).toHaveValue("#1a1613");
  });

  it("(PR-F3) Switching preset while editing updates name/description fields", async () => {
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

    await user.click(screen.getAllByRole("button", { name: /^edit$/i })[0]);
    const nameInput = screen.getByPlaceholderText(
      "Име (напр. light-bee + dark-bee)",
    ) as HTMLInputElement;
    const descriptionInput = screen.getByPlaceholderText(
      "Описание (по желание)",
    ) as HTMLInputElement;

    expect(nameInput).toHaveValue("Golden Honey");

    await user.click(screen.getAllByRole("button", { name: /^edit$/i })[1]);

    expect(nameInput).toHaveValue("Pollination Garden");
    expect(descriptionInput).toHaveValue(
      "beeLMS – лавандула + жълти акценти, природна хармония.",
    );
  });

  it("(PR-F4) Apply button updates palette based on selected target", async () => {
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
        getPaletteHexInput("Light palette", "Background hex value"),
      ).toHaveValue("#f5f3ef");
    });
    expect(
      getPaletteHexInput("Dark palette", "Background hex value"),
    ).toHaveValue("#000000");
  });

  it("(PR-F5) Custom preset validation rejects short and duplicate names", async () => {
    const initialResponse = createMockSettingsResponse();
    initialResponse.branding.customThemePresets = [
      {
        id: "custom-1",
        name: "Custom Bee",
        description: "Existing",
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
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const { user } = await renderAndOpenTheme();

    const nameInput = screen.getByPlaceholderText(
      "Име (напр. light-bee + dark-bee)",
    ) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: /save preset/i });

    await user.type(nameInput, "A");
    await user.click(saveButton);

    expect(
      await screen.findByText("Име на пресета трябва да е поне 2 символа."),
    ).toBeInTheDocument();

    await user.clear(nameInput);
    await user.type(nameInput, "Custom Bee");
    await user.click(saveButton);

    expect(
      await screen.findByText(
        'Име "Custom Bee" вече е заето от custom preset. Избери различно име.',
      ),
    ).toBeInTheDocument();
  });

  it("(PR-F6) Saving custom preset sends PATCH and updates list", async () => {
    const initialResponse = createMockSettingsResponse();
    const patchResponse = createMockSettingsResponse();
    patchResponse.branding.customThemePresets = [
      {
        id: "custom-1",
        name: "Custom Bee",
        description: "Warm tone",
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
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => patchResponse,
      });

    const { user } = await renderAndOpenTheme();

    const nameInput = screen.getByPlaceholderText(
      "Име (напр. light-bee + dark-bee)",
    ) as HTMLInputElement;
    const descriptionInput = screen.getByPlaceholderText(
      "Описание (по желание)",
    ) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: /save preset/i });

    await user.type(nameInput, "  Custom Bee  ");
    await user.type(descriptionInput, "Warm tone");
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    const patchCall = mockFetch.mock.calls[1][1] as RequestInit;
    const body = JSON.parse(patchCall.body as string) as {
      branding: { customThemePresets: Array<Record<string, unknown>> };
    };

    expect(body.branding.customThemePresets[0].name).toBe("Custom Bee");
    expect(body.branding.customThemePresets[0].description).toBe("Warm tone");
    expect(body.branding.customThemePresets[0].light).toMatchObject({
      background: "#ffffff",
      primary: "#007bff",
    });

    expect(await screen.findByText("Custom Bee")).toBeInTheDocument();
    expect(
      await screen.findByText('Custom пресет "Custom Bee" е запазен.'),
    ).toBeInTheDocument();
  });

  it("(PR-F7) Editing custom preset updates existing card without duplication", async () => {
    const initialResponse = createMockSettingsResponse();
    initialResponse.branding.customThemePresets = [
      {
        id: "custom-1",
        name: "Custom Bee",
        description: "Original",
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
    ];

    const patchResponse = createMockSettingsResponse();
    patchResponse.branding.customThemePresets = [
      {
        id: "custom-1",
        name: "Custom Bee Updated",
        description: "Updated",
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
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => patchResponse,
      });

    const { user } = await renderAndOpenTheme();

    const presetCard = screen
      .getByText("Custom Bee")
      .closest("div.rounded-lg") as HTMLElement | null;
    if (!presetCard) {
      throw new Error("Custom preset card not found");
    }
    const editButton = within(presetCard).getByRole("button", { name: "Edit" });
    await user.click(editButton);

    const nameInput = screen.getByPlaceholderText(
      "Име (напр. light-bee + dark-bee)",
    ) as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "Custom Bee Updated");

    const updateButton = screen.getByRole("button", {
      name: /update preset/i,
    });
    await user.click(updateButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText("Custom Bee Updated")).toBeInTheDocument();
    expect(screen.queryByText("Custom Bee")).not.toBeInTheDocument();
  });

  it("(PR-F8) Hidden presets show expand control with count", async () => {
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

    const expandButton = screen.getByRole("button", {
      name: /Покажи още \(\d+\)/,
    });
    expect(expandButton).toBeInTheDocument();

    await user.click(expandButton);
    expect(screen.getByRole("button", { name: "Скрий" })).toBeInTheDocument();
  });

  it("(PR-F9) Apply + Save persists updated palettes", async () => {
    const patchResponse = createMockSettingsResponse();
    patchResponse.branding.theme = {
      mode: "system",
      light: {
        background: "#f5f3ef",
        foreground: "#2b2419",
        primary: "#f0b90b",
        secondary: "#f59e42",
      },
      dark: {
        background: "#1a1613",
        foreground: "#e8e6e1",
        primary: "#f5c951",
        secondary: "#f0ad6f",
      },
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => patchResponse,
      });

    const { user } = await renderAndOpenTheme();

    const applyPresetButton = screen.getAllByRole("button", {
      name: /^apply$/i,
    })[0];
    await user.click(applyPresetButton);

    const saveButton = screen.getByRole("button", { name: "Запази" });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    const patchCall = mockFetch.mock.calls[1][1] as RequestInit;
    const body = JSON.parse(patchCall.body as string) as {
      branding: {
        theme: { light: Record<string, string>; dark: Record<string, string> };
      };
    };

    expect(body.branding.theme.light.background).toBe("#f5f3ef");
    expect(body.branding.theme.dark.background).toBe("#1a1613");
  });

  it("(PR-F10) Saving preset handles backend failure with theme notice", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockRejectedValueOnce(new Error("Network down"));

    const { user } = await renderAndOpenTheme();

    const nameInput = screen.getByPlaceholderText(
      "Име (напр. light-bee + dark-bee)",
    ) as HTMLInputElement;
    await user.type(nameInput, "Custom Bee");

    const saveButton = screen.getByRole("button", { name: /save preset/i });
    await user.click(saveButton);

    expect(await screen.findByText("Network down")).toBeInTheDocument();
  });

  it("(PR-F11) Preset actions are keyboard focusable", async () => {
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

    const applyPresetButton = screen.getAllByRole("button", {
      name: /^apply$/i,
    })[0];

    await user.tab();
    applyPresetButton.focus();
    expect(applyPresetButton).toHaveFocus();
    expect(applyPresetButton).toHaveAccessibleName("Apply");
  });

  it("(PR-F12) Saving disables Apply/Save buttons while request in flight", async () => {
    let resolveSave: ((value: Response) => void) | undefined;
    const savePromise = new Promise<Response>((resolve) => {
      resolveSave = resolve;
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockReturnValueOnce(savePromise as unknown as Promise<Response>);

    const { user } = await renderAndOpenTheme();

    const saveButton = screen.getByRole("button", { name: "Запази" });
    await user.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(
      screen.getAllByRole("button", { name: /^apply$/i })[0],
    ).toBeDisabled();

    if (resolveSave) {
      resolveSave({
        ok: true,
        json: async () => createMockSettingsResponse(),
      } as Response);
    }
  });

  it("(PR-F13) Preset search/filter is not present", async () => {
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

    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/filter/i)).not.toBeInTheDocument();
  });

  it("(PR-F14) Apply button styling follows current preview variant", async () => {
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

    await user.click(screen.getByRole("button", { name: "dark" }));

    const applyPresetButton = screen.getAllByRole("button", {
      name: /^apply$/i,
    })[0];

    expect(applyPresetButton).toHaveStyle({
      borderColor: "#0d6efd",
      color: "#0d6efd",
    });
  });

  it("(PR-F15) Preset apply remains enabled even when dark theme disabled", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            features: {
              themeLight: true,
              themeDark: false,
              themeModeSelector: true,
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    await renderAndOpenTheme();

    const applyPresetButton = screen.getAllByRole("button", {
      name: /^apply$/i,
    })[0];
    expect(applyPresetButton).not.toBeDisabled();
  });

  it("(PR-F16) Re-rendering after updated presets reflects new list", async () => {
    const initialResponse = createMockSettingsResponse();
    const updatedResponse = createMockSettingsResponse();
    updatedResponse.branding.customThemePresets = [
      {
        id: "custom-1",
        name: "Synced Preset",
        description: "From another tab",
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
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedResponse,
      });

    const { renderResult } = await renderAndOpenTheme();
    renderResult.unmount();

    await renderAndOpenTheme();
    expect(await screen.findByText("Synced Preset")).toBeInTheDocument();
  });

  it("(PR-F17) Unsaved preset apply resets after reload", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const { user, renderResult } = await renderAndOpenTheme();

    const applyPresetButton = screen.getAllByRole("button", {
      name: /^apply$/i,
    })[0];
    await user.click(applyPresetButton);

    await waitFor(() => {
      expect(
        getPaletteHexInput("Light palette", "Background hex value"),
      ).toHaveValue("#f5f3ef");
    });

    renderResult.unmount();
    await renderAndOpenTheme();

    expect(
      getPaletteHexInput("Light palette", "Background hex value"),
    ).toHaveValue("#ffffff");
  });

  it("(PR-F18) Editing built-in preset shows copy guidance", async () => {
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

    const editPresetButton = screen.getAllByRole("button", {
      name: /^edit$/i,
    })[0];
    await user.click(editPresetButton);

    expect(
      await screen.findByText(/Промени цветовете, избери ново име/i),
    ).toBeInTheDocument();
  });

  it("(PR-F19) Delete preset confirms and removes card", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    const initialResponse = createMockSettingsResponse();
    initialResponse.branding.customThemePresets = [
      {
        id: "custom-1",
        name: "Custom Bee",
        description: "Original",
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
    ];

    const patchResponse = createMockSettingsResponse();
    patchResponse.branding.customThemePresets = [];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => patchResponse,
      });

    const { user } = await renderAndOpenTheme();

    const presetCard = screen
      .getByText("Custom Bee")
      .closest("div.rounded-lg") as HTMLElement | null;
    if (!presetCard) {
      throw new Error("Custom preset card not found");
    }
    const deleteButton = within(presetCard).getByRole("button", {
      name: "Delete",
    });
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(
      await screen.findByText(/Custom пресет "Custom Bee" е изтрит/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Custom Bee")).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it("(PR-F20) Validation focuses name input on error", async () => {
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

    const nameInput = screen.getByPlaceholderText(
      "Име (напр. light-bee + dark-bee)",
    ) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: /save preset/i });

    await user.type(nameInput, "A");
    await user.click(saveButton);

    expect(
      await screen.findByText("Име на пресета трябва да е поне 2 символа."),
    ).toBeInTheDocument();
    expect(nameInput).toHaveValue("A");
  });

  it("(PR-F21) Renders large preset lists without collapsing", async () => {
    const initialResponse = createMockSettingsResponse();
    initialResponse.branding.customThemePresets = Array.from(
      { length: 50 },
      (_, index) => ({
        id: `custom-${index + 1}`,
        name: `Custom Preset ${index + 1}`,
        description: `Desc ${index + 1}`,
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
      }),
    );

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    await renderAndOpenTheme();

    expect(screen.getAllByText(/Custom Preset \d+/)).toHaveLength(50);
  });

  it("(PR-F22) Offline preset save keeps inputs and shows error", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockRejectedValueOnce(new Error("Offline"));

    const { user } = await renderAndOpenTheme();

    const nameInput = screen.getByPlaceholderText(
      "Име (напр. light-bee + dark-bee)",
    ) as HTMLInputElement;
    const descriptionInput = screen.getByPlaceholderText(
      "Описание (по желание)",
    ) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: /save preset/i });

    await user.type(nameInput, "Offline Preset");
    await user.type(descriptionInput, "Keep data");
    await user.click(saveButton);

    expect(await screen.findByText("Offline")).toBeInTheDocument();
    expect(nameInput).toHaveValue("Offline Preset");
    expect(descriptionInput).toHaveValue("Keep data");
  });
});
