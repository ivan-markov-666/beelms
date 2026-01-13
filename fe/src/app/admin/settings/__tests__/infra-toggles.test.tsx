import "@testing-library/jest-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as nextNavigation from "next/navigation";
import AdminSettingsPage from "../page";
import { ACCESS_TOKEN_KEY } from "../../../auth-token";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const useRouterMock = nextNavigation.useRouter as jest.Mock;

type SettingsResponseLike = {
  branding?: Record<string, unknown>;
  features?: Record<string, unknown>;
  languages?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  socialProviders?: unknown;
  socialCredentials?: unknown;
} & Record<string, unknown>;

function makeSettingsResponse(overrides?: Partial<SettingsResponseLike>) {
  return {
    branding: {
      appName: "BeeLMS",
      browserTitle: "BeeLMS",
      footerSocialLinks: null,
      ...overrides?.branding,
    },
    features: {
      wiki: true,
      wikiPublic: true,
      courses: true,
      coursesPublic: true,
      myCourses: true,
      profile: true,
      accessibilityWidget: true,
      seo: true,
      themeLight: true,
      themeDark: true,
      themeModeSelector: true,
      auth: true,
      authLogin: true,
      authRegister: true,
      auth2fa: false,
      captcha: false,
      captchaLogin: false,
      captchaRegister: false,
      captchaForgotPassword: false,
      captchaChangePassword: false,
      paidCourses: true,
      socialGoogle: true,
      socialFacebook: true,
      socialGithub: true,
      socialLinkedin: true,
      infraMonitoring: true,
      infraMonitoringUrl: "https://example.com/monitoring",
      infraRedis: false,
      infraRedisUrl: null,
      infraRabbitmq: false,
      infraRabbitmqUrl: null,
      infraErrorTracking: false,
      infraErrorTrackingUrl: null,
      ...overrides?.features,
    },
    languages: {
      supported: ["bg"],
      default: "bg",
      icons: null,
      flagPicker: null,
      ...overrides?.languages,
    },
    seo: {
      baseUrl: null,
      titleTemplate: "{page} | {site}",
      defaultTitle: null,
      defaultDescription: null,
      robots: { index: true },
      sitemap: {
        enabled: true,
        includeWiki: true,
        includeCourses: true,
        includeLegal: true,
      },
      ...overrides?.seo,
    },
    socialProviders: null,
    socialCredentials: null,
    ...overrides,
  };
}

describe("AdminSettingsPage infra toggles", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();

    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = jest.fn();
    }

    useRouterMock.mockReturnValue({
      replace: jest.fn(),
      push: jest.fn(),
      prefetch: jest.fn(),
    });

    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");
  });

  it("blocks enabling Redis when URL is invalid, then saves when valid", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => makeSettingsResponse(),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () =>
          makeSettingsResponse({
            features: {
              infraRedis: true,
              infraRedisUrl: "redis://localhost:6379",
            },
          }),
      } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AdminSettingsPage />);

    await screen.findByRole("heading", { name: "Settings" });

    await waitFor(() => {
      expect(screen.queryByText("Зареждане...")).not.toBeInTheDocument();
    });

    const featureTogglesAccordion = await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      const trigger = buttons.find((btn) =>
        within(btn).queryByText(/^Feature toggles$/i),
      );
      if (!trigger) {
        throw new Error("Expected Feature toggles accordion trigger button");
      }
      return trigger;
    });
    await userEvent.click(featureTogglesAccordion);

    const redisSwitch = await screen.findByRole("switch", {
      name: "Infra Redis",
    });
    const infraRedisRow = redisSwitch.closest("div");
    if (!infraRedisRow) throw new Error("Expected infra redis row");

    await userEvent.click(redisSwitch);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "За да включиш Redis",
    );

    await userEvent.type(
      within(infraRedisRow).getByPlaceholderText(/redis:\/\/\.\.\.|host:port/i),
      "redis://localhost:6379",
    );

    await userEvent.click(redisSwitch);

    const saveButton = screen.getByRole("button", { name: "Запази" });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/api/admin/settings",
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    const patchCall = fetchMock.mock.calls.find(
      (call) => call?.[1]?.method === "PATCH",
    );
    if (!patchCall) throw new Error("Expected PATCH call");
    const body = JSON.parse(patchCall[1].body);

    expect(body.features).toEqual(
      expect.objectContaining({
        infraRedis: true,
        infraRedisUrl: "redis://localhost:6379",
      }),
    );
  }, 15000);

  it("blocks enabling Error tracking when URL is invalid", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => makeSettingsResponse(),
    } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AdminSettingsPage />);

    await screen.findByRole("heading", { name: "Settings" });

    await waitFor(() => {
      expect(screen.queryByText("Зареждане...")).not.toBeInTheDocument();
    });

    const featureTogglesAccordion = await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      const trigger = buttons.find((btn) =>
        within(btn).queryByText(/^Feature toggles$/i),
      );
      if (!trigger) {
        throw new Error("Expected Feature toggles accordion trigger button");
      }
      return trigger;
    });
    await userEvent.click(featureTogglesAccordion);

    const errorSwitch = await screen.findByRole("switch", {
      name: "Infra Error tracking",
    });
    const row = errorSwitch.closest("div");
    if (!row) throw new Error("Expected infra error tracking row");

    await userEvent.clear(within(row).getByPlaceholderText("https://..."));
    await userEvent.type(
      within(row).getByPlaceholderText("https://..."),
      "not-a-url",
    );

    await userEvent.click(errorSwitch);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Error tracking",
    );
  }, 15000);
});
