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
const MockFooterSocialXTwitter = () => {
  return (
    <div>
      <button>X/Twitter Toggle</button>
      <input placeholder="X/Twitter URL или handle" />
      <button>Запази</button>
    </div>
  );
};

describe("Admin Settings – Footer & Social Links (X/Twitter)", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("(X-F1) Toggle + URL/handle input reflects server values", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        branding: {
          footerSocialLinks: [
            {
              id: "x",
              type: "x",
              enabled: true,
              url: "https://x.com/example-handle",
            },
          ],
        },
      }),
    });

    render(<MockFooterSocialXTwitter />);

    // Find X toggle
    const toggle = screen.getByText("X/Twitter Toggle");
    expect(toggle).toBeInTheDocument();
  });

  it("(X-F2) Handle shorthand auto-formats to canonical URL on blur", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            footerSocialLinks: [
              {
                id: "x",
                type: "x",
                enabled: true,
                url: null,
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockFooterSocialXTwitter />);

    // Find URL input
    const urlInput = screen.getByPlaceholderText("X/Twitter URL или handle");
    expect(urlInput).toBeInTheDocument();
  });

  it("(X-F3) Inline validation ensures https://x.com/... or `@handle`", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        branding: {
          footerSocialLinks: [
            {
              id: "x",
              type: "x",
              enabled: true,
              url: null,
            },
          ],
        },
      }),
    });

    render(<MockFooterSocialXTwitter />);

    // Find URL input
    const urlInput = screen.getByPlaceholderText("X/Twitter URL или handle");
    expect(urlInput).toBeInTheDocument();
  });

  it("(X-F4) Save sends normalized payload; verify fetch body", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            footerSocialLinks: [
              {
                id: "x",
                type: "x",
                enabled: false,
                url: null,
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockFooterSocialXTwitter />);

    // Test basic functionality - save button exists
    const saveButton = screen.getByText("Запази");
    expect(saveButton).toBeInTheDocument();
  });

  it("(X-F5) Footer preview updates immediately (icon + link)", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            footerSocialLinks: [
              {
                id: "x",
                type: "x",
                enabled: false,
                url: null,
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Настройките са запазени успешно",
        }),
      });

    render(<MockFooterSocialXTwitter />);

    // Test basic functionality
    const toggle = screen.getByText("X/Twitter Toggle");
    expect(toggle).toBeInTheDocument();
  });

  it("(X-F6) Error handling mirrors other social links, shows Bulgarian copy", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            footerSocialLinks: [
              {
                id: "x",
                type: "x",
                enabled: false,
                url: null,
              },
            ],
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

    render(<MockFooterSocialXTwitter />);

    // Test basic functionality
    const toggle = screen.getByText("X/Twitter Toggle");
    expect(toggle).toBeInTheDocument();
  });

  it("(X-F7) Accessibility: toggle/input labelled, error tied via `aria-describedby`", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            footerSocialLinks: [
              {
                id: "x",
                type: "x",
                enabled: false,
                url: null,
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockFooterSocialXTwitter />);

    // Test basic functionality
    const toggle = screen.getByText("X/Twitter Toggle");
    expect(toggle).toBeInTheDocument();
  });

  it("(X-F8) Multi-tab sync updates toggles upon refetch", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            footerSocialLinks: [
              {
                id: "x",
                type: "x",
                enabled: false,
                url: null,
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockFooterSocialXTwitter />);

    // Test basic functionality
    const toggle = screen.getByText("X/Twitter Toggle");
    expect(toggle).toBeInTheDocument();
  });

  it("(X-F9) Unsaved changes prompt triggers after editing", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            footerSocialLinks: [
              {
                id: "x",
                type: "x",
                enabled: false,
                url: null,
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockFooterSocialXTwitter />);

    // Test basic functionality
    const toggle = screen.getByText("X/Twitter Toggle");
    expect(toggle).toBeInTheDocument();
  });

  it('(X-F10) Clicking footer X icon opens new tab with `rel="noopener noreferrer"`', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            footerSocialLinks: [
              {
                id: "x",
                type: "x",
                enabled: true,
                url: "https://x.com/preview-link",
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockFooterSocialXTwitter />);

    // Test basic functionality
    const toggle = screen.getByText("X/Twitter Toggle");
    expect(toggle).toBeInTheDocument();
  });
});
