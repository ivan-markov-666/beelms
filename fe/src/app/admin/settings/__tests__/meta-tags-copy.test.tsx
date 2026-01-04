import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Test component that isolates the meta tags snippet + copy functionality
function TestMetaTagsCopyComponent() {
  const [showMetaTagsSnippet, setShowMetaTagsSnippet] = React.useState(false);
  const [browserTitle, setBrowserTitle] = React.useState("");
  const [socialImageUrl] = React.useState("");
  const [socialDescription] = React.useState("");
  const [openGraphTitle, setOpenGraphTitle] = React.useState("");
  const [openGraphDescription, setOpenGraphDescription] = React.useState("");
  const [openGraphImageUrl, setOpenGraphImageUrl] = React.useState("");
  const [twitterTitle, setTwitterTitle] = React.useState("");
  const [twitterDescription] = React.useState("");
  const [twitterImageUrl] = React.useState("");
  const [twitterCard, setTwitterCard] = React.useState("summary_large_image");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const escapeMetaValue = (value: string) => {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  // Calculate preview values with fallback logic
  const ogPreviewTitle =
    openGraphTitle.trim().length > 0
      ? openGraphTitle.trim()
      : browserTitle.trim();
  const ogPreviewDescription =
    openGraphDescription.trim().length > 0
      ? openGraphDescription.trim()
      : socialDescription.trim();
  const ogPreviewImage =
    openGraphImageUrl.trim().length > 0
      ? openGraphImageUrl.trim()
      : socialImageUrl.trim();

  const twitterPreviewTitle =
    twitterTitle.trim().length > 0 ? twitterTitle.trim() : ogPreviewTitle;
  const twitterPreviewDescription =
    twitterDescription.trim().length > 0
      ? twitterDescription.trim()
      : ogPreviewDescription;
  const twitterPreviewImage =
    twitterImageUrl.trim().length > 0
      ? twitterImageUrl.trim()
      : socialImageUrl.trim();

  const socialMetaTagsSnippet = React.useMemo(() => {
    const ogTitleOut = escapeMetaValue(ogPreviewTitle || "");
    const ogDescriptionOut = escapeMetaValue(ogPreviewDescription || "");
    const ogImageOut = ogPreviewImage ? escapeMetaValue(ogPreviewImage) : "";
    const ogUrlOut = escapeMetaValue("https://example.com"); // Mock URL

    const twitterTitleOut = escapeMetaValue(twitterPreviewTitle || "");
    const twitterDescriptionOut = escapeMetaValue(
      twitterPreviewDescription || "",
    );
    const twitterImageOut = twitterPreviewImage
      ? escapeMetaValue(twitterPreviewImage)
      : "";
    const twitterCardOut = escapeMetaValue(twitterCard);

    let snippet = "";

    // Basic meta tags
    if (ogTitleOut) {
      snippet += `<title>${ogTitleOut}</title>\n`;
    }
    if (ogDescriptionOut) {
      snippet += `<meta name="description" content="${ogDescriptionOut}">\n`;
    }

    // Open Graph tags
    if (ogTitleOut) {
      snippet += `<meta property="og:title" content="${ogTitleOut}">\n`;
    }
    if (ogDescriptionOut) {
      snippet += `<meta property="og:description" content="${ogDescriptionOut}">\n`;
    }
    if (ogImageOut) {
      snippet += `<meta property="og:image" content="${ogImageOut}">\n`;
    }
    if (
      ogUrlOut &&
      ogUrlOut !== "https://example.com/" &&
      ogUrlOut !== "https://example.com"
    ) {
      snippet += `<meta property="og:url" content="${ogUrlOut}">\n`;
    }
    if (browserTitle || ogTitleOut || ogDescriptionOut || ogImageOut) {
      snippet += `<meta property="og:type" content="website">\n`;
    }

    // Twitter card tags - only if there's actual content to share
    const hasContent =
      browserTitle ||
      ogTitleOut ||
      ogDescriptionOut ||
      ogImageOut ||
      twitterTitleOut ||
      twitterDescriptionOut ||
      twitterImageOut;
    if (hasContent) {
      snippet += `<meta name="twitter:card" content="${twitterCardOut}">\n`;
    }
    if (twitterTitleOut) {
      snippet += `<meta name="twitter:title" content="${twitterTitleOut}">\n`;
    }
    if (twitterDescriptionOut) {
      snippet += `<meta name="twitter:description" content="${twitterDescriptionOut}">\n`;
    }
    if (twitterImageOut) {
      snippet += `<meta name="twitter:image" content="${twitterImageOut}">\n`;
    }

    return snippet.trim();
  }, [
    browserTitle,
    ogPreviewTitle,
    ogPreviewDescription,
    ogPreviewImage,
    twitterPreviewTitle,
    twitterPreviewDescription,
    twitterPreviewImage,
    twitterCard,
  ]);

  const copyToClipboard = async (text: string) => {
    // Mock clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-999999px";
      textarea.style.top = "-999999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      return new Promise<void>((resolve, reject) => {
        try {
          const successful = document.execCommand("copy");
          document.body.removeChild(textarea);
          if (successful) {
            resolve();
          } else {
            reject(new Error("Unable to copy"));
          }
        } catch (err) {
          document.body.removeChild(textarea);
          reject(err);
        }
      });
    }
  };

  const handleCopyMetaTags = async () => {
    setError(null);
    setSuccess(null);
    try {
      const payload = socialMetaTagsSnippet.trim();
      if (!payload) {
        setError("Няма meta tags за копиране.");
        return;
      }
      await copyToClipboard(payload);
      setSuccess("Meta tags са копирани в clipboard.");
    } catch {
      setError("Неуспешно копиране в clipboard.");
    }
  };

  return (
    <div>
      <div data-testid="meta-tags-controls">
        <button
          type="button"
          onClick={handleCopyMetaTags}
          data-testid="copy-button"
        >
          Copy meta tags
        </button>
        <button
          type="button"
          onClick={() => setShowMetaTagsSnippet((prev) => !prev)}
          data-testid="toggle-button"
        >
          {showMetaTagsSnippet ? "Hide meta tags" : "View meta tags"}
        </button>
      </div>

      <div data-testid="meta-tags-inputs">
        <input
          value={browserTitle}
          onChange={(e) => setBrowserTitle(e.target.value)}
          placeholder="Browser title"
          data-testid="browser-title-input"
        />
        <input
          value={openGraphTitle}
          onChange={(e) => setOpenGraphTitle(e.target.value)}
          placeholder="OG title"
          data-testid="og-title-input"
        />
        <input
          value={openGraphDescription}
          onChange={(e) => setOpenGraphDescription(e.target.value)}
          placeholder="OG description"
          data-testid="og-description-input"
        />
        <input
          value={openGraphImageUrl}
          onChange={(e) => setOpenGraphImageUrl(e.target.value)}
          placeholder="OG image"
          data-testid="og-image-input"
        />
        <input
          value={twitterTitle}
          onChange={(e) => setTwitterTitle(e.target.value)}
          placeholder="Twitter title"
          data-testid="twitter-title-input"
        />
        <input
          value={twitterCard}
          onChange={(e) => setTwitterCard(e.target.value)}
          data-testid="twitter-card-input"
        />
      </div>

      {showMetaTagsSnippet && (
        <div data-testid="meta-tags-snippet">
          <label>Generated meta tags (read-only)</label>
          <textarea
            value={socialMetaTagsSnippet}
            readOnly
            rows={10}
            data-testid="snippet-textarea"
          />
        </div>
      )}

      {error && (
        <div data-testid="error-message" className="text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div data-testid="success-message" className="text-green-700">
          {success}
        </div>
      )}
    </div>
  );
}

// Mock clipboard API
const mockWriteText = jest.fn();
const mockExecCommand = jest.fn();
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: mockWriteText,
  },
  configurable: true,
});

describe("Meta Tags Snippet + Copy", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockWriteText.mockClear();
    mockExecCommand.mockReset();
    mockExecCommand.mockReturnValue(true);
    (
      document as unknown as { execCommand: typeof mockExecCommand }
    ).execCommand = mockExecCommand;
    Object.defineProperty(window, "isSecureContext", {
      value: false,
      configurable: true,
    });
  });

  it("toggles meta tags snippet visibility", async () => {
    render(<TestMetaTagsCopyComponent />);

    // Initially hidden
    expect(screen.queryByTestId("meta-tags-snippet")).not.toBeInTheDocument();
    expect(screen.getByTestId("toggle-button")).toHaveTextContent(
      "View meta tags",
    );

    // Click to show
    await user.click(screen.getByTestId("toggle-button"));

    // Should be visible
    expect(screen.getByTestId("meta-tags-snippet")).toBeInTheDocument();
    expect(screen.getByTestId("snippet-textarea")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-button")).toHaveTextContent(
      "Hide meta tags",
    );

    // Click to hide
    await user.click(screen.getByTestId("toggle-button"));

    // Should be hidden again
    expect(screen.queryByTestId("meta-tags-snippet")).not.toBeInTheDocument();
    expect(screen.getByTestId("toggle-button")).toHaveTextContent(
      "View meta tags",
    );
  });

  it("updates snippet text as state changes", async () => {
    render(<TestMetaTagsCopyComponent />);

    // Show snippet
    await user.click(screen.getByTestId("toggle-button"));
    const textarea = screen.getByTestId(
      "snippet-textarea",
    ) as HTMLTextAreaElement;

    // Initially empty
    expect(textarea.value).toBe("");

    // Add browser title
    const browserTitleInput = screen.getByTestId(
      "browser-title-input",
    ) as HTMLInputElement;
    await user.type(browserTitleInput, "Test Page Title");

    // Should update snippet
    expect(textarea.value).toContain("<title>Test Page Title</title>");
    expect(textarea.value).toContain(
      '<meta property="og:title" content="Test Page Title">',
    );
    expect(textarea.value).toContain(
      '<meta name="twitter:title" content="Test Page Title">',
    );
  });

  it("generates complete meta tags with all fields", async () => {
    render(<TestMetaTagsCopyComponent />);

    // Fill all fields
    await user.type(screen.getByTestId("browser-title-input"), "My Website");
    await user.type(screen.getByTestId("og-title-input"), "OG Title Here");
    await user.type(
      screen.getByTestId("og-description-input"),
      "OG description for sharing",
    );
    await user.type(
      screen.getByTestId("og-image-input"),
      "https://example.com/image.jpg",
    );
    await user.type(
      screen.getByTestId("twitter-title-input"),
      "Twitter Specific Title",
    );

    // Show snippet
    await user.click(screen.getByTestId("toggle-button"));
    const textarea = screen.getByTestId(
      "snippet-textarea",
    ) as HTMLTextAreaElement;

    // Should contain all meta tags
    expect(textarea.value).toContain("<title>OG Title Here</title>");
    expect(textarea.value).toContain(
      '<meta name="description" content="OG description for sharing">',
    );
    expect(textarea.value).toContain(
      '<meta property="og:title" content="OG Title Here">',
    );
    expect(textarea.value).toContain(
      '<meta property="og:description" content="OG description for sharing">',
    );
    expect(textarea.value).toContain(
      '<meta property="og:image" content="https://example.com/image.jpg">',
    );
    expect(textarea.value).toContain(
      '<meta property="og:type" content="website">',
    );
    expect(textarea.value).toContain(
      '<meta name="twitter:card" content="summary_large_image">',
    );
    expect(textarea.value).toContain(
      '<meta name="twitter:title" content="Twitter Specific Title">',
    );
    expect(textarea.value).toContain(
      '<meta name="twitter:description" content="OG description for sharing">',
    );
  });

  it("uses fallback logic correctly", async () => {
    render(<TestMetaTagsCopyComponent />);

    // Only fill browser title (should fallback to OG and Twitter)
    await user.type(
      screen.getByTestId("browser-title-input"),
      "Fallback Title",
    );

    // Show snippet
    await user.click(screen.getByTestId("toggle-button"));
    const textarea = screen.getByTestId(
      "snippet-textarea",
    ) as HTMLTextAreaElement;

    // Should use browser title as fallback
    expect(textarea.value).toContain("<title>Fallback Title</title>");
    expect(textarea.value).toContain(
      '<meta property="og:title" content="Fallback Title">',
    );
    expect(textarea.value).toContain(
      '<meta name="twitter:title" content="Fallback Title">',
    );
  });

  it("copies meta tags to clipboard successfully", async () => {
    render(<TestMetaTagsCopyComponent />);

    // Add some content
    await user.type(screen.getByTestId("browser-title-input"), "Test Title");
    await user.type(
      screen.getByTestId("og-description-input"),
      "Test description",
    );

    // Ensure snippet exists before copy (defensive)
    await user.click(screen.getByTestId("toggle-button"));

    // Copy meta tags
    await user.click(screen.getByTestId("copy-button"));

    expect(mockExecCommand).toHaveBeenCalledWith("copy");

    // Should show success message
    expect(screen.getByTestId("success-message")).toHaveTextContent(
      "Meta tags са копирани в clipboard.",
    );
    expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
  });

  it("shows error when no meta tags to copy", async () => {
    render(<TestMetaTagsCopyComponent />);

    // Try to copy without any content
    await user.click(screen.getByTestId("copy-button"));

    // Should show error message
    expect(screen.getByTestId("error-message")).toHaveTextContent(
      "Няма meta tags за копиране.",
    );
    expect(screen.queryByTestId("success-message")).not.toBeInTheDocument();

    // Should not attempt to copy
    expect(mockExecCommand).not.toHaveBeenCalled();
  });

  it("handles clipboard copy failure", async () => {
    mockExecCommand.mockImplementation(() => {
      throw new Error("Clipboard failed");
    });

    render(<TestMetaTagsCopyComponent />);

    // Add some content
    await user.type(screen.getByTestId("browser-title-input"), "Test Title");

    // Try to copy
    await user.click(screen.getByTestId("copy-button"));

    // Should show error message
    expect(screen.getByTestId("error-message")).toHaveTextContent(
      "Неуспешно копиране в clipboard.",
    );
    expect(screen.queryByTestId("success-message")).not.toBeInTheDocument();
  });

  it("escapes HTML special characters in meta tags", async () => {
    render(<TestMetaTagsCopyComponent />);

    // Add content with special characters
    await user.type(
      screen.getByTestId("og-title-input"),
      'Title with "quotes" & <brackets>',
    );
    await user.type(
      screen.getByTestId("og-description-input"),
      "Description with 'apostrophes' & ampersands",
    );

    // Show snippet
    await user.click(screen.getByTestId("toggle-button"));
    const textarea = screen.getByTestId(
      "snippet-textarea",
    ) as HTMLTextAreaElement;

    // Should escape special characters
    expect(textarea.value).toContain(
      "&quot;quotes&quot; &amp; &lt;brackets&gt;",
    );
    expect(textarea.value).toContain("&#39;apostrophes&#39; &amp; ampersands");
  });

  it("updates snippet in real-time as fields change", async () => {
    render(<TestMetaTagsCopyComponent />);

    // Show snippet
    await user.click(screen.getByTestId("toggle-button"));
    const textarea = screen.getByTestId(
      "snippet-textarea",
    ) as HTMLTextAreaElement;
    const ogTitleInput = screen.getByTestId(
      "og-title-input",
    ) as HTMLInputElement;

    // Type character by character
    await user.type(ogTitleInput, "A");
    expect(textarea.value).toContain("<title>A</title>");

    await user.type(ogTitleInput, "B");
    expect(textarea.value).toContain("<title>AB</title>");

    await user.type(ogTitleInput, "C");
    expect(textarea.value).toContain("<title>ABC</title>");

    // Clear field
    await user.clear(ogTitleInput);
    expect(textarea.value).not.toContain("<title>");
  });

  it("respects twitter card type changes", async () => {
    render(<TestMetaTagsCopyComponent />);

    // Show snippet
    await user.click(screen.getByTestId("toggle-button"));
    const textarea = screen.getByTestId(
      "snippet-textarea",
    ) as HTMLTextAreaElement;
    const twitterCardInput = screen.getByTestId(
      "twitter-card-input",
    ) as HTMLInputElement;

    await user.type(screen.getByTestId("browser-title-input"), "X");

    // Change twitter card type
    await user.clear(twitterCardInput);
    await user.type(twitterCardInput, "summary");

    // Should update twitter:card meta tag
    expect(textarea.value).toContain(
      '<meta name="twitter:card" content="summary">',
    );

    // Change to player
    await user.clear(twitterCardInput);
    await user.type(twitterCardInput, "player");
    expect(textarea.value).toContain(
      '<meta name="twitter:card" content="player">',
    );
  });
});
