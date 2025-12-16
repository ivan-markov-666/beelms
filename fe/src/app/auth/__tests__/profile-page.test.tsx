import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProfilePage from "../../profile/page";
import { ACCESS_TOKEN_KEY } from "../../auth-token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

const mockReplace = jest.fn();

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      replace: mockReplace,
      push: jest.fn(),
      prefetch: jest.fn(),
    }),
  };
});

describe("ProfilePage email change behaviour", () => {
  const originalFetch = global.fetch;
  const originalLocation = window.location;

  beforeEach(() => {
    // @ts-expect-error JSDOM
    delete window.location;
    // @ts-expect-error JSDOM
    window.location = { ...originalLocation, assign: jest.fn() };

    jest
      .spyOn(window.localStorage.__proto__, "getItem")
      .mockImplementation((...args: unknown[]) => {
        const [key] = args as [string];
        if (key === ACCESS_TOKEN_KEY) {
          return "test-access-token";
        }
        return null;
      });

    jest
      .spyOn(window.localStorage.__proto__, "removeItem")
      .mockImplementation(jest.fn());

    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === `${API_BASE_URL}/users/me` && (!init || !init.method || init.method === "GET")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "user-1",
            email: "user@example.com",
            createdAt: new Date().toISOString(),
            emailChangeLimitReached: false,
            emailChangeLimitResetAt: null,
          }),
        } as Response;
      }

      if (url === `${API_BASE_URL}/users/me` && init && init.method === "PATCH") {
        const body = init.body ? JSON.parse(init.body as string) : {};
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "user-1",
            email: body.email ?? "user@example.com",
            createdAt: new Date().toISOString(),
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch to ${url}`);
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
    // @ts-expect-error JSDOM
    window.location = originalLocation;
  });

  it("does not send a second PATCH request for the same new email and shows an info message instead", async () => {
    render(<ProfilePage />);

    // profile load
    await screen.findByText("Моят профил");

    const [changeButton] = screen.getAllByRole("button", { name: "Промяна" });
    fireEvent.click(changeButton);

    const input = await screen.findByLabelText("Нов email адрес");

    fireEvent.change(input, { target: { value: "new@example.com" } });

    const saveButton = screen.getByRole("button", { name: "Запази" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Изпратихме имейл за потвърждение на новия адрес. Промяната ще влезе в сила след потвърждение.",
        ),
      ).toBeInTheDocument();
    });

    // reset fetch mock call count
    (global.fetch as jest.Mock).mockClear();

    // click Save again with the same email
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Вече изпратихме имейл за потвърждение на този адрес. Моля, използвайте най-новия получен линк или проверете пощата си. Може да заявите нов имейл отново след 60 секунди.",
        ),
      ).toBeInTheDocument();
    });

    // ensure no new PATCH call was sent
    expect((global.fetch as jest.Mock)).not.toHaveBeenCalledWith(
      `${API_BASE_URL}/users/me`,
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("allows a new PATCH request for the same email after 60 seconds", async () => {
    let currentTime = Date.now();
    const dateNowSpy = jest
      .spyOn(Date, "now")
      .mockImplementation(() => currentTime);

    render(<ProfilePage />);

    await screen.findByText("Моят профил");

    const [changeButton] = screen.getAllByRole("button", { name: "Промяна" });
    fireEvent.click(changeButton);

    const input = await screen.findByLabelText("Нов email адрес");
    const saveButton = screen.getByRole("button", { name: "Запази" });

    currentTime = 1_000_000;
    fireEvent.change(input, { target: { value: "new@example.com" } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Изпратихме имейл за потвърждение на новия адрес. Промяната ще влезе в сила след потвърждение.",
        ),
      ).toBeInTheDocument();
    });

    // second attempt within 60 seconds should not send a new PATCH request
    (global.fetch as jest.Mock).mockClear();
    currentTime = 1_000_000 + 30_000;
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Вече изпратихме имейл за потвърждение на този адрес. Моля, използвайте най-новия получен линк или проверете пощата си. Може да заявите нов имейл отново след 60 секунди.",
        ),
      ).toBeInTheDocument();
    });

    let patchCalls = (global.fetch as jest.Mock).mock.calls.filter(([, init]) => {
      if (!init) return false;
      const cast = init as RequestInit;
      return cast.method === "PATCH";
    });

    expect(patchCalls.length).toBe(0);

    // third attempt after 60 seconds should send a new PATCH request
    (global.fetch as jest.Mock).mockClear();
    currentTime = 1_000_000 + 61_000;
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Изпратихме имейл за потвърждение на новия адрес. Промяната ще влезе в сила след потвърждение.",
        ),
      ).toBeInTheDocument();
    });

    patchCalls = (global.fetch as jest.Mock).mock.calls.filter(([, init]) => {
      if (!init) return false;
      const cast = init as RequestInit;
      return cast.method === "PATCH";
    });

    expect(patchCalls.length).toBe(1);

    dateNowSpy.mockRestore();
  });

  it("shows the email change limit warning when the profile indicates the limit is reached", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();

        if (
          url === `${API_BASE_URL}/users/me` &&
          (!init || !init.method || init.method === "GET")
        ) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              id: "user-1",
              email: "user@example.com",
              createdAt: new Date().toISOString(),
              emailChangeLimitReached: true,
              emailChangeLimitResetAt: new Date(
                Date.now() + 60 * 60 * 1000,
              ).toISOString(),
            }),
          } as Response;
        }

        throw new Error(`Unexpected fetch to ${url}`);
      },
    ) as unknown as typeof fetch;

    render(<ProfilePage />);

    await screen.findByText("Моят профил");

    const [changeButton] = screen.getAllByRole("button", { name: "Промяна" });
    fireEvent.click(changeButton);

    await screen.findByLabelText("Нов email адрес");

    expect(
      screen.getByText(
        "Достигнат е максималният брой потвърждения на нов имейл за последните 24 часа. Моля, опитайте отново след 24 часа.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the 24h email change limit message when PATCH /users/me returns 429", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();

        if (
          url === `${API_BASE_URL}/users/me` &&
          (!init || !init.method || init.method === "GET")
        ) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              id: "user-1",
              email: "user@example.com",
              createdAt: new Date().toISOString(),
              emailChangeLimitReached: false,
              emailChangeLimitResetAt: null,
            }),
          } as Response;
        }

        if (url === `${API_BASE_URL}/users/me` && init && init.method === "PATCH") {
          return {
            ok: false,
            status: 429,
            json: async () => ({
              statusCode: 429,
              message: "email change verification limit reached",
            }),
          } as Response;
        }

        throw new Error(`Unexpected fetch to ${url}`);
      },
    ) as unknown as typeof fetch;

    render(<ProfilePage />);

    await screen.findByText("Моят профил");

    const [changeButton] = screen.getAllByRole("button", { name: "Промяна" });
    fireEvent.click(changeButton);

    const input = await screen.findByLabelText("Нов email адрес");
    const saveButton = screen.getByRole("button", { name: "Запази" });

    fireEvent.change(input, { target: { value: "new@example.com" } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Достигнат е максималният брой потвърждения на нов имейл за последните 24 часа. Моля, опитайте отново след 24 часа.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows an error when the new email equals the current email and does not send a PATCH request", async () => {
    render(<ProfilePage />);

    await screen.findByText("Моят профил");

    const [changeButton] = screen.getAllByRole("button", { name: "Промяна" });
    fireEvent.click(changeButton);

    const input = await screen.findByLabelText("Нов email адрес");

    // current email from the mocked /users/me response
    fireEvent.change(input, { target: { value: "user@example.com" } });

    const saveButton = screen.getByRole("button", { name: "Запази" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText("Новият email съвпада с текущия email адрес."),
      ).toBeInTheDocument();
    });

    const patchCalls = (global.fetch as jest.Mock).mock.calls.filter(([, init]) => {
      if (!init) return false;
      const cast = init as RequestInit;
      return cast.method === "PATCH";
    });

    expect(patchCalls.length).toBe(0);
  });

  it("renders an email change limit tooltip in the profile header", async () => {
    render(<ProfilePage />);

    await screen.findByText("Моят профил");

    const tooltip = await screen.findByTitle(
      /Можете да заявите до 3 успешни смени на имейл адрес за последните 24 часа/i,
    );

    expect(tooltip).toBeInTheDocument();
  });
});

describe("ProfilePage critical actions", () => {
  const originalFetch = global.fetch;
  const originalLocation = window.location;

  beforeEach(() => {
    mockReplace.mockClear();

    // @ts-expect-error JSDOM
    delete window.location;
    // @ts-expect-error JSDOM
    window.location = { ...originalLocation, assign: jest.fn() };

    jest
      .spyOn(window.localStorage.__proto__, "getItem")
      .mockImplementation((...args: unknown[]) => {
        const [key] = args as [string];
        if (key === ACCESS_TOKEN_KEY) {
          return "test-access-token";
        }
        return null;
      });

    jest
      .spyOn(window.localStorage.__proto__, "removeItem")
      .mockImplementation(jest.fn());

    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (
        url === `${API_BASE_URL}/users/me` &&
        (!init || !init.method || init.method === "GET")
      ) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "user-1",
            email: "user@example.com",
            createdAt: new Date().toISOString(),
            emailChangeLimitReached: false,
            emailChangeLimitResetAt: null,
          }),
        } as Response;
      }

      if (url === `${API_BASE_URL}/users/me/change-password` && init?.method === "POST") {
        return {
          ok: true,
          status: 200,
          json: async () => ({}),
        } as Response;
      }

      if (url === `${API_BASE_URL}/users/me/export` && init?.method === "POST") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "user-1",
            email: "user@example.com",
            createdAt: new Date().toISOString(),
            active: true,
          }),
        } as Response;
      }

      if (url === `${API_BASE_URL}/users/me` && init?.method === "DELETE") {
        return {
          ok: true,
          status: 204,
          json: async () => ({}),
        } as Response;
      }

      throw new Error(`Unexpected fetch to ${url}`);
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
    // @ts-expect-error JSDOM
    window.location = originalLocation;
  });

  it("redirects to /auth/login when no token is present", async () => {
    jest
      .spyOn(window.localStorage.__proto__, "getItem")
      .mockImplementation(() => null);

    render(<ProfilePage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("logs out and redirects to home", async () => {
    render(<ProfilePage />);
    await screen.findByText("Моят профил");

    fireEvent.click(screen.getByRole("button", { name: "Изход" }));

    expect(window.localStorage.removeItem).toHaveBeenCalledWith(ACCESS_TOKEN_KEY);
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("changes password successfully", async () => {
    render(<ProfilePage />);
    await screen.findByText("Моят профил");

    const changeButtons = screen.getAllByRole("button", { name: "Промяна" });
    fireEvent.click(changeButtons[1]);

    fireEvent.change(await screen.findByLabelText("Текуща парола"), {
      target: { value: "old-pass" },
    });
    fireEvent.change(screen.getByLabelText("Нова парола"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Потвърждение"), {
      target: { value: "new-password" },
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Запази" })[0]);

    await waitFor(() => {
      expect(screen.getByText("Паролата беше успешно сменена.")).toBeInTheDocument();
    });
  });

  it("exports user data", async () => {
    render(<ProfilePage />);
    await screen.findByText("Моят профил");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Експортирай моите данни",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Заявката за експорт на данни беше приета."),
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Детайли от експортираните данни/i)).toBeInTheDocument();
    });

    expect((global.fetch as jest.Mock).mock.calls).toEqual(
      expect.arrayContaining([
        [
          `${API_BASE_URL}/users/me/export`,
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ captchaToken: "dummy-captcha-token" }),
          }),
        ],
      ]),
    );
  });

  it("deletes account with two-step confirmation and redirects", async () => {
    render(<ProfilePage />);
    await screen.findByText("Моят профил");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Изтрий акаунта завинаги",
      }),
    );

    await screen.findByText("Закриване на акаунта");

    fireEvent.click(screen.getByRole("button", { name: "OK" }));

    await screen.findByText("Потвърдете изтриването на акаунта");

    fireEvent.click(
      screen.getByRole("button", { name: "Да, изтрий акаунта завинаги" }),
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/auth/account-deleted");
    });

    expect(window.localStorage.removeItem).toHaveBeenCalledWith(ACCESS_TOKEN_KEY);
  });
});
