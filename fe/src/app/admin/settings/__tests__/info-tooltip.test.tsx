import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: jest.fn(() => ({ replace: jest.fn(), push: jest.fn() })),
  };
});

describe("InfoTooltip", () => {
  it("stops click propagation to parent container", async () => {
    const user = userEvent.setup();
    const onOuterClick = jest.fn();
    const { InfoTooltip } = await import("../../_components/info-tooltip");

    render(
      <div onClick={onOuterClick}>
        <InfoTooltip
          label="Info"
          title="Tooltip title"
          description="Tooltip body"
        />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Info" }));
    expect(onOuterClick).not.toHaveBeenCalled();
  });

  it("renders tooltip content in DOM (initially hidden)", async () => {
    const { InfoTooltip } = await import("../../_components/info-tooltip");

    render(
      <InfoTooltip
        label="Info"
        title="Tooltip title"
        description="Tooltip body"
      />,
    );

    const title = screen.getByText("Tooltip title");
    expect(title).toBeInTheDocument();
    expect(screen.getByText("Tooltip body")).toBeInTheDocument();

    const tooltipContainer = title.closest("div");
    expect(tooltipContainer).toHaveClass("hidden");
  });
});
