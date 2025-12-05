import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ForgotPasswordPage from "../forgot-password/page";

const mockPush = jest.fn();

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    }),
    useSearchParams: () => new URLSearchParams("lang=bg"),
  };
});

function mockFetchOnce(data: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
  } as unknown as Response);
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("shows validation errors and does not call API for invalid form", async () => {
    global.fetch = jest.fn();

    render(<ForgotPasswordPage />);

    const emailInput = await screen.findByLabelText("Email адрес");
    const submitButton = await screen.findByRole("button", {
      name: "Изпрати линк за смяна",
    });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Моля, въведете валиден имейл адрес."),
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits forgot password successfully and shows success message", async () => {
    mockFetchOnce({}, true, 200);

    render(<ForgotPasswordPage />);

    const emailInput = await screen.findByLabelText("Email адрес");
    const submitButton = screen.getByRole("button", {
      name: "Изпрати линк за смяна",
    });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Ако има акаунт с този имейл, ще изпратим инструкции за смяна на паролата.",
        ),
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("shows generic error message when server returns 5xx", async () => {
    mockFetchOnce({}, false, 500);

    render(<ForgotPasswordPage />);

    const emailInput = await screen.findByLabelText("Имейл");
    const captchaCheckbox = await screen.findByLabelText(
      /Не съм робот \(placeholder за CAPTCHA интеграция\)/i,
    );
    const submitButton = screen.getByRole("button", {
      name: "Изпрати линк за ресет",
    });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.click(captchaCheckbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Заявката за забравена парола не успя. Моля, опитайте отново по-късно.",
        ),
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
