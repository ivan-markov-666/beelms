import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Test component that isolates the Twitter card validation UX functionality
function TestTwitterCardValidationComponent() {
  const [twitterCard, setTwitterCard] = React.useState("summary_large_image");
  const [twitterAppName, setTwitterAppName] = React.useState("");
  const [twitterAppIdIphone, setTwitterAppIdIphone] = React.useState("");
  const [twitterPlayerUrl, setTwitterPlayerUrl] = React.useState("");
  const [twitterPlayerWidth, setTwitterPlayerWidth] = React.useState("");
  const [twitterPlayerHeight, setTwitterPlayerHeight] = React.useState("");

  const twitterAppNameMissing =
    twitterCard === "app" && twitterAppName.trim().length === 0;
  const twitterAppIdIphoneMissing =
    twitterCard === "app" && twitterAppIdIphone.trim().length === 0;
  const twitterPlayerUrlMissing =
    twitterCard === "player" && twitterPlayerUrl.trim().length === 0;
  const twitterPlayerWidthMissing =
    twitterCard === "player" &&
    (!Number.isFinite(Number(twitterPlayerWidth.trim())) ||
      Number(twitterPlayerWidth.trim()) <= 0);
  const twitterPlayerHeightMissing =
    twitterCard === "player" &&
    (!Number.isFinite(Number(twitterPlayerHeight.trim())) ||
      Number(twitterPlayerHeight.trim()) <= 0);

  const twitterAppMissingFields = React.useMemo(() => {
    const fields: string[] = [];
    if (twitterAppNameMissing) fields.push("App name");
    if (twitterAppIdIphoneMissing) fields.push("App ID (iPhone)");
    return fields;
  }, [twitterAppIdIphoneMissing, twitterAppNameMissing]);

  const twitterPlayerMissingFields = React.useMemo(() => {
    const fields: string[] = [];
    if (twitterPlayerUrlMissing) fields.push("Player URL");
    if (twitterPlayerWidthMissing)
      fields.push("Player width (положително число)");
    if (twitterPlayerHeightMissing)
      fields.push("Player height (положително число)");
    return fields;
  }, [
    twitterPlayerHeightMissing,
    twitterPlayerUrlMissing,
    twitterPlayerWidthMissing,
  ]);

  const twitterAppHasMinimum =
    twitterAppName.trim().length > 0 && twitterAppIdIphone.trim().length > 0;
  const twitterPlayerHasMinimum =
    twitterPlayerUrl.trim().length > 0 &&
    Number.isFinite(Number(twitterPlayerWidth.trim())) &&
    Number.isFinite(Number(twitterPlayerHeight.trim()));

  const socialInputClassOk =
    "mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";
  const socialInputClassError =
    "mt-2 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

  return (
    <div>
      <div data-testid="twitter-card-select">
        <label>Twitter card</label>
        <select
          value={twitterCard}
          onChange={(e) => setTwitterCard(e.target.value)}
          data-testid="twitter-card-select-input"
        >
          <option value="summary_large_image">summary_large_image</option>
          <option value="summary">summary</option>
          <option value="app">app</option>
          <option value="player">player</option>
        </select>
      </div>

      {twitterCard === "app" && (
        <div data-testid="twitter-app-section">
          <p>Twitter App card</p>
          {twitterAppMissingFields.length > 0 && (
            <div data-testid="app-missing-fields-warning">
              <p>Липсващи задължителни полета:</p>
              <ul>
                {twitterAppMissingFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          <div data-testid="app-name-input">
            <label>App name</label>
            <input
              value={twitterAppName}
              onChange={(e) => setTwitterAppName(e.target.value)}
              className={
                twitterAppNameMissing
                  ? socialInputClassError
                  : socialInputClassOk
              }
              data-testid="app-name-field"
            />
          </div>

          <div data-testid="app-iphone-id-input">
            <label>App ID (iPhone)</label>
            <input
              value={twitterAppIdIphone}
              onChange={(e) => setTwitterAppIdIphone(e.target.value)}
              className={
                twitterAppIdIphoneMissing
                  ? socialInputClassError
                  : socialInputClassOk
              }
              data-testid="app-iphone-id-field"
            />
          </div>

          <div data-testid="app-status-badge">
            {twitterAppHasMinimum ? "APP OK" : "APP INCOMPLETE"}
          </div>
        </div>
      )}

      {twitterCard === "player" && (
        <div data-testid="twitter-player-section">
          <p>Twitter Player card</p>
          {twitterPlayerMissingFields.length > 0 && (
            <div data-testid="player-missing-fields-warning">
              <p>Липсващи задължителни полета:</p>
              <ul>
                {twitterPlayerMissingFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          <div data-testid="player-url-input">
            <label>Player URL</label>
            <input
              value={twitterPlayerUrl}
              onChange={(e) => setTwitterPlayerUrl(e.target.value)}
              className={
                twitterPlayerUrlMissing
                  ? socialInputClassError
                  : socialInputClassOk
              }
              data-testid="player-url-field"
            />
          </div>

          <div data-testid="player-width-input">
            <label>Player width</label>
            <input
              value={twitterPlayerWidth}
              onChange={(e) => setTwitterPlayerWidth(e.target.value)}
              className={
                twitterPlayerWidthMissing
                  ? socialInputClassError
                  : socialInputClassOk
              }
              data-testid="player-width-field"
            />
          </div>

          <div data-testid="player-height-input">
            <label>Player height</label>
            <input
              value={twitterPlayerHeight}
              onChange={(e) => setTwitterPlayerHeight(e.target.value)}
              className={
                twitterPlayerHeightMissing
                  ? socialInputClassError
                  : socialInputClassOk
              }
              data-testid="player-height-field"
            />
          </div>

          <div data-testid="player-status-badge">
            {twitterPlayerHasMinimum ? "PLAYER OK" : "PLAYER INCOMPLETE"}
          </div>
        </div>
      )}
    </div>
  );
}

describe("Twitter Card Validation UX", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe("App Card Validation", () => {
    it("shows missing fields warning when app card is selected with empty fields", async () => {
      render(<TestTwitterCardValidationComponent />);

      // Select app card
      const select = screen.getByTestId("twitter-card-select-input");
      await user.selectOptions(select, "app");

      // Should show app section
      expect(screen.getByTestId("twitter-app-section")).toBeInTheDocument();

      // Should show missing fields warning
      expect(
        screen.getByTestId("app-missing-fields-warning"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Липсващи задължителни полета:"),
      ).toBeInTheDocument();
      // Check for missing fields in the warning list (fixed)
      const warningList = screen
        .getByTestId("app-missing-fields-warning")
        .querySelector("ul");
      expect(warningList).toHaveTextContent("App name");
      expect(warningList).toHaveTextContent("App ID (iPhone)");

      // Should show incomplete status
      expect(screen.getByTestId("app-status-badge")).toHaveTextContent(
        "APP INCOMPLETE",
      );

      // Required fields should have error styling
      const appNameField = screen.getByTestId("app-name-field");
      const appIphoneIdField = screen.getByTestId("app-iphone-id-field");

      expect(appNameField).toHaveClass("border-red-300", "bg-white");
      expect(appIphoneIdField).toHaveClass("border-red-300", "bg-white");
    });

    it("removes warning when required app fields are filled", async () => {
      render(<TestTwitterCardValidationComponent />);

      // Select app card
      const select = screen.getByTestId("twitter-card-select-input");
      await user.selectOptions(select, "app");

      // Fill required fields
      const appNameField = screen.getByTestId("app-name-field");
      const appIphoneIdField = screen.getByTestId("app-iphone-id-field");

      await user.type(appNameField, "My App");
      await user.type(appIphoneIdField, "123456789");

      // Warning should disappear
      expect(
        screen.queryByTestId("app-missing-fields-warning"),
      ).not.toBeInTheDocument();

      // Should show ok status
      expect(screen.getByTestId("app-status-badge")).toHaveTextContent(
        "APP OK",
      );

      // Fields should have normal styling
      expect(appNameField).toHaveClass("border-gray-300", "bg-white");
      expect(appIphoneIdField).toHaveClass("border-gray-300", "bg-white");
    });

    it("shows partial warning when only one required field is filled", async () => {
      render(<TestTwitterCardValidationComponent />);

      // Select app card
      const select = screen.getByTestId("twitter-card-select-input");
      await user.selectOptions(select, "app");

      // Fill only app name
      const appNameField = screen.getByTestId("app-name-field");
      await user.type(appNameField, "My App");

      // Should still show warning for missing iPhone ID
      expect(
        screen.getByTestId("app-missing-fields-warning"),
      ).toBeInTheDocument();
      // Check that App name is not in the warning list anymore
      const warningList = screen
        .getByTestId("app-missing-fields-warning")
        .querySelector("ul");
      expect(warningList).not.toHaveTextContent("App name");
      expect(warningList).toHaveTextContent("App ID (iPhone)");

      // App name field should have normal styling, iPhone ID should have error
      expect(appNameField).toHaveClass("border-gray-300", "bg-white");
      expect(screen.getByTestId("app-iphone-id-field")).toHaveClass(
        "border-red-300",
        "bg-white",
      );
    });
  });

  describe("Player Card Validation", () => {
    it("shows missing fields warning when player card is selected with empty fields", async () => {
      render(<TestTwitterCardValidationComponent />);

      // Select player card
      const select = screen.getByTestId("twitter-card-select-input");
      await user.selectOptions(select, "player");

      // Should show player section
      expect(screen.getByTestId("twitter-player-section")).toBeInTheDocument();

      // Should show missing fields warning
      expect(
        screen.getByTestId("player-missing-fields-warning"),
      ).toBeInTheDocument();
      // Check for missing fields in the warning list
      const warningList = screen
        .getByTestId("player-missing-fields-warning")
        .querySelector("ul");
      expect(warningList).toHaveTextContent("Player URL");
      expect(
        screen.getByText("Липсващи задължителни полета:"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Player width (положително число)"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Player height (положително число)"),
      ).toBeInTheDocument();

      // Should show incomplete status
      expect(screen.getByTestId("player-status-badge")).toHaveTextContent(
        "PLAYER INCOMPLETE",
      );

      // Required fields should have error styling
      const playerUrlField = screen.getByTestId("player-url-field");
      const playerWidthField = screen.getByTestId("player-width-field");
      const playerHeightField = screen.getByTestId("player-height-field");

      expect(playerUrlField).toHaveClass("border-red-300", "bg-white");
      expect(playerWidthField).toHaveClass("border-red-300", "bg-white");
      expect(playerHeightField).toHaveClass("border-red-300", "bg-white");
    });

    it("removes warning when required player fields are filled with valid values", async () => {
      render(<TestTwitterCardValidationComponent />);

      // Select player card
      const select = screen.getByTestId("twitter-card-select-input");
      await user.selectOptions(select, "player");

      // Fill required fields
      const playerUrlField = screen.getByTestId("player-url-field");
      const playerWidthField = screen.getByTestId("player-width-field");
      const playerHeightField = screen.getByTestId("player-height-field");

      await user.type(playerUrlField, "https://example.com/player");
      await user.type(playerWidthField, "640");
      await user.type(playerHeightField, "360");

      // Warning should disappear
      expect(
        screen.queryByTestId("player-missing-fields-warning"),
      ).not.toBeInTheDocument();

      // Should show ok status
      expect(screen.getByTestId("player-status-badge")).toHaveTextContent(
        "PLAYER OK",
      );

      // Fields should have normal styling
      expect(playerUrlField).toHaveClass("border-gray-300", "bg-white");
      expect(playerWidthField).toHaveClass("border-gray-300", "bg-white");
      expect(playerHeightField).toHaveClass("border-gray-300", "bg-white");
    });

    it("shows warning for invalid numeric values in player dimensions", async () => {
      render(<TestTwitterCardValidationComponent />);

      // Select player card
      const select = screen.getByTestId("twitter-card-select-input");
      await user.selectOptions(select, "player");

      // Fill URL but invalid dimensions
      const playerUrlField = screen.getByTestId("player-url-field");
      const playerWidthField = screen.getByTestId("player-width-field");
      const playerHeightField = screen.getByTestId("player-height-field");

      await user.type(playerUrlField, "https://example.com/player");
      await user.type(playerWidthField, "invalid");
      await user.type(playerHeightField, "-100");

      // Should show warning for invalid dimensions
      expect(
        screen.getByTestId("player-missing-fields-warning"),
      ).toBeInTheDocument();
      // Check that Player URL is not in the warning list anymore
      const warningList = screen
        .getByTestId("player-missing-fields-warning")
        .querySelector("ul");
      expect(warningList).not.toHaveTextContent("Player URL");
      expect(warningList).toHaveTextContent("Player width (положително число)");
      expect(warningList).toHaveTextContent(
        "Player height (положително число)",
      );

      // URL should have normal styling, dimensions should have error
      expect(playerUrlField).toHaveClass("border-gray-300", "bg-white");
      expect(playerWidthField).toHaveClass("border-red-300", "bg-white");
      expect(playerHeightField).toHaveClass("border-red-300", "bg-white");
    });

    it("shows warning for zero values in player dimensions", async () => {
      render(<TestTwitterCardValidationComponent />);

      // Select player card
      const select = screen.getByTestId("twitter-card-select-input");
      await user.selectOptions(select, "player");

      // Fill URL but zero dimensions
      const playerUrlField = screen.getByTestId("player-url-field");
      const playerWidthField = screen.getByTestId("player-width-field");
      const playerHeightField = screen.getByTestId("player-height-field");

      await user.type(playerUrlField, "https://example.com/player");
      await user.type(playerWidthField, "0");
      await user.type(playerHeightField, "0");

      // Should show warning for zero dimensions
      expect(
        screen.getByTestId("player-missing-fields-warning"),
      ).toBeInTheDocument();
      // Check that Player URL is not in the warning list anymore
      const warningList = screen
        .getByTestId("player-missing-fields-warning")
        .querySelector("ul");
      expect(warningList).not.toHaveTextContent("Player URL");
      expect(warningList).toHaveTextContent("Player width (положително число)");
      expect(warningList).toHaveTextContent(
        "Player height (положително число)",
      );
    });
  });

  describe("Card Type Switching", () => {
    it("hides app section when switching from app to summary", async () => {
      render(<TestTwitterCardValidationComponent />);

      // Select app card
      const select = screen.getByTestId("twitter-card-select-input");
      await user.selectOptions(select, "app");

      expect(screen.getByTestId("twitter-app-section")).toBeInTheDocument();

      // Switch to summary
      await user.selectOptions(select, "summary");

      // App section should be hidden
      expect(
        screen.queryByTestId("twitter-app-section"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("app-missing-fields-warning"),
      ).not.toBeInTheDocument();
    });

    it("hides player section when switching from player to summary_large_image", async () => {
      render(<TestTwitterCardValidationComponent />);

      // Select player card
      const select = screen.getByTestId("twitter-card-select-input");
      await user.selectOptions(select, "player");

      expect(screen.getByTestId("twitter-player-section")).toBeInTheDocument();

      // Switch to summary_large_image
      await user.selectOptions(select, "summary_large_image");

      // Player section should be hidden
      expect(
        screen.queryByTestId("twitter-player-section"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("player-missing-fields-warning"),
      ).not.toBeInTheDocument();
    });

    it("switches between app and player sections correctly", async () => {
      render(<TestTwitterCardValidationComponent />);

      const select = screen.getByTestId("twitter-card-select-input");

      // Select app
      await user.selectOptions(select, "app");
      expect(screen.getByTestId("twitter-app-section")).toBeInTheDocument();
      expect(
        screen.queryByTestId("twitter-player-section"),
      ).not.toBeInTheDocument();

      // Switch to player
      await user.selectOptions(select, "player");
      expect(
        screen.queryByTestId("twitter-app-section"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("twitter-player-section")).toBeInTheDocument();

      // Switch back to app
      await user.selectOptions(select, "app");
      expect(screen.getByTestId("twitter-app-section")).toBeInTheDocument();
      expect(
        screen.queryByTestId("twitter-player-section"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Non-card types", () => {
    it("does not show validation sections for summary and summary_large_image", async () => {
      render(<TestTwitterCardValidationComponent />);

      const select = screen.getByTestId("twitter-card-select-input");

      // Test summary_large_image (default)
      expect(
        screen.queryByTestId("twitter-app-section"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("twitter-player-section"),
      ).not.toBeInTheDocument();

      // Test summary
      await user.selectOptions(select, "summary");
      expect(
        screen.queryByTestId("twitter-app-section"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("twitter-player-section"),
      ).not.toBeInTheDocument();
    });
  });
});
