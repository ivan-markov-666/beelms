import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { WikiArticleActions } from "../wiki-article-actions";

describe("WikiArticleActions", () => {
  const originalNavigator = { ...navigator };
  const originalLocation = { ...window.location };
  const originalPrint = window.print;
  const originalAlert = window.alert;

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      value: { href: "http://localhost/wiki/getting-started" },
      writable: true,
    });
  });

  afterEach(() => {
    Object.assign(navigator, originalNavigator);
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
    window.print = originalPrint;
    window.alert = originalAlert;
  });

  it("renders Share and Print buttons", () => {
    render(<WikiArticleActions title="Test article" lang="bg" />);

    expect(screen.getByRole("button", { name: "Сподели" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Принтирай" })).toBeInTheDocument();
  });

  it("uses Web Share API when available", async () => {
    const shareMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: shareMock,
      configurable: true,
      writable: true,
    });

    render(<WikiArticleActions title="Shared article" lang="bg" />);

    const shareButton = screen.getByRole("button", { name: "Сподели" });
    await act(async () => {
      fireEvent.click(shareButton);
    });

    expect(shareMock).toHaveBeenCalledWith({
      title: "Shared article",
      url: "http://localhost/wiki/getting-started",
    });
  });

  it("falls back to clipboard when Web Share is not available", async () => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<WikiArticleActions title="Clipboard article" lang="bg" />);

    const shareButton = screen.getByRole("button", { name: "Сподели" });
    fireEvent.click(shareButton);

    expect(writeTextMock).toHaveBeenCalledWith(
      "http://localhost/wiki/getting-started",
    );
    expect(
      await screen.findByText("Линкът е копиран в клипборда."),
    ).toBeInTheDocument();
  });

  it("falls back to window.alert when neither Web Share nor clipboard are available", () => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: {},
      configurable: true,
      writable: true,
    });
    const alertMock = jest.fn();
    window.alert = alertMock;

    render(<WikiArticleActions title="Alert article" lang="bg" />);

    const shareButton = screen.getByRole("button", { name: "Сподели" });
    fireEvent.click(shareButton);

    expect(alertMock).toHaveBeenCalledWith(
      "http://localhost/wiki/getting-started",
    );
  });

  it("calls window.print when clicking Print", () => {
    const printMock = jest.fn();
    window.print = printMock;

    render(<WikiArticleActions title="Print article" lang="bg" />);

    const printButton = screen.getByRole("button", { name: "Принтирай" });
    fireEvent.click(printButton);

    expect(printMock).toHaveBeenCalled();
  });
});
