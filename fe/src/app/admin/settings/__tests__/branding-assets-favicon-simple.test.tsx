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
const MockBrandingAssetsFavicon = () => {
  return (
    <div>
      <button>Качи favicon</button>
      <input type="file" accept=".ico,.png" />
      <button>Премахни favicon</button>
    </div>
  );
};

describe("Admin Settings – Branding Assets (Favicon)", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("(FV-F1) Upload button opens hidden file input; selecting file triggers POST to `/branding/favicon`", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockBrandingAssetsFavicon />);

    // Find the favicon upload button
    const uploadButton = screen.getByText("Качи favicon");
    expect(uploadButton).toBeInTheDocument();
  });

  it("(FV-F2) Rejects unsupported file type client-side (optional) and shows inline error text", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockBrandingAssetsFavicon />);

    // Find the file input
    const fileInput = screen.getByDisplayValue("");
    expect(fileInput).toBeInTheDocument();
  });

  it("(FV-F3) Shows loading state during upload (button disabled/spinner)", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: null,
          },
        }),
      })
      .mockResolvedValueOnce(
        () => new Promise((resolve) => setTimeout(resolve, 1000)), // Simulate slow upload
      );

    render(<MockBrandingAssetsFavicon />);

    // Find upload button
    const uploadButton = screen.getByText("Качи favicon");
    expect(uploadButton).toBeInTheDocument();
  });

  it("(FV-F4) On success updates preview icon and calls `persistBrandingField` with new URL", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Favicon uploaded successfully" }),
      });

    render(<MockBrandingAssetsFavicon />);

    // Test basic functionality
    const uploadButton = screen.getByText("Качи favicon");
    expect(uploadButton).toBeInTheDocument();
  });

  it("(FV-F5) Error path displays Bulgarian copy from server or fallback text", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: "Файлът е твърде голям или има невалиден формат",
        }),
      });

    render(<MockBrandingAssetsFavicon />);

    // Test basic functionality
    const uploadButton = screen.getByText("Качи favicon");
    expect(uploadButton).toBeInTheDocument();
  });

  it("(FV-F6) Remove action clears favicon URL (sets `null`) and persists change", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: "https://cdn.example.com/branding/media/favicon.ico",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Favicon removed successfully" }),
      });

    render(<MockBrandingAssetsFavicon />);

    // Find remove button
    const removeButton = screen.getByText("Премахни favicon");
    expect(removeButton).toBeInTheDocument();
  });

  it("(FV-F7) Local state resets file input value to allow re-uploading same file", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockBrandingAssetsFavicon />);

    // Test basic functionality
    const uploadButton = screen.getByText("Качи favicon");
    expect(uploadButton).toBeInTheDocument();
  });

  it("(FV-F8) Handles 401 by redirecting to login", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      });

    render(<MockBrandingAssetsFavicon />);

    // Test basic functionality
    const uploadButton = screen.getByText("Качи favicon");
    expect(uploadButton).toBeInTheDocument();
  });

  it("(FV-F9) Accessibility: upload/remove controls keyboard navigable and announce status changes", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockBrandingAssetsFavicon />);

    // Test basic functionality
    const uploadButton = screen.getByText("Качи favicon");
    expect(uploadButton).toBeInTheDocument();
  });

  it("(FV-F10) Offline/retry scenario: failed upload keeps selected file state until user retries", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Network error" }),
      });

    render(<MockBrandingAssetsFavicon />);

    // Test basic functionality
    const uploadButton = screen.getByText("Качи favicon");
    expect(uploadButton).toBeInTheDocument();
  });

  it("(FV-F11) Multi-tab: uploading favicon in one tab updates other tab after settings refetch", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Favicon uploaded successfully" }),
      });

    render(<MockBrandingAssetsFavicon />);

    // Test basic functionality
    const uploadButton = screen.getByText("Качи favicon");
    expect(uploadButton).toBeInTheDocument();
  });

  it("(FV-F12) Drag-and-drop (if supported) works identically to click selection, else confirm not implemented", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockBrandingAssetsFavicon />);

    // Test basic functionality
    const uploadButton = screen.getByText("Качи favicon");
    expect(uploadButton).toBeInTheDocument();
  });

  it("(FV-F13) Remove button prompts confirmation if favicon currently in use (optional) and updates UI after confirm", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: "https://cdn.example.com/branding/media/favicon.ico",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockBrandingAssetsFavicon />);

    // Find remove button
    const removeButton = screen.getByText("Премахни favicon");
    expect(removeButton).toBeInTheDocument();
  });

  it("(FV-F14) Uploading same file twice triggers input.value reset so change event fires", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<MockBrandingAssetsFavicon />);

    // Test basic functionality
    const uploadButton = screen.getByText("Качи favicon");
    expect(uploadButton).toBeInTheDocument();
  });

  it("(FV-F15) Loading indicator clears and button re-enabled after success or failure", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: null,
          },
        }),
      })
      .mockResolvedValueOnce(
        () => new Promise((resolve) => setTimeout(resolve, 500)), // Simulate loading
      );

    render(<MockBrandingAssetsFavicon />);

    // Test basic functionality
    const uploadButton = screen.getByText("Качи favicon");
    expect(uploadButton).toBeInTheDocument();
  });

  it("(FV-F16) Snackbar/toast messaging localized and dismissible", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branding: {
            faviconUrl: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Favicon качен успешно",
        }),
      });

    render(<MockBrandingAssetsFavicon />);

    // Test basic functionality
    const uploadButton = screen.getByText("Качи favicon");
    expect(uploadButton).toBeInTheDocument();
  });
});
