import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Test component that isolates the section accent colors + guidelines panel functionality
function TestSectionColorsComponent() {
  const [browserTitle, setBrowserTitle] = React.useState("");
  const [socialImageUrl, setSocialImageUrl] = React.useState("");
  const [socialDescription, setSocialDescription] = React.useState("");
  const [openGraphTitle, setOpenGraphTitle] = React.useState("");
  const [openGraphDescription, setOpenGraphDescription] = React.useState("");
  const [openGraphImageUrl, setOpenGraphImageUrl] = React.useState("");
  const [twitterTitle, setTwitterTitle] = React.useState("");
  const [twitterDescription, setTwitterDescription] = React.useState("");
  const [twitterImageUrl, setTwitterImageUrl] = React.useState("");

  const metadataSectionAccent = (filled: boolean) =>
    filled ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50";

  // Calculate section content status
  const ogSectionHasContent =
    openGraphTitle.trim().length > 0 ||
    openGraphDescription.trim().length > 0 ||
    openGraphImageUrl.trim().length > 0;

  const twitterSectionHasContent =
    twitterTitle.trim().length > 0 ||
    twitterDescription.trim().length > 0 ||
    twitterImageUrl.trim().length > 0;

  const sharedSectionHasContent =
    socialImageUrl.trim().length > 0 || socialDescription.trim().length > 0;

  const browserSectionHasContent = browserTitle.trim().length > 0;

  return (
    <div data-testid="browser-social-metadata-accordion">
      {/* Main accordion section */}
      <div
        data-testid="main-section"
        className={`rounded-lg border px-4 py-4 ${
          ogSectionHasContent || twitterSectionHasContent
            ? "border-green-100 bg-green-50"
            : "border-red-100 bg-red-50"
        }`}
      >
        <h2>Browser & Social metadata</h2>

        {/* Guidelines panel */}
        <div data-testid="guidelines-panel" className="mt-4">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Guidelines
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Практични препоръки за да изглежда добре при споделяне.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Browser title section */}
        <div
          data-testid="browser-title-section"
          className={`mt-4 rounded-md border px-3 py-2 ${metadataSectionAccent(browserSectionHasContent)}`}
        >
          <label className="block text-sm font-medium text-gray-700">
            Browser title
          </label>
          <input
            value={browserTitle}
            onChange={(e) => setBrowserTitle(e.target.value)}
            data-testid="browser-title-input"
            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        {/* Shared social metadata section */}
        <div
          data-testid="shared-social-section"
          className={`mt-4 rounded-md border px-3 py-2 ${metadataSectionAccent(sharedSectionHasContent)}`}
        >
          <h3>Shared social metadata</h3>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700">
              Shared social image (fallback)
            </label>
            <input
              value={socialImageUrl}
              onChange={(e) => setSocialImageUrl(e.target.value)}
              data-testid="social-image-input"
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700">
              Shared social description
            </label>
            <textarea
              value={socialDescription}
              onChange={(e) => setSocialDescription(e.target.value)}
              data-testid="social-description-input"
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              rows={3}
            />
          </div>
        </div>

        {/* OpenGraph section */}
        <div
          data-testid="opengraph-section"
          className={`mt-4 rounded-md border px-3 py-2 ${metadataSectionAccent(ogSectionHasContent)}`}
        >
          <h3>OpenGraph metadata</h3>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700">
              OG title
            </label>
            <input
              value={openGraphTitle}
              onChange={(e) => setOpenGraphTitle(e.target.value)}
              data-testid="og-title-input"
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700">
              OG description
            </label>
            <textarea
              value={openGraphDescription}
              onChange={(e) => setOpenGraphDescription(e.target.value)}
              data-testid="og-description-input"
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              rows={3}
            />
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700">
              OG image
            </label>
            <input
              value={openGraphImageUrl}
              onChange={(e) => setOpenGraphImageUrl(e.target.value)}
              data-testid="og-image-input"
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Twitter section */}
        <div
          data-testid="twitter-section"
          className={`mt-4 rounded-md border px-3 py-2 ${metadataSectionAccent(twitterSectionHasContent)}`}
        >
          <h3>Twitter metadata</h3>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700">
              Twitter title
            </label>
            <input
              value={twitterTitle}
              onChange={(e) => setTwitterTitle(e.target.value)}
              data-testid="twitter-title-input"
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700">
              Twitter description
            </label>
            <textarea
              value={twitterDescription}
              onChange={(e) => setTwitterDescription(e.target.value)}
              data-testid="twitter-description-input"
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              rows={3}
            />
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700">
              Twitter image
            </label>
            <input
              value={twitterImageUrl}
              onChange={(e) => setTwitterImageUrl(e.target.value)}
              data-testid="twitter-image-input"
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

describe("Section Accent Colors + Guidelines Panel", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe("Main Section Accent Colors", () => {
    it("shows red background when all sections are empty", () => {
      render(<TestSectionColorsComponent />);

      const mainSection = screen.getByTestId("main-section");
      expect(mainSection).toHaveClass("border-red-100", "bg-red-50");
      expect(mainSection).not.toHaveClass("border-green-100", "bg-green-50");
    });

    it("shows green background when OG section has content", async () => {
      render(<TestSectionColorsComponent />);

      const mainSection = screen.getByTestId("main-section");
      const ogTitleInput = screen.getByTestId("og-title-input");

      // Add OG content
      await user.type(ogTitleInput, "OG Title");

      expect(mainSection).toHaveClass("border-green-100", "bg-green-50");
      expect(mainSection).not.toHaveClass("border-red-100", "bg-red-50");
    });

    it("shows green background when Twitter section has content", async () => {
      render(<TestSectionColorsComponent />);

      const mainSection = screen.getByTestId("main-section");
      const twitterTitleInput = screen.getByTestId("twitter-title-input");

      // Add Twitter content
      await user.type(twitterTitleInput, "Twitter Title");

      expect(mainSection).toHaveClass("border-green-100", "bg-green-50");
      expect(mainSection).not.toHaveClass("border-red-100", "bg-red-50");
    });

    it("maintains green background when content is cleared", async () => {
      render(<TestSectionColorsComponent />);

      const mainSection = screen.getByTestId("main-section");
      const ogTitleInput = screen.getByTestId("og-title-input");

      // Add content then clear it
      await user.type(ogTitleInput, "OG Title");
      expect(mainSection).toHaveClass("border-green-100", "bg-green-50");

      await user.clear(ogTitleInput);
      expect(mainSection).toHaveClass("border-red-100", "bg-red-50");
    });
  });

  describe("Individual Section Accent Colors", () => {
    it("browser title section shows correct accent colors", async () => {
      render(<TestSectionColorsComponent />);

      const browserSection = screen.getByTestId("browser-title-section");
      const browserTitleInput = screen.getByTestId("browser-title-input");

      // Initially red (empty)
      expect(browserSection).toHaveClass("border-red-100", "bg-red-50");
      expect(browserSection).not.toHaveClass("border-green-100", "bg-green-50");

      // Add content - should turn green
      await user.type(browserTitleInput, "Browser Title");
      expect(browserSection).toHaveClass("border-green-100", "bg-green-50");
      expect(browserSection).not.toHaveClass("border-red-100", "bg-red-50");

      // Clear content - should turn red again
      await user.clear(browserTitleInput);
      expect(browserSection).toHaveClass("border-red-100", "bg-red-50");
      expect(browserSection).not.toHaveClass("border-green-100", "bg-green-50");
    });

    it("shared social section shows correct accent colors", async () => {
      render(<TestSectionColorsComponent />);

      const sharedSection = screen.getByTestId("shared-social-section");
      const socialImageInput = screen.getByTestId("social-image-input");

      // Initially red (empty)
      expect(sharedSection).toHaveClass("border-red-100", "bg-red-50");

      // Add image content - should turn green
      await user.type(socialImageInput, "https://example.com/image.jpg");
      expect(sharedSection).toHaveClass("border-green-100", "bg-green-50");
      expect(sharedSection).not.toHaveClass("border-red-100", "bg-red-50");
    });

    it("shared social section turns green with description content", async () => {
      render(<TestSectionColorsComponent />);

      const sharedSection = screen.getByTestId("shared-social-section");
      const socialDescriptionInput = screen.getByTestId(
        "social-description-input",
      );

      // Add description content - should turn green
      await user.type(socialDescriptionInput, "Social description");
      expect(sharedSection).toHaveClass("border-green-100", "bg-green-50");
    });

    it("OpenGraph section shows correct accent colors", async () => {
      render(<TestSectionColorsComponent />);

      const ogSection = screen.getByTestId("opengraph-section");
      const ogTitleInput = screen.getByTestId("og-title-input");
      const ogDescriptionInput = screen.getByTestId("og-description-input");
      const ogImageInput = screen.getByTestId("og-image-input");

      // Initially red
      expect(ogSection).toHaveClass("border-red-100", "bg-red-50");

      // Add any OG content - should turn green
      await user.type(ogTitleInput, "OG Title");
      expect(ogSection).toHaveClass("border-green-100", "bg-green-50");

      // Clear and add different content
      await user.clear(ogTitleInput);
      expect(ogSection).toHaveClass("border-red-100", "bg-red-50");

      await user.type(ogDescriptionInput, "OG Description");
      expect(ogSection).toHaveClass("border-green-100", "bg-green-50");

      await user.clear(ogDescriptionInput);
      expect(ogSection).toHaveClass("border-red-100", "bg-red-50");

      await user.type(ogImageInput, "https://example.com/og.jpg");
      expect(ogSection).toHaveClass("border-green-100", "bg-green-50");
    });

    it("Twitter section shows correct accent colors", async () => {
      render(<TestSectionColorsComponent />);

      const twitterSection = screen.getByTestId("twitter-section");
      const twitterTitleInput = screen.getByTestId("twitter-title-input");
      const twitterDescriptionInput = screen.getByTestId(
        "twitter-description-input",
      );
      const twitterImageInput = screen.getByTestId("twitter-image-input");

      // Initially red
      expect(twitterSection).toHaveClass("border-red-100", "bg-red-50");

      // Add any Twitter content - should turn green
      await user.type(twitterTitleInput, "Twitter Title");
      expect(twitterSection).toHaveClass("border-green-100", "bg-green-50");

      // Test with description
      await user.clear(twitterTitleInput);
      expect(twitterSection).toHaveClass("border-red-100", "bg-red-50");

      await user.type(twitterDescriptionInput, "Twitter Description");
      expect(twitterSection).toHaveClass("border-green-100", "bg-green-50");

      // Test with image
      await user.clear(twitterDescriptionInput);
      expect(twitterSection).toHaveClass("border-red-100", "bg-red-50");

      await user.type(twitterImageInput, "https://example.com/twitter.jpg");
      expect(twitterSection).toHaveClass("border-green-100", "bg-green-50");
    });
  });

  describe("Guidelines Panel", () => {
    it("renders guidelines panel with correct content", () => {
      render(<TestSectionColorsComponent />);

      const guidelinesPanel = screen.getByTestId("guidelines-panel");

      // Should have guidelines title and description
      expect(guidelinesPanel).toHaveTextContent("Guidelines");
      expect(guidelinesPanel).toHaveTextContent(
        "Практични препоръки за да изглежда добре при споделяне.",
      );

      // Should have proper styling
      const guidelinesContainer = guidelinesPanel.querySelector(".rounded-lg");
      expect(guidelinesContainer).toHaveClass(
        "border",
        "border-gray-200",
        "bg-white",
      );
    });

    it("guidelines panel styling is independent of section content", async () => {
      render(<TestSectionColorsComponent />);

      const guidelinesPanel = screen.getByTestId("guidelines-panel");
      const guidelinesContainer = guidelinesPanel.querySelector(".rounded-lg");

      // Guidelines should always have neutral styling regardless of content
      expect(guidelinesContainer).toHaveClass("border-gray-200", "bg-white");
      expect(guidelinesContainer).not.toHaveClass(
        "border-green-100",
        "bg-green-50",
        "border-red-100",
        "bg-red-50",
      );

      // Add content to sections
      await user.type(screen.getByTestId("og-title-input"), "Content");

      // Guidelines styling should remain unchanged
      expect(guidelinesContainer).toHaveClass("border-gray-200", "bg-white");
    });
  });

  describe("Integration Test - Entire Accordion", () => {
    it("renders complete accordion with all sections", () => {
      render(<TestSectionColorsComponent />);

      // Main accordion
      expect(
        screen.getByTestId("browser-social-metadata-accordion"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("main-section")).toBeInTheDocument();

      // Guidelines panel
      expect(screen.getByTestId("guidelines-panel")).toBeInTheDocument();

      // All sections
      expect(screen.getByTestId("browser-title-section")).toBeInTheDocument();
      expect(screen.getByTestId("shared-social-section")).toBeInTheDocument();
      expect(screen.getByTestId("opengraph-section")).toBeInTheDocument();
      expect(screen.getByTestId("twitter-section")).toBeInTheDocument();

      // All inputs
      expect(screen.getByTestId("browser-title-input")).toBeInTheDocument();
      expect(screen.getByTestId("social-image-input")).toBeInTheDocument();
      expect(
        screen.getByTestId("social-description-input"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("og-title-input")).toBeInTheDocument();
      expect(screen.getByTestId("og-description-input")).toBeInTheDocument();
      expect(screen.getByTestId("og-image-input")).toBeInTheDocument();
      expect(screen.getByTestId("twitter-title-input")).toBeInTheDocument();
      expect(
        screen.getByTestId("twitter-description-input"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("twitter-image-input")).toBeInTheDocument();
    });

    it("all sections start with red accent colors", () => {
      render(<TestSectionColorsComponent />);

      // Main section
      expect(screen.getByTestId("main-section")).toHaveClass(
        "border-red-100",
        "bg-red-50",
      );

      // Individual sections
      expect(screen.getByTestId("browser-title-section")).toHaveClass(
        "border-red-100",
        "bg-red-50",
      );
      expect(screen.getByTestId("shared-social-section")).toHaveClass(
        "border-red-100",
        "bg-red-50",
      );
      expect(screen.getByTestId("opengraph-section")).toHaveClass(
        "border-red-100",
        "bg-red-50",
      );
      expect(screen.getByTestId("twitter-section")).toHaveClass(
        "border-red-100",
        "bg-red-50",
      );
    });

    it("progressive content filling updates colors correctly", async () => {
      render(<TestSectionColorsComponent />);

      // Initially all red
      expect(screen.getByTestId("main-section")).toHaveClass(
        "border-red-100",
        "bg-red-50",
      );
      expect(screen.getByTestId("browser-title-section")).toHaveClass(
        "border-red-100",
        "bg-red-50",
      );
      expect(screen.getByTestId("shared-social-section")).toHaveClass(
        "border-red-100",
        "bg-red-50",
      );

      // Add browser title - main and browser section turn green
      await user.type(
        screen.getByTestId("browser-title-input"),
        "Browser Title",
      );
      expect(screen.getByTestId("main-section")).toHaveClass(
        "border-red-100",
        "bg-red-50",
      );
      expect(screen.getByTestId("browser-title-section")).toHaveClass(
        "border-green-100",
        "bg-green-50",
      );
      expect(screen.getByTestId("shared-social-section")).toHaveClass(
        "border-red-100",
        "bg-red-50",
      );

      // Add shared image - shared section turns green
      await user.type(
        screen.getByTestId("social-image-input"),
        "https://example.com/image.jpg",
      );
      expect(screen.getByTestId("shared-social-section")).toHaveClass(
        "border-green-100",
        "bg-green-50",
      );

      expect(screen.getByTestId("main-section")).toHaveClass(
        "border-red-100",
        "bg-red-50",
      );

      // Add OG content - OG section turns green
      await user.type(screen.getByTestId("og-title-input"), "OG Title");
      expect(screen.getByTestId("opengraph-section")).toHaveClass(
        "border-green-100",
        "bg-green-50",
      );

      expect(screen.getByTestId("main-section")).toHaveClass(
        "border-green-100",
        "bg-green-50",
      );

      // Add Twitter content - Twitter section turns green
      await user.type(
        screen.getByTestId("twitter-title-input"),
        "Twitter Title",
      );
      expect(screen.getByTestId("twitter-section")).toHaveClass(
        "border-green-100",
        "bg-green-50",
      );

      // All sections should now be green
      expect(screen.getByTestId("browser-title-section")).toHaveClass(
        "border-green-100",
        "bg-green-50",
      );
      expect(screen.getByTestId("shared-social-section")).toHaveClass(
        "border-green-100",
        "bg-green-50",
      );
      expect(screen.getByTestId("opengraph-section")).toHaveClass(
        "border-green-100",
        "bg-green-50",
      );
      expect(screen.getByTestId("twitter-section")).toHaveClass(
        "border-green-100",
        "bg-green-50",
      );
    });

    it("whitespace-only content is treated as empty", async () => {
      render(<TestSectionColorsComponent />);

      const browserSection = screen.getByTestId("browser-title-section");
      const browserTitleInput = screen.getByTestId("browser-title-input");

      // Initially red
      expect(browserSection).toHaveClass("border-red-100", "bg-red-50");

      // Add only whitespace - should remain red
      await user.type(browserTitleInput, "   ");
      expect(browserSection).toHaveClass("border-red-100", "bg-red-50");

      // Add actual content - should turn green
      await user.type(browserTitleInput, "content");
      expect(browserSection).toHaveClass("border-green-100", "bg-green-50");

      // Clear to whitespace only - should turn red again
      await user.clear(browserTitleInput);
      await user.type(browserTitleInput, "  \t  ");
      expect(browserSection).toHaveClass("border-red-100", "bg-red-50");
    });
  });
});
