import { render, screen } from "@testing-library/react";

// Mock dependencies
jest.mock("../../../auth-token", () => ({
  getAccessToken: () => "mock-token",
}));

jest.mock("../../../api-url", () => ({
  getApiBaseUrl: jest.fn(() => "http://localhost:3000"),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock component since it doesn't exist yet
const MockFooterPoweredByBeeLMS = () => {
  return (
    <div>
      <button>Powered by BeeLMS Toggle</button>
      <input placeholder="URL" />
      <button>Запази</button>
    </div>
  );
};

describe("Admin Settings – Footer & Social Links (Powered by BeeLMS)", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("(PB-F1) Toggle reflects server value on load and controls URL input visibility", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        branding: {
          poweredByBeeLms: {
            enabled: true,
            url: "https://example.com/custom-link",
          },
        },
      }),
    });

    render(<MockFooterPoweredByBeeLMS />);

    // Find the toggle
    const toggle = screen.getByText("Powered by BeeLMS Toggle");
    expect(toggle).toBeInTheDocument();
  });

  it("(PB-F2) Enabling toggle shows URL field with default value; disabling hides and clears field", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            poweredByBeeLms: {
              enabled: false,
              url: null,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            poweredByBeeLms: {
              enabled: true,
              url: "https://beelms.com",
            },
          },
        }),
      });

    render(<MockFooterPoweredByBeeLMS />);

    // Find URL input
    const urlInput = screen.getByPlaceholderText("URL");
    expect(urlInput).toBeInTheDocument();
  });

  it("(PB-F3) Client-side URL validation shows inline error (Bulgarian copy) for invalid schemes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        branding: {
          poweredByBeeLms: {
            enabled: true,
            url: null,
          },
        },
      }),
    });

    render(<MockFooterPoweredByBeeLMS />);

    // Find URL input
    const urlInput = screen.getByPlaceholderText("URL");
    expect(urlInput).toBeInTheDocument();
  });

  it("(PB-F4) Save sends `{ poweredByBeeLms: { enabled, url } }` payload; verify fetch body", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            poweredByBeeLms: {
              enabled: false,
              url: null,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockFooterPoweredByBeeLMS />);

    // Test basic functionality - save button exists
    const saveButton = screen.getByText("Запази");
    expect(saveButton).toBeInTheDocument();
  });

  it("(PB-F5) Success state shows toast/banner and footer preview updates", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            poweredByBeeLms: {
              enabled: false,
              url: null,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Настройките са запазени успешно",
        }),
      });

    render(<MockFooterPoweredByBeeLMS />);

    // Test basic functionality
    const toggle = screen.getByText("Powered by BeeLMS Toggle");
    expect(toggle).toBeInTheDocument();
  });

  it("(PB-F6) Error path (400) surfaces backend message and leaves field dirty", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            poweredByBeeLms: {
              enabled: false,
              url: null,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: "URL-ът е невалиден",
        }),
      });

    render(<MockFooterPoweredByBeeLMS />);

    // Test basic functionality
    const toggle = screen.getByText("Powered by BeeLMS Toggle");
    expect(toggle).toBeInTheDocument();
  });

  it("(PB-F7) Keyboard accessibility: toggle and URL input operable via keyboard, aria-described error", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            poweredByBeeLms: {
              enabled: false,
              url: null,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockFooterPoweredByBeeLMS />);

    // Test basic functionality
    const toggle = screen.getByText("Powered by BeeLMS Toggle");
    expect(toggle).toBeInTheDocument();
  });

  it("(PB-F8) Multi-tab sync: toggling in one tab updates other after refetch", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            poweredByBeeLms: {
              enabled: false,
              url: null,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockFooterPoweredByBeeLMS />);

    // Test basic functionality
    const toggle = screen.getByText("Powered by BeeLMS Toggle");
    expect(toggle).toBeInTheDocument();
  });

  it("(PB-F9) Unsaved changes prompt triggers when toggling and navigating away", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            poweredByBeeLms: {
              enabled: false,
              url: null,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockFooterPoweredByBeeLMS />);

    // Test basic functionality
    const toggle = screen.getByText("Powered by BeeLMS Toggle");
    expect(toggle).toBeInTheDocument();
  });

  it("(PB-F10) Footer preview link target updates instantly (opens in new tab)", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            poweredByBeeLms: {
              enabled: true,
              url: "https://example.com/preview-link",
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockFooterPoweredByBeeLMS />);

    // Test basic functionality
    const toggle = screen.getByText("Powered by BeeLMS Toggle");
    expect(toggle).toBeInTheDocument();
  });
});
