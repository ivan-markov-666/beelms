import { render, screen, waitFor } from "@testing-library/react";
import * as nextNavigation from "next/navigation";
import { HeaderNav } from "../header-nav";
import { ACCESS_TOKEN_KEY } from "../../auth-token";

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useSearchParams: jest.fn(),
    usePathname: jest.fn(),
    useRouter: jest.fn(),
  };
});

const useSearchParamsMock = nextNavigation.useSearchParams as jest.Mock;
const usePathnameMock = nextNavigation.usePathname as jest.Mock;
const useRouterMock = nextNavigation.useRouter as jest.Mock;

// Provide a default router object so LanguageSwitcher can call router.push safely
useRouterMock.mockReturnValue({ push: jest.fn() });

function makeSearchParams(query: string) {
  return new URLSearchParams(query) as unknown as URLSearchParams;
}

describe("HeaderNav i18n", () => {
  it("renders BG labels when lang=bg", async () => {
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));
    usePathnameMock.mockReturnValue("/wiki");

    // stub fetch for public settings
    global.fetch = jest.fn().mockImplementation(async (input: RequestInfo) => {
      const url = String(input);

      if (url.includes("/public/settings")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            branding: { appName: "BeeLMS" },
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
              paidCourses: true,
              gdprLegal: true,
              pageTerms: true,
              pagePrivacy: true,
              pageCookiePolicy: true,
              pageImprint: true,
              pageAccessibility: true,
              pageContact: true,
              pageFaq: true,
              pageSupport: true,
              pageNotFound: true,
              socialGoogle: true,
              socialFacebook: true,
              socialGithub: true,
              socialLinkedin: true,
              infraRedis: false,
              infraRabbitmq: false,
              infraMonitoring: true,
              infraErrorTracking: false,
            },
            languages: { supported: ["bg"], default: "bg" },
          }),
        } as unknown as Response;
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      } as unknown as Response;
    });

    render(<HeaderNav />);

    expect(screen.getByRole("link", { name: "Wiki" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Courses" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "My Courses" }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Вход" }),
    ).toBeInTheDocument();
  });

  it("renders EN labels when lang=en", async () => {
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=en"));
    usePathnameMock.mockReturnValue("/wiki");

    global.fetch = jest.fn().mockImplementation(async (input: RequestInfo) => {
      const url = String(input);

      if (url.includes("/public/settings")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            branding: { appName: "BeeLMS" },
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
              paidCourses: true,
              gdprLegal: true,
              pageTerms: true,
              pagePrivacy: true,
              pageCookiePolicy: true,
              pageImprint: true,
              pageAccessibility: true,
              pageContact: true,
              pageFaq: true,
              pageSupport: true,
              pageNotFound: true,
              socialGoogle: true,
              socialFacebook: true,
              socialGithub: true,
              socialLinkedin: true,
              infraRedis: false,
              infraRabbitmq: false,
              infraMonitoring: true,
              infraErrorTracking: false,
            },
            languages: { supported: ["en"], default: "en" },
          }),
        } as unknown as Response;
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      } as unknown as Response;
    });

    render(<HeaderNav />);

    expect(screen.getByRole("link", { name: "Wiki" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Courses" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "My Courses" }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Sign in" }),
    ).toBeInTheDocument();
  });

  it("hides login link when an access token is present", async () => {
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));
    usePathnameMock.mockReturnValue("/wiki");

    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    // stub fetch for public settings + profile check
    global.fetch = jest.fn().mockImplementation(async (input: RequestInfo) => {
      const url = String(input);

      if (url.includes("/public/settings")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            branding: { appName: "BeeLMS" },
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
              paidCourses: true,
              gdprLegal: true,
              pageTerms: true,
              pagePrivacy: true,
              pageCookiePolicy: true,
              pageImprint: true,
              pageAccessibility: true,
              pageContact: true,
              pageFaq: true,
              pageSupport: true,
              pageNotFound: true,
              socialGoogle: true,
              socialFacebook: true,
              socialGithub: true,
              socialLinkedin: true,
              infraRedis: false,
              infraRabbitmq: false,
              infraMonitoring: true,
              infraErrorTracking: false,
            },
            languages: { supported: ["bg"], default: "bg" },
          }),
        } as unknown as Response;
      }

      if (url.includes("/users/me")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "user-id",
            email: "user@example.com",
            createdAt: "2024-01-01T00:00:00.000Z",
            role: "user",
          }),
        } as unknown as Response;
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      } as unknown as Response;
    });

    render(<HeaderNav />);

    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: "Вход" }),
      ).not.toBeInTheDocument();
    });

    expect(
      await screen.findByRole("link", { name: "My Courses" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Профил" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Изход" })).toBeInTheDocument();

    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  });

  it("shows Admin link only for admin user", async () => {
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=en"));
    usePathnameMock.mockReturnValue("/wiki");

    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    global.fetch = jest.fn().mockImplementation(async (input: RequestInfo) => {
      const url = String(input);

      if (url.includes("/public/settings")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            branding: { appName: "BeeLMS" },
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
              paidCourses: true,
              gdprLegal: true,
              pageTerms: true,
              pagePrivacy: true,
              pageCookiePolicy: true,
              pageImprint: true,
              pageAccessibility: true,
              pageContact: true,
              pageFaq: true,
              pageSupport: true,
              pageNotFound: true,
              socialGoogle: true,
              socialFacebook: true,
              socialGithub: true,
              socialLinkedin: true,
              infraRedis: false,
              infraRabbitmq: false,
              infraMonitoring: true,
              infraErrorTracking: false,
            },
            languages: { supported: ["en"], default: "en" },
          }),
        } as unknown as Response;
      }

      if (url.includes("/users/me")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "admin-id",
            email: "admin@example.com",
            createdAt: "2024-01-01T00:00:00.000Z",
            role: "admin",
          }),
        } as unknown as Response;
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      } as unknown as Response;
    });

    render(<HeaderNav />);

    expect(
      await screen.findByRole("link", { name: "Admin" }),
    ).toBeInTheDocument();

    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  });

  it("does not show Admin link for non-admin user", async () => {
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=en"));
    usePathnameMock.mockReturnValue("/wiki");

    window.localStorage.setItem(ACCESS_TOKEN_KEY, "test-token");

    global.fetch = jest.fn().mockImplementation(async (input: RequestInfo) => {
      const url = String(input);

      if (url.includes("/public/settings")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            branding: { appName: "BeeLMS" },
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
              paidCourses: true,
              gdprLegal: true,
              pageTerms: true,
              pagePrivacy: true,
              pageCookiePolicy: true,
              pageImprint: true,
              pageAccessibility: true,
              pageContact: true,
              pageFaq: true,
              pageSupport: true,
              pageNotFound: true,
              socialGoogle: true,
              socialFacebook: true,
              socialGithub: true,
              socialLinkedin: true,
              infraRedis: false,
              infraRabbitmq: false,
              infraMonitoring: true,
              infraErrorTracking: false,
            },
            languages: { supported: ["en"], default: "en" },
          }),
        } as unknown as Response;
      }

      if (url.includes("/users/me")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "user-id",
            email: "user@example.com",
            createdAt: "2024-01-01T00:00:00.000Z",
            role: "user",
          }),
        } as unknown as Response;
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      } as unknown as Response;
    });

    render(<HeaderNav />);

    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: "Admin" }),
      ).not.toBeInTheDocument();
    });

    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  });

  it("does not show Admin link when token is missing", async () => {
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=en"));
    usePathnameMock.mockReturnValue("/wiki");

    global.fetch = jest.fn().mockImplementation(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/public/settings")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            branding: { appName: "BeeLMS" },
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
              paidCourses: true,
              gdprLegal: true,
              pageTerms: true,
              pagePrivacy: true,
              pageCookiePolicy: true,
              pageImprint: true,
              pageAccessibility: true,
              pageContact: true,
              pageFaq: true,
              pageSupport: true,
              pageNotFound: true,
              socialGoogle: true,
              socialFacebook: true,
              socialGithub: true,
              socialLinkedin: true,
              infraRedis: false,
              infraRabbitmq: false,
              infraMonitoring: true,
              infraErrorTracking: false,
            },
            languages: { supported: ["en"], default: "en" },
          }),
        } as unknown as Response;
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      } as unknown as Response;
    });

    render(<HeaderNav />);

    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: "Admin" }),
      ).not.toBeInTheDocument();
    });
  });

  it("hides theme dropdown when only one theme mode is enabled", async () => {
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=en"));
    usePathnameMock.mockReturnValue("/wiki");

    global.fetch = jest.fn().mockImplementation(async (input: RequestInfo) => {
      const url = String(input);

      if (url.includes("/public/settings")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            branding: { appName: "BeeLMS" },
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
              themeDark: false,
              themeModeSelector: true,
              auth: true,
              authLogin: true,
              authRegister: true,
              paidCourses: true,
              gdprLegal: true,
              pageTerms: true,
              pagePrivacy: true,
              pageCookiePolicy: true,
              pageImprint: true,
              pageAccessibility: true,
              pageContact: true,
              pageFaq: true,
              pageSupport: true,
              pageNotFound: true,
              socialGoogle: true,
              socialFacebook: true,
              socialGithub: true,
              socialLinkedin: true,
              infraRedis: false,
              infraRabbitmq: false,
              infraMonitoring: true,
              infraErrorTracking: false,
            },
            languages: { supported: ["en"], default: "en" },
          }),
        } as unknown as Response;
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      } as unknown as Response;
    });

    render(<HeaderNav />);

    await waitFor(() => {
      expect(screen.queryByLabelText("Theme")).not.toBeInTheDocument();
    });
  });
});
