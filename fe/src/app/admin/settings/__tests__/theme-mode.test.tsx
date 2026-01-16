import { render, screen, waitFor } from "@testing-library/react";
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

// Helper function to render and open Branding accordion (contains Theme settings)
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
  const { user, renderResult } = await renderAndOpenBranding();

  return { user, renderResult };
};

// Mock settings response
const createMockSettingsResponse = (themeMode: string = "system") => ({
  branding: {
    appName: "BeeLMS",
    theme: {
      mode: themeMode,
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

describe("Admin Settings – Theme Mode", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("(TM-F1) Theme mode combobox renders current server mode", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => createMockSettingsResponse("system"),
    });

    await renderAndOpenTheme();

    const dropdown = screen.getByRole("combobox", { name: /theme mode/i });
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveTextContent("system");
  });

  it("(TM-F2) Changing theme mode updates the combobox value", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createMockSettingsResponse("system"),
    });

    const { user } = await renderAndOpenTheme();

    const dropdown = screen.getByRole("combobox", { name: /theme mode/i });
    await user.click(dropdown);

    const lightOption = await screen.findByRole("option", { name: "light" });
    await user.click(lightOption);

    expect(dropdown).toHaveTextContent("light");
  });

  it("(TM-F3) Save persists theme mode via PATCH /admin/settings", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse("system"),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse("dark"),
      });

    const { user } = await renderAndOpenTheme();

    const dropdown = screen.getByRole("combobox", { name: /theme mode/i });
    await user.click(dropdown);
    const darkOption = await screen.findByRole("option", { name: "dark" });
    await user.click(darkOption);

    const saveButton = screen.getByRole("button", { name: /запази/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    const patchCall = mockFetch.mock.calls.find(
      ([url, init]) =>
        url === "http://localhost:3000/admin/settings" &&
        typeof init === "object" &&
        init !== null &&
        (init as { method?: string }).method === "PATCH",
    );
    expect(patchCall).toBeTruthy();
    const [, patchInit] = patchCall as [string, RequestInit];
    expect(patchInit).toEqual(
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-token",
        }),
        body: expect.stringContaining('"mode":"dark"'),
      }),
    );
  });
});
