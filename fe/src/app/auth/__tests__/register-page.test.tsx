import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RegisterPage from "../register/page";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
      prefetch: jest.fn(),
    }),
    useSearchParams: () => new URLSearchParams("lang=bg"),
  };
});

function mockFetchOnce(data: unknown, ok = true, status = 201) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
  } as unknown as Response);
}

describe("RegisterPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
  });

  it("shows validation errors and does not call API for invalid form", async () => {
    global.fetch = jest.fn();

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText("Имейл");
    const passwordInput = await screen.findByLabelText("Парола");
    const confirmPasswordInput = await screen.findByLabelText("Потвърди паролата");
    const submitButton = await screen.findByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "short" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "different" } });
    // не маркираме Terms и CAPTCHA

    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Моля, въведете валиден имейл адрес."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Паролата трябва да е поне 8 символа."),
    ).toBeInTheDocument();
    expect(screen.getByText("Паролите не съвпадат.")).toBeInTheDocument();
    expect(
      screen.getByText("Необходимо е да приемете условията."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Моля, потвърдете, че не сте робот."),
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits registration successfully and shows success message", async () => {
    mockFetchOnce(
      {
        id: "user-id",
        email: "user@example.com",
        createdAt: new Date().toISOString(),
      },
      true,
      201,
    );

    render(<RegisterPage />);

    const emailInput = await screen.findByLabelText("Имейл");
    const passwordInput = await screen.findByLabelText("Парола");
    const confirmPasswordInput = await screen.findByLabelText("Потвърди паролата");
    const termsCheckbox = await screen.findByLabelText(
      /Съгласен съм с Условията за ползване/i,
    );
    const captchaCheckbox = await screen.findByLabelText(
      /Не съм робот \(placeholder за CAPTCHA интеграция\)/i,
    );
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.click(termsCheckbox);
    fireEvent.click(captchaCheckbox);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Регистрацията беше успешна. Моля, проверете имейла си и потвърдете адреса чрез получен линк. След това можете да влезете в акаунта си от страницата за вход.",
        ),
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("shows duplicate email error when API returns 409", async () => {
    mockFetchOnce({ message: "Email already in use" }, false, 409);

    render(<RegisterPage />);

    const emailInput = screen.getByLabelText("Имейл");
    const passwordInput = screen.getByLabelText("Парола");
    const confirmPasswordInput = screen.getByLabelText("Потвърди паролата");
    const termsCheckbox = screen.getByLabelText(
      /Съгласен съм с Условията за ползване/i,
    );
    const captchaCheckbox = screen.getByLabelText(
      /Не съм робот \(placeholder за CAPTCHA интеграция\)/i,
    );
    const submitButton = screen.getByRole("button", { name: "Регистрация" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.click(termsCheckbox);
    fireEvent.click(captchaCheckbox);

    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Този имейл вече е регистриран."),
    ).toBeInTheDocument();
  });
});
