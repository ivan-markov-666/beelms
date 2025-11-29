import type { SupportedLang } from "./config";

type DomainMessages = {
  nav: {
    wiki: string;
    practice: string;
    login: string;
  };
  common: Record<string, string>;
};

export type Messages = {
  [L in SupportedLang]: DomainMessages;
};

export const messages: Messages = {
  bg: {
    nav: {
      wiki: "Wiki",
      practice: "Практика",
      login: "Вход",
    },
    common: {},
  },
  en: {
    nav: {
      wiki: "Wiki",
      practice: "Practice",
      login: "Sign in",
    },
    common: {},
  },
};
