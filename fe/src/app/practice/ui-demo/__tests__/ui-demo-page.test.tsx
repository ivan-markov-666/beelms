import { render, screen } from "@testing-library/react";
import UiDemoPage from "../page";

describe("UiDemoPage", () => {
  it("renders title and tasks section", () => {
    render(<UiDemoPage />);

    expect(
      screen.getByRole("heading", { name: /UI Demo/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /Примерни задачи/i }),
    ).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThanOrEqual(5);
  });
});
