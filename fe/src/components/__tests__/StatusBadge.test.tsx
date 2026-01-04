import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StatusBadge } from "../../app/admin/settings/page";

describe("StatusBadge Component", () => {
  it('renders "ok" variant with correct styling and label', () => {
    render(<StatusBadge variant="ok" label="SET" />);

    const badge = screen.getByText("SET");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(
      "inline-flex",
      "items-center",
      "rounded-full",
      "border",
      "px-2",
      "py-0.5",
      "text-[10px]",
      "font-semibold",
      "uppercase",
      "tracking-wide",
      "border-green-200",
      "bg-green-50",
      "text-green-700",
    );
  });

  it('renders "missing" variant with correct styling and label', () => {
    render(<StatusBadge variant="missing" label="EMPTY" />);

    const badge = screen.getByText("EMPTY");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(
      "inline-flex",
      "items-center",
      "rounded-full",
      "border",
      "px-2",
      "py-0.5",
      "text-[10px]",
      "font-semibold",
      "uppercase",
      "tracking-wide",
      "border-red-200",
      "bg-red-50",
      "text-red-700",
    );
  });

  it('renders "fallback" variant with correct styling and label', () => {
    render(<StatusBadge variant="fallback" label="APPNAME" />);

    const badge = screen.getByText("APPNAME");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(
      "inline-flex",
      "items-center",
      "rounded-full",
      "border",
      "px-2",
      "py-0.5",
      "text-[10px]",
      "font-semibold",
      "uppercase",
      "tracking-wide",
      "border-amber-200",
      "bg-amber-50",
      "text-amber-800",
    );
  });

  it("applies correct classes for different variants", () => {
    const { rerender } = render(<StatusBadge variant="ok" label="TEST" />);
    const badge = screen.getByText("TEST");

    expect(badge).toHaveClass(
      "border-green-200",
      "bg-green-50",
      "text-green-700",
    );
    expect(badge).not.toHaveClass(
      "border-amber-200",
      "bg-amber-50",
      "text-amber-800",
    );
    expect(badge).not.toHaveClass(
      "border-red-200",
      "bg-red-50",
      "text-red-700",
    );

    rerender(<StatusBadge variant="fallback" label="TEST" />);
    expect(badge).toHaveClass(
      "border-amber-200",
      "bg-amber-50",
      "text-amber-800",
    );
    expect(badge).not.toHaveClass(
      "border-green-200",
      "bg-green-50",
      "text-green-700",
    );
    expect(badge).not.toHaveClass(
      "border-red-200",
      "bg-red-50",
      "text-red-700",
    );

    rerender(<StatusBadge variant="missing" label="TEST" />);
    expect(badge).toHaveClass("border-red-200", "bg-red-50", "text-red-700");
    expect(badge).not.toHaveClass(
      "border-green-200",
      "bg-green-50",
      "text-green-700",
    );
    expect(badge).not.toHaveClass(
      "border-amber-200",
      "bg-amber-50",
      "text-amber-800",
    );
  });

  it("displays label text in uppercase", () => {
    render(<StatusBadge variant="ok" label="set" />);

    const badge = screen.getByText("set");
    expect(badge).toHaveClass("uppercase");
  });

  it("has consistent base classes across all variants", () => {
    const variants: Array<"ok" | "missing" | "fallback"> = [
      "ok",
      "missing",
      "fallback",
    ];

    variants.forEach((variant) => {
      const { unmount } = render(
        <StatusBadge variant={variant} label="TEST" />,
      );
      const badge = screen.getByText("TEST");

      // Base classes should always be present
      expect(badge).toHaveClass(
        "inline-flex",
        "items-center",
        "rounded-full",
        "border",
        "px-2",
        "py-0.5",
        "text-[10px]",
        "font-semibold",
        "uppercase",
        "tracking-wide",
      );

      unmount();
    });
  });

  it("renders as span element", () => {
    render(<StatusBadge variant="ok" label="TEST" />);

    const badge = screen.getByText("TEST");
    expect(badge.tagName).toBe("SPAN");
  });
});
