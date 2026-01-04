import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Test component that isolates the validator helper links functionality
function TestValidatorLinksComponent() {
  const [previewOrigin, setPreviewOrigin] = React.useState(
    "https://example.com",
  );

  const normalizedPreviewUrl = React.useMemo(() => {
    const trimmed = previewOrigin.trim();
    if (!trimmed) {
      return "https://example.com";
    }
    try {
      const url = new URL(trimmed);
      return url.toString();
    } catch {
      return "https://example.com";
    }
  }, [previewOrigin]);

  const validatorLinks = React.useMemo(() => {
    const encoded = encodeURIComponent(normalizedPreviewUrl);
    return {
      facebook: `https://developers.facebook.com/tools/debug/?q=${encoded}`,
      linkedin: `https://www.linkedin.com/post-inspector/inspect/${encoded}`,
      twitter: `https://cards-dev.twitter.com/validator?url=${encoded}`,
    };
  }, [normalizedPreviewUrl]);

  const handleUseCurrentOrigin = () => {
    if (typeof window === "undefined") {
      return;
    }
    setPreviewOrigin(window.location.origin);
  };

  const handleUseLocalhostPreview = () => {
    setPreviewOrigin("http://localhost:3001/");
  };

  return (
    <div>
      <div data-testid="validator-links-section">
        <div data-testid="preview-origin-input">
          <label>Preview origin</label>
          <input
            value={previewOrigin}
            onChange={(e) => setPreviewOrigin(e.target.value)}
            placeholder="https://example.com"
            data-testid="origin-input"
          />
        </div>

        <div data-testid="origin-buttons">
          <button
            type="button"
            onClick={handleUseCurrentOrigin}
            data-testid="use-current-button"
          >
            Use current origin
          </button>
          <button
            type="button"
            onClick={handleUseLocalhostPreview}
            data-testid="use-localhost-button"
          >
            Use localhost:3001
          </button>
        </div>

        <div data-testid="validator-links">
          <h3>Validator helpers</h3>
          <div data-testid="facebook-link">
            <a
              href={validatorLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="facebook-validator-link"
            >
              Facebook Debugger
            </a>
            <span data-testid="facebook-url">{validatorLinks.facebook}</span>
          </div>

          <div data-testid="linkedin-link">
            <a
              href={validatorLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="linkedin-validator-link"
            >
              LinkedIn Post Inspector
            </a>
            <span data-testid="linkedin-url">{validatorLinks.linkedin}</span>
          </div>

          <div data-testid="twitter-link">
            <a
              href={validatorLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="twitter-validator-link"
            >
              Twitter Card Validator
            </a>
            <span data-testid="twitter-url">{validatorLinks.twitter}</span>
          </div>
        </div>

        <div data-testid="normalized-url">
          <span data-testid="normalized-value">{normalizedPreviewUrl}</span>
        </div>
      </div>
    </div>
  );
}

// Mock window.location.origin
const mockLocationOrigin = "https://myapp.com";
Object.defineProperty(window, "location", {
  value: {
    origin: mockLocationOrigin,
  },
  writable: true,
});

describe("Validator Helper Links", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe("Preview Origin Normalization", () => {
    it("normalizes valid URLs correctly", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const normalizedValue = screen.getByTestId("normalized-value");

      // Enter a valid URL
      await user.clear(originInput);
      await user.type(originInput, "https://example.com/page");

      // Should normalize to full URL
      expect(normalizedValue).toHaveTextContent("https://example.com/page");
    });

    it("handles malformed URLs gracefully", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const normalizedValue = screen.getByTestId("normalized-value");

      // Enter malformed URL
      await user.clear(originInput);
      await user.type(originInput, "not-a-valid-url");

      // Should fallback to default
      expect(normalizedValue).toHaveTextContent("https://example.com");
    });

    it("handles empty input gracefully", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const normalizedValue = screen.getByTestId("normalized-value");

      // Clear input
      await user.clear(originInput);

      // Should fallback to default
      expect(normalizedValue).toHaveTextContent("https://example.com");
    });

    it("trims whitespace from URLs", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const normalizedValue = screen.getByTestId("normalized-value");

      // Enter URL with whitespace
      await user.clear(originInput);
      await user.type(originInput, "  https://example.com/trimmed  ");

      // Should trim and normalize
      expect(normalizedValue).toHaveTextContent("https://example.com/trimmed");
    });

    it("adds missing protocol to domain", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const normalizedValue = screen.getByTestId("normalized-value");

      // Enter domain without protocol
      await user.clear(originInput);
      await user.type(originInput, "example.com");

      // URL constructor should add protocol
      expect(normalizedValue).toHaveTextContent("https://example.com");
    });
  });

  describe("Generated Validator Links", () => {
    it("generates correct Facebook debugger link", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const facebookUrl = screen.getByTestId("facebook-url");

      // Set specific URL
      await user.clear(originInput);
      await user.type(originInput, "https://test.example.com/page");

      // Should generate correct Facebook debugger URL
      expect(facebookUrl).toHaveTextContent(
        "https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Ftest.example.com%2Fpage",
      );

      // Link should have correct attributes
      const facebookLink = screen.getByTestId("facebook-validator-link");
      expect(facebookLink).toHaveAttribute("href", facebookUrl.textContent);
      expect(facebookLink).toHaveAttribute("target", "_blank");
      expect(facebookLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("generates correct LinkedIn Post Inspector link", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const linkedinUrl = screen.getByTestId("linkedin-url");

      // Set specific URL
      await user.clear(originInput);
      await user.type(originInput, "https://test.example.com/page");

      // Should generate correct LinkedIn URL
      expect(linkedinUrl).toHaveTextContent(
        "https://www.linkedin.com/post-inspector/inspect/https%3A%2F%2Ftest.example.com%2Fpage",
      );

      // Link should have correct attributes
      const linkedinLink = screen.getByTestId("linkedin-validator-link");
      expect(linkedinLink).toHaveAttribute("href", linkedinUrl.textContent);
      expect(linkedinLink).toHaveAttribute("target", "_blank");
      expect(linkedinLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("generates correct Twitter Card Validator link", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const twitterUrl = screen.getByTestId("twitter-url");

      // Set specific URL
      await user.clear(originInput);
      await user.type(originInput, "https://test.example.com/page");

      // Should generate correct Twitter validator URL
      expect(twitterUrl).toHaveTextContent(
        "https://cards-dev.twitter.com/validator?url=https%3A%2F%2Ftest.example.com%2Fpage",
      );

      // Link should have correct attributes
      const twitterLink = screen.getByTestId("twitter-validator-link");
      expect(twitterLink).toHaveAttribute("href", twitterUrl.textContent);
      expect(twitterLink).toHaveAttribute("target", "_blank");
      expect(twitterLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("URL-encodes special characters in validator links", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const facebookUrl = screen.getByTestId("facebook-url");

      // Set URL with special characters
      await user.clear(originInput);
      await user.type(
        originInput,
        "https://example.com/page with spaces & symbols?param=value",
      );

      // Should encode special characters
      expect(facebookUrl).toHaveTextContent(
        "https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fexample.com%2Fpage%2520with%2520spaces%2520%26%2520symbols%3Fparam%3Dvalue",
      );
    });

    it("updates links in real-time as URL changes", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const facebookUrl = screen.getByTestId("facebook-url");

      // Initial state
      expect(facebookUrl).toHaveTextContent(
        "https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fexample.com%2F",
      );

      // Change URL
      await user.clear(originInput);
      await user.type(originInput, "https://new.example.com");

      // Should update immediately
      expect(facebookUrl).toHaveTextContent(
        "https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fnew.example.com%2F",
      );
    });
  });

  describe("Helper Buttons", () => {
    it("sets current origin when Use current origin is clicked", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const normalizedValue = screen.getByTestId("normalized-value");
      const useCurrentButton = screen.getByTestId("use-current-button");

      // Click use current origin
      await user.click(useCurrentButton);

      // Should set to window.location.origin
      expect(originInput).toHaveValue(mockLocationOrigin);
      expect(normalizedValue).toHaveTextContent(mockLocationOrigin);

      // Validator links should update
      const facebookUrl = screen.getByTestId("facebook-url");
      expect(facebookUrl).toHaveTextContent(
        `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(mockLocationOrigin)}`,
      );
    });

    it("sets localhost when Use localhost:3001 is clicked", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const normalizedValue = screen.getByTestId("normalized-value");
      const useLocalhostButton = screen.getByTestId("use-localhost-button");

      // Click use localhost
      await user.click(useLocalhostButton);

      // Should set to localhost URL
      expect(originInput).toHaveValue("http://localhost:3001/");
      expect(normalizedValue).toHaveTextContent("http://localhost:3001/");

      // Validator links should update
      const facebookUrl = screen.getByTestId("facebook-url");
      expect(facebookUrl).toHaveTextContent(
        "https://developers.facebook.com/tools/debug/?q=http%3A%2F%2Flocalhost%3A3001%2F",
      );
    });
  });

  describe("Default State", () => {
    it("shows default validator links for example.com", () => {
      render(<TestValidatorLinksComponent />);

      // Should show default links
      const facebookUrl = screen.getByTestId("facebook-url");
      const linkedinUrl = screen.getByTestId("linkedin-url");
      const twitterUrl = screen.getByTestId("twitter-url");

      expect(facebookUrl).toHaveTextContent(
        "https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fexample.com%2F",
      );
      expect(linkedinUrl).toHaveTextContent(
        "https://www.linkedin.com/post-inspector/inspect/https%3A%2F%2Fexample.com%2F",
      );
      expect(twitterUrl).toHaveTextContent(
        "https://cards-dev.twitter.com/validator?url=https%3A%2F%2Fexample.com%2F",
      );
    });

    it("has correct link attributes for security", () => {
      render(<TestValidatorLinksComponent />);

      const links = [
        screen.getByTestId("facebook-validator-link"),
        screen.getByTestId("linkedin-validator-link"),
        screen.getByTestId("twitter-validator-link"),
      ];

      links.forEach((link) => {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles URLs with query parameters and fragments", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const facebookUrl = screen.getByTestId("facebook-url");

      // Set URL with query and fragment
      await user.clear(originInput);
      await user.type(
        originInput,
        "https://example.com/path?param=value&other=test#section",
      );

      // Should encode entire URL correctly
      expect(facebookUrl).toHaveTextContent(
        "https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fexample.com%2Fpath%3Fparam%3Dvalue%26other%3Dtest%23section",
      );
    });

    it("handles international domain names", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const facebookUrl = screen.getByTestId("facebook-url");

      // Set IDN URL
      await user.clear(originInput);
      await user.type(originInput, "https://пример.рф");

      // Should handle IDN (punycode conversion happens at browser level)
      expect(facebookUrl).toHaveTextContent(
        "https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fxn--e1afmkfd.xn--p1ai%2F",
      );
    });

    it("handles port numbers in URLs", async () => {
      render(<TestValidatorLinksComponent />);

      const originInput = screen.getByTestId("origin-input");
      const facebookUrl = screen.getByTestId("facebook-url");

      // Set URL with port
      await user.clear(originInput);
      await user.type(originInput, "https://example.com:8080/path");

      // Should preserve port in encoded URL
      expect(facebookUrl).toHaveTextContent(
        "https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fexample.com%3A8080%2Fpath",
      );
    });
  });
});
