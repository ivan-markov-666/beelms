import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.setTimeout(30000);

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

const mockFetch = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).fetch = mockFetch;

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

const renderAdminSettingsPage = async () => {
  const AdminSettingsPage = (await import("../page")).default;
  return render(<AdminSettingsPage />);
};

const renderAndOpenBranding = async () => {
  const user = userEvent.setup();
  const renderResult = await renderAdminSettingsPage();

  const brandingHeading = await screen.findByRole("heading", {
    name: /branding/i,
  });
  const brandingAccordion = brandingHeading.closest("button");
  if (!brandingAccordion) {
    throw new Error("Branding accordion button not found");
  }
  await user.click(brandingAccordion);

  // Wait for Font section to appear
  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: /upload font/i }),
    ).toBeInTheDocument();
  });

  return { user, renderResult };
};

type MockSettingsOverrides = {
  branding?: Record<string, unknown>;
  languages?: { supported?: string[]; default?: string };
};

const createMockSettingsResponse = (overrides: MockSettingsOverrides = {}) => {
  const branding = overrides.branding ?? {};
  const languages = overrides.languages ?? {};

  return {
    branding: {
      appName: "BeeLMS",
      browserTitle: "BeeLMS",
      faviconUrl: null,
      logoUrl: null,
      logoLightUrl: null,
      logoDarkUrl: null,
      googleFont: null,
      googleFontByLang: {},
      fontUrl: null,
      fontUrlByLang: {},
      fontLicenseUrl: null,
      fontLicenseUrlByLang: {},
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
      ...branding,
    },
    features: {
      themeLight: true,
      themeDark: true,
      themeModeSelector: true,
    },
    languages: {
      supported: languages.supported ?? ["bg", "en"],
      default: languages.default ?? "bg",
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
  };
};

const getPerLangRow = (langCode: string) => {
  const codeNode = screen.getByText(langCode);
  const row = codeNode.closest("div.rounded-md") as HTMLElement | null;
  if (!row) {
    throw new Error(`Per-language row not found for ${langCode}`);
  }
  return row;
};

describe("Admin Settings – Fonts & licenses", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("(FT-F1) Upload font button handles base font; success updates preview text sample", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: "https://cdn.example.com/font.woff2" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            branding: { fontUrl: "https://cdn.example.com/font.woff2" },
          }),
      });

    const { user } = await renderAndOpenBranding();

    const fileInput = screen.getByLabelText(
      "Branding font file input",
    ) as HTMLInputElement;
    const file = new File(["font"], "font.woff2", { type: "font/woff2" });

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/admin/settings/branding/font",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
          body: expect.any(FormData),
        }),
      );
    });

    const preview = screen.getByTestId("branding-font-preview");
    await waitFor(() => {
      expect(preview).toHaveStyle({
        fontFamily: '"__beelms_custom_font_preview__", sans-serif',
      });
    });
  });

  it("(FT-F2) Per-language font upload UI handles selection of language code and displays active overrides", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            branding: { fontUrlByLang: {} },
            languages: { supported: ["bg", "en"], default: "bg" },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: "https://cdn.example.com/bg.woff2" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            branding: {
              fontUrlByLang: { bg: "https://cdn.example.com/bg.woff2" },
            },
            languages: { supported: ["bg", "en"], default: "bg" },
          }),
      });

    const { user } = await renderAndOpenBranding();

    const row = getPerLangRow("bg");
    const uploadBtn = within(row).getByRole("button", { name: /upload font/i });
    await user.click(uploadBtn);

    const perLangInput = screen.getByLabelText(
      "Branding per-language font file input",
    ) as HTMLInputElement;
    const file = new File(["font"], "bg.woff2", { type: "font/woff2" });

    await user.upload(perLangInput, file);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/admin/settings/branding/font",
        expect.any(Object),
      );
    });

    await waitFor(() => {
      const link = within(row).getByRole("link", { name: /font file/i });
      expect(link).toHaveAttribute("href", "https://cdn.example.com/bg.woff2");
    });
  });

  it("(FT-F3) Deleting per-language font reverts to default font preview", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            branding: {
              fontUrl: "https://cdn.example.com/base.woff2",
              fontUrlByLang: { bg: "https://cdn.example.com/bg.woff2" },
            },
            languages: { supported: ["bg", "en"], default: "bg" },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            branding: {
              fontUrl: "https://cdn.example.com/base.woff2",
              fontUrlByLang: {},
            },
            languages: { supported: ["bg", "en"], default: "bg" },
          }),
      });

    const { user } = await renderAndOpenBranding();

    const row = getPerLangRow("bg");
    const removeBtns = within(row).getAllByRole("button", {
      name: /^remove$/i,
    });
    const removeBtn = removeBtns[0];
    await user.click(removeBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/admin/settings",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"fontUrlByLang":{"bg":null}'),
        }),
      );
    });

    await waitFor(() => {
      expect(
        within(row).queryByRole("link", { name: /font file/i }),
      ).toBeNull();
      expect(within(row).getByText(/\(global\)/i)).toBeInTheDocument();
    });
  });

  it("(FT-F4) Uploading invalid file surfaces localized error", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Невалиден формат на файла" }),
      });

    const { user } = await renderAndOpenBranding();

    const fileInput = screen.getByLabelText(
      "Branding font file input",
    ) as HTMLInputElement;
    const file = new File(["bad"], "bad.exe", {
      type: "application/octet-stream",
    });

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /невалиден формат на файла/i,
      );
    });
  });

  it("(FT-F5) License upload UI accepts allowed file types and displays link to uploaded document", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: "https://cdn.example.com/license.pdf" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            branding: { fontLicenseUrl: "https://cdn.example.com/license.pdf" },
          }),
      });

    const { user } = await renderAndOpenBranding();

    const fileInput = screen.getByLabelText(
      "Branding font license file input",
    ) as HTMLInputElement;
    const file = new File(["pdf"], "license.pdf", { type: "application/pdf" });

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/admin/settings/branding/font-license",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
          body: expect.any(FormData),
        }),
      );
    });

    await waitFor(() => {
      const link = screen.getByRole("link", { name: /license file/i });
      expect(link).toHaveAttribute(
        "href",
        "https://cdn.example.com/license.pdf",
      );
    });
  });

  it("(FT-F6) Removing license clears preview link", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            branding: { fontLicenseUrl: "https://cdn.example.com/license.pdf" },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({ branding: { fontLicenseUrl: null } }),
      });

    const { user } = await renderAndOpenBranding();

    const uploadBtn = screen.getByRole("button", { name: /upload license/i });
    const container = uploadBtn.parentElement;
    if (!container) throw new Error("Expected license controls container");

    const removeBtn = within(container).getByRole("button", {
      name: /^remove$/i,
    });
    await user.click(removeBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/admin/settings",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"fontLicenseUrl":null'),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: /license file/i })).toBeNull();
    });
  });

  it("(FT-F7) Accessibility: file inputs labelled for screen readers; status changes announced", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: "https://cdn.example.com/license.pdf" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            branding: { fontLicenseUrl: "https://cdn.example.com/license.pdf" },
          }),
      });

    const { user } = await renderAndOpenBranding();

    expect(
      screen.getByLabelText("Branding font file input"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Branding font license file input"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Branding per-language font file input"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Branding per-language font license file input"),
    ).toBeInTheDocument();

    const fileInput = screen.getByLabelText(
      "Branding font license file input",
    ) as HTMLInputElement;
    const file = new File(["pdf"], "license.pdf", { type: "application/pdf" });

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  it("(FT-F8) Offline/retry for fonts keeps file reference until user retries", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSettingsResponse(),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Network error" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: "https://cdn.example.com/font.woff2" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            branding: { fontUrl: "https://cdn.example.com/font.woff2" },
          }),
      });

    const { user } = await renderAndOpenBranding();

    const fileInput = screen.getByLabelText(
      "Branding font file input",
    ) as HTMLInputElement;
    const file = new File(["font"], "font.woff2", { type: "font/woff2" });

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /retry upload/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /retry upload/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /retry upload/i }),
      ).toBeNull();
    });

    const preview = screen.getByTestId("branding-font-preview");
    await waitFor(() => {
      expect(preview).toHaveStyle({
        fontFamily: '"__beelms_custom_font_preview__", sans-serif',
      });
    });
  });

  it("(FT-F9) Multi-tab update syncs per-language font list after save", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            branding: { fontUrlByLang: {} },
            languages: { supported: ["bg", "en"], default: "bg" },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMockSettingsResponse({
            branding: {
              fontUrlByLang: { bg: "https://cdn.example.com/bg.woff2" },
            },
            languages: { supported: ["bg", "en"], default: "bg" },
          }),
      });

    await renderAndOpenBranding();

    const initialRow = getPerLangRow("bg");
    expect(
      within(initialRow).queryByRole("link", { name: /font file/i }),
    ).toBeNull();

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "beelms.adminSettingsSync",
        newValue: String(Date.now()),
      }),
    );

    await waitFor(() => {
      const updatedRow = getPerLangRow("bg");
      const link = within(updatedRow).getByRole("link", { name: /font file/i });
      expect(link).toHaveAttribute("href", "https://cdn.example.com/bg.woff2");
    });
  });
});
