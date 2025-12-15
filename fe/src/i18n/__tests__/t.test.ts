import { t } from "../../i18n/t";
import { DEFAULT_LANG } from "../../i18n/config";
import type { Messages } from "../../i18n/messages";

describe("i18n t helper", () => {
  it("returns the correct translation for existing keys", () => {
    expect(t("bg", "nav", "practice")).toBe("Практика");
    expect(t("en", "nav", "practice")).toBe("Practice");
  });

  it("falls back to DEFAULT_LANG when translation is missing for selected language", () => {
    const customMessages = {
      bg: {
        nav: {
          wiki: "Wiki",
          practice: "Практика",
          login: "Вход",
        },
        auth: {},
        common: {},
        wiki: {},
      },
      en: {
        nav: {
          wiki: "Wiki",
          // practice липсва нарочно, за да форсираме fallback към BG
          login: "Sign in",
        },
        auth: {},
        common: {},
        wiki: {},
      },
      de: {
        nav: {
          wiki: "Wiki",
          practice: "Praxis",
          login: "Anmelden",
        },
        auth: {},
        common: {},
        wiki: {},
      },
    } as unknown as Messages;

    expect(t("en", "nav", "practice", customMessages)).toBe("Практика");
  });

  it("returns the key itself if translation is missing in both selected and default language", () => {
    const customMessages: Messages = {
      bg: {
        nav: {
          wiki: "Wiki",
          practice: "Практика",
          practiceApi: "API Demo",
          login: "Вход",
          register: "Регистрация",
          profile: "Профил",
          logout: "Изход",
          admin: "Admin",
        },
        auth: {},
        common: {},
        wiki: {},
      },
      en: {
        nav: {
          wiki: "Wiki",
          practice: "Practice",
          practiceApi: "API Demo",
          login: "Sign in",
          register: "Register",
          profile: "Profile",
          logout: "Logout",
          admin: "Admin",
        },
        auth: {},
        common: {},
        wiki: {},
      },
      de: {
        nav: {
          wiki: "Wiki",
          practice: "Praxis",
          practiceApi: "API Demo",
          login: "Anmelden",
          register: "Registrieren",
          profile: "Profil",
          logout: "Abmelden",
          admin: "Admin",
        },
        auth: {},
        common: {},
        wiki: {},
      },
    };

    expect(t(DEFAULT_LANG, "common", "nonexistent-key", customMessages)).toBe(
      "nonexistent-key",
    );
  });
});
