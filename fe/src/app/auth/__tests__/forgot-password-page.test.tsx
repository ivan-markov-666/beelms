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

const defaultPublicSettingsResponse = {
  branding: { appName: "BeeLMS" },
  features: {
    wiki: true,
    wikiPublic: true,
    courses: true,
    coursesPublic: true,
    myCourses: true,
    auth: true,
    authLogin: true,
    authRegister: true,
    socialGoogle: true,
    socialFacebook: true,
    socialGithub: true,
    socialLinkedin: true,
  },
  languages: { supported: ["bg"], default: "bg" },
};

function getUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return (input as Request).url;
}

function mockSettingsOnlyFetch() {
  global.fetch = jest.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = getUrl(input);
    if (url.includes("/public/settings")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => defaultPublicSettingsResponse,
      } as Response);
    }
    throw new Error(`Unexpected fetch call to ${url}`);
  });
}

function mockFetchOnce(data: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = getUrl(input);
    if (url.includes("/public/settings")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => defaultPublicSettingsResponse,
      } as Response);
    }

    if (url.includes("/auth/forgot-password")) {
      return Promise.resolve({
        ok,
        status,
        json: async () => data,
      } as Response);
    }

    throw new Error(`Unexpected fetch call to ${url}`);
  });
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("shows validation errors and does not call API for invalid form", async () => {
    mockSettingsOnlyFetch();

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

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const authCall = (global.fetch as jest.Mock).mock.calls.find(([input]) =>
      getUrl(input).includes("/auth/forgot-password"),
    );
    expect(authCall).toBeUndefined();
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

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("shows generic error message when server returns 5xx", async () => {
    mockFetchOnce({}, false, 500);

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
          "Заявката за забравена парола не успя. Моля, опитайте отново по-късно.",
        ),
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
