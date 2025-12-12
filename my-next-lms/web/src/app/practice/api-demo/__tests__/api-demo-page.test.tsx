import { render, screen } from "@testing-library/react";
import ApiDemoPage from "../page";

describe("ApiDemoPage", () => {
  it("renders title and Swagger link", () => {
    render(<ApiDemoPage />);

    expect(
      screen.getByRole("heading", { name: /API Demo \/ Training API/i }),
    ).toBeInTheDocument();

    const swaggerLink = screen.getByRole("link", {
      name: /Swagger UI за Training API/i,
    });

    expect(swaggerLink).toHaveAttribute(
      "href",
      "http://localhost:4000/api/training/docs",
    );

    expect(
      screen.getByRole("heading", {
        name: /Примерни сценарии за упражнения/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: /Интерактивен Training API playground/i,
      }),
    ).toBeInTheDocument();
  });
});
