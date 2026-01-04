import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock fetch for the metadata fetching functionality
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Test component that isolates the fetch metadata from URL functionality
function TestFetchMetadataComponent() {
  const [url, setUrl] = React.useState("");
  const [metaFetchStatus, setMetaFetchStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [metaFetchMessage, setMetaFetchMessage] = React.useState<string | null>(
    null,
  );
  const [browserTitle, setBrowserTitle] = React.useState("");
  const [socialImageUrl, setSocialImageUrl] = React.useState("");
  const [socialDescription, setSocialDescription] = React.useState("");
  const [openGraphTitle, setOpenGraphTitle] = React.useState("");
  const [openGraphDescription, setOpenGraphDescription] = React.useState("");
  const [openGraphImageUrl, setOpenGraphImageUrl] = React.useState("");
  const [twitterTitle, setTwitterTitle] = React.useState("");
  const [twitterDescription, setTwitterDescription] = React.useState("");
  const [twitterImageUrl, setTwitterImageUrl] = React.useState("");

  const handleFetchMetadataFromUrl = async () => {
    if (!url.trim()) {
      // Don't show error for empty URL, just don't fetch
      return;
    }

    setMetaFetchStatus("loading");
    setMetaFetchMessage(null);

    try {
      const res = await fetch(url);

      if (!res.ok) {
        setMetaFetchStatus("error");
        setMetaFetchMessage(
          `HTTP ${res.status} · Неуспешно зареждане на HTML.`,
        );
        return;
      }

      const html = await res.text();
      if (typeof DOMParser === "undefined") {
        setMetaFetchStatus("error");
        setMetaFetchMessage("DOMParser не е наличен в този браузър контекст.");
        return;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const getMetaContent = (property: string, fallback?: string) => {
        // First try property (og: tags)
        const meta = doc.querySelector(
          `meta[property="${property}"], meta[name="${property}"]`,
        );
        if (meta?.getAttribute("content")) {
          return meta.getAttribute("content") || "";
        }
        // If not found and fallback provided, try fallback (twitter: tags)
        if (fallback) {
          const fallbackMeta = doc.querySelector(
            `meta[property="${fallback}"], meta[name="${fallback}"]`,
          );
          return fallbackMeta?.getAttribute("content") || "";
        }
        return "";
      };

      const nextBrowserTitle =
        doc.querySelector("title")?.textContent?.trim() || "";
      const nextSocialImage = getMetaContent("og:image", "twitter:image");
      const nextSocialDescription = getMetaContent(
        "og:description",
        "twitter:description",
      );
      const nextOpenGraphTitle = getMetaContent("og:title");
      const nextOpenGraphDescription = getMetaContent("og:description");
      const nextOpenGraphImage = getMetaContent("og:image");
      const nextTwitterTitle = getMetaContent("twitter:title");
      const nextTwitterDescription = getMetaContent("twitter:description");
      const nextTwitterImage = getMetaContent("twitter:image");

      setBrowserTitle(nextBrowserTitle);
      setSocialImageUrl(nextSocialImage);
      setSocialDescription(nextSocialDescription);
      setOpenGraphTitle(nextOpenGraphTitle);
      setOpenGraphDescription(nextOpenGraphDescription);
      setOpenGraphImageUrl(nextOpenGraphImage);
      setTwitterTitle(nextTwitterTitle);
      setTwitterDescription(nextTwitterDescription);
      setTwitterImageUrl(nextTwitterImage);

      const foundAny =
        nextSocialImage ||
        nextSocialDescription ||
        nextOpenGraphTitle ||
        nextOpenGraphDescription ||
        nextOpenGraphImage ||
        nextTwitterTitle ||
        nextTwitterDescription ||
        nextTwitterImage;

      setMetaFetchStatus("success");
      setMetaFetchMessage(
        foundAny
          ? "Изтеглих meta tags от URL. Провери стойностите и натисни Save."
          : "URL се зареди, но не намерих OG/Twitter meta tags в HTML.",
      );
    } catch (err) {
      setMetaFetchStatus("error");
      setMetaFetchMessage(
        err instanceof TypeError
          ? "Неуспешно fetch-ване на URL (вероятно CORS блокировка). Опитай с друг URL или използвай backend proxy."
          : "Възникна неочаквана грешка при извличане на meta tags.",
      );
    }
  };

  return (
    <div>
      <div data-testid="fetch-metadata-section">
        <label>Fetch metadata from URL</label>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            data-testid="url-input"
          />
          <button
            type="button"
            onClick={handleFetchMetadataFromUrl}
            disabled={metaFetchStatus === "loading"}
            data-testid="fetch-button"
          >
            {metaFetchStatus === "loading" ? "Fetching..." : "Fetch from URL"}
          </button>
        </div>

        {metaFetchMessage && (
          <div
            data-testid="fetch-message"
            className={
              metaFetchStatus === "error"
                ? "text-red-700"
                : metaFetchStatus === "success"
                  ? "text-green-700"
                  : "text-gray-600"
            }
          >
            {metaFetchMessage}
          </div>
        )}
      </div>

      <div data-testid="fetched-metadata">
        <div data-testid="browser-title">{browserTitle}</div>
        <div data-testid="social-image">{socialImageUrl}</div>
        <div data-testid="social-description">{socialDescription}</div>
        <div data-testid="og-title">{openGraphTitle}</div>
        <div data-testid="og-description">{openGraphDescription}</div>
        <div data-testid="og-image">{openGraphImageUrl}</div>
        <div data-testid="twitter-title">{twitterTitle}</div>
        <div data-testid="twitter-description">{twitterDescription}</div>
        <div data-testid="twitter-image">{twitterImageUrl}</div>
      </div>
    </div>
  );
}

describe("Fetch Metadata from URL", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockFetch.mockClear();
  });

  it("shows loading state while fetching", async () => {
    // Mock a delayed response
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                text: () =>
                  Promise.resolve(
                    "<html><head><title>Test Page</title></head></html>",
                  ),
              }),
            100,
          ),
        ),
    );

    render(<TestFetchMetadataComponent />);

    const urlInput = screen.getByTestId("url-input");
    const fetchButton = screen.getByTestId("fetch-button");

    await user.type(urlInput, "https://example.com");
    await user.click(fetchButton);

    // Should show loading state
    expect(fetchButton).toHaveTextContent("Fetching...");
    expect(fetchButton).toBeDisabled();
    expect(screen.queryByTestId("fetch-message")).not.toBeInTheDocument();
  });

  it("successfully fetches and populates metadata from valid URL", async () => {
    const mockHtml = `
      <html>
        <head>
          <title>Example Page Title</title>
          <meta property="og:title" content="OG Title">
          <meta property="og:description" content="OG Description">
          <meta property="og:image" content="https://example.com/og-image.jpg">
          <meta name="twitter:title" content="Twitter Title">
          <meta name="twitter:description" content="Twitter Description">
          <meta name="twitter:image" content="https://example.com/twitter-image.jpg">
        </head>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    render(<TestFetchMetadataComponent />);

    const urlInput = screen.getByTestId("url-input");
    const fetchButton = screen.getByTestId("fetch-button");

    await user.type(urlInput, "https://example.com");
    await user.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByTestId("fetch-message")).toBeInTheDocument();
    });

    // Should show success message
    expect(screen.getByTestId("fetch-message")).toHaveTextContent(
      "Изтеглих meta tags от URL. Провери стойностите и натисни Save.",
    );
    expect(screen.getByTestId("fetch-message")).toHaveClass("text-green-700");

    // Should populate all metadata fields
    expect(screen.getByTestId("browser-title")).toHaveTextContent(
      "Example Page Title",
    );
    expect(screen.getByTestId("og-title")).toHaveTextContent("OG Title");
    expect(screen.getByTestId("og-description")).toHaveTextContent(
      "OG Description",
    );
    expect(screen.getByTestId("og-image")).toHaveTextContent(
      "https://example.com/og-image.jpg",
    );
    expect(screen.getByTestId("twitter-title")).toHaveTextContent(
      "Twitter Title",
    );
    expect(screen.getByTestId("twitter-description")).toHaveTextContent(
      "Twitter Description",
    );
    expect(screen.getByTestId("twitter-image")).toHaveTextContent(
      "https://example.com/twitter-image.jpg",
    );

    // Shared fields should be populated from OG/Twitter tags
    expect(screen.getByTestId("social-image")).toHaveTextContent(
      "https://example.com/og-image.jpg",
    );
    expect(screen.getByTestId("social-description")).toHaveTextContent(
      "OG Description",
    );

    // Button should be back to normal state
    expect(fetchButton).toHaveTextContent("Fetch from URL");
    expect(fetchButton).not.toBeDisabled();
  });

  it("handles HTTP error responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Not Found"),
    });

    render(<TestFetchMetadataComponent />);

    const urlInput = screen.getByTestId("url-input");
    const fetchButton = screen.getByTestId("fetch-button");

    await user.type(urlInput, "https://example.com/not-found");
    await user.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByTestId("fetch-message")).toBeInTheDocument();
    });

    // Should show error message
    expect(screen.getByTestId("fetch-message")).toHaveTextContent(
      "HTTP 404 · Неуспешно зареждане на HTML.",
    );
    expect(screen.getByTestId("fetch-message")).toHaveClass("text-red-700");

    // Should not populate any metadata
    expect(screen.getByTestId("browser-title")).toHaveTextContent("");
    expect(screen.getByTestId("og-title")).toHaveTextContent("");
  });

  it("handles network/CORS errors", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    render(<TestFetchMetadataComponent />);

    const urlInput = screen.getByTestId("url-input");
    const fetchButton = screen.getByTestId("fetch-button");

    await user.type(urlInput, "https://example.com/cors-blocked");
    await user.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByTestId("fetch-message")).toBeInTheDocument();
    });

    // Should show CORS error message
    expect(screen.getByTestId("fetch-message")).toHaveTextContent(
      "Неуспешно fetch-ване на URL (вероятно CORS блокировка). Опитай с друг URL или използвай backend proxy.",
    );
    expect(screen.getByTestId("fetch-message")).toHaveClass("text-red-700");
  });

  it("shows appropriate message when no meta tags are found", async () => {
    const mockHtml = "<html><head><title>Simple Page</title></head></html>";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    render(<TestFetchMetadataComponent />);

    const urlInput = screen.getByTestId("url-input");
    const fetchButton = screen.getByTestId("fetch-button");

    await user.type(urlInput, "https://example.com/no-meta");
    await user.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByTestId("fetch-message")).toBeInTheDocument();
    });

    // Should show no meta tags message
    expect(screen.getByTestId("fetch-message")).toHaveTextContent(
      "URL се зареди, но не намерих OG/Twitter meta tags в HTML.",
    );
    expect(screen.getByTestId("fetch-message")).toHaveClass("text-green-700");

    // Should still populate browser title if available
    expect(screen.getByTestId("browser-title")).toHaveTextContent(
      "Simple Page",
    );
    expect(screen.getByTestId("og-title")).toHaveTextContent("");
  });

  it("handles missing DOMParser gracefully", async () => {
    // Mock DOMParser as undefined
    const originalDOMParser = (global as Partial<typeof globalThis>).DOMParser;
    (global as Partial<typeof globalThis>).DOMParser = undefined;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () =>
        Promise.resolve("<html><head><title>Test</title></head></html>"),
    });

    render(<TestFetchMetadataComponent />);

    const urlInput = screen.getByTestId("url-input");
    const fetchButton = screen.getByTestId("fetch-button");

    await user.type(urlInput, "https://example.com");
    await user.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByTestId("fetch-message")).toBeInTheDocument();
    });

    // Should show DOMParser error
    expect(screen.getByTestId("fetch-message")).toHaveTextContent(
      "DOMParser не е наличен в този браузър контекст.",
    );
    expect(screen.getByTestId("fetch-message")).toHaveClass("text-red-700");

    // Restore DOMParser
    (global as Partial<typeof globalThis>).DOMParser = originalDOMParser;
  });

  it("prioritizes og:image over twitter:image for shared social image", async () => {
    const mockHtml = `
      <html>
        <head>
          <meta property="og:image" content="https://example.com/og-image.jpg">
          <meta name="twitter:image" content="https://example.com/twitter-image.jpg">
        </head>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    render(<TestFetchMetadataComponent />);

    const urlInput = screen.getByTestId("url-input");
    const fetchButton = screen.getByTestId("fetch-button");

    await user.type(urlInput, "https://example.com");
    await user.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByTestId("fetch-message")).toBeInTheDocument();
    });

    // Should use og:image for shared social image
    expect(screen.getByTestId("social-image")).toHaveTextContent(
      "https://example.com/og-image.jpg",
    );
    expect(screen.getByTestId("og-image")).toHaveTextContent(
      "https://example.com/og-image.jpg",
    );
    expect(screen.getByTestId("twitter-image")).toHaveTextContent(
      "https://example.com/twitter-image.jpg",
    );
  });

  it("falls back to twitter:image when og:image is missing", async () => {
    const mockHtml = `
      <html>
        <head>
          <meta name="twitter:image" content="https://example.com/twitter-image.jpg">
        </head>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    render(<TestFetchMetadataComponent />);

    const urlInput = screen.getByTestId("url-input");
    const fetchButton = screen.getByTestId("fetch-button");

    await user.type(urlInput, "https://example.com");
    await user.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByTestId("fetch-message")).toBeInTheDocument();
    });

    // Should use twitter:image for both shared and twitter
    expect(screen.getByTestId("social-image")).toHaveTextContent(
      "https://example.com/twitter-image.jpg",
    );
    expect(screen.getByTestId("og-image")).toHaveTextContent("");
    expect(screen.getByTestId("twitter-image")).toHaveTextContent(
      "https://example.com/twitter-image.jpg",
    );
  });

  it("does not fetch with empty URL", async () => {
    render(<TestFetchMetadataComponent />);

    const fetchButton = screen.getByTestId("fetch-button");

    // Click fetch without entering URL
    await user.click(fetchButton);

    // Should not trigger fetch (no loading state)
    expect(fetchButton).toHaveTextContent("Fetch from URL");
    expect(fetchButton).not.toBeDisabled();
    expect(screen.queryByTestId("fetch-message")).not.toBeInTheDocument();

    // Should not have called fetch
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
