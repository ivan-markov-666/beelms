import { render, screen } from "@testing-library/react";
import UiDemoPage from "../page";

describe("UiDemoPage", () => {
  it("renders title and tasks section", () => {
    render(<UiDemoPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /UI Demo/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /Примерни задачи/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Примерна задача от Tasks API/i),
    ).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThanOrEqual(5);
  });
});
