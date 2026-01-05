import {
  DEFAULT_LANG,
  SUPPORTED_LANGS,
  normalizeLang,
} from "../../i18n/config";

describe("i18n config", () => {
  it("defines supported languages", () => {
    expect(SUPPORTED_LANGS).toEqual(["bg", "en", "de"]);
  });

  it("normalizes null/undefined to DEFAULT_LANG", () => {
    expect(normalizeLang(null)).toBe(DEFAULT_LANG);
    expect(normalizeLang(undefined)).toBe(DEFAULT_LANG);
  });

  it("normalizes known languages", () => {
    expect(normalizeLang("bg")).toBe("bg");
    expect(normalizeLang("en")).toBe("en");
    expect(normalizeLang("de")).toBe("de");
  });

  it("falls back to DEFAULT_LANG for unknown values when supported list is provided", () => {
    expect(normalizeLang("fr", ["bg", "en"], DEFAULT_LANG)).toBe(DEFAULT_LANG);
  });
});
