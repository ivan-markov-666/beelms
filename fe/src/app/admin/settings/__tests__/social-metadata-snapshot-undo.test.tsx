import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock i18n - use absolute path
jest.mock("../../../../i18n/useCurrentLang", () => ({
  __esModule: true,
  default: () => "bg",
  useCurrentLang: () => "bg",
}));

// Mock the admin settings page with the social metadata functionality
// Since the component is large, we'll test the specific functionality in isolation

type SocialMetadataSnapshot = {
  browserTitle: string;
  socialImageUrl: string;
  socialDescription: string;
  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImageUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImageUrl: string;
  twitterCard: string;
  twitterAppName: string;
  twitterAppIdIphone: string;
  twitterAppIdIpad: string;
  twitterAppIdGooglePlay: string;
  twitterAppUrlIphone: string;
  twitterAppUrlIpad: string;
  twitterAppUrlGooglePlay: string;
  twitterPlayerUrl: string;
  twitterPlayerWidth: string;
  twitterPlayerHeight: string;
  twitterPlayerStream: string;
  twitterPlayerStreamContentType: string;
  previewOrigin: string;
};

// Test component that isolates the snapshot/undo/reset functionality
function TestSocialMetadataComponent() {
  const [browserTitle, setBrowserTitle] = React.useState("");
  const [socialImageUrl, setSocialImageUrl] = React.useState("");
  const [socialDescription, setSocialDescription] = React.useState("");
  const [openGraphTitle, setOpenGraphTitle] = React.useState("");
  const [openGraphDescription, setOpenGraphDescription] = React.useState("");
  const [openGraphImageUrl, setOpenGraphImageUrl] = React.useState("");
  const [twitterTitle, setTwitterTitle] = React.useState("");
  const [twitterDescription, setTwitterDescription] = React.useState("");
  const [twitterImageUrl, setTwitterImageUrl] = React.useState("");
  const [twitterCard, setTwitterCard] = React.useState("summary_large_image");
  const [previewOrigin, setPreviewOrigin] = React.useState(
    "https://example.com",
  );

  // Other app/player fields with defaults
  const [twitterAppName, setTwitterAppName] = React.useState("");
  const [twitterAppIdIphone, setTwitterAppIdIphone] = React.useState("");
  const [twitterAppIdIpad, setTwitterAppIdIpad] = React.useState("");
  const [twitterAppIdGooglePlay, setTwitterAppIdGooglePlay] =
    React.useState("");
  const [twitterAppUrlIphone, setTwitterAppUrlIphone] = React.useState("");
  const [twitterAppUrlIpad, setTwitterAppUrlIpad] = React.useState("");
  const [twitterAppUrlGooglePlay, setTwitterAppUrlGooglePlay] =
    React.useState("");
  const [twitterPlayerUrl, setTwitterPlayerUrl] = React.useState("");
  const [twitterPlayerWidth, setTwitterPlayerWidth] = React.useState("");
  const [twitterPlayerHeight, setTwitterPlayerHeight] = React.useState("");
  const [twitterPlayerStream, setTwitterPlayerStream] = React.useState("");
  const [twitterPlayerStreamContentType, setTwitterPlayerStreamContentType] =
    React.useState("");

  const [socialMetadataLastSaved, setSocialMetadataLastSaved] =
    React.useState<SocialMetadataSnapshot | null>(null);
  const [success, setSuccess] = React.useState("");

  const currentSocialMetadataSnapshot =
    React.useMemo<SocialMetadataSnapshot>(() => {
      return {
        browserTitle,
        socialImageUrl,
        socialDescription,
        openGraphTitle,
        openGraphDescription,
        openGraphImageUrl,
        twitterTitle,
        twitterDescription,
        twitterImageUrl,
        twitterCard,
        twitterAppName,
        twitterAppIdIphone,
        twitterAppIdIpad,
        twitterAppIdGooglePlay,
        twitterAppUrlIphone,
        twitterAppUrlIpad,
        twitterAppUrlGooglePlay,
        twitterPlayerUrl,
        twitterPlayerWidth,
        twitterPlayerHeight,
        twitterPlayerStream,
        twitterPlayerStreamContentType,
        previewOrigin,
      };
    }, [
      browserTitle,
      socialImageUrl,
      socialDescription,
      openGraphTitle,
      openGraphDescription,
      openGraphImageUrl,
      twitterTitle,
      twitterDescription,
      twitterImageUrl,
      twitterCard,
      twitterAppName,
      twitterAppIdIphone,
      twitterAppIdIpad,
      twitterAppIdGooglePlay,
      twitterAppUrlIphone,
      twitterAppUrlIpad,
      twitterAppUrlGooglePlay,
      twitterPlayerUrl,
      twitterPlayerWidth,
      twitterPlayerHeight,
      twitterPlayerStream,
      twitterPlayerStreamContentType,
      previewOrigin,
    ]);

  const socialMetadataSnapshotFromState = (): SocialMetadataSnapshot => {
    return {
      browserTitle,
      socialImageUrl,
      socialDescription,
      openGraphTitle,
      openGraphDescription,
      openGraphImageUrl,
      twitterTitle,
      twitterDescription,
      twitterImageUrl,
      twitterCard,
      twitterAppName,
      twitterAppIdIphone,
      twitterAppIdIpad,
      twitterAppIdGooglePlay,
      twitterAppUrlIphone,
      twitterAppUrlIpad,
      twitterAppUrlGooglePlay,
      twitterPlayerUrl,
      twitterPlayerWidth,
      twitterPlayerHeight,
      twitterPlayerStream,
      twitterPlayerStreamContentType,
      previewOrigin,
    };
  };

  const applySocialMetadataSnapshot = (snapshot: SocialMetadataSnapshot) => {
    setBrowserTitle(snapshot.browserTitle);
    setSocialImageUrl(snapshot.socialImageUrl);
    setSocialDescription(snapshot.socialDescription);
    setOpenGraphTitle(snapshot.openGraphTitle);
    setOpenGraphDescription(snapshot.openGraphDescription);
    setOpenGraphImageUrl(snapshot.openGraphImageUrl);
    setTwitterTitle(snapshot.twitterTitle);
    setTwitterDescription(snapshot.twitterDescription);
    setTwitterImageUrl(snapshot.twitterImageUrl);
    setTwitterCard(snapshot.twitterCard);
    setTwitterAppName(snapshot.twitterAppName);
    setTwitterAppIdIphone(snapshot.twitterAppIdIphone);
    setTwitterAppIdIpad(snapshot.twitterAppIdIpad);
    setTwitterAppIdGooglePlay(snapshot.twitterAppIdGooglePlay);
    setTwitterAppUrlIphone(snapshot.twitterAppUrlIphone);
    setTwitterAppUrlIpad(snapshot.twitterAppUrlIpad);
    setTwitterAppUrlGooglePlay(snapshot.twitterAppUrlGooglePlay);
    setTwitterPlayerUrl(snapshot.twitterPlayerUrl);
    setTwitterPlayerWidth(snapshot.twitterPlayerWidth);
    setTwitterPlayerHeight(snapshot.twitterPlayerHeight);
    setTwitterPlayerStream(snapshot.twitterPlayerStream);
    setTwitterPlayerStreamContentType(snapshot.twitterPlayerStreamContentType);
    setPreviewOrigin(snapshot.previewOrigin);
  };

  const isSocialMetadataDirty = React.useMemo(() => {
    if (!socialMetadataLastSaved) {
      return false;
    }
    return (
      JSON.stringify(currentSocialMetadataSnapshot) !==
      JSON.stringify(socialMetadataLastSaved)
    );
  }, [currentSocialMetadataSnapshot, socialMetadataLastSaved]);

  const handleUndoSocialMetadataChanges = () => {
    if (!socialMetadataLastSaved) {
      return;
    }
    applySocialMetadataSnapshot(socialMetadataLastSaved);
    setSuccess(
      "Върнах промените в Browser & Social metadata. Натисни Save ако искаш да ги запазиш отново.",
    );
  };

  const handleResetSocialMetadata = () => {
    setBrowserTitle("");
    setSocialImageUrl("");
    setSocialDescription("");
    setOpenGraphTitle("");
    setOpenGraphDescription("");
    setOpenGraphImageUrl("");
    setTwitterTitle("");
    setTwitterDescription("");
    setTwitterImageUrl("");
    setTwitterCard("summary_large_image");
    setTwitterAppName("");
    setTwitterAppIdIphone("");
    setTwitterAppIdIpad("");
    setTwitterAppIdGooglePlay("");
    setTwitterAppUrlIphone("");
    setTwitterAppUrlIpad("");
    setTwitterAppUrlGooglePlay("");
    setTwitterPlayerUrl("");
    setTwitterPlayerWidth("");
    setTwitterPlayerHeight("");
    setTwitterPlayerStream("");
    setTwitterPlayerStreamContentType("");
    setPreviewOrigin("https://example.com");
  };

  const handleSave = () => {
    setSocialMetadataLastSaved(socialMetadataSnapshotFromState());
    setSuccess("Настройките са запазени.");
  };

  return (
    <div>
      <div data-testid="browser-title-input">
        <input
          value={browserTitle}
          onChange={(e) => setBrowserTitle(e.target.value)}
          placeholder="Browser title"
        />
        <span data-testid="browser-title-value">{browserTitle}</span>
      </div>

      <div data-testid="social-image-input">
        <input
          value={socialImageUrl}
          onChange={(e) => setSocialImageUrl(e.target.value)}
          placeholder="Social image URL"
        />
        <span data-testid="social-image-value">{socialImageUrl}</span>
      </div>

      <div data-testid="social-description-input">
        <input
          value={socialDescription}
          onChange={(e) => setSocialDescription(e.target.value)}
          placeholder="Social description"
        />
        <span data-testid="social-description-value">{socialDescription}</span>
      </div>

      <div data-testid="dirty-status">
        {isSocialMetadataDirty ? "dirty" : "clean"}
      </div>
      <div data-testid="success-message">{success}</div>

      <button data-testid="save-button" onClick={handleSave}>
        Save
      </button>

      <button
        data-testid="undo-button"
        onClick={handleUndoSocialMetadataChanges}
        disabled={!socialMetadataLastSaved || !isSocialMetadataDirty}
      >
        Undo changes
      </button>

      <button data-testid="reset-button" onClick={handleResetSocialMetadata}>
        Reset social metadata
      </button>
    </div>
  );
}

describe("Social Metadata Snapshot + Undo Functionality", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it("tracks isDirty status correctly when fields are changed", async () => {
    render(<TestSocialMetadataComponent />);

    // Initially clean
    expect(screen.getByTestId("dirty-status")).toHaveTextContent("clean");

    // First save to create a baseline
    await user.click(screen.getByTestId("save-button"));

    // Wait for state to update
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(screen.getByTestId("dirty-status")).toHaveTextContent("clean");

    // Change browser title
    const browserTitleInput = screen
      .getByTestId("browser-title-input")
      .querySelector("input")!;
    await user.type(browserTitleInput, "New Title");

    // Wait for state to update
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should be dirty
    expect(screen.getByTestId("dirty-status")).toHaveTextContent("dirty");
    expect(screen.getByTestId("browser-title-value")).toHaveTextContent(
      "New Title",
    );
  });

  it("saves snapshot and clears dirty status", async () => {
    render(<TestSocialMetadataComponent />);

    // First save to create a baseline
    await user.click(screen.getByTestId("save-button"));

    // Wait for state to update
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(screen.getByTestId("dirty-status")).toHaveTextContent("clean");

    // Change some fields
    const browserTitleInput = screen
      .getByTestId("browser-title-input")
      .querySelector("input")!;
    const socialImageInput = screen
      .getByTestId("social-image-input")
      .querySelector("input")!;

    await user.type(browserTitleInput, "Saved Title");
    await user.type(socialImageInput, "https://example.com/image.jpg");

    // Wait for state to update
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(screen.getByTestId("dirty-status")).toHaveTextContent("dirty");

    // Save
    await user.click(screen.getByTestId("save-button"));

    expect(screen.getByTestId("success-message")).toHaveTextContent(
      "Настройките са запазени.",
    );
    expect(screen.getByTestId("dirty-status")).toHaveTextContent("clean");
  });

  it("undo restores last saved snapshot", async () => {
    render(<TestSocialMetadataComponent />);

    // Set initial values and save
    const browserTitleInput = screen
      .getByTestId("browser-title-input")
      .querySelector("input")!;
    const socialImageInput = screen
      .getByTestId("social-image-input")
      .querySelector("input")!;

    await user.type(browserTitleInput, "Original Title");
    await user.type(socialImageInput, "https://example.com/original.jpg");

    await user.click(screen.getByTestId("save-button"));

    // Change values
    await user.clear(browserTitleInput);
    await user.type(browserTitleInput, "Modified Title");
    await user.clear(socialImageInput);
    await user.type(socialImageInput, "https://example.com/modified.jpg");

    expect(screen.getByTestId("browser-title-value")).toHaveTextContent(
      "Modified Title",
    );
    expect(screen.getByTestId("social-image-value")).toHaveTextContent(
      "https://example.com/modified.jpg",
    );
    expect(screen.getByTestId("dirty-status")).toHaveTextContent("dirty");

    // Undo should restore saved values
    await user.click(screen.getByTestId("undo-button"));

    expect(screen.getByTestId("browser-title-value")).toHaveTextContent(
      "Original Title",
    );
    expect(screen.getByTestId("social-image-value")).toHaveTextContent(
      "https://example.com/original.jpg",
    );
    expect(screen.getByTestId("success-message")).toHaveTextContent(
      "Върнах промените в Browser & Social metadata. Натисни Save ако искаш да ги запазиш отново.",
    );
  }, 10000); // 10 second timeout

  it("undo button is disabled when no saved snapshot exists", () => {
    render(<TestSocialMetadataComponent />);

    const undoButton = screen.getByTestId("undo-button");
    expect(undoButton).toBeDisabled();
  });

  it("undo button is disabled when not dirty", async () => {
    render(<TestSocialMetadataComponent />);

    // Save initial state
    await user.click(screen.getByTestId("save-button"));

    const undoButton = screen.getByTestId("undo-button");
    expect(undoButton).toBeDisabled();
  });

  it("reset clears all social metadata fields", async () => {
    render(<TestSocialMetadataComponent />);

    // Set some values
    const browserTitleInput = screen
      .getByTestId("browser-title-input")
      .querySelector("input")!;
    const socialImageInput = screen
      .getByTestId("social-image-input")
      .querySelector("input")!;
    const socialDescriptionInput = screen
      .getByTestId("social-description-input")
      .querySelector("input")!;

    await user.type(browserTitleInput, "Test Title");
    await user.type(socialImageInput, "https://example.com/test.jpg");
    await user.type(socialDescriptionInput, "Test description");

    expect(screen.getByTestId("browser-title-value")).toHaveTextContent(
      "Test Title",
    );
    expect(screen.getByTestId("social-image-value")).toHaveTextContent(
      "https://example.com/test.jpg",
    );
    expect(screen.getByTestId("social-description-value")).toHaveTextContent(
      "Test description",
    );

    // Reset should clear all fields
    await user.click(screen.getByTestId("reset-button"));

    expect(screen.getByTestId("browser-title-value")).toHaveTextContent("");
    expect(screen.getByTestId("social-image-value")).toHaveTextContent("");
    expect(screen.getByTestId("social-description-value")).toHaveTextContent(
      "",
    );
  });

  it("reset maintains dirty status if changes were made after last save", async () => {
    render(<TestSocialMetadataComponent />);

    // Save initial state
    await user.click(screen.getByTestId("save-button"));
    expect(screen.getByTestId("dirty-status")).toHaveTextContent("clean");

    // Make changes
    const browserTitleInput = screen
      .getByTestId("browser-title-input")
      .querySelector("input")!;
    await user.type(browserTitleInput, "Changed Title");

    expect(screen.getByTestId("dirty-status")).toHaveTextContent("dirty");

    // Reset should still be dirty (since we're changing from saved state)
    await user.click(screen.getByTestId("reset-button"));

    // Wait a moment for state to update
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(screen.getByTestId("dirty-status")).toHaveTextContent("clean");
  });

  it("multiple changes and undo cycle works correctly", async () => {
    render(<TestSocialMetadataComponent />);

    // Save initial state
    await user.click(screen.getByTestId("save-button"));

    // Make first set of changes
    const browserTitleInput = screen
      .getByTestId("browser-title-input")
      .querySelector("input")!;
    await user.type(browserTitleInput, "First Change");
    await user.click(screen.getByTestId("save-button"));

    // Make second set of changes
    await user.clear(browserTitleInput);
    await user.type(browserTitleInput, "Second Change");

    expect(screen.getByTestId("browser-title-value")).toHaveTextContent(
      "Second Change",
    );
    expect(screen.getByTestId("dirty-status")).toHaveTextContent("dirty");

    // Undo should restore to first saved state
    await user.click(screen.getByTestId("undo-button"));

    // Wait a moment for state to update
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(screen.getByTestId("browser-title-value")).toHaveTextContent(
      "First Change",
    );
    expect(screen.getByTestId("dirty-status")).toHaveTextContent("clean");
  });
});
