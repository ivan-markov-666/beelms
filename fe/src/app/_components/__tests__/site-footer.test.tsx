import { render, screen } from "@testing-library/react";
import * as nextNavigation from "next/navigation";
import { SiteFooter } from "../site-footer";
import type { PublicSettings } from "../../_data/public-settings";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

const useSearchParamsMock = nextNavigation.useSearchParams as jest.Mock;

function makeSearchParams(query: string) {
  return new URLSearchParams(query) as unknown as URLSearchParams;
}

describe("SiteFooter", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useSearchParamsMock.mockReturnValue(makeSearchParams("lang=bg"));
  });

  it("renders footer links matching wireframe navigation", () => {
    const initialPublicSettings: PublicSettings = {
      branding: {
        appName: "Test",
        pageLinks: {
          enabled: true,
          bySlug: {
            about: { footer: true },
            privacy: { footer: true },
            contact: { footer: true },
          },
        },
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
        paymentsStripe: false,
        paymentsPaypal: false,
        paymentsMypos: false,
        paymentsRevolut: false,
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
        socialGoogle: false,
        socialFacebook: false,
        socialGithub: false,
        socialLinkedin: false,
        infraRedis: false,
        infraRabbitmq: false,
        infraMonitoring: false,
        infraErrorTracking: false,
      },
      languages: {
        supported: ["bg", "en"],
        default: "bg",
      },
      seo: null,
    };

    render(<SiteFooter initialPublicSettings={initialPublicSettings} />);

    const aboutLink = screen.getByRole("link", {
      name: "About",
    });
    const privacyLink = screen.getByRole("link", {
      name: "Политика за поверителност (Privacy/GDPR)",
    });
    const contactLink = screen.getByRole("link", { name: "Contact" });

    expect(aboutLink).toHaveAttribute("href", "/about");
    expect(privacyLink).toHaveAttribute("href", "/legal/privacy");
    expect(contactLink).toHaveAttribute("href", "/contact");
  });
});
