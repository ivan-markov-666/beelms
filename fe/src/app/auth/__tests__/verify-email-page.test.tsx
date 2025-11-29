import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import VerifyEmailPage from "../verify-email/page";

const mockPush = jest.fn();
let mockTokenValue: string | null = "test-token";

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    }),
    useSearchParams: () => ({
      get: (key: string) => (key === "token" ? mockTokenValue : null),
    }),
  };
});

function mockFetchOnce(data: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
  } as unknown as Response);
}

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockPush.mockReset();
    mockTokenValue = "test-token";
    global.fetch = jest.fn();
  });

  it("calls API and shows success message for valid token", async () => {
    mockFetchOnce({}, true, 200);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Имейлът беше потвърден успешно. Вече можете да продължите да използвате акаунта си.",
        ),
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const ctaButton = screen.getByRole("button", {
      name: /Към страницата за вход|Към профила/,
    });
    fireEvent.click(ctaButton);

    expect(mockPush).toHaveBeenCalled();
  });

  it("shows invalid/expired message when API returns 400", async () => {
    mockFetchOnce({}, false, 400);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Линкът за потвърждение е невалиден или е изтекъл. Ако имате нужда от нов линк, влезте в акаунта си и заявете ново потвърждение.",
        ),
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const loginButton = screen.getByRole("button", {
      name: "Към страницата за вход",
    });
    fireEvent.click(loginButton);

    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });

  it("shows limit-reached message when API returns 429", async () => {
    mockFetchOnce({}, false, 429);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Не успяхме да потвърдим този линк за промяна на имейл адреса. Върнете се в профила си, за да видите повече информация за лимита на промените на имейл адрес за последните 24 часа.",
        ),
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const loginButton = screen.getByRole("button", {
      name: "Към страницата за вход",
    });
    fireEvent.click(loginButton);

    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });

  it("shows generic error message when server returns 5xx", async () => {
    mockFetchOnce({}, false, 500);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Потвърждението на имейла не успя. Моля, опитайте отново по-късно.",
        ),
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const homeButton = screen.getByRole("button", {
      name: "Към началната страница",
    });
    fireEvent.click(homeButton);

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("shows error message and does not call API when token is missing", async () => {
    mockTokenValue = null;

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Линкът за потвърждение е невалиден. Моля, използвайте най-новия линк, изпратен на имейла ви.",
        ),
      ).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
