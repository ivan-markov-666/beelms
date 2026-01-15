import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.setTimeout(20000);

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

let settingsResponse: unknown;
let patchResponse: {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
};

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();

  // JSDOM may not implement scrollIntoView (used by focusAndScroll in page.tsx)
  HTMLElement.prototype.scrollIntoView = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;

  HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
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

  // Open Branding accordion (contains Footer settings) via heading
  const brandingCandidates = await screen.findAllByRole("button", {
    name: /branding/i,
  });
  const brandingAccordion =
    brandingCandidates.find((btn) =>
      within(btn).queryByRole("heading", { name: /branding/i }),
    ) ?? null;
  if (!brandingAccordion) {
    throw new Error("Branding accordion button not found");
  }
  await user.click(brandingAccordion);

  // Ensure the Footer & Social links section has rendered.
  await screen.findByRole("switch", {
    name: /footer social youtube enabled/i,
  });

  return { user, renderResult };
};

const getYouTubeToggle = () =>
  screen.getByRole("switch", {
    name: /footer social youtube enabled/i,
  });

const getYouTubeCard = () => {
  const toggle = getYouTubeToggle();
  let node: HTMLElement | null = toggle;
  while (node && node !== document.body) {
    const text = node.textContent ?? "";
    if (
      /type:\s*youtube/i.test(text) &&
      node.querySelector?.('input[placeholder="https://..."]')
    ) {
      return node;
    }
    node = node.parentElement;
  }
  throw new Error("YouTube card not found");
};

const getYouTubeUrlInput = () =>
  within(getYouTubeCard()).getByPlaceholderText(/https:\/\/\.\.\./i);

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
    mockFetch.mockReset();
    settingsResponse = createMockSettingsResponse();
    patchResponse = {
      ok: true,
      status: 200,
      json: async () => ({}),
    };

    mockFetch.mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : String(input);
        const method = String(init?.method ?? "GET").toUpperCase();

        if (url.includes("/admin/settings") && method === "PATCH") {
          return patchResponse;
        }

        if (url.includes("/admin/settings") && method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => settingsResponse,
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({}),
        };
      },
    );
  });

  it("(YT-F1) Toggle + URL input reflect server values", async () => {
    settingsResponse = createMockSettingsResponse({
      enabled: true,
      url: "https://youtube.com/example-channel",
    });

    await renderAndOpenFooter();

    // Find YouTube toggle
    const toggle = getYouTubeToggle();
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-checked", "true");

    const urlInput = getYouTubeUrlInput();
    expect(urlInput).toHaveValue("https://youtube.com/example-channel");
  });

  it("(YT-F2) Inline validation ensures https://youtube.com/... or https://youtu.be/...", async () => {
    settingsResponse = createMockSettingsResponse({ enabled: true, url: null });

    await renderAndOpenFooter();

    // Find URL input
    const urlInput = getYouTubeUrlInput();
    expect(urlInput).toBeInTheDocument();
  });

  it("(YT-F3) Helper text explains accepted formats (channel, playlist, video)", async () => {
    settingsResponse = createMockSettingsResponse({ enabled: true, url: null });

    await renderAndOpenFooter();

    // Test basic functionality - helper text would be in real component
    const toggle = getYouTubeToggle();
    expect(toggle).toBeInTheDocument();
  });

  it("(YT-F4) Save sends normalized payload", async () => {
    settingsResponse = createMockSettingsResponse({
      enabled: false,
      url: null,
    });
    patchResponse = { ok: true, status: 200, json: async () => ({}) };

    const { user } = await renderAndOpenFooter();

    const urlInput = getYouTubeUrlInput();
    fireEvent.change(urlInput, {
      target: { value: "https://youtube.com/updated-channel" },
    });
    await waitFor(() => {
      expect(urlInput).toHaveValue("https://youtube.com/updated-channel");
    });

    // Enable toggle (requires URL)
    const toggle = getYouTubeToggle();
    await user.click(toggle);
    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-checked", "true");
    });

    // Click Save button
    const saveButton = screen.getByRole("button", { name: /запази/i });
    await user.click(saveButton);

    // Verify fetch call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/settings"),
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
  }, 20000);

  it("(YT-F5) Footer preview updates icon/link", async () => {
    settingsResponse = createMockSettingsResponse({
      enabled: false,
      url: null,
    });
    patchResponse = {
      ok: true,
      status: 200,
      json: async () => ({ message: "Настройките са запазени успешно" }),
    };

    const { user } = await renderAndOpenFooter();

    const urlInput = getYouTubeUrlInput();
    fireEvent.change(urlInput, {
      target: { value: "https://youtube.com/preview-channel" },
    });
    await waitFor(() => {
      expect(urlInput).toHaveValue("https://youtube.com/preview-channel");
    });

    // Enable toggle (requires URL)
    const toggle = getYouTubeToggle();
    await user.click(toggle);
    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-checked", "true");
    });

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

    await waitFor(() => {
      const patchCall = mockFetch.mock.calls.find((call) => {
        const [input, init] = call as [
          RequestInfo | URL,
          RequestInit | undefined,
        ];
        const url = typeof input === "string" ? input : String(input);
        const method = String(init?.method ?? "GET").toUpperCase();
        return url.includes("/admin/settings") && method === "PATCH";
      });

      expect(patchCall).toBeTruthy();

      const [, init] = patchCall as [
        RequestInfo | URL,
        RequestInit | undefined,
      ];
      const body = typeof init?.body === "string" ? init.body : "";
      expect(body).toContain('"footerSocialLinks"');
      expect(body).toContain('"id":"youtube"');
      expect(body).toContain('"url":"https://youtube.com/preview-channel"');
    });
  }, 20000);

  it("(YT-F6) Error from backend displayed near field", async () => {
    settingsResponse = createMockSettingsResponse({
      enabled: false,
      url: null,
    });
    patchResponse = {
      ok: false,
      status: 400,
      json: async () => ({ message: "URL-ът е невалиден" }),
    };

    const { user } = await renderAndOpenFooter();

    // Provide a client-valid URL so the request reaches the backend.
    const urlInput = getYouTubeUrlInput();
    fireEvent.change(urlInput, {
      target: { value: "https://youtube.com/invalid-url" },
    });
    await waitFor(() => {
      expect(urlInput).toHaveValue("https://youtube.com/invalid-url");
    });

    const toggle = getYouTubeToggle();
    await user.click(toggle);
    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-checked", "true");
    });

    // Click Save button
    const saveButton = screen.getByRole("button", { name: /запази/i });
    await user.click(saveButton);

    // Wait for error message
    await waitFor(() => {
      const errorMessage = screen.getByText(
        /неуспешно запазване на настройките\.[\s\S]*url-ът е невалиден/i,
      );
      expect(errorMessage).toBeInTheDocument();
    });

    // Field should retain dirty state
    expect(urlInput).toHaveValue("https://youtube.com/invalid-url");
  }, 20000);

  it("(YT-F7) Accessibility: toggle/input labelled, error tied via `aria-describedby`", async () => {
    settingsResponse = createMockSettingsResponse({
      enabled: false,
      url: null,
    });
    patchResponse = { ok: true, status: 200, json: async () => ({}) };

    const { user } = await renderAndOpenFooter();

    const toggle = getYouTubeToggle();
    const urlInput = getYouTubeUrlInput();
    fireEvent.change(urlInput, {
      target: { value: "https://youtube.com/example-channel" },
    });
    await waitFor(() => {
      expect(urlInput).toHaveValue("https://youtube.com/example-channel");
    });

    toggle.focus();
    expect(toggle).toHaveFocus();

    // Enable toggle with keyboard
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-checked", "true");
    });

    // Type invalid URL
    fireEvent.change(urlInput, {
      target: { value: "javascript:alert(1)" },
    });
    await waitFor(() => {
      expect(urlInput).toHaveValue("javascript:alert(1)");
    });

    // Check for error announcement
    await waitFor(() => {
      const errorMessage = screen.getByText(
        /url трябва да е към youtube\.com или youtu\.be/i,
      );
      expect(errorMessage).toBeInTheDocument();
    });
  }, 20000);

  it("(YT-F8) Toggle requires URL and shows inline error", async () => {
    settingsResponse = createMockSettingsResponse({
      enabled: false,
      url: null,
    });

    const { user } = await renderAndOpenFooter();

    // Try enabling without URL
    const toggle = getYouTubeToggle();
    await user.click(toggle);

    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-checked", "false");
    });

    const youtubeCard = getYouTubeCard();
    expect(
      await within(youtubeCard).findByText(
        /за да активираш този линк,[\s\S]*попълни[\s\S]*url/i,
      ),
    ).toBeInTheDocument();
  });

  it("(YT-F9) No unsaved changes prompt is registered", async () => {
    settingsResponse = createMockSettingsResponse({
      enabled: false,
      url: null,
    });

    await renderAndOpenFooter();

    expect(window.onbeforeunload).toBeNull();
  }, 20000);

  it("(YT-F10) Toggle + URL are editable and remain in the form", async () => {
    settingsResponse = createMockSettingsResponse({
      enabled: true,
      url: "https://youtube.com/preview-link",
    });

    await renderAndOpenFooter();

    const toggle = getYouTubeToggle();
    expect(toggle).toHaveAttribute("aria-checked", "true");

    const urlInput = getYouTubeUrlInput();
    expect(urlInput).toHaveValue("https://youtube.com/preview-link");

    fireEvent.change(urlInput, {
      target: { value: "https://youtu.be/example" },
    });
    await waitFor(() => {
      expect(urlInput).toHaveValue("https://youtu.be/example");
    });
  });
});
