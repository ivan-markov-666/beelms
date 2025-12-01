import { fireEvent, render, screen } from "@testing-library/react";
import UiDemoPage from "../page";

describe("UiDemoPage interactions", () => {
  it("resets basic form fields and difficulty when Reset is clicked", () => {
    render(<UiDemoPage />);

    const nameInput = screen.getByLabelText(/^Име$/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/Имейл/i) as HTMLInputElement;
    const difficultySelect = screen.getByLabelText(
      /Ниво на трудност/i,
    ) as HTMLSelectElement;
    const resetButton = screen.getByRole("button", { name: /Reset/i });

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(difficultySelect, { target: { value: "hard" } });

    expect(nameInput.value).toBe("Test User");
    expect(emailInput.value).toBe("test@example.com");
    expect(difficultySelect.value).toBe("hard");

    fireEvent.click(resetButton);

    expect(nameInput.value).toBe("");
    expect(emailInput.value).toBe("");
    expect(difficultySelect.value).toBe("medium");
  });
});
