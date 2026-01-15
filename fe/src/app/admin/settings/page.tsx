"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as Fa6Icons from "react-icons/fa6";
import * as SiIcons from "react-icons/si";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";
import { AdminBreadcrumbs } from "../_components/admin-breadcrumbs";
import { InfoTooltip } from "../_components/info-tooltip";
import { ListboxSelect } from "../../_components/listbox-select";

const API_BASE_URL = getApiBaseUrl();

const THEME_FIELD_KEYS = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "error",
  "card",
  "border",
  "scrollThumb",
  "scrollTrack",
  "fieldOkBg",
  "fieldOkBorder",
  "fieldAlertBg",
  "fieldAlertBorder",
  "fieldErrorBg",
  "fieldErrorBorder",
] as const;

type ThemeFieldKey = (typeof THEME_FIELD_KEYS)[number];

const THEME_FIELD_ORDER: ThemeFieldKey[] = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "error",
  "card",
  "border",
  "scrollThumb",
  "scrollTrack",
  "fieldOkBg",
  "fieldOkBorder",
  "fieldAlertBg",
  "fieldAlertBorder",
  "fieldErrorBg",
  "fieldErrorBorder",
];

const THEME_FIELD_DEFS: Record<
  ThemeFieldKey,
  { label: string; description: string; token: string; example: string }
> = {
  background: {
    label: "Background",
    description: "Основен фон на страницата (body/background).",
    token: "--background / --theme-*-background",
    example: "Главен layout фон",
  },
  foreground: {
    label: "Foreground",
    description:
      "Основен цвят за текст и икони (вкл. текст в input/textarea/select и dropdown списъци).",
    token: "--foreground / --theme-*-foreground",
    example: "Текст в UI + стойности в form полета",
  },
  primary: {
    label: "Primary",
    description: "Главен акцентен цвят (бутони, линкове, highlights).",
    token: "--primary / --theme-*-primary",
    example: "CTA бутони, активни състояния",
  },
  secondary: {
    label: "Secondary",
    description: "Вторичен акцент за линкове/информационни елементи.",
    token: "--secondary / --theme-*-secondary",
    example: "Информационни банери, вторични бутони",
  },
  error: {
    label: "Error",
    description: "Критични съобщения и destructive бутони.",
    token: "--error / --theme-*-error",
    example: "Field errors, danger бутони",
  },
  card: {
    label: "Card",
    description:
      "Контейнери/панели върху background (вкл. фон на input/textarea/select и dropdown списъци).",
    token: "--card / --theme-*-card",
    example: "Card background + form field background",
  },
  border: {
    label: "Border",
    description: "Граници на панели, form полета и делители.",
    token: "--border / --theme-*-border",
    example: "Card border + input/select рамки",
  },
  scrollThumb: {
    label: "Scroll thumb",
    description: "Цвят на скрол бара (движещата се част).",
    token: "--scroll-thumb / --theme-*-scroll-thumb",
    example: "Scrollbar thumb",
  },
  scrollTrack: {
    label: "Scroll track",
    description: "Фонът на скрол бара.",
    token: "--scroll-track / --theme-*-scroll-track",
    example: "Scrollbar track",
  },
  fieldOkBg: {
    label: "Selected/OK bg",
    description: "Фон за успех/потвърждение (напр. success toast).",
    token: "--field-ok-bg / --theme-*-field-ok-bg",
    example: "Success банери, подсветка на валидни полета",
  },
  fieldOkBorder: {
    label: "Selected/OK border",
    description: "Рамка за успех/потвърждение.",
    token: "--field-ok-border / --theme-*-field-ok-border",
    example: "Success банери, подсветка на валидни полета",
  },
  fieldAlertBg: {
    label: "Alert bg",
    description: "Фон за alert/warning съобщения и стойности.",
    token: "--field-alert-bg / --theme-*-field-alert-bg",
    example: "Warning банери, подсветка на alert полета",
  },
  fieldAlertBorder: {
    label: "Alert border",
    description: "Рамка за alert/warning съобщения и стойности.",
    token: "--field-alert-border / --theme-*-field-alert-border",
    example: "Warning банери, подсветка на alert полета",
  },
  fieldErrorBg: {
    label: "Missing/Error bg",
    description: "Фон за грешки и липсващи данни.",
    token: "--field-error-bg / --theme-*-field-error-bg",
    example: "Validation грешки, предупреждения",
  },
  fieldErrorBorder: {
    label: "Missing/Error border",
    description: "Рамки/делители при грешки.",
    token: "--field-error-border / --theme-*-field-error-border",
    example: "Validation грешки, предупреждения",
  },
};

const THEME_PREVIEW_LEGEND_KEYS: ThemeFieldKey[] = [
  "background",
  "foreground",
  "card",
  "border",
  "primary",
  "secondary",
];

type ThemePalette = Record<ThemeFieldKey, string>;
type ThemePaletteDraft = Partial<Record<ThemeFieldKey, string>>;
type ThemeVariant = "light" | "dark";
type ThemePreset = {
  id: string;
  name: string;
  description: string;
  light: ThemePalette;
  dark: ThemePalette;
};

type ThemePresetDraft = {
  id: string;
  name: string;
  description: string;
  light: Partial<ThemePalette>;
  dark: Partial<ThemePalette>;
};
type CustomThemePreset = {
  id: string;
  name: string;
  description?: string | null;
  light: ThemePalette;
  dark: ThemePalette;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};
type ThemeHexDraftState = Record<ThemeVariant, ThemePaletteDraft>;
type ThemePresetTarget = "both" | "light" | "dark";
type StringDictionary = Record<string, string>;

const MIN_BUTTON_CONTRAST_RATIO = 3.2;

type RgbTuple = { r: number; g: number; b: number };

function hexToRgb(hex: string): RgbTuple | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return { r, g, b };
  }
  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].some((value) => Number.isNaN(value))) {
      return null;
    }
    return { r, g, b };
  }
  return null;
}

function rgbToHex({ r, g, b }: RgbTuple): string {
  const clamp = (value: number) =>
    Math.min(255, Math.max(0, Math.round(value)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function hueFromHex(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return Number.NaN;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;

  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  hue *= 60;
  if (hue < 0) hue += 360;
  return hue;
}

function relativeLuminance({ r, g, b }: RgbTuple): number {
  const channel = (value: number) => {
    const srgb = value / 255;
    return srgb <= 0.03928
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return Infinity;
  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  const brightest = Math.max(lumA, lumB);
  const darkest = Math.min(lumA, lumB);
  return (brightest + 0.05) / (darkest + 0.05);
}

function mixHex(base: string, target: string, amount: number): string {
  const baseRgb = hexToRgb(base);
  const targetRgb = hexToRgb(target);
  if (!baseRgb || !targetRgb) return base;
  return rgbToHex({
    r: baseRgb.r + (targetRgb.r - baseRgb.r) * amount,
    g: baseRgb.g + (targetRgb.g - baseRgb.g) * amount,
    b: baseRgb.b + (targetRgb.b - baseRgb.b) * amount,
  });
}

function ensureButtonContrast(
  color: string,
  foreground: string,
  variant: ThemeVariant,
): string {
  if (!color || !foreground) return color;
  let adjusted = color;
  let attempts = 0;
  while (
    contrastRatio(adjusted, foreground) < MIN_BUTTON_CONTRAST_RATIO &&
    attempts < 12
  ) {
    adjusted = mixHex(
      adjusted,
      variant === "light" ? "#ffffff" : "#000000",
      0.15,
    );
    attempts += 1;
  }
  return adjusted;
}

function ensureLinkContrast(
  color: string,
  background: string,
  variant: ThemeVariant,
  minContrast = 5,
): string {
  if (!color || !background) return color;

  const baseContrast = contrastRatio(color, background);
  if (baseContrast >= minContrast) {
    return color;
  }

  const target = variant === "light" ? "#000000" : "#ffffff";
  let best = color;
  let bestContrast = baseContrast;

  for (let i = 1; i <= 20; i += 1) {
    const mixed = mixHex(color, target, i / 20);
    const c = contrastRatio(mixed, background);
    if (c > bestContrast) {
      bestContrast = c;
      best = mixed;
    }
    if (c >= minContrast) {
      return mixed;
    }
  }

  return best;
}

function normalizeButtonContrast(
  palette: ThemePalette,
  variant: ThemeVariant,
): ThemePalette {
  return {
    ...palette,
    primary: ensureButtonContrast(palette.primary, palette.foreground, variant),
    secondary: ensureButtonContrast(
      palette.secondary,
      palette.foreground,
      variant,
    ),
  };
}

function completeThemePalette(
  partial: Partial<ThemePalette>,
  fallback: ThemePalette,
  variant: ThemeVariant,
): ThemePalette {
  const merged = THEME_FIELD_KEYS.reduce((acc, key) => {
    const raw = partial[key];
    acc[key] =
      typeof raw === "string" && raw.trim().length > 0
        ? raw.trim()
        : fallback[key];
    return acc;
  }, {} as ThemePalette);

  const alertAccent = "#f59e0b";
  if (
    typeof partial.fieldAlertBg !== "string" ||
    partial.fieldAlertBg.trim().length === 0
  ) {
    merged.fieldAlertBg = mixHex(
      merged.background,
      alertAccent,
      variant === "dark" ? 0.16 : 0.08,
    );
  }
  if (
    typeof partial.fieldAlertBorder !== "string" ||
    partial.fieldAlertBorder.trim().length === 0
  ) {
    merged.fieldAlertBorder = mixHex(
      merged.border,
      alertAccent,
      variant === "dark" ? 0.6 : 0.45,
    );
  }

  return normalizeButtonContrast(merged, variant);
}

const SUCCESS_NOTICE_STYLE: CSSProperties = {
  backgroundColor: "var(--field-ok-bg)",
  borderColor: "var(--field-ok-border)",
  color: "var(--foreground)",
};

const ERROR_NOTICE_STYLE: CSSProperties = {
  backgroundColor: "var(--field-error-bg)",
  borderColor: "var(--field-error-border)",
  color: "var(--error)",
};

const ALERT_NOTICE_STYLE: CSSProperties = {
  backgroundColor: "var(--field-alert-bg)",
  borderColor: "var(--field-alert-border)",
  color: "var(--foreground)",
};

const BUILT_IN_PRESET_EDIT_ALERT_MESSAGE =
  "Промени цветовете, избери ново име в секцията Custom presets и натисни Save preset (ще създадеш нов custom вариант, оригиналът остава непроменен).";

const DEFAULT_THEME_LIGHT: Record<ThemeFieldKey, string> = {
  background: "#ffffff",
  foreground: "#171717",
  primary: "#16a34a",
  secondary: "#2563eb",
  error: "#dc2626",
  card: "#ffffff",
  border: "#e5e7eb",
  scrollThumb: "#86efac",
  scrollTrack: "#f0fdf4",
  fieldOkBg: "#f0fdf4",
  fieldOkBorder: "#dcfce7",
  fieldAlertBg: "#fff7ed",
  fieldAlertBorder: "#fed7aa",
  fieldErrorBg: "#fef2f2",
  fieldErrorBorder: "#fee2e2",
};

const DEFAULT_THEME_DARK: Record<ThemeFieldKey, string> = {
  background: "#0f172a",
  foreground: "#e5e7eb",
  primary: "#22c55e",
  secondary: "#60a5fa",
  error: "#fb7185",
  card: "#111827",
  border: "#374151",
  scrollThumb: "#16a34a",
  scrollTrack: "#0b2a16",
  fieldOkBg: "#052e16",
  fieldOkBorder: "#14532d",
  fieldAlertBg: "#2a1607",
  fieldAlertBorder: "#9a3412",
  fieldErrorBg: "#450a0a",
  fieldErrorBorder: "#7f1d1d",
};

const RAW_THEME_PRESETS: ThemePresetDraft[] = [
  {
    id: "beelms-golden-honey",
    name: "Golden Honey",
    description: "beeLMS – медено златисто + топли акценти.",
    light: {
      background: "#f5f3ef",
      foreground: "#2b2419",
      primary: "#f0b90b",
      secondary: "#f59e42",
      error: "#b91c1c",
      card: "#faf7f0",
      border: "#ddd5c7",
      scrollThumb: "#f0b90b",
      scrollTrack: "#fbf9f5",
      fieldOkBg: "#f5fbe8",
      fieldOkBorder: "#84cc16",
      fieldErrorBg: "#fef2f2",
      fieldErrorBorder: "#fca5a5",
    },
    dark: {
      background: "#1a1613",
      foreground: "#e8e6e1",
      primary: "#f5c951",
      secondary: "#f0ad6f",
      error: "#f87171",
      card: "#221f1a",
      border: "#3d3830",
      scrollThumb: "#f5c951",
      scrollTrack: "#15120f",
      fieldOkBg: "#1b2a16",
      fieldOkBorder: "#84cc16",
      fieldErrorBg: "#3a1a14",
      fieldErrorBorder: "#f87171",
    },
  },
  {
    id: "beelms-pollination-garden",
    name: "Pollination Garden",
    description: "beeLMS – лавандула + жълти акценти, природна хармония.",
    light: {
      background: "#f7f7fb",
      foreground: "#2d2640",
      primary: "#ffd000",
      secondary: "#967ed6",
      error: "#e11d48",
      card: "#f2f1f9",
      border: "#d4d1e5",
      scrollThumb: "#967ed6",
      scrollTrack: "#efeff8",
      fieldOkBg: "#ecfdf5",
      fieldOkBorder: "#22c55e",
      fieldErrorBg: "#fff1f2",
      fieldErrorBorder: "#fb7185",
    },
    dark: {
      background: "#17141f",
      foreground: "#dddce3",
      primary: "#ffe066",
      secondary: "#b5a4e8",
      error: "#fb7185",
      card: "#1e1a28",
      border: "#3a3548",
      scrollThumb: "#b5a4e8",
      scrollTrack: "#141f2b",
      fieldOkBg: "#12261d",
      fieldOkBorder: "#22c55e",
      fieldErrorBg: "#33151c",
      fieldErrorBorder: "#fb7185",
    },
  },
  {
    id: "mocha-elegance",
    name: "Mocha Elegance",
    description: "Pantone 2025 вдъхновение – топли, уютни кафеникави тонове.",
    light: {
      background: "#faf7f5",
      foreground: "#2c2319",
      primary: "#8b6f47",
      secondary: "#b8956a",
      error: "#c84b31",
      card: "#ffffff",
      border: "#e5ddd5",
      scrollThumb: "#c9b5a0",
      scrollTrack: "#f0ebe6",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#1a1410",
      foreground: "#e8dfd6",
      primary: "#c9a875",
      secondary: "#9d8566",
      error: "#e76f51",
      card: "#2a2018",
      border: "#3d3228",
      scrollThumb: "#5a4a3a",
      scrollTrack: "#231c15",
      fieldOkBg: "#1b3a1f",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#3a1a14",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Спокойни сини и аква тонове за професионални приложения.",
    light: {
      background: "#f5f9fc",
      foreground: "#1a2c3d",
      primary: "#2e86ab",
      secondary: "#5dade2",
      error: "#d32f2f",
      card: "#ffffff",
      border: "#d6e9f5",
      scrollThumb: "#85c1e9",
      scrollTrack: "#ebf5fb",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#0f1c26",
      foreground: "#e0ebf5",
      primary: "#5dade2",
      secondary: "#3498db",
      error: "#ef5350",
      card: "#15202b",
      border: "#243447",
      scrollThumb: "#355273",
      scrollTrack: "#101821",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "forest-sanctuary",
    name: "Forest Sanctuary",
    description: "Природни зелени тонове, вдъхновени от 2025 трендовете.",
    light: {
      background: "#f7faf7",
      foreground: "#1f3a28",
      primary: "#4a7c59",
      secondary: "#6b9e78",
      error: "#d84315",
      card: "#ffffff",
      border: "#d9e8dd",
      scrollThumb: "#8fbc8f",
      scrollTrack: "#edf5ee",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#ff7043",
    },
    dark: {
      background: "#141a16",
      foreground: "#dfe8e1",
      primary: "#7fb685",
      secondary: "#5a8d66",
      error: "#ff6f43",
      card: "#1f2a22",
      border: "#2f4032",
      scrollThumb: "#4a6b51",
      scrollTrack: "#191f1b",
      fieldOkBg: "#1f3a27",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a2520",
      fieldErrorBorder: "#ff7043",
    },
  },
  {
    id: "ruby-passion",
    name: "Ruby Passion",
    description: "Смели рубинено червени акценти – Behr 2025 вдъхновение.",
    light: {
      background: "#faf5f6",
      foreground: "#2d1b1f",
      primary: "#d45872",
      secondary: "#e88b9b",
      error: "#c62828",
      card: "#ffffff",
      border: "#ecd7dc",
      scrollThumb: "#e4b6c1",
      scrollTrack: "#fbf7f8",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#1a1214",
      foreground: "#ebd9dd",
      primary: "#d97b8f",
      secondary: "#b5536a",
      error: "#ef5350",
      card: "#2a1d20",
      border: "#3d2e31",
      scrollThumb: "#704249",
      scrollTrack: "#1f1517",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "sunrise-nectar",
    name: "Sunrise Nectar",
    description:
      "Изгрев върху кошера – огнено червени и златисти тонове, оптимистични и енергични.",
    light: {
      background: "#f9f6f5",
      foreground: "#372820",
      primary: "#ec5744",
      secondary: "#f5a623",
      error: "#c2410c",
      card: "#f4ede8",
      border: "#e3dad4",
      scrollThumb: "#f2b5a8",
      scrollTrack: "#fdf9f7",
      fieldOkBg: "#f5fbe8",
      fieldOkBorder: "#84cc16",
      fieldErrorBg: "#fff1f2",
      fieldErrorBorder: "#fb7185",
    },
    dark: {
      background: "#1d1512",
      foreground: "#e0dcda",
      primary: "#ed8274",
      secondary: "#f5bd6b",
      error: "#fb7185",
      card: "#26201b",
      border: "#3f3630",
      scrollThumb: "#f1a28f",
      scrollTrack: "#130c0a",
      fieldOkBg: "#132615",
      fieldOkBorder: "#4ade80",
      fieldErrorBg: "#3a1a14",
      fieldErrorBorder: "#fb7185",
    },
  },
  {
    id: "queen-bee-burgundy",
    name: "Queen Bee Burgundy",
    description:
      "Луксозно бордо с кралски златисти акценти – премиум усещане за курсове.",
    light: {
      background: "#f7f3f4",
      foreground: "#3d2929",
      primary: "#b32347",
      secondary: "#ebb134",
      error: "#b91c1c",
      card: "#f3ecee",
      border: "#dfd2d6",
      scrollThumb: "#e4b6c1",
      scrollTrack: "#fbf7f8",
      fieldOkBg: "#f5fbf2",
      fieldOkBorder: "#65a30d",
      fieldErrorBg: "#fff1f3",
      fieldErrorBorder: "#f87171",
    },
    dark: {
      background: "#251a1a",
      foreground: "#dadada",
      primary: "#d5697f",
      secondary: "#e4c26c",
      error: "#fb7185",
      card: "#2e2324",
      border: "#463637",
      scrollThumb: "#a25568",
      scrollTrack: "#180f10",
      fieldOkBg: "#142115",
      fieldOkBorder: "#65a30d",
      fieldErrorBg: "#3c161a",
      fieldErrorBorder: "#fb7185",
    },
  },
  {
    id: "terracotta-hive",
    name: "Terracotta Hive",
    description:
      "Глинена пчелна пита – земни теракотени тонове за практични обучения.",
    light: {
      background: "#f7f4f2",
      foreground: "#403230",
      primary: "#e07856",
      secondary: "#d8941e",
      error: "#c2410c",
      card: "#f0ebe7",
      border: "#dcd4cf",
      scrollThumb: "#edb49e",
      scrollTrack: "#fbf7f4",
      fieldOkBg: "#f3faf0",
      fieldOkBorder: "#65a30d",
      fieldErrorBg: "#fff3f0",
      fieldErrorBorder: "#f87171",
    },
    dark: {
      background: "#201815",
      foreground: "#dbd8d6",
      primary: "#e39e7e",
      secondary: "#d9ad60",
      error: "#fb7185",
      card: "#291f1b",
      border: "#3e3531",
      scrollThumb: "#c77f62",
      scrollTrack: "#150f0c",
      fieldOkBg: "#152219",
      fieldOkBorder: "#65a30d",
      fieldErrorBg: "#381915",
      fieldErrorBorder: "#fb7185",
    },
  },
  {
    id: "ruby-honey",
    name: "Ruby Honey",
    description:
      "Рубинен мед – наситени рубинени тонове с богато златисто усещане.",
    light: {
      background: "#f8f5f6",
      foreground: "#3d2630",
      primary: "#d11f49",
      secondary: "#fac800",
      error: "#be123c",
      card: "#f5f0f2",
      border: "#e2d8db",
      scrollThumb: "#f3a9c0",
      scrollTrack: "#fcf7f9",
      fieldOkBg: "#f4fbf2",
      fieldOkBorder: "#4ade80",
      fieldErrorBg: "#fff1f5",
      fieldErrorBorder: "#fb7185",
    },
    dark: {
      background: "#201317",
      foreground: "#e0dce0",
      primary: "#e0677f",
      secondary: "#f9d768",
      error: "#fb7185",
      card: "#291a1e",
      border: "#3f3237",
      scrollThumb: "#c65775",
      scrollTrack: "#150a0d",
      fieldOkBg: "#162215",
      fieldOkBorder: "#4ade80",
      fieldErrorBg: "#3a161c",
      fieldErrorBorder: "#fb7185",
    },
  },
  {
    id: "crimson-pollen",
    name: "Crimson Pollen",
    description:
      "Малинов прашец – модерни малинови тонове с прашецово жълти акценти.",
    light: {
      background: "#f8f4f5",
      foreground: "#3d2933",
      primary: "#db2862",
      secondary: "#f4c534",
      error: "#c2410c",
      card: "#f3ecf0",
      border: "#dfd3d9",
      scrollThumb: "#f2a8c2",
      scrollTrack: "#fcf6f8",
      fieldOkBg: "#f5fbf2",
      fieldOkBorder: "#4ade80",
      fieldErrorBg: "#fff1f4",
      fieldErrorBorder: "#fb7185",
    },
    dark: {
      background: "#201418",
      foreground: "#ddd8db",
      primary: "#de6f93",
      secondary: "#f1d474",
      error: "#fb7185",
      card: "#291b21",
      border: "#423438",
      scrollThumb: "#c45e83",
      scrollTrack: "#140b0f",
      fieldOkBg: "#162015",
      fieldOkBorder: "#4ade80",
      fieldErrorBg: "#3a141b",
      fieldErrorBorder: "#fb7185",
    },
  },
  {
    id: "sunset-swarm",
    name: "Sunset Swarm",
    description:
      "Рояк при залез – динамични оранжево-червени градиенти за социално учене.",
    light: {
      background: "#f8f5f3",
      foreground: "#3e2f26",
      primary: "#ea5234",
      secondary: "#f2a91f",
      error: "#c2410c",
      card: "#f2ede9",
      border: "#e0d7d0",
      scrollThumb: "#f3b6a2",
      scrollTrack: "#fdf8f4",
      fieldOkBg: "#f4faf1",
      fieldOkBorder: "#4ade80",
      fieldErrorBg: "#fff2ee",
      fieldErrorBorder: "#fb7185",
    },
    dark: {
      background: "#201714",
      foreground: "#ddd9d6",
      primary: "#e87f66",
      secondary: "#efbd65",
      error: "#fb7185",
      card: "#2a1f1a",
      border: "#423832",
      scrollThumb: "#c7644d",
      scrollTrack: "#140c0a",
      fieldOkBg: "#152116",
      fieldOkBorder: "#4ade80",
      fieldErrorBg: "#381812",
      fieldErrorBorder: "#fb7185",
    },
  },
  {
    id: "lavender-dreams",
    name: "Lavender Dreams",
    description: "Меки лавандулови и лилави тонове – Digital Lavender trend.",
    light: {
      background: "#f9f7fb",
      foreground: "#2e2638",
      primary: "#8b7ab8",
      secondary: "#b8a8d8",
      error: "#d32f2f",
      card: "#ffffff",
      border: "#e4dcf0",
      scrollThumb: "#b8a8d8",
      scrollTrack: "#f2edf7",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#16141a",
      foreground: "#e5dff0",
      primary: "#b8a8d8",
      secondary: "#9687be",
      error: "#ef5350",
      card: "#211e28",
      border: "#342f3d",
      scrollThumb: "#5a4f78",
      scrollTrack: "#1a1720",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "sunset-glow",
    name: "Sunset Glow",
    description: "Топли портокалови и златисти тонове.",
    light: {
      background: "#fbf7f3",
      foreground: "#2e1f15",
      primary: "#e07a5f",
      secondary: "#f4a261",
      error: "#d32f2f",
      card: "#ffffff",
      border: "#f0e2d7",
      scrollThumb: "#e9b896",
      scrollTrack: "#f7f0e9",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#1a1410",
      foreground: "#ebe0d4",
      primary: "#f4a261",
      secondary: "#d88654",
      error: "#ef5350",
      card: "#2a1f17",
      border: "#3d2f23",
      scrollThumb: "#6b4e3d",
      scrollTrack: "#1f1712",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "midnight-blue",
    name: "Midnight Blue",
    description: "Дълбоки професионални сини за корпоративни приложения.",
    light: {
      background: "#f6f8fa",
      foreground: "#1b2838",
      primary: "#2b6fc6",
      secondary: "#5b8fd0",
      error: "#c62828",
      card: "#ffffff",
      border: "#d9e2ec",
      scrollThumb: "#6594c8",
      scrollTrack: "#ecf1f7",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#0c141d",
      foreground: "#e0e8f0",
      primary: "#4a8dcf",
      secondary: "#3670b0",
      error: "#ef5350",
      card: "#15202b",
      border: "#243447",
      scrollThumb: "#355273",
      scrollTrack: "#101821",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "sage-serenity",
    name: "Sage Serenity",
    description:
      "Sherwin-Williams Quietude вдъхновение – успокояващо sage green.",
    light: {
      background: "#f7faf8",
      foreground: "#2b3732",
      primary: "#7a9b8b",
      secondary: "#9db7a9",
      error: "#d84315",
      card: "#ffffff",
      border: "#dce8e1",
      scrollThumb: "#a5bcaf",
      scrollTrack: "#edf4f0",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#ff7043",
    },
    dark: {
      background: "#141916",
      foreground: "#e1ebe5",
      primary: "#9db7a9",
      secondary: "#7a9b8b",
      error: "#ff6f43",
      card: "#1e2722",
      border: "#303d35",
      scrollThumb: "#4d6156",
      scrollTrack: "#181d1a",
      fieldOkBg: "#1f3a27",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a2520",
      fieldErrorBorder: "#ff7043",
    },
  },
  {
    id: "cherry-blossom",
    name: "Cherry Blossom",
    description: "Нежни розови пастелни тонове.",
    light: {
      background: "#fbf7f9",
      foreground: "#3a2530",
      primary: "#d88aa3",
      secondary: "#e9b3c5",
      error: "#d32f2f",
      card: "#ffffff",
      border: "#f0dbe5",
      scrollThumb: "#e5c4d3",
      scrollTrack: "#f7edf2",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#1a1315",
      foreground: "#ebdbe3",
      primary: "#c86a8d",
      secondary: "#a35471",
      error: "#ef5350",
      card: "#281d23",
      border: "#3a2e34",
      scrollThumb: "#604852",
      scrollTrack: "#1f1619",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "nordic-minimal",
    name: "Nordic Minimal",
    description: "Чисти скандинавски тонове.",
    light: {
      background: "#f9fafb",
      foreground: "#1f2937",
      primary: "#6b7280",
      secondary: "#9ca3af",
      error: "#dc3545",
      card: "#ffffff",
      border: "#dee2e6",
      scrollThumb: "#adb5bd",
      scrollTrack: "#f1f3f5",
      fieldOkBg: "#d1e7dd",
      fieldOkBorder: "#75b798",
      fieldErrorBg: "#f8d7da",
      fieldErrorBorder: "#ea868f",
    },
    dark: {
      background: "#121416",
      foreground: "#e9ecef",
      primary: "#adb5bd",
      secondary: "#6b7280",
      error: "#ea868f",
      card: "#1e2226",
      border: "#343a40",
      scrollThumb: "#495057",
      scrollTrack: "#0f1113",
      fieldOkBg: "#1b4332",
      fieldOkBorder: "#75b798",
      fieldErrorBg: "#3a1e1f",
      fieldErrorBorder: "#ea868f",
    },
  },
  {
    id: "emerald-forest",
    name: "Emerald Forest",
    description: "Богати изумрудени зелени.",
    light: {
      background: "#f5faf7",
      foreground: "#1a3729",
      primary: "#059669",
      secondary: "#34d399",
      error: "#dc2626",
      card: "#ffffff",
      border: "#d1fae5",
      scrollThumb: "#6ee7b7",
      scrollTrack: "#ecfdf5",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#0f1a15",
      foreground: "#e0f2e8",
      primary: "#34d399",
      secondary: "#10b981",
      error: "#ef4444",
      card: "#1a2920",
      border: "#2d4037",
      scrollThumb: "#276749",
      scrollTrack: "#131d18",
      fieldOkBg: "#064e3b",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#450a0a",
      fieldErrorBorder: "#f87171",
    },
  },
  {
    id: "coral-reef",
    name: "Coral Reef",
    description: "Живи коралови и топли тонове.",
    light: {
      background: "#fbf8f7",
      foreground: "#3a2220",
      primary: "#ff6b6b",
      secondary: "#ffa07a",
      error: "#d32f2f",
      card: "#ffffff",
      border: "#ffe4db",
      scrollThumb: "#ffb399",
      scrollTrack: "#fff0eb",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#1a1312",
      foreground: "#efddd9",
      primary: "#ffa07a",
      secondary: "#ff826b",
      error: "#ef5350",
      card: "#2a1d1b",
      border: "#3d2e2c",
      scrollThumb: "#704843",
      scrollTrack: "#1f1615",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "purple-haze",
    name: "Purple Haze",
    description: "Богати пурпурни палитри – 2025 trend.",
    light: {
      background: "#faf7fb",
      foreground: "#2e1f3a",
      primary: "#9d4edd",
      secondary: "#c77dff",
      error: "#d32f2f",
      card: "#ffffff",
      border: "#e8daef",
      scrollThumb: "#c8a4e3",
      scrollTrack: "#f4eff7",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#16111c",
      foreground: "#ede1f5",
      primary: "#c77dff",
      secondary: "#a260d8",
      error: "#ef5350",
      card: "#221b2a",
      border: "#352d3f",
      scrollThumb: "#5a4270",
      scrollTrack: "#1a1521",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    description: "Златисти бежови тонове – Wheatfield Beige trend.",
    light: {
      background: "#faf8f3",
      foreground: "#3a3228",
      primary: "#c19a6b",
      secondary: "#d4b896",
      error: "#d84315",
      card: "#ffffff",
      border: "#e8e0d5",
      scrollThumb: "#d9c4a4",
      scrollTrack: "#f3efe8",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#ff7043",
    },
    dark: {
      background: "#1a1712",
      foreground: "#e8e0d5",
      primary: "#d9c4a4",
      secondary: "#b39e7a",
      error: "#ff6f43",
      card: "#2a241c",
      border: "#3d362b",
      scrollThumb: "#5a4f3f",
      scrollTrack: "#1f1b15",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a2520",
      fieldErrorBorder: "#ff7043",
    },
  },
  {
    id: "arctic-blue",
    name: "Arctic Blue",
    description: "Студени чисти сини за tech приложения.",
    light: {
      background: "#f7fafc",
      foreground: "#1a365d",
      primary: "#4299e1",
      secondary: "#63b3ed",
      error: "#c53030",
      card: "#ffffff",
      border: "#cbd5e0",
      scrollThumb: "#90cdf4",
      scrollTrack: "#edf2f7",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#fc8181",
    },
    dark: {
      background: "#0d1721",
      foreground: "#e6f2ff",
      primary: "#63b3ed",
      secondary: "#4299e1",
      error: "#fc8181",
      card: "#1a2332",
      border: "#2d3748",
      scrollThumb: "#2c5282",
      scrollTrack: "#111b27",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#fc8181",
    },
  },
  {
    id: "terracotta",
    name: "Terracotta",
    description: "Земни терракота тонове – природни и автентични.",
    light: {
      background: "#faf6f4",
      foreground: "#3d2617",
      primary: "#c1694f",
      secondary: "#d49479",
      error: "#c62828",
      card: "#ffffff",
      border: "#e8d9d0",
      scrollThumb: "#ceaa95",
      scrollTrack: "#f3eae4",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#1a110e",
      foreground: "#e8d9d0",
      primary: "#d49479",
      secondary: "#b17a61",
      error: "#ef5350",
      card: "#2a1d17",
      border: "#3d2e25",
      scrollThumb: "#5a4137",
      scrollTrack: "#1f1512",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "mint-fresh",
    name: "Mint Fresh",
    description: "Свежи ментови тонове.",
    light: {
      background: "#f7fbfa",
      foreground: "#1f3d39",
      primary: "#5cb8aa",
      secondary: "#7dd3c0",
      error: "#d84315",
      card: "#ffffff",
      border: "#d4ede8",
      scrollThumb: "#8fd5ca",
      scrollTrack: "#edf8f5",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#ff7043",
    },
    dark: {
      background: "#0f1918",
      foreground: "#dff2ee",
      primary: "#7dd3c0",
      secondary: "#5cb8aa",
      error: "#ff6f43",
      card: "#1a2927",
      border: "#2e403c",
      scrollThumb: "#3a5b55",
      scrollTrack: "#131d1c",
      fieldOkBg: "#1f3a27",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a2520",
      fieldErrorBorder: "#ff7043",
    },
  },
  {
    id: "crimson-bold",
    name: "Crimson Bold",
    description: "Смели наситени червени – high energy.",
    light: {
      background: "#fbf7f8",
      foreground: "#3d1f26",
      primary: "#dc143c",
      secondary: "#e74c6c",
      error: "#b71c1c",
      card: "#ffffff",
      border: "#f0d8dd",
      scrollThumb: "#e88ba0",
      scrollTrack: "#f7edf0",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#1a1012",
      foreground: "#edd9df",
      primary: "#e74c6c",
      secondary: "#c73a54",
      error: "#ef5350",
      card: "#2a1a1e",
      border: "#3d2b30",
      scrollThumb: "#703a45",
      scrollTrack: "#1f1315",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "slate-modern",
    name: "Slate Modern",
    description: "Съвременни slate сиви – професионални и елегантни.",
    light: {
      background: "#f8f9fa",
      foreground: "#212529",
      primary: "#495057",
      secondary: "#6c757d",
      error: "#dc3545",
      card: "#ffffff",
      border: "#dee2e6",
      scrollThumb: "#adb5bd",
      scrollTrack: "#f1f3f5",
      fieldOkBg: "#d1e7dd",
      fieldOkBorder: "#75b798",
      fieldErrorBg: "#f8d7da",
      fieldErrorBorder: "#ea868f",
    },
    dark: {
      background: "#121416",
      foreground: "#e9ecef",
      primary: "#adb5bd",
      secondary: "#6c757d",
      error: "#ea868f",
      card: "#1e2226",
      border: "#343a40",
      scrollThumb: "#495057",
      scrollTrack: "#0f1113",
      fieldOkBg: "#1b4332",
      fieldOkBorder: "#75b798",
      fieldErrorBg: "#3a1e1f",
      fieldErrorBorder: "#ea868f",
    },
  },
  {
    id: "peachy-keen",
    name: "Peachy Keen",
    description: "Clementine и Off-White – 2025 fresh trend.",
    light: {
      background: "#fbf9f7",
      foreground: "#3a2f27",
      primary: "#ff9f66",
      secondary: "#ffb88c",
      error: "#d84315",
      card: "#ffffff",
      border: "#f0e5db",
      scrollThumb: "#ffcba4",
      scrollTrack: "#f7f2ed",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#ff7043",
    },
    dark: {
      background: "#1a1512",
      foreground: "#ebe2d9",
      primary: "#ffb88c",
      secondary: "#e89466",
      error: "#ff6f43",
      card: "#2a221c",
      border: "#3d332b",
      scrollThumb: "#5a4a3f",
      scrollTrack: "#1f1915",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a2520",
      fieldErrorBorder: "#ff7043",
    },
  },
  {
    id: "electric-teal",
    name: "Electric Teal",
    description: "Енергични teal тонове за модерни tech приложения.",
    light: {
      background: "#f5fafb",
      foreground: "#1a3d42",
      primary: "#14b8a6",
      secondary: "#5eead4",
      error: "#dc2626",
      card: "#ffffff",
      border: "#ccfbf1",
      scrollThumb: "#99f6e4",
      scrollTrack: "#f0fdfa",
      fieldOkBg: "#d1fae5",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#fee2e2",
      fieldErrorBorder: "#f87171",
    },
    dark: {
      background: "#0f1c1e",
      foreground: "#e0f2f1",
      primary: "#5eead4",
      secondary: "#2dd4bf",
      error: "#f87171",
      card: "#1a2b2e",
      border: "#2d4347",
      scrollThumb: "#0f766e",
      scrollTrack: "#131f21",
      fieldOkBg: "#064e3b",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#450a0a",
      fieldErrorBorder: "#f87171",
    },
  },
  {
    id: "burgundy-luxury",
    name: "Burgundy Luxury",
    description: "Богати бургундски тонове за премиум брандове.",
    light: {
      background: "#faf6f7",
      foreground: "#3d1a22",
      primary: "#8e3b46",
      secondary: "#b85c6d",
      error: "#c62828",
      card: "#ffffff",
      border: "#ecd8dc",
      scrollThumb: "#c88996",
      scrollTrack: "#f5edf0",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#1a0f12",
      foreground: "#ebd8dc",
      primary: "#c88996",
      secondary: "#a6616f",
      error: "#ef5350",
      card: "#2a1a1e",
      border: "#3d2b30",
      scrollThumb: "#5a3a42",
      scrollTrack: "#1f1316",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "honey-gold",
    name: "Honey Gold",
    description: "Медени златисти тонове – топли и приветливи.",
    light: {
      background: "#fbf9f4",
      foreground: "#3a3020",
      primary: "#daa520",
      secondary: "#f0c050",
      error: "#d84315",
      card: "#ffffff",
      border: "#f0e8d6",
      scrollThumb: "#e8d4a0",
      scrollTrack: "#f7f3e9",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#ff7043",
    },
    dark: {
      background: "#1a1710",
      foreground: "#ebe4d2",
      primary: "#f0c050",
      secondary: "#c9a23a",
      error: "#ff6f43",
      card: "#2a2418",
      border: "#3d362b",
      scrollThumb: "#5a4d35",
      scrollTrack: "#1f1c14",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a2520",
      fieldErrorBorder: "#ff7043",
    },
  },
  {
    id: "fuchsia-pop",
    name: "Fuchsia Pop",
    description: "Смели фуксия тонове – креативни и експресивни.",
    light: {
      background: "#fbf7fa",
      foreground: "#3d1f3a",
      primary: "#d946ef",
      secondary: "#e879f9",
      error: "#dc2626",
      card: "#ffffff",
      border: "#f5d0fe",
      scrollThumb: "#f0abfc",
      scrollTrack: "#faf5ff",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#fee2e2",
      fieldErrorBorder: "#f87171",
    },
    dark: {
      background: "#1a1018",
      foreground: "#f5e1f7",
      primary: "#e879f9",
      secondary: "#c026d3",
      error: "#f87171",
      card: "#2a1a28",
      border: "#3d2b3d",
      scrollThumb: "#701a75",
      scrollTrack: "#1f1420",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#66bb6a",
      fieldErrorBg: "#450a0a",
      fieldErrorBorder: "#f87171",
    },
  },
  {
    id: "sky-blue",
    name: "Sky Blue",
    description: "Светли небесносини – оптимистични и отворени.",
    light: {
      background: "#f7fbff",
      foreground: "#1e3a5f",
      primary: "#38bdf8",
      secondary: "#7dd3fc",
      error: "#dc2626",
      card: "#ffffff",
      border: "#e0f2fe",
      scrollThumb: "#bae6fd",
      scrollTrack: "#f0f9ff",
      fieldOkBg: "#d1fae5",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#fee2e2",
      fieldErrorBorder: "#f87171",
    },
    dark: {
      background: "#0c1821",
      foreground: "#e0f2fe",
      primary: "#7dd3fc",
      secondary: "#38bdf8",
      error: "#f87171",
      card: "#172532",
      border: "#1e3a5f",
      scrollThumb: "#075985",
      scrollTrack: "#0f1d2b",
      fieldOkBg: "#064e3b",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#450a0a",
      fieldErrorBorder: "#f87171",
    },
  },
  {
    id: "olive-earth",
    name: "Olive Earth",
    description: "Маслиненозелени земни тонове.",
    light: {
      background: "#f9faf7",
      foreground: "#2d3319",
      primary: "#6b7f3a",
      secondary: "#8fa35c",
      error: "#d84315",
      card: "#ffffff",
      border: "#e0e7d3",
      scrollThumb: "#a8bf7a",
      scrollTrack: "#f0f4e8",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#ff7043",
    },
    dark: {
      background: "#14170f",
      foreground: "#e5e9dc",
      primary: "#a8bf7a",
      secondary: "#7d9451",
      error: "#ff6f43",
      card: "#1f2518",
      border: "#30382a",
      scrollThumb: "#4a5538",
      scrollTrack: "#181b13",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a2520",
      fieldErrorBorder: "#ff7043",
    },
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    description: "Елегантни rose gold тонове – луксозни и нежни.",
    light: {
      background: "#fbf8f7",
      foreground: "#3a2828",
      primary: "#d4a5a5",
      secondary: "#e9c5c5",
      error: "#c62828",
      card: "#ffffff",
      border: "#f0e0e0",
      scrollThumb: "#e5cece",
      scrollTrack: "#f7f0f0",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#1a1414",
      foreground: "#ebe0e0",
      primary: "#e9c5c5",
      secondary: "#c49898",
      error: "#ef5350",
      card: "#2a1f1f",
      border: "#3d3030",
      scrollThumb: "#5a4848",
      scrollTrack: "#1f1717",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "indigo-night",
    name: "Indigo Night",
    description: "Дълбоки индиго тонове – мистериозни и професионални.",
    light: {
      background: "#f7f8fb",
      foreground: "#1e2447",
      primary: "#4f46e5",
      secondary: "#6366f1",
      error: "#dc2626",
      card: "#ffffff",
      border: "#e0e7ff",
      scrollThumb: "#a5b4fc",
      scrollTrack: "#eef2ff",
      fieldOkBg: "#d1fae5",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#fee2e2",
      fieldErrorBorder: "#f87171",
    },
    dark: {
      background: "#0f1121",
      foreground: "#e0e7ff",
      primary: "#818cf8",
      secondary: "#6366f1",
      error: "#f87171",
      card: "#1a1e38",
      border: "#2d3250",
      scrollThumb: "#3730a3",
      scrollTrack: "#131625",
      fieldOkBg: "#064e3b",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#450a0a",
      fieldErrorBorder: "#f87171",
    },
  },
  {
    id: "lime-burst",
    name: "Lime Burst",
    description: "Енергични lime зелени – младежки и свежи.",
    light: {
      background: "#f9fcf7",
      foreground: "#2d3d1a",
      primary: "#84cc16",
      secondary: "#a3e635",
      error: "#dc2626",
      card: "#ffffff",
      border: "#e7f5d1",
      scrollThumb: "#bef264",
      scrollTrack: "#f7fee7",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#fee2e2",
      fieldErrorBorder: "#f87171",
    },
    dark: {
      background: "#0f140c",
      foreground: "#e7f5d1",
      primary: "#a3e635",
      secondary: "#84cc16",
      error: "#f87171",
      card: "#1a2215",
      border: "#2d3d25",
      scrollThumb: "#4d7c0f",
      scrollTrack: "#131810",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#450a0a",
      fieldErrorBorder: "#f87171",
    },
  },
  {
    id: "chocolate-delight",
    name: "Chocolate Delight",
    description: "Богати шоколадови кафяви.",
    light: {
      background: "#faf7f5",
      foreground: "#3d2817",
      primary: "#8b4513",
      secondary: "#a0522d",
      error: "#d84315",
      card: "#ffffff",
      border: "#e8ddd5",
      scrollThumb: "#c9a588",
      scrollTrack: "#f3ebe6",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#ff7043",
    },
    dark: {
      background: "#1a1210",
      foreground: "#e8ddd5",
      primary: "#c9a588",
      secondary: "#9d7a5c",
      error: "#ff6f43",
      card: "#2a1e18",
      border: "#3d2f25",
      scrollThumb: "#5a3e2f",
      scrollTrack: "#1f1614",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a2520",
      fieldErrorBorder: "#ff7043",
    },
  },
  {
    id: "aqua-marine",
    name: "Aqua Marine",
    description: "Кристално чисти аквамаринови тонове.",
    light: {
      background: "#f5fbfb",
      foreground: "#1a3d3d",
      primary: "#20b2aa",
      secondary: "#48d1cc",
      error: "#dc2626",
      card: "#ffffff",
      border: "#ccfaf5",
      scrollThumb: "#7fe5e0",
      scrollTrack: "#edfafa",
      fieldOkBg: "#d1fae5",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#fee2e2",
      fieldErrorBorder: "#f87171",
    },
    dark: {
      background: "#0f1a1a",
      foreground: "#dffaf5",
      primary: "#66d9d4",
      secondary: "#3fbfba",
      error: "#f87171",
      card: "#1a2828",
      border: "#2d4242",
      scrollThumb: "#0f5e5e",
      scrollTrack: "#131e1e",
      fieldOkBg: "#064e3b",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#450a0a",
      fieldErrorBorder: "#f87171",
    },
  },
  {
    id: "amber-glow",
    name: "Amber Glow",
    description: "Топли кехлибарени тонове.",
    light: {
      background: "#fbf9f5",
      foreground: "#3d3020",
      primary: "#f59e0b",
      secondary: "#fbbf24",
      error: "#dc2626",
      card: "#ffffff",
      border: "#fef3c7",
      scrollThumb: "#fcd34d",
      scrollTrack: "#fffbeb",
      fieldOkBg: "#d1fae5",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#fee2e2",
      fieldErrorBorder: "#f87171",
    },
    dark: {
      background: "#1a1610",
      foreground: "#fef3c7",
      primary: "#fbbf24",
      secondary: "#f59e0b",
      error: "#f87171",
      card: "#2a2218",
      border: "#3d3428",
      scrollThumb: "#92400e",
      scrollTrack: "#1f1b14",
      fieldOkBg: "#064e3b",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#450a0a",
      fieldErrorBorder: "#f87171",
    },
  },
  {
    id: "plum-perfect",
    name: "Plum Perfect",
    description: "Елегантни сливови пурпурни тонове.",
    light: {
      background: "#faf7fa",
      foreground: "#3d2238",
      primary: "#8b5a8f",
      secondary: "#a87bad",
      error: "#c62828",
      card: "#ffffff",
      border: "#e8d8ea",
      scrollThumb: "#c5a3c9",
      scrollTrack: "#f5edf6",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#1a1218",
      foreground: "#e8d8ea",
      primary: "#c5a3c9",
      secondary: "#9e7aa3",
      error: "#ef5350",
      card: "#2a1e28",
      border: "#3d2f3a",
      scrollThumb: "#5a4060",
      scrollTrack: "#1f1620",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "steel-gray",
    name: "Steel Gray",
    description: "Индустриални стоманеносиви тонове.",
    light: {
      background: "#f8f9fa",
      foreground: "#2c3439",
      primary: "#607d8b",
      secondary: "#90a4ae",
      error: "#dc2626",
      card: "#ffffff",
      border: "#cfd8dc",
      scrollThumb: "#b0bec5",
      scrollTrack: "#eceff1",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#fee2e2",
      fieldErrorBorder: "#f87171",
    },
    dark: {
      background: "#121517",
      foreground: "#eceff1",
      primary: "#90a4ae",
      secondary: "#78909c",
      error: "#f87171",
      card: "#1e2326",
      border: "#37474f",
      scrollThumb: "#455a64",
      scrollTrack: "#0f1315",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#450a0a",
      fieldErrorBorder: "#f87171",
    },
  },
  {
    id: "tangerine-dream",
    name: "Tangerine Dream",
    description: "Живи мандаринови портокалови тонове.",
    light: {
      background: "#fbf8f6",
      foreground: "#3d2517",
      primary: "#ff8c42",
      secondary: "#ffb380",
      error: "#d32f2f",
      card: "#ffffff",
      border: "#ffe4d1",
      scrollThumb: "#ffc9a3",
      scrollTrack: "#fff4eb",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#e57373",
    },
    dark: {
      background: "#1a1310",
      foreground: "#ffe4d1",
      primary: "#ffb380",
      secondary: "#e68855",
      error: "#ef5350",
      card: "#2a1e17",
      border: "#3d2f24",
      scrollThumb: "#5a4030",
      scrollTrack: "#1f1714",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a1f1f",
      fieldErrorBorder: "#ef5350",
    },
  },
  {
    id: "periwinkle-blue",
    name: "Periwinkle Blue",
    description: "Меки periwinkle сини – успокояващи и приятни.",
    light: {
      background: "#f8f9fc",
      foreground: "#2a2d47",
      primary: "#8b9dc3",
      secondary: "#a8b8d8",
      error: "#dc2626",
      card: "#ffffff",
      border: "#dde4f0",
      scrollThumb: "#c4cfe5",
      scrollTrack: "#f0f3f9",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#fee2e2",
      fieldErrorBorder: "#f87171",
    },
    dark: {
      background: "#13151c",
      foreground: "#e5e9f5",
      primary: "#a8b8d8",
      secondary: "#8b9dc3",
      error: "#f87171",
      card: "#1e2130",
      border: "#2f3547",
      scrollThumb: "#4a5273",
      scrollTrack: "#161820",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#450a0a",
      fieldErrorBorder: "#f87171",
    },
  },
  {
    id: "cypress-green",
    name: "Cypress Green",
    description: "Тъмнозелени кипарисови тонове.",
    light: {
      background: "#f7faf8",
      foreground: "#1f3d2a",
      primary: "#2d5f4e",
      secondary: "#4a8070",
      error: "#d84315",
      card: "#ffffff",
      border: "#d5e8df",
      scrollThumb: "#7aaa96",
      scrollTrack: "#edf5f1",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#ff7043",
    },
    dark: {
      background: "#0f1915",
      foreground: "#d5e8df",
      primary: "#6b9b89",
      secondary: "#4d7a68",
      error: "#ff6f43",
      card: "#1a2822",
      border: "#2d4238",
      scrollThumb: "#3a5f4f",
      scrollTrack: "#131d19",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a2520",
      fieldErrorBorder: "#ff7043",
    },
  },
  {
    id: "marigold-yellow",
    name: "Marigold Yellow",
    description: "Слънчеви невенови жълти тонове.",
    light: {
      background: "#fcfaf6",
      foreground: "#3d3420",
      primary: "#eab308",
      secondary: "#facc15",
      error: "#dc2626",
      card: "#ffffff",
      border: "#fef9c3",
      scrollThumb: "#fde047",
      scrollTrack: "#fefce8",
      fieldOkBg: "#d1fae5",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#fee2e2",
      fieldErrorBorder: "#f87171",
    },
    dark: {
      background: "#1a1810",
      foreground: "#fef9c3",
      primary: "#facc15",
      secondary: "#eab308",
      error: "#f87171",
      card: "#2a2418",
      border: "#3d3728",
      scrollThumb: "#854d0e",
      scrollTrack: "#1f1c14",
      fieldOkBg: "#064e3b",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#450a0a",
      fieldErrorBorder: "#f87171",
    },
  },
  {
    id: "magenta-pulse",
    name: "Magenta Pulse",
    description: "Интензивни магента тонове – дръзки и съвременни.",
    light: {
      background: "#fbf7fa",
      foreground: "#3d1f3d",
      primary: "#c026d3",
      secondary: "#d946ef",
      error: "#dc2626",
      card: "#ffffff",
      border: "#f5d0fe",
      scrollThumb: "#e879f9",
      scrollTrack: "#fdf4ff",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#fee2e2",
      fieldErrorBorder: "#f87171",
    },
    dark: {
      background: "#1a1018",
      foreground: "#f5d0fe",
      primary: "#e879f9",
      secondary: "#c026d3",
      error: "#f87171",
      card: "#2a1a28",
      border: "#3d2b3d",
      scrollThumb: "#86198f",
      scrollTrack: "#1f1420",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#450a0a",
      fieldErrorBorder: "#f87171",
    },
  },
  {
    id: "caramel-cream",
    name: "Caramel Cream",
    description: "Кремави карамелени нюанси.",
    light: {
      background: "#fbf9f6",
      foreground: "#3a2f27",
      primary: "#b8956a",
      secondary: "#d4b896",
      error: "#d84315",
      card: "#ffffff",
      border: "#ede5d8",
      scrollThumb: "#d9c8af",
      scrollTrack: "#f5f0e8",
      fieldOkBg: "#e8f5e9",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#ffebee",
      fieldErrorBorder: "#ff7043",
    },
    dark: {
      background: "#1a1612",
      foreground: "#ede5d8",
      primary: "#d9c8af",
      secondary: "#b8a080",
      error: "#ff6f43",
      card: "#2a221d",
      border: "#3d3529",
      scrollThumb: "#5a4d3d",
      scrollTrack: "#1f1b16",
      fieldOkBg: "#1b3a2f",
      fieldOkBorder: "#81c784",
      fieldErrorBg: "#3a2520",
      fieldErrorBorder: "#ff7043",
    },
  },
];

const THEME_PRESETS: ThemePreset[] = RAW_THEME_PRESETS.map((preset) => {
  return {
    id: preset.id,
    name: preset.name,
    description: preset.description,
    light: completeThemePalette(
      preset.light,
      DEFAULT_THEME_LIGHT as ThemePalette,
      "light",
    ),
    dark: completeThemePalette(
      preset.dark,
      DEFAULT_THEME_DARK as ThemePalette,
      "dark",
    ),
  };
});
const THEME_PRESET_TARGETS: ThemePresetTarget[] = ["light", "dark", "both"];
const THEME_PRESET_TARGET_LABEL: Record<ThemePresetTarget, string> = {
  light: "Light",
  dark: "Dark",
  both: "Light + Dark",
};

const APP_NAME_MIN_LENGTH = 2;
const APP_NAME_MAX_LENGTH = 32;
const APP_NAME_CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const APP_NAME_HAS_ALPHANUMERIC = /[\p{L}\p{N}]/u;

const BEE_LMS_PRESET_IDS = new Set<string>([
  "beelms-golden-honey",
  "beelms-pollination-garden",
]);

const OTHER_THEME_PRESETS_PREVIEW_COUNT = 4;
const THEME_PRESET_SWATCH_KEYS: ThemeFieldKey[] = [
  "background",
  "foreground",
  "primary",
  "secondary",
];

const HEX_COLOR_FULL_PATTERN = /^#[0-9a-fA-F]{6}$/;
const HEX_COLOR_SHORT_PATTERN = /^#[0-9a-fA-F]{3}$/;

const sanitizeHexDraft = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }
  const withoutHash = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  const filtered = withoutHash.replace(/[^0-9a-f]/g, "").slice(0, 6);
  if (!filtered) {
    return "";
  }
  return `#${filtered}`;
};

const expandToSixHex = (value: string): string | null => {
  if (HEX_COLOR_FULL_PATTERN.test(value)) {
    return value.toLowerCase();
  }
  if (HEX_COLOR_SHORT_PATTERN.test(value)) {
    const r = value[1];
    const g = value[2];
    const b = value[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
};

const cloneThemePalette = (palette: ThemePalette): ThemePalette => {
  return THEME_FIELD_KEYS.reduce((acc, key) => {
    acc[key] = palette[key];
    return acc;
  }, {} as ThemePalette);
};

const sanitizeCustomThemePresets = (value: unknown): CustomThemePreset[] => {
  const list = Array.isArray(value) ? value : [];

  const normalizeString = (raw: unknown): string => {
    return typeof raw === "string" ? raw.trim() : "";
  };

  const normalizePalette = (
    raw: unknown,
    fallback: ThemePalette,
  ): ThemePalette => {
    const record =
      raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    return THEME_FIELD_KEYS.reduce((acc, key) => {
      const v = record[key];
      acc[key] =
        typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback[key];
      return acc;
    }, {} as ThemePalette);
  };

  const out: CustomThemePreset[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const obj = raw as Record<string, unknown>;

    const id = normalizeString(obj.id);
    const name = normalizeString(obj.name);
    if (!id || !name) continue;

    const descriptionRaw = normalizeString(obj.description);
    const description = descriptionRaw.length > 0 ? descriptionRaw : null;

    const light = normalizePalette(
      obj.light,
      DEFAULT_THEME_LIGHT as ThemePalette,
    );
    const dark = normalizePalette(obj.dark, DEFAULT_THEME_DARK as ThemePalette);

    const createdAtRaw = normalizeString(obj.createdAt);
    const updatedAtRaw = normalizeString(obj.updatedAt);
    const createdByRaw = normalizeString(obj.createdBy);
    const updatedByRaw = normalizeString(obj.updatedBy);

    const preset: CustomThemePreset = {
      id,
      name,
      ...(description ? { description } : {}),
      light,
      dark,
      ...(createdAtRaw ? { createdAt: createdAtRaw } : {}),
      ...(updatedAtRaw ? { updatedAt: updatedAtRaw } : {}),
      ...(createdByRaw ? { createdBy: createdByRaw } : {}),
      ...(updatedByRaw ? { updatedBy: updatedByRaw } : {}),
    };
    out.push(preset);
  }

  return out;
};

const sanitizeStringDictionary = (
  value?: Record<string, string | null | undefined> | null,
): StringDictionary => {
  if (!value) {
    return {};
  }
  return Object.entries(value).reduce<StringDictionary>((acc, [key, val]) => {
    if (typeof val === "string") {
      acc[key] = val;
    }
    return acc;
  }, {});
};

const upsertStringDictionary = (
  prev: StringDictionary,
  key: string,
  value?: string | null,
): StringDictionary => {
  const next: StringDictionary = { ...prev };
  if (typeof value === "string" && value.length > 0) {
    next[key] = value;
  } else {
    delete next[key];
  }
  return next;
};

type FooterSocialLink = {
  id: string;
  type: "facebook" | "x" | "youtube" | "custom";
  label?: string | null;
  url?: string | null;
  enabled?: boolean;
  iconKey?:
    | "whatsapp"
    | "messenger"
    | "signal"
    | "skype"
    | "imessage"
    | "wechat"
    | "line"
    | "kakaotalk"
    | "threema"
    | "icq"
    | "instagram"
    | "tiktok"
    | "snapchat"
    | "pinterest"
    | "threads"
    | "bereal"
    | "tumblr"
    | "bluesky"
    | "mastodon"
    | "vk"
    | "zoom"
    | "teams"
    | "slack"
    | "google-meet"
    | "google-chat"
    | "reddit"
    | "twitch"
    | "quora"
    | "clubhouse"
    | "tinder"
    | "github"
    | "npm"
    | "maven"
    | "nuget"
    | "pypi"
    | "linkedin"
    | "discord"
    | "telegram"
    | "viber"
    | "phone"
    | "location"
    | "link"
    | "globe"
    | null;
  iconLightUrl?: string | null;
  iconDarkUrl?: string | null;
};

const DEFAULT_FOOTER_SOCIAL_LINKS: FooterSocialLink[] = [
  {
    id: "facebook",
    type: "facebook",
    label: "Facebook",
    url: null,
    enabled: false,
    iconLightUrl: null,
    iconDarkUrl: null,
  },
  {
    id: "x",
    type: "x",
    label: "X",
    url: null,
    enabled: false,
    iconLightUrl: null,
    iconDarkUrl: null,
  },
  {
    id: "youtube",
    type: "youtube",
    label: "YouTube",
    url: null,
    enabled: false,
    iconLightUrl: null,
    iconDarkUrl: null,
  },
];

const FOOTER_SOCIAL_ICON_KEYS = [
  "whatsapp",
  "messenger",
  "signal",
  "skype",
  "imessage",
  "wechat",
  "line",
  "kakaotalk",
  "threema",
  "icq",
  "instagram",
  "tiktok",
  "snapchat",
  "pinterest",
  "threads",
  "bereal",
  "tumblr",
  "bluesky",
  "mastodon",
  "vk",
  "zoom",
  "teams",
  "slack",
  "google-meet",
  "google-chat",
  "reddit",
  "twitch",
  "quora",
  "clubhouse",
  "tinder",
  "github",
  "npm",
  "maven",
  "nuget",
  "pypi",
  "linkedin",
  "discord",
  "telegram",
  "viber",
  "phone",
  "location",
  "link",
  "globe",
] as const;

type FooterSocialIconKey = Exclude<FooterSocialLink["iconKey"], null>;

type FooterSocialIconOption = {
  key: FooterSocialIconKey;
  label: string;
  icon: { lib: "si" | "fa6"; name: string };
};

const FOOTER_SOCIAL_ICON_OPTIONS: FooterSocialIconOption[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: { lib: "si", name: "SiWhatsapp" },
  },
  {
    key: "messenger",
    label: "Messenger",
    icon: { lib: "si", name: "SiMessenger" },
  },
  { key: "signal", label: "Signal", icon: { lib: "si", name: "SiSignal" } },
  { key: "skype", label: "Skype", icon: { lib: "si", name: "SiSkype" } },
  {
    key: "imessage",
    label: "iMessage",
    icon: { lib: "si", name: "SiImessage" },
  },
  { key: "wechat", label: "WeChat", icon: { lib: "si", name: "SiWechat" } },
  { key: "line", label: "LINE", icon: { lib: "si", name: "SiLine" } },
  {
    key: "kakaotalk",
    label: "KakaoTalk",
    icon: { lib: "si", name: "SiKakaotalk" },
  },
  { key: "threema", label: "Threema", icon: { lib: "si", name: "SiThreema" } },
  { key: "icq", label: "ICQ", icon: { lib: "si", name: "SiIcq" } },
  {
    key: "instagram",
    label: "Instagram",
    icon: { lib: "si", name: "SiInstagram" },
  },
  { key: "tiktok", label: "TikTok", icon: { lib: "si", name: "SiTiktok" } },
  {
    key: "snapchat",
    label: "Snapchat",
    icon: { lib: "si", name: "SiSnapchat" },
  },
  {
    key: "pinterest",
    label: "Pinterest",
    icon: { lib: "si", name: "SiPinterest" },
  },
  { key: "threads", label: "Threads", icon: { lib: "si", name: "SiThreads" } },
  { key: "bereal", label: "BeReal", icon: { lib: "si", name: "SiBereal" } },
  { key: "tumblr", label: "Tumblr", icon: { lib: "si", name: "SiTumblr" } },
  { key: "bluesky", label: "Bluesky", icon: { lib: "si", name: "SiBluesky" } },
  {
    key: "mastodon",
    label: "Mastodon",
    icon: { lib: "si", name: "SiMastodon" },
  },
  { key: "vk", label: "VK", icon: { lib: "si", name: "SiVk" } },
  { key: "zoom", label: "Zoom", icon: { lib: "si", name: "SiZoom" } },
  {
    key: "teams",
    label: "Teams",
    icon: { lib: "si", name: "SiMicrosoftteams" },
  },
  { key: "slack", label: "Slack", icon: { lib: "si", name: "SiSlack" } },
  {
    key: "google-meet",
    label: "Google Meet",
    icon: { lib: "si", name: "SiGooglemeet" },
  },
  {
    key: "google-chat",
    label: "Google Chat",
    icon: { lib: "si", name: "SiGooglechat" },
  },
  { key: "reddit", label: "Reddit", icon: { lib: "si", name: "SiReddit" } },
  { key: "twitch", label: "Twitch", icon: { lib: "si", name: "SiTwitch" } },
  { key: "quora", label: "Quora", icon: { lib: "si", name: "SiQuora" } },
  {
    key: "clubhouse",
    label: "Clubhouse",
    icon: { lib: "si", name: "SiClubhouse" },
  },
  { key: "tinder", label: "Tinder", icon: { lib: "si", name: "SiTinder" } },
  { key: "github", label: "GitHub", icon: { lib: "si", name: "SiGithub" } },
  { key: "npm", label: "npm", icon: { lib: "si", name: "SiNpm" } },
  { key: "maven", label: "Maven", icon: { lib: "si", name: "SiApachemaven" } },
  { key: "nuget", label: "NuGet", icon: { lib: "si", name: "SiNuget" } },
  { key: "pypi", label: "PyPI", icon: { lib: "si", name: "SiPypi" } },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: { lib: "si", name: "SiLinkedin" },
  },
  { key: "discord", label: "Discord", icon: { lib: "si", name: "SiDiscord" } },
  {
    key: "telegram",
    label: "Telegram",
    icon: { lib: "si", name: "SiTelegram" },
  },
  { key: "viber", label: "Viber", icon: { lib: "si", name: "SiViber" } },
  { key: "phone", label: "Phone", icon: { lib: "fa6", name: "FaPhone" } },
  {
    key: "location",
    label: "Location",
    icon: { lib: "fa6", name: "FaLocationDot" },
  },
  { key: "globe", label: "Globe", icon: { lib: "fa6", name: "FaGlobe" } },
  { key: "link", label: "Link", icon: { lib: "fa6", name: "FaLink" } },
];

const getFooterSocialIconComponent = (
  opt: FooterSocialIconOption["icon"],
): ((props: { className?: string }) => JSX.Element) | null => {
  const lib =
    opt.lib === "fa6"
      ? (Fa6Icons as Record<string, unknown>)
      : (SiIcons as Record<string, unknown>);
  const comp = lib[opt.name];
  return typeof comp === "function"
    ? (comp as (props: { className?: string }) => JSX.Element)
    : null;
};

const FOOTER_SOCIAL_ICON_COMPONENTS: Record<
  FooterSocialIconKey,
  ((props: { className?: string }) => JSX.Element) | null
> = FOOTER_SOCIAL_ICON_OPTIONS.reduce(
  (acc, opt) => {
    acc[opt.key] = getFooterSocialIconComponent(opt.icon);
    return acc;
  },
  {} as Record<
    FooterSocialIconKey,
    ((props: { className?: string }) => JSX.Element) | null
  >,
);

function FooterSocialIconPicker({
  value,
  disabled,
  onChange,
}: {
  value: FooterSocialLink["iconKey"];
  disabled: boolean;
  onChange: (value: FooterSocialLink["iconKey"]) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const selected =
    typeof value === "string"
      ? (FOOTER_SOCIAL_ICON_OPTIONS.find((o) => o.key === value) ?? null)
      : null;

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: globalThis.MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const SelectedIcon = selected
    ? FOOTER_SOCIAL_ICON_COMPONENTS[selected.key]
    : null;

  return (
    <div ref={rootRef} className="relative mt-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-50"
      >
        <span className="flex items-center gap-2">
          {SelectedIcon ? (
            <SelectedIcon className="h-4 w-4" />
          ) : (
            <Fa6Icons.FaLink className="h-4 w-4" />
          )}
          <span>{selected?.label ?? "(none)"}</span>
        </span>
        <span className="text-xs text-gray-500">▾</span>
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            <Fa6Icons.FaLink className="h-4 w-4" />
            <span>(none)</span>
          </button>
          {FOOTER_SOCIAL_ICON_OPTIONS.map((opt) => {
            const Icon =
              FOOTER_SOCIAL_ICON_COMPONENTS[opt.key] ?? Fa6Icons.FaLink;
            return (
              <button
                key={opt.key}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                onClick={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
              >
                <Icon className="h-4 w-4" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const isValidFooterSocialUrl = (
  type: FooterSocialLink["type"],
  value: string,
): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const parsed = parseUrl(trimmed);
  if (!parsed) return false;
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  if (type === "facebook") {
    return (
      host === "facebook.com" ||
      host === "www.facebook.com" ||
      host.endsWith(".facebook.com")
    );
  }
  if (type === "youtube") {
    return (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtu.be" ||
      host.endsWith(".youtu.be")
    );
  }
  if (type === "x") {
    return (
      host === "x.com" ||
      host === "www.x.com" ||
      host.endsWith(".x.com") ||
      host === "twitter.com" ||
      host === "www.twitter.com" ||
      host.endsWith(".twitter.com")
    );
  }
  return true;
};

const footerSocialUrlErrorMessage = (type: FooterSocialLink["type"]) => {
  if (type === "facebook") return "URL трябва да е към facebook.com";
  if (type === "youtube") return "URL трябва да е към youtube.com или youtu.be";
  if (type === "x") return "URL трябва да е към x.com или twitter.com";
  return "Невалиден URL";
};

const isValidFooterSocialId = (value: string) => /^[a-z0-9_-]+$/.test(value);

const sanitizeFooterSocialLinks = (
  value?: FooterSocialLink[] | null,
): FooterSocialLink[] => {
  const normalizedList = Array.isArray(value) ? value : [];
  const map = new Map<string, FooterSocialLink>();

  for (const link of normalizedList) {
    if (!link) continue;
    const id = (link.id ?? "").trim().toLowerCase();
    if (!id || !isValidFooterSocialId(id)) continue;

    const type = link.type;
    if (
      type !== "facebook" &&
      type !== "x" &&
      type !== "youtube" &&
      type !== "custom"
    ) {
      continue;
    }

    map.set(id, {
      id,
      type,
      label: typeof link.label === "string" ? link.label : (link.label ?? null),
      url: typeof link.url === "string" ? link.url : (link.url ?? null),
      enabled: link.enabled,
      iconKey:
        type === "custom" &&
        typeof link.iconKey === "string" &&
        (FOOTER_SOCIAL_ICON_KEYS as readonly string[]).includes(link.iconKey)
          ? (link.iconKey as FooterSocialLink["iconKey"])
          : null,
      iconLightUrl:
        typeof link.iconLightUrl === "string"
          ? link.iconLightUrl
          : (link.iconLightUrl ?? null),
      iconDarkUrl:
        typeof link.iconDarkUrl === "string"
          ? link.iconDarkUrl
          : (link.iconDarkUrl ?? null),
    });
  }

  for (const base of DEFAULT_FOOTER_SOCIAL_LINKS) {
    if (!map.has(base.id)) {
      map.set(base.id, { ...base });
    }
  }

  const next = Array.from(map.values());
  next.sort((a, b) => {
    const order = (id: string) =>
      id === "facebook" ? 0 : id === "x" ? 1 : id === "youtube" ? 2 : 9;
    const byOrder = order(a.id) - order(b.id);
    if (byOrder !== 0) return byOrder;
    return a.id.localeCompare(b.id);
  });
  return next;
};

const normalizeFooterSocialLinksForSave = (
  list: FooterSocialLink[],
): FooterSocialLink[] | null => {
  const normalized = sanitizeFooterSocialLinks(list);
  const nonEmpty = normalized.filter(
    (l) =>
      (l.url ?? "").trim().length > 0 ||
      (l.iconKey ?? "").trim().length > 0 ||
      (l.iconLightUrl ?? "").trim().length > 0 ||
      (l.iconDarkUrl ?? "").trim().length > 0 ||
      (l.enabled ?? false) === true,
  );
  return nonEmpty.length > 0 ? nonEmpty : null;
};
type InstanceBranding = {
  appName: string;
  browserTitle?: string | null;
  notFoundTitle?: string | null;
  notFoundMarkdown?: string | null;
  notFoundTitleByLang?: Record<string, string | null> | null;
  notFoundMarkdownByLang?: Record<string, string | null> | null;
  loginSocialUnavailableMessageEnabled?: boolean;
  loginSocialResetPasswordHintEnabled?: boolean;
  poweredByBeeLms?: {
    enabled?: boolean;
    url?: string | null;
  } | null;
  cursorUrl?: string | null;
  cursorLightUrl?: string | null;
  cursorDarkUrl?: string | null;
  cursorPointerUrl?: string | null;
  cursorPointerLightUrl?: string | null;
  cursorPointerDarkUrl?: string | null;
  cursorHotspot?: {
    x?: number | null;
    y?: number | null;
  } | null;
  faviconUrl?: string | null;
  googleFont?: string | null;
  googleFontByLang?: Record<string, string | null> | null;
  fontUrl?: string | null;
  fontUrlByLang?: Record<string, string | null> | null;
  fontLicenseUrl?: string | null;
  fontLicenseUrlByLang?: Record<string, string | null> | null;
  customThemePresets?: CustomThemePreset[] | null;
  theme?: {
    mode?: "light" | "dark" | "system" | null;
    light?: {
      background?: string | null;
      foreground?: string | null;
      primary?: string | null;
      secondary?: string | null;
      error?: string | null;
      card?: string | null;
      border?: string | null;
      scrollThumb?: string | null;
      scrollTrack?: string | null;
      fieldOkBg?: string | null;
      fieldOkBorder?: string | null;
      fieldErrorBg?: string | null;
      fieldErrorBorder?: string | null;
    } | null;
    dark?: {
      background?: string | null;
      foreground?: string | null;
      primary?: string | null;
      secondary?: string | null;
      error?: string | null;
      card?: string | null;
      border?: string | null;
      scrollThumb?: string | null;
      scrollTrack?: string | null;
      fieldOkBg?: string | null;
      fieldOkBorder?: string | null;
      fieldErrorBg?: string | null;
      fieldErrorBorder?: string | null;
    } | null;
  } | null;
  logoUrl?: string | null;
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
  primaryColor?: string | null;
  socialDescription?: string | null;
  socialImage?: {
    imageUrl?: string | null;
  } | null;
  openGraph?: {
    title?: string | null;
    description?: string | null;
    imageUrl?: string | null;
  } | null;
  twitter?: {
    title?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    card?: string | null;
    app?: {
      name?: string | null;
      id?: {
        iphone?: string | null;
        ipad?: string | null;
        googleplay?: string | null;
      } | null;
      url?: {
        iphone?: string | null;
        ipad?: string | null;
        googleplay?: string | null;
      } | null;
    } | null;
    player?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
      stream?: string | null;
      streamContentType?: string | null;
    } | null;
  } | null;

  footerSocialLinks?: FooterSocialLink[] | null;

  socialLoginIcons?: Partial<
    Record<SocialProvider, SocialLoginIconConfig>
  > | null;
};

type InstanceFeatures = {
  wiki: boolean;
  wikiPublic: boolean;
  courses: boolean;
  coursesPublic: boolean;
  myCourses: boolean;
  profile: boolean;
  accessibilityWidget: boolean;
  seo: boolean;
  themeLight: boolean;
  themeDark: boolean;
  themeModeSelector: boolean;
  auth: boolean;
  authLogin: boolean;
  authRegister: boolean;
  auth2fa: boolean;
  captcha: boolean;
  captchaLogin: boolean;
  captchaRegister: boolean;
  captchaForgotPassword: boolean;
  captchaChangePassword: boolean;
  paidCourses: boolean;
  socialGoogle: boolean;
  socialFacebook: boolean;
  socialGithub: boolean;
  socialLinkedin: boolean;
  infraRedis: boolean;
  infraRedisUrl?: string | null;
  infraRabbitmq: boolean;
  infraRabbitmqUrl?: string | null;
  infraMonitoring: boolean;
  infraMonitoringUrl?: string | null;
  infraErrorTracking: boolean;
  infraErrorTrackingUrl?: string | null;
};

type InstanceLanguages = {
  supported: string[];
  default: string;
  icons?: Record<
    string,
    { lightUrl?: string | null; darkUrl?: string | null } | null
  > | null;
  flagPicker?: {
    global?: string | null;
    byLang?: Record<string, string | null> | null;
  } | null;
};

const COUNTRY_FLAG_CODES: readonly string[] = [
  "ad",
  "ae",
  "af",
  "ag",
  "ai",
  "al",
  "am",
  "ao",
  "aq",
  "ar",
  "as",
  "at",
  "au",
  "aw",
  "ax",
  "az",
  "ba",
  "bb",
  "bd",
  "be",
  "bf",
  "bg",
  "bh",
  "bi",
  "bj",
  "bl",
  "bm",
  "bn",
  "bo",
  "bq",
  "br",
  "bs",
  "bt",
  "bv",
  "bw",
  "by",
  "bz",
  "ca",
  "cc",
  "cd",
  "cf",
  "cg",
  "ch",
  "ci",
  "ck",
  "cl",
  "cm",
  "cn",
  "co",
  "cr",
  "cu",
  "cv",
  "cw",
  "cx",
  "cy",
  "cz",
  "de",
  "dj",
  "dk",
  "dm",
  "do",
  "dz",
  "ec",
  "ee",
  "eg",
  "eh",
  "er",
  "es",
  "et",
  "fi",
  "fj",
  "fk",
  "fm",
  "fo",
  "fr",
  "ga",
  "gb",
  "gd",
  "ge",
  "gf",
  "gg",
  "gh",
  "gi",
  "gl",
  "gm",
  "gn",
  "gp",
  "gq",
  "gr",
  "gs",
  "gt",
  "gu",
  "gw",
  "gy",
  "hk",
  "hm",
  "hn",
  "hr",
  "ht",
  "hu",
  "id",
  "ie",
  "il",
  "im",
  "in",
  "io",
  "iq",
  "ir",
  "is",
  "it",
  "je",
  "jm",
  "jo",
  "jp",
  "ke",
  "kg",
  "kh",
  "ki",
  "km",
  "kn",
  "kp",
  "kr",
  "kw",
  "ky",
  "kz",
  "la",
  "lb",
  "lc",
  "li",
  "lk",
  "lr",
  "ls",
  "lt",
  "lu",
  "lv",
  "ly",
  "ma",
  "mc",
  "md",
  "me",
  "mf",
  "mg",
  "mh",
  "mk",
  "ml",
  "mm",
  "mn",
  "mo",
  "mp",
  "mq",
  "mr",
  "ms",
  "mt",
  "mu",
  "mv",
  "mw",
  "mx",
  "my",
  "mz",
  "na",
  "nc",
  "ne",
  "nf",
  "ng",
  "ni",
  "nl",
  "no",
  "np",
  "nr",
  "nu",
  "nz",
  "om",
  "pa",
  "pe",
  "pf",
  "pg",
  "ph",
  "pk",
  "pl",
  "pm",
  "pn",
  "pr",
  "ps",
  "pt",
  "pw",
  "py",
  "qa",
  "re",
  "ro",
  "rs",
  "ru",
  "rw",
  "sa",
  "sb",
  "sc",
  "sd",
  "se",
  "sg",
  "sh",
  "si",
  "sj",
  "sk",
  "sl",
  "sm",
  "sn",
  "so",
  "sr",
  "ss",
  "st",
  "sv",
  "sx",
  "sy",
  "sz",
  "tc",
  "td",
  "tf",
  "tg",
  "th",
  "tj",
  "tk",
  "tl",
  "tm",
  "tn",
  "to",
  "tr",
  "tt",
  "tv",
  "tw",
  "tz",
  "ua",
  "ug",
  "um",
  "us",
  "uy",
  "uz",
  "va",
  "vc",
  "ve",
  "vg",
  "vi",
  "vn",
  "vu",
  "wf",
  "ws",
  "ye",
  "yt",
  "za",
  "zm",
  "zw",
];

function FlagCodeAutocomplete(props: {
  value: string;
  disabled?: boolean;
  ariaLabel: string;
  onSelect: (next: string) => void;
}) {
  const { value, disabled, ariaLabel, onSelect } = props;
  const [query, setQuery] = useState<string>(value ?? "");
  const [open, setOpen] = useState(false);

  const normalizedQuery = (query ?? "").trim().toLowerCase();

  const options = useMemo(() => {
    const all = Array.isArray(COUNTRY_FLAG_CODES) ? COUNTRY_FLAG_CODES : [];
    if (!normalizedQuery) return all;

    const starts = all.filter((cc) => cc.startsWith(normalizedQuery));
    if (starts.length > 0) return starts;

    return all.filter((cc) => cc.includes(normalizedQuery));
  }, [normalizedQuery]);

  const displayedQuery = open ? query : (value ?? "");

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          value={displayedQuery}
          disabled={disabled}
          onFocus={() => {
            setQuery(value ?? "");
            setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false);
            }, 120);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              return;
            }

            if (e.key === "Enter") {
              const exact = (query ?? "").trim().toLowerCase();
              if (
                /^[a-z]{2}$/.test(exact) &&
                COUNTRY_FLAG_CODES.includes(exact)
              ) {
                onSelect(exact);
                setOpen(false);
              }
            }
          }}
          placeholder="bg"
          aria-label={ariaLabel}
          className="w-[88px] rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {(value ?? "").trim().length ? (
          <span
            aria-hidden="true"
            className={`fi fi-${value} h-4 w-4 rounded-sm`}
          />
        ) : null}
      </div>

      {open ? (
        <div className="absolute left-0 z-20 mt-1 w-[160px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="max-h-64 overflow-auto py-1">
            <button
              type="button"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect("");
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 px-2 py-1 text-left text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>—</span>
              <span className="text-[11px] text-gray-400">clear</span>
            </button>

            {options.map((cc) => (
              <button
                key={`flag-autocomplete-${cc}`}
                type="button"
                disabled={disabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(cc);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-2 py-1 text-left text-xs text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="font-medium">{cc.toUpperCase()}</span>
                <span
                  aria-hidden="true"
                  className={`fi fi-${cc} h-4 w-4 rounded-sm`}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type InstanceSeo = {
  baseUrl?: string | null;
  titleTemplate?: string | null;
  defaultTitle?: string | null;
  defaultDescription?: string | null;
  robots?: {
    index?: boolean;
  } | null;
  sitemap?: {
    enabled?: boolean;
    includeWiki?: boolean;
    includeCourses?: boolean;
    includeLegal?: boolean;
  } | null;
};

type SocialProvider = "google" | "facebook" | "github" | "linkedin";

type SocialLoginIconConfig = {
  lightUrl?: string | null;
  darkUrl?: string | null;
} | null;

type SocialProviderCredentialResponse = {
  clientId: string | null;
  redirectUri: string | null;
  hasClientSecret: boolean;
  notes: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
};

type SocialProviderCredentialRequest = {
  clientId?: string | null;
  clientSecret?: string | null;
  redirectUri?: string | null;
  notes?: string | null;
};

type SocialCredentialFormState = {
  clientId: string;
  redirectUri: string;
  clientSecretInput: string;
  hasClientSecret: boolean;
  clearSecret: boolean;
  notes: string;
  updatedBy: string | null;
  updatedAt: string | null;
};

type SocialFieldErrors = {
  clientId?: string;
  redirectUri?: string;
  clientSecret?: string;
};

type SocialMetadataSnapshot = {
  browserTitle: string;
  socialImageUrl: string;
  socialDescription: string;
  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImageUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImageUrl: string;
  twitterCard: string;
  twitterAppName: string;
  twitterAppIdIphone: string;
  twitterAppIdIpad: string;
  twitterAppIdGooglePlay: string;
  twitterAppUrlIphone: string;
  twitterAppUrlIpad: string;
  twitterAppUrlGooglePlay: string;
  twitterPlayerUrl: string;
  twitterPlayerWidth: string;
  twitterPlayerHeight: string;
  twitterPlayerStream: string;
  twitterPlayerStreamContentType: string;
  previewOrigin: string;
};

type SocialFieldKey = keyof SocialFieldErrors;

type SocialProviderStatus = {
  enabled: boolean;
  configured: boolean;
};

type SocialProviderStatuses = Record<SocialProvider, SocialProviderStatus>;

type SocialImagePurpose = "shared" | "open-graph" | "twitter";

type SocialProviderTestResultResponse = {
  provider: SocialProvider;
  ok: boolean;
  checkedAt: string;
  latencyMs: number;
  httpStatus: number;
  endpoint: string;
};

type SocialTestState = {
  status: "idle" | "loading" | "success" | "error";
  message: string | null;
  details?: SocialProviderTestResultResponse | null;
  errorDetails?: string | null;
};

type AdminSettingsResponse = {
  branding: InstanceBranding;
  features: InstanceFeatures;
  languages: InstanceLanguages;
  seo: InstanceSeo | null;
  socialProviders?: SocialProviderStatuses | null;
  socialCredentials: Partial<
    Record<SocialProvider, SocialProviderCredentialResponse>
  >;
};

const GOOGLE_FONTS: {
  value: string;
  label: string;
  sampleStyle: React.CSSProperties;
  supportsCyrillic: boolean;
}[] = [
  {
    value: "inter",
    label: "Inter (sans)",
    sampleStyle: { fontFamily: "Inter, sans-serif" },
    supportsCyrillic: true,
  },
  {
    value: "roboto",
    label: "Roboto (sans)",
    sampleStyle: { fontFamily: "Roboto, sans-serif" },
    supportsCyrillic: true,
  },
  {
    value: "open-sans",
    label: "Open Sans (sans)",
    sampleStyle: { fontFamily: '"Open Sans", sans-serif' },
    supportsCyrillic: true,
  },
  {
    value: "lato",
    label: "Lato (sans)",
    sampleStyle: { fontFamily: "Lato, sans-serif" },
    supportsCyrillic: false,
  },
  {
    value: "montserrat",
    label: "Montserrat (sans)",
    sampleStyle: { fontFamily: "Montserrat, sans-serif" },
    supportsCyrillic: true,
  },
  {
    value: "poppins",
    label: "Poppins (sans)",
    sampleStyle: { fontFamily: "Poppins, sans-serif" },
    supportsCyrillic: false,
  },
  {
    value: "nunito",
    label: "Nunito (sans)",
    sampleStyle: { fontFamily: "Nunito, sans-serif" },
    supportsCyrillic: false,
  },
  {
    value: "merriweather",
    label: "Merriweather (serif)",
    sampleStyle: { fontFamily: "Merriweather, serif" },
    supportsCyrillic: false,
  },
  {
    value: "playfair-display",
    label: "Playfair Display (serif)",
    sampleStyle: { fontFamily: '"Playfair Display", serif' },
    supportsCyrillic: false,
  },
  {
    value: "noto-sans",
    label: "Noto Sans (global sans)",
    sampleStyle: { fontFamily: '"Noto Sans", sans-serif' },
    supportsCyrillic: true,
  },
  {
    value: "noto-serif",
    label: "Noto Serif (global serif)",
    sampleStyle: { fontFamily: '"Noto Serif", serif' },
    supportsCyrillic: true,
  },
];

const CYRILLIC_LANGS = new Set(["bg", "ru", "uk", "sr", "mk"]);

const SOCIAL_PROVIDERS: SocialProvider[] = [
  "google",
  "facebook",
  "github",
  "linkedin",
];

const buildSocialStatuses = (
  incoming: Partial<Record<SocialProvider, SocialProviderStatus>> | null,
): SocialProviderStatuses => {
  const fallback: SocialProviderStatus = { enabled: false, configured: false };
  return SOCIAL_PROVIDERS.reduce((acc, provider) => {
    const value = incoming?.[provider];
    acc[provider] =
      value &&
      typeof value.enabled === "boolean" &&
      typeof value.configured === "boolean"
        ? value
        : fallback;
    return acc;
  }, {} as SocialProviderStatuses);
};

const SOCIAL_PROVIDER_LABELS: Record<SocialProvider, string> = {
  facebook: "Facebook",
  github: "GitHub",
  google: "Google",
  linkedin: "LinkedIn",
};

const FEATURE_TOGGLE_INFO: Record<
  string,
  { title: string; description: string; impact: string; risk?: string }
> = {
  accessibilityWidget: {
    title: "Accessibility tool",
    description:
      "Показва бутон в header-а за локални accessibility настройки (увеличение на текста и high-contrast).",
    impact:
      "OFF скрива бутона от UI и форсира default (100% и normal contrast) за всички потребители.",
  },
  themeLight: {
    title: "Theme: Light",
    description: "Позволява Light theme (и UI избор на Light).",
    impact:
      "OFF скрива Light като опция и форсира fallback към Dark (или System, ако е позволено).",
  },
  themeDark: {
    title: "Theme: Dark",
    description: "Позволява Dark theme (и UI избор на Dark).",
    impact:
      "OFF скрива Dark като опция и форсира fallback към Light (или System, ако е позволено).",
  },
  themeModeSelector: {
    title: "Theme selector",
    description:
      "Показва dropdown в header-а, за да може потребителят да избере Light/Dark/System (локално чрез localStorage).",
    impact:
      "OFF скрива dropdown-а и системата използва само Branding -> Mode като админски default за всички.",
  },
  wiki: {
    title: "Wiki",
    description:
      "Пълен switch за Wiki (публичен). Използвай го, ако искаш да скриеш Wiki изцяло от потребителите.",
    impact:
      "OFF скрива Wiki навигацията и всички публични /wiki страници връщат 404. Admin Wiki остава достъпен.",
    risk: "Потребителите губят достъп до документация/помощни материали и може да се увеличат запитванията към поддръжката.",
  },
  wikiPublic: {
    title: "Wiki public",
    description:
      "Публичният Wiki модул – статии, категории и търсене без вход.",
    impact:
      "Ако е OFF, линковете към Wiki се скриват, а всички /wiki страници връщат 404 и студентите вече не могат да четат помощни материали.",
    risk: "Може да загубиш самопомощ канал и да увеличиш натоварването на поддръжката.",
  },
  courses: {
    title: "Courses",
    description: "Навигацията и страниците за курсове (листинг + детайли).",
    impact:
      "OFF скрива Courses навигацията, а опитите за достъп връщат 404, така че студентите не могат да записват или разглеждат курсове.",
    risk: "Потребителите ще приемат платформата за счупена и може да загубиш приходи от платени курсове.",
  },
  coursesPublic: {
    title: "Courses public",
    description: "Публичен каталог за курсове (list + detail) без login.",
    impact:
      "OFF прави /courses и /course-categories недостъпни (404) за всички. Записването и My Courses могат да останат налични за вече вписани потребители.",
    risk: "Нови потребители няма да могат да разглеждат каталога и да откриват курсове.",
  },
  myCourses: {
    title: "My Courses",
    description:
      "Персонализираният раздел за записани курсове и прогрес (изисква login).",
    impact:
      "OFF връща 404 за /my-courses и свързаните user endpoints (users/me/courses, curriculum progress, enroll/certificate).",
    risk: "Потребителите няма да могат да продължат започнати курсове и да виждат прогрес/сертификати.",
  },
  profile: {
    title: "Profile",
    description:
      "Профилен раздел на потребителя (email, change-password, export).",
    impact:
      "OFF скрива /profile и спира user actions като change-password и email update (връща 404 на съответните endpoints).",
    risk: "Потребителите губят self-service управление на акаунта и ще се нуждаят от support.",
  },
  auth: {
    title: "Auth (risk)",
    description:
      "Master switch за всички auth endpoints (login/register/reset/social).",
    impact:
      "OFF спира всеки auth поток и връща 404/403 – реално никой освен админите с активна сесия няма да може да използва системата.",
    risk: "Неправилна употреба води до пълно изключване на платформата за потребителите.",
  },
  authLogin: {
    title: "Auth: Login (users)",
    description: "Контролира входа на стандартни потребители (role=user).",
    impact:
      "OFF връща 403 при login за студенти, но админ/инструктор роли все още могат да се вписват.",
    risk: "Потребителите ще останат извън системата и ще създават incident tickets, ако промяната не е планирана.",
  },
  authRegister: {
    title: "Auth: Register + Reset password",
    description:
      "Регистрация, забравена парола и reset процеси (email токени).",
    impact:
      "OFF показва съобщение в UI и връща 404 за register/forgot/reset API – нови акаунти и възстановяване на пароли стават невъзможни.",
    risk: "Забравилите паролата си потребители ще бъдат блокирани до повторно активиране.",
  },
  auth2fa: {
    title: "Auth: 2FA (TOTP)",
    description:
      "Позволява Two-factor authentication чрез Authenticator app (TOTP) за password login.",
    impact:
      "OFF изключва 2FA потоците и password login не изисква код, дори потребителят да е активирал 2FA преди това.",
    risk: "Изключването намалява сигурността. Използвай OFF само при инцидент или нужда от emergency access.",
  },
  captcha: {
    title: "Captcha (global)",
    description:
      "Глобален switch за captcha. Ако е OFF, всички captcha под-опции се изключват.",
    impact: "OFF изключва captcha защита във всички auth/profile flows.",
    risk: "Повишен риск от bot/spam атаки, brute-force и злоупотреби.",
  },
  captchaLogin: {
    title: "Captcha: Login",
    description:
      "Captcha защита при login (може да се активира при подозрителни опити).",
    impact:
      "Когато е ON, backend може да изисква captchaToken при login според защитната логика.",
  },
  captchaRegister: {
    title: "Captcha: Register",
    description: "Captcha защита при регистрация.",
    impact: "Когато е ON, register изисква captchaToken.",
  },
  captchaForgotPassword: {
    title: "Captcha: Forgot password",
    description: "Captcha защита при forgot-password.",
    impact: "Когато е ON, forgot-password изисква captchaToken.",
  },
  captchaChangePassword: {
    title: "Captcha: Change password",
    description: "Captcha защита при смяна на парола в профила.",
    impact: "Когато е ON, change-password изисква captchaToken.",
  },
  paidCourses: {
    title: "Paid courses",
    description: "Показване на платени курсове, checkout/плащане и статуси.",
    impact:
      "OFF скрива всички CTA за плащане и маркира курсовете като недостъпни за покупка.",
    risk: "Временно спиране на приходи – използвай само при инциденти с плащания.",
  },
  infraMonitoring: {
    title: "Infra: Monitoring",
    description:
      "UI елементи, които показват статус на мониторинг/health endpoints.",
    impact:
      "OFF скрива мониторинг карти и прекратява автоматичните ping панели.",
    risk: "Няма директен риск, но DevOps губи видимост за здравето на системата.",
  },
  infraRedis: {
    title: "Infra: Redis",
    description: "Обозначава наличен Redis cache за сесии/опашки.",
    impact:
      "OFF кара приложението да избегне Redis функции и да използва in-memory fallback (по-бавно и по-рисково при рестарт).",
    risk: "Повече latency и потенциална загуба на сесии при рестартиране.",
  },
  infraRabbitmq: {
    title: "Infra: RabbitMQ",
    description: "Флаг дали е налична background queue за асинхронни задачи.",
    impact:
      "OFF принуждава приложенията да изпълняват задачи синхронно или да ги пропускат.",
    risk: "Изпращането на имейли/нотификации може да спре, а UI операции ще се забавят.",
  },
  infraErrorTracking: {
    title: "Infra: Error tracking",
    description:
      "Индикация, че външен error-tracking (Sentry и т.н.) е активен.",
    impact: "OFF скрива линковете към тракера и спира автоматичните репорти.",
    risk: "Инцидентите няма да бъдат логнати централизирано – разчитай на логове.",
  },
};

type FeatureToggleKey = keyof typeof FEATURE_TOGGLE_INFO;

function FeatureToggleLabel({
  label,
  featureKey,
}: {
  label: string;
  featureKey: FeatureToggleKey;
}) {
  const info = FEATURE_TOGGLE_INFO[featureKey];
  if (!info) {
    return (
      <div className="flex flex-1 items-center justify-between gap-2">
        <span className="text-sm text-gray-800">{label}</span>
      </div>
    );
  }

  const stopPropagation = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="flex flex-1 items-start justify-between gap-2">
      <span className="text-sm text-gray-800">{label}</span>
      <button
        type="button"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onMouseUp={stopPropagation}
        className="group relative ml-auto inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-[11px] font-semibold text-gray-600 transition hover:border-green-500 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label={`${info.title} информация`}
      >
        ?
        <div className="pointer-events-none absolute right-0 top-6 z-20 hidden w-72 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 shadow-xl group-hover:block group-focus-visible:block">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-500">
            {info.title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-gray-800">
            {info.description}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            <span className="font-semibold text-gray-900">Влияние:</span>{" "}
            {info.impact}
          </p>
          {info.risk ? (
            <p className="mt-2 text-sm leading-relaxed text-red-700">
              <span className="font-semibold text-red-800">Риск:</span>{" "}
              {info.risk}
            </p>
          ) : null}
        </div>
      </button>
    </div>
  );
}

type ThemeFieldControlsProps = {
  title: string;
  palette: ThemePalette;
  savedPalette: ThemePalette;
  redoMap: ThemePaletteDraft;
  setPalette: Dispatch<SetStateAction<ThemePalette>>;
  setRedo: Dispatch<SetStateAction<ThemePaletteDraft>>;
  variant: ThemeVariant;
  hexDraft: ThemePaletteDraft;
  setHexDraft: Dispatch<SetStateAction<ThemeHexDraftState>>;
  disabled: boolean;
};

function ThemeFieldControls({
  title,
  palette,
  savedPalette,
  redoMap,
  setPalette,
  setRedo,
  variant,
  hexDraft,
  setHexDraft,
  disabled,
}: ThemeFieldControlsProps) {
  const handleReset = (key: ThemeFieldKey) => {
    setRedo((prev) => ({
      ...prev,
      [key]: palette[key],
    }));
    setPalette((prev) => ({
      ...prev,
      [key]: savedPalette[key],
    }));
  };

  const handleRedo = (key: ThemeFieldKey) => {
    if (typeof redoMap[key] !== "string") return;
    const lastValue = redoMap[key] ?? palette[key];
    setPalette((prev) => ({
      ...prev,
      [key]: lastValue,
    }));
    setRedo((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleColorChange = (key: ThemeFieldKey, value: string) => {
    setRedo((prev) => {
      if (typeof prev[key] === "undefined") {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setPalette((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };
      return next;
    });
    setHexDraft((prev) => ({
      ...prev,
      [variant]: {
        ...prev[variant],
        [key]: value,
      },
    }));
  };

  const handleHexInputChange = (key: ThemeFieldKey, value: string) => {
    const draft = sanitizeHexDraft(value);
    setHexDraft((prev) => ({
      ...prev,
      [variant]: {
        ...prev[variant],
        [key]: draft,
      },
    }));
    const expanded = expandToSixHex(draft);
    if (expanded) {
      handleColorChange(key, expanded);
    }
  };

  const handleHexInputBlur = (key: ThemeFieldKey) => {
    setHexDraft((prev) => ({
      ...prev,
      [variant]: {
        ...prev[variant],
        [key]: palette[key],
      },
    }));
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span>{title}</span>
        <InfoTooltip
          label={`${title} info`}
          title={title}
          description={
            variant === "light"
              ? "Редактираш Light палитрата. Това са стойностите за CSS variables (tokens) при светъл режим."
              : "Редактираш Dark палитрата. Това са стойностите за CSS variables (tokens) при тъмен режим."
          }
        />
      </p>
      <div className="mt-3 space-y-4">
        {THEME_FIELD_ORDER.map((key) => {
          const def = THEME_FIELD_DEFS[key];
          const isDirty = palette[key] !== savedPalette[key];
          const hasRedo = typeof redoMap[key] === "string";
          return (
            <div
              key={key}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {def.label}
                  </p>
                  <p className="text-xs text-gray-500">{def.description}</p>
                  <p className="mt-1 text-[11px] font-mono text-gray-400">
                    {def.token}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isDirty ? (
                    <button
                      type="button"
                      onClick={() => handleReset(key)}
                      disabled={disabled}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`${def.label} reset`}
                      title="↩ Reset to saved"
                    >
                      ↩
                    </button>
                  ) : null}
                  {hasRedo ? (
                    <button
                      type="button"
                      onClick={() => handleRedo(key)}
                      disabled={disabled}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`${def.label} redo`}
                      title="↪ Redo"
                    >
                      ↪
                    </button>
                  ) : null}
                  <input
                    type="color"
                    value={palette[key] ?? "#000000"}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    disabled={disabled}
                    className="h-9 w-14 rounded border border-gray-300 bg-white"
                  />
                  <input
                    type="text"
                    inputMode="text"
                    spellCheck={false}
                    value={hexDraft[key] ?? palette[key]}
                    onChange={(e) => handleHexInputChange(key, e.target.value)}
                    onBlur={() => handleHexInputBlur(key)}
                    disabled={disabled}
                    className="h-9 w-28 rounded border border-gray-300 bg-white px-2 font-mono text-sm uppercase text-gray-900"
                    aria-label={`${def.label} hex value`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ThemePreviewCard({
  palette,
  variant,
}: {
  palette: ThemePalette;
  variant: ThemeVariant;
}) {
  const previewMutedText: CSSProperties = {
    color: palette.foreground,
    opacity: variant === "dark" ? 0.75 : 0.7,
  };
  const baseCard: CSSProperties = {
    backgroundColor: palette.card,
    color: palette.foreground,
    borderColor: palette.border,
  };
  const primaryButton: CSSProperties = {
    backgroundColor: palette.primary,
    color: palette.foreground,
    borderColor: palette.primary,
  };
  const secondaryButton: CSSProperties = {
    backgroundColor: palette.secondary,
    color: palette.foreground,
    borderColor: palette.secondary,
  };
  const okChip: CSSProperties = {
    backgroundColor: palette.fieldOkBg,
    borderColor: palette.fieldOkBorder,
    color: palette.foreground,
  };
  const errorChip: CSSProperties = {
    backgroundColor: palette.fieldErrorBg,
    borderColor: palette.fieldErrorBorder,
    color: palette.error,
  };

  const inputBase: CSSProperties = {
    backgroundColor: palette.card,
    color: palette.foreground,
    borderColor: palette.border,
  };
  const inputOk: CSSProperties = {
    backgroundColor: palette.fieldOkBg,
    color: palette.foreground,
    borderColor: palette.fieldOkBorder,
  };
  const inputAlert: CSSProperties = {
    backgroundColor: palette.fieldAlertBg,
    color: palette.foreground,
    borderColor: palette.fieldAlertBorder,
  };
  const inputError: CSSProperties = {
    backgroundColor: palette.fieldErrorBg,
    color: palette.foreground,
    borderColor: palette.fieldErrorBorder,
  };

  const linkColor = ensureLinkContrast(
    palette.primary,
    palette.card,
    variant,
    5,
  );

  const linkStyle: CSSProperties = {
    color: linkColor,
    textDecoration: "underline",
    textUnderlineOffset: 2,
  };

  return (
    <div
      className="rounded-2xl border p-4 shadow-sm"
      style={{
        backgroundColor: palette.background,
        color: palette.foreground,
        borderColor: palette.border,
      }}
    >
      <div className="rounded-xl border p-4 shadow-sm" style={baseCard}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs uppercase tracking-wide"
              style={previewMutedText}
            >
              {variant === "light" ? "Light preview" : "Dark preview"}
            </p>
            <h3 className="text-lg font-semibold">UI sample headline</h3>
            <p className="mt-1 text-sm" style={previewMutedText}>
              Примерен текст за основния body цвят и контрасти.
            </p>
            <p className="mt-2 text-sm">
              Това е примерен текст с нормална плътност и един{" "}
              <a href="#" style={linkStyle}>
                примерен линк
              </a>
              .
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className="h-12 w-2 rounded-full border"
              style={{
                borderColor: palette.border,
                backgroundColor: palette.scrollTrack,
              }}
            >
              <div
                className="mx-auto mt-1 h-4 w-1 rounded-full"
                style={{ backgroundColor: palette.scrollThumb }}
              />
            </div>
            <span className="text-[10px] font-medium" style={previewMutedText}>
              Scroll
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border px-3 py-1 text-xs font-semibold shadow-sm"
            style={primaryButton}
          >
            Primary CTA
          </button>
          <button
            type="button"
            className="rounded-full border px-3 py-1 text-xs font-semibold shadow-sm"
            style={secondaryButton}
          >
            Secondary
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium">
        <span
          className="inline-flex items-center rounded-full border px-2 py-0.5"
          style={okChip}
        >
          ✓ Success state
        </span>
        <span
          className="inline-flex items-center rounded-full border px-2 py-0.5"
          style={{
            backgroundColor: palette.fieldAlertBg,
            borderColor: palette.fieldAlertBorder,
            color: palette.foreground,
          }}
        >
          ⚑ Alert state
        </span>
        <span
          className="inline-flex items-center rounded-full border px-2 py-0.5"
          style={errorChip}
        >
          ⚠ Error state
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={previewMutedText}
          >
            Field (normal)
          </p>
          <div
            className="mt-2 rounded-md border px-3 py-2 text-sm shadow-sm"
            style={inputBase}
          >
            Example input
          </div>
        </div>
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={previewMutedText}
          >
            Field (ok)
          </p>
          <div
            className="mt-2 rounded-md border px-3 py-2 text-sm shadow-sm"
            style={inputOk}
          >
            Valid value
          </div>
        </div>
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={previewMutedText}
          >
            Alert value
          </p>
          <div
            className="mt-2 rounded-md border px-3 py-2 text-sm shadow-sm"
            style={inputAlert}
          >
            Needs attention
          </div>
        </div>
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={previewMutedText}
          >
            Field (error)
          </p>
          <div
            className="mt-2 rounded-md border px-3 py-2 text-sm shadow-sm"
            style={inputError}
          >
            Invalid value
          </div>
          <p className="mt-1 text-xs" style={{ color: palette.error }}>
            Example error message
          </p>
        </div>
      </div>
    </div>
  );
}

function ThemePreviewLegend({
  lightPalette,
  darkPalette,
}: {
  lightPalette: ThemePalette;
  darkPalette: ThemePalette;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto">
      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span>Legend</span>
        <InfoTooltip
          label="Legend info"
          title="Legend"
          description="Списък с основните theme tokens и как изглеждат като цветове при Light и Dark."
        />
      </p>
      <div className="mt-3 grid gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Light
          </p>
          <dl className="mt-2 space-y-3">
            {THEME_PREVIEW_LEGEND_KEYS.map((key) => {
              const def = THEME_FIELD_DEFS[key];
              return (
                <div
                  key={`legend-light-${key}`}
                  className="flex items-center gap-3"
                >
                  <span
                    className="h-4 w-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: lightPalette[key] }}
                  />
                  <div>
                    <dt className="text-sm font-medium text-gray-800">
                      {def.label}
                    </dt>
                    <dd className="text-[11px] text-gray-500">{def.token}</dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Dark
          </p>
          <dl className="mt-2 space-y-3">
            {THEME_PREVIEW_LEGEND_KEYS.map((key) => {
              const def = THEME_FIELD_DEFS[key];
              return (
                <div
                  key={`legend-dark-${key}`}
                  className="flex items-center gap-3"
                >
                  <span
                    className="h-4 w-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: darkPalette[key] }}
                  />
                  <div>
                    <dt className="text-sm font-medium text-gray-800">
                      {def.label}
                    </dt>
                    <dd className="text-[11px] text-gray-500">{def.token}</dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({
  variant,
  label,
}: {
  variant: "ok" | "missing" | "fallback";
  label: string;
}) {
  const style: CSSProperties =
    variant === "ok"
      ? {
          backgroundColor: "var(--field-ok-bg)",
          borderColor: "var(--field-ok-border)",
          color: "var(--primary)",
        }
      : variant === "fallback"
        ? {
            backgroundColor: "var(--field-alert-bg)",
            borderColor: "var(--field-alert-border)",
            color: "var(--foreground)",
          }
        : {
            backgroundColor: "var(--field-error-bg)",
            borderColor: "var(--field-error-border)",
            color: "var(--error)",
          };
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={style}
    >
      {label}
    </span>
  );
}

export function SocialPreviewCard({
  platform,
  title,
  description,
  imageUrl,
  domain,
  twitterCardType,
  twitterAppName,
  twitterPlayerUrl,
  twitterPlayerWidth,
  twitterPlayerHeight,
}: {
  platform: "facebook" | "twitter";
  title: string;
  description: string;
  imageUrl?: string | null;
  domain: string;
  twitterCardType?: string | null;
  twitterAppName?: string | null;
  twitterPlayerUrl?: string | null;
  twitterPlayerWidth?: number | null;
  twitterPlayerHeight?: number | null;
}) {
  const isTwitter = platform === "twitter";
  const effectiveTwitterCard = isTwitter
    ? twitterCardType && twitterCardType.length > 0
      ? twitterCardType
      : "summary_large_image"
    : null;
  const isTwitterCompactCard = effectiveTwitterCard === "summary";
  const isTwitterAppCard = effectiveTwitterCard === "app";
  const isTwitterPlayerCard = effectiveTwitterCard === "player";
  const layoutIsRow = !isTwitter || isTwitterCompactCard;
  const imageShellClass = !isTwitter
    ? "h-40 w-full md:h-44 md:w-1/2"
    : isTwitterCompactCard
      ? "h-40 w-full md:h-40 md:w-1/3"
      : "h-48 w-full";
  const contentClass = !isTwitter
    ? "flex flex-1 flex-col px-4 py-3"
    : isTwitterCompactCard
      ? "flex flex-1 flex-col px-4 py-3 md:w-2/3"
      : "flex flex-1 flex-col px-4 py-3";

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <span>
          {isTwitter ? "Twitter / X preview" : "Facebook / LinkedIn preview"}
        </span>
        {isTwitter && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
            Card: {effectiveTwitterCard}
          </span>
        )}
      </div>
      <div className={`flex flex-col ${layoutIsRow ? "md:flex-row" : ""}`}>
        <div className={imageShellClass}>
          <div
            className={`relative h-full w-full overflow-hidden rounded-none border-b border-gray-100 ${
              layoutIsRow ? "md:border-b-0 md:border-r" : ""
            } ${imageUrl ? "" : "flex items-center justify-center bg-gray-100"}`}
            style={
              imageUrl
                ? {
                    backgroundImage: `url(${imageUrl})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }
                : undefined
            }
          >
            {isTwitterPlayerCard ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60">
                  <span className="ml-0.5 text-base font-bold text-white">
                    ▶
                  </span>
                </div>
              </div>
            ) : null}

            {!imageUrl && !isTwitterPlayerCard && (
              <span className="text-xs font-medium text-gray-500">
                Няма изображение
              </span>
            )}
          </div>
        </div>
        <div className={contentClass}>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">
            {domain || "example.com"}
          </p>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {title || "Добави заглавие"}
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {description ||
              "Добави описание, за да завършиш social preview картата."}
          </p>

          {isTwitterAppCard ? (
            <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                App card
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {twitterAppName?.trim()
                  ? `Install / Open: ${twitterAppName.trim()}`
                  : "Install / Open: (липсва App name)"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Twitter показва CTA към App Store / Google Play.
              </p>
            </div>
          ) : null}

          {isTwitterPlayerCard ? (
            <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Player card
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {twitterPlayerWidth && twitterPlayerHeight
                  ? `Player: ${twitterPlayerWidth}×${twitterPlayerHeight}`
                  : "Player: (липсват размери)"}
              </p>
              <p className="mt-1 break-all text-xs text-gray-500">
                {twitterPlayerUrl?.trim()
                  ? twitterPlayerUrl.trim()
                  : "(липсва Player URL)"}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        checked
          ? "border-green-500 bg-green-600"
          : "border-gray-300 bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function AccordionSection({
  title,
  description,
  open,
  onToggle,
  children,
  headerAdornment,
}: {
  title: string;
  description?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  headerAdornment?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 px-5 py-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start justify-between gap-4 text-left"
        >
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
            {description ? (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            ) : null}
          </div>
          <span
            className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-transform ${
              open ? "rotate-180" : "rotate-0"
            }`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>
        <div className="flex flex-shrink-0 items-start pt-1">
          {headerAdornment ? headerAdornment : null}
        </div>
      </div>
      {open ? <div className="px-5 pb-5">{children}</div> : null}
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmEnabled,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmEnabled: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmEnabled}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const SOCIAL_PROVIDER_SCOPE_HINTS: Record<SocialProvider, string> = {
  google: "Scopes: openid profile email",
  facebook: "Scopes: email public_profile",
  github: "Scopes: user:email read:user",
  linkedin: "Scopes: r_emailaddress r_liteprofile",
};

const SOCIAL_PROVIDER_REDIRECT_HINTS: Record<SocialProvider, string> = {
  google: `${API_BASE_URL}/auth/google/callback`,
  facebook: `${API_BASE_URL}/auth/facebook/callback`,
  github: `${API_BASE_URL}/auth/github/callback`,
  linkedin: `${API_BASE_URL}/auth/linkedin/callback`,
};

function buildSocialCredentialState(
  data?: Partial<Record<SocialProvider, SocialProviderCredentialResponse>>,
): Record<SocialProvider, SocialCredentialFormState> {
  return SOCIAL_PROVIDERS.reduce(
    (acc, provider) => {
      const server = data?.[provider];
      acc[provider] = {
        clientId: server?.clientId ?? "",
        redirectUri: server?.redirectUri ?? "",
        clientSecretInput: "",
        hasClientSecret: Boolean(server?.hasClientSecret),
        clearSecret: false,
        notes: server?.notes ?? "",
        updatedBy: server?.updatedBy ?? null,
        updatedAt: server?.updatedAt ?? null,
      };
      return acc;
    },
    {} as Record<SocialProvider, SocialCredentialFormState>,
  );
}

function buildSocialFieldErrors(): Record<SocialProvider, SocialFieldErrors> {
  return SOCIAL_PROVIDERS.reduce(
    (acc, provider) => {
      acc[provider] = {};
      return acc;
    },
    {} as Record<SocialProvider, SocialFieldErrors>,
  );
}

function buildSocialTestStates(): Record<SocialProvider, SocialTestState> {
  return SOCIAL_PROVIDERS.reduce(
    (acc, provider) => {
      acc[provider] = {
        status: "idle",
        message: null,
        details: null,
        errorDetails: null,
      };
      return acc;
    },
    {} as Record<SocialProvider, SocialTestState>,
  );
}

const KNOWN_LANGUAGE_CODES = [
  "aa",
  "ab",
  "ae",
  "af",
  "ak",
  "am",
  "an",
  "ar",
  "as",
  "av",
  "ay",
  "az",
  "ba",
  "be",
  "bg",
  "bh",
  "bi",
  "bm",
  "bn",
  "bo",
  "br",
  "bs",
  "ca",
  "ce",
  "ch",
  "co",
  "cr",
  "cs",
  "cu",
  "cv",
  "cy",
  "da",
  "de",
  "dv",
  "dz",
  "ee",
  "el",
  "en",
  "eo",
  "es",
  "et",
  "eu",
  "fa",
  "ff",
  "fi",
  "fj",
  "fo",
  "fr",
  "fy",
  "ga",
  "gd",
  "gl",
  "gn",
  "gu",
  "gv",
  "ha",
  "he",
  "hi",
  "ho",
  "hr",
  "ht",
  "hu",
  "hy",
  "hz",
  "ia",
  "id",
  "ie",
  "ig",
  "ii",
  "ik",
  "io",
  "is",
  "it",
  "iu",
  "ja",
  "jv",
  "ka",
  "kg",
  "ki",
  "kj",
  "kk",
  "kl",
  "km",
  "kn",
  "ko",
  "kr",
  "ks",
  "ku",
  "kv",
  "kw",
  "ky",
  "la",
  "lb",
  "lg",
  "li",
  "ln",
  "lo",
  "lt",
  "lu",
  "lv",
  "mg",
  "mh",
  "mi",
  "mk",
  "ml",
  "mn",
  "mr",
  "ms",
  "mt",
  "my",
  "na",
  "nb",
  "nd",
  "ne",
  "ng",
  "nl",
  "nn",
  "no",
  "nr",
  "nv",
  "ny",
  "oc",
  "oj",
  "om",
  "or",
  "os",
  "pa",
  "pi",
  "pl",
  "ps",
  "pt",
  "qu",
  "rm",
  "rn",
  "ro",
  "ru",
  "rw",
  "sa",
  "sc",
  "sd",
  "se",
  "sg",
  "si",
  "sk",
  "sl",
  "sm",
  "sn",
  "so",
  "sq",
  "sr",
  "ss",
  "st",
  "su",
  "sv",
  "sw",
  "ta",
  "te",
  "tg",
  "th",
  "ti",
  "tk",
  "tl",
  "tn",
  "to",
  "tr",
  "ts",
  "tt",
  "tw",
  "ty",
  "ug",
  "uk",
  "ur",
  "uz",
  "ve",
  "vi",
  "vo",
  "wa",
  "wo",
  "xh",
  "yi",
  "yo",
  "za",
  "zh",
  "zu",
] as const;

const KNOWN_LANGUAGE_CODE_SET = new Set<string>(KNOWN_LANGUAGE_CODES);

function analyzeLanguageDraft(raw: string): {
  incoming: string[];
  invalid: string[];
  unknown: string[];
} {
  const parts = (raw ?? "")
    .split(/[,\n\r\t\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const incoming: string[] = [];
  const invalid: string[] = [];
  const unknown: string[] = [];

  for (const part of parts) {
    const normalized = part.toLowerCase();
    if (!/^[a-z]{2,5}$/.test(normalized)) {
      invalid.push(part);
      continue;
    }
    incoming.push(normalized);
    if (!KNOWN_LANGUAGE_CODE_SET.has(normalized)) {
      unknown.push(normalized);
    }
  }

  const uniqIncoming = Array.from(new Set(incoming));
  const uniqUnknown = Array.from(new Set(unknown));
  return {
    incoming: uniqIncoming,
    invalid: Array.from(new Set(invalid)),
    unknown: uniqUnknown,
  };
}

function LanguageDraftAutocomplete(props: {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel: string;
  flagByLang?: Record<string, string>;
  flagGlobal?: string;
  onChange: (next: string) => void;
}) {
  const {
    value,
    disabled,
    placeholder,
    ariaLabel,
    flagByLang,
    flagGlobal,
    onChange,
  } = props;
  const [open, setOpen] = useState(false);

  const raw = value ?? "";
  const lastCommaIdx = raw.lastIndexOf(",");
  const lastSpaceIdx = raw.lastIndexOf(" ");
  const lastSepIdx = Math.max(lastCommaIdx, lastSpaceIdx);
  const prefix = lastSepIdx >= 0 ? raw.slice(0, lastSepIdx + 1) : "";
  const tokenRaw = lastSepIdx >= 0 ? raw.slice(lastSepIdx + 1) : raw;
  const token = (tokenRaw ?? "").trim().toLowerCase();

  const options = useMemo(() => {
    const all = KNOWN_LANGUAGE_CODES as unknown as readonly string[];
    if (!token) return Array.from(all);
    const starts = all.filter((c) => c.startsWith(token));
    if (starts.length > 0) return starts;
    return all.filter((c) => c.includes(token));
  }, [token]);

  const countryFlagCodeSet = useMemo(
    () =>
      new Set<string>(
        Array.isArray(COUNTRY_FLAG_CODES) ? Array.from(COUNTRY_FLAG_CODES) : [],
      ),
    [],
  );

  const normalizeFlagCode = (rawCode: string): string => {
    const candidate = (rawCode ?? "").trim().toLowerCase();
    if (!/^[a-z]{2}$/.test(candidate)) return "";
    return countryFlagCodeSet.has(candidate) ? candidate : "";
  };

  const getFlagCodeForLang = (langCode: string): string => {
    const lc = (langCode ?? "").trim().toLowerCase();
    const fromMap = normalizeFlagCode(flagByLang?.[lc] ?? "");
    if (fromMap) return fromMap;
    if (lc === "en") return "gb";

    try {
      type LocaleLike = { region?: unknown; maximize?: () => LocaleLike };
      const LocaleCtor = (
        Intl as unknown as { Locale?: new (tag: string) => LocaleLike }
      ).Locale;
      if (typeof LocaleCtor === "function") {
        const locale = new LocaleCtor(lc);
        const maximized =
          locale && typeof locale.maximize === "function"
            ? locale.maximize()
            : locale;
        const region = normalizeFlagCode((maximized?.region ?? "") as string);
        if (region) return region;
      }
    } catch {
      // ignore
    }

    const direct = normalizeFlagCode(lc);
    if (direct) return direct;

    const global = normalizeFlagCode(flagGlobal ?? "");
    if (global) return global;

    return "us";
  };

  const applySuggestion = (code: string) => {
    let normalizedPrefix = prefix;
    if (normalizedPrefix.endsWith(",")) {
      normalizedPrefix += " ";
    } else if (normalizedPrefix.length > 0 && !/\s$/.test(normalizedPrefix)) {
      normalizedPrefix += " ";
    }
    onChange(`${normalizedPrefix}${code}`);
  };

  return (
    <div className="relative">
      <input
        value={raw}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
          }, 120);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        aria-label={ariaLabel}
        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-70"
        placeholder={placeholder}
      />

      {open ? (
        <div className="absolute left-0 z-20 mt-1 w-full max-w-[520px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="max-h-64 overflow-auto py-1">
            {options.map((code) => {
              const flagCode = getFlagCodeForLang(code);
              return (
                <button
                  key={`lang-draft-opt-${code}`}
                  type="button"
                  disabled={disabled}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    applySuggestion(code);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="font-medium">{code}</span>
                  {flagCode ? (
                    <span
                      aria-hidden="true"
                      className={`fi fi-${flagCode} h-4 w-4 rounded-sm`}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DefaultLanguageDropdown(props: {
  value: string;
  disabled?: boolean;
  ariaLabel: string;
  options: string[];
  onSelect: (next: string) => void;
}) {
  const { value, disabled, ariaLabel, options, onSelect } = props;
  const [open, setOpen] = useState(false);

  const selected = (value ?? "").trim().toLowerCase();

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
          }, 120);
        }}
        className="mt-2 flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="font-medium">{selected || "—"}</span>
        <span aria-hidden="true" className="text-xs text-gray-500">
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="max-h-64 overflow-auto py-1">
            <button
              type="button"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect("");
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>—</span>
              <span className="text-[11px] text-gray-400">clear</span>
            </button>

            {options.map((code) => (
              <button
                key={`default-lang-${code}`}
                type="button"
                disabled={disabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(code);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="font-medium">{code}</span>
                {selected === code ? (
                  <span className="text-[11px] text-gray-400">selected</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function isValidRedirectUrl(value: string): boolean {
  if (!value) {
    return false;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isValidOptionalHttpUrl(value: string): boolean {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return true;
  return isValidRedirectUrl(trimmed);
}

function isValidHttpUrl(value: string): boolean {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidInfraRabbitmqUrl(value: string): boolean {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "amqp:" || parsed.protocol === "amqps:";
  } catch {
    return false;
  }
}

function isValidInfraRedisUrl(value: string): boolean {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "redis:" || parsed.protocol === "rediss:") {
      return Boolean(parsed.hostname);
    }
  } catch {
    // ignore
  }

  return /^[a-zA-Z0-9.-]+:\d{2,5}$/.test(trimmed);
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveInFlightRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [themeNotice, setThemeNotice] = useState<{
    type: "error" | "success" | "alert";
    message: string;
  } | null>(null);

  const themeStorageKey = "beelms.themeMode";
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [uiThemeMode, setUiThemeMode] = useState<"light" | "dark" | "system">(
    () => {
      if (typeof window === "undefined") return "system";
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "light" || attr === "dark" || attr === "system") {
        return attr;
      }
      try {
        const v = localStorage.getItem(themeStorageKey);
        if (v === "light" || v === "dark" || v === "system") {
          return v;
        }
      } catch {
        // ignore
      }
      return "system";
    },
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const mqlHandler = () => {
      setSystemPrefersDark(mql.matches);
    };

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", mqlHandler);
    } else {
      mql.addListener(mqlHandler);
    }

    const observer = new MutationObserver(() => {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "light" || attr === "dark" || attr === "system") {
        setUiThemeMode(attr);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const storageHandler = (e: StorageEvent) => {
      if (e.key !== themeStorageKey) return;
      const v = e.newValue;
      if (v === "light" || v === "dark" || v === "system") {
        setUiThemeMode(v);
      }
    };
    window.addEventListener("storage", storageHandler);

    mqlHandler();

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", storageHandler);
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", mqlHandler);
      } else {
        mql.removeListener(mqlHandler);
      }
    };
  }, []);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const [authRiskModalOpen, setAuthRiskModalOpen] = useState(false);
  const [authRiskAcknowledged, setAuthRiskAcknowledged] = useState(false);

  const [initialFeatures, setInitialFeatures] =
    useState<InstanceFeatures | null>(null);

  const [appName, setAppName] = useState<string>("BeeLMS");
  const [browserTitle, setBrowserTitle] = useState<string>("");
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const faviconFileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoLightUrl, setLogoLightUrl] = useState<string>("");
  const logoLightFileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoDarkUrl, setLogoDarkUrl] = useState<string>("");
  const logoDarkFileInputRef = useRef<HTMLInputElement | null>(null);
  const [googleFont, setGoogleFont] = useState<string>("");
  const [googleFontByLang, setGoogleFontByLang] = useState<StringDictionary>(
    {},
  );
  const [fontUrl, setFontUrl] = useState<string>("");
  const [fontUrlByLang, setFontUrlByLang] = useState<StringDictionary>({});
  const [fontLicenseUrl, setFontLicenseUrl] = useState<string>("");
  const [fontLicenseUrlByLang, setFontLicenseUrlByLang] =
    useState<StringDictionary>({});
  const fontFileInputRef = useRef<HTMLInputElement | null>(null);
  const perLangFontFileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFontLang, setPendingFontLang] = useState<string>("");
  const fontLicenseFileInputRef = useRef<HTMLInputElement | null>(null);
  const perLangFontLicenseFileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFontLicenseLang, setPendingFontLicenseLang] =
    useState<string>("");

  const [seoBaseUrl, setSeoBaseUrl] = useState<string>("");
  const [seoTitleTemplate, setSeoTitleTemplate] =
    useState<string>("{page} | {site}");
  const [seoDefaultTitle, setSeoDefaultTitle] = useState<string>("");
  const [seoDefaultDescription, setSeoDefaultDescription] =
    useState<string>("");
  const [seoRobotsIndex, setSeoRobotsIndex] = useState<boolean>(true);
  const [seoSitemapEnabled, setSeoSitemapEnabled] = useState<boolean>(true);
  const [seoSitemapIncludeWiki, setSeoSitemapIncludeWiki] =
    useState<boolean>(true);
  const [seoSitemapIncludeCourses, setSeoSitemapIncludeCourses] =
    useState<boolean>(true);
  const [seoSitemapIncludeLegal, setSeoSitemapIncludeLegal] =
    useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(
    "system",
  );
  const [themeLight, setThemeLight] = useState<ThemePalette>({
    ...DEFAULT_THEME_LIGHT,
  });
  const [savedThemeLight, setSavedThemeLight] = useState<ThemePalette>({
    ...DEFAULT_THEME_LIGHT,
  });
  const [themeDark, setThemeDark] = useState<ThemePalette>({
    ...DEFAULT_THEME_DARK,
  });
  const [savedThemeDark, setSavedThemeDark] = useState<ThemePalette>({
    ...DEFAULT_THEME_DARK,
  });
  const [themeLightRedo, setThemeLightRedo] = useState<ThemePaletteDraft>({});
  const [themeDarkRedo, setThemeDarkRedo] = useState<ThemePaletteDraft>({});
  const [themePreviewVariant, setThemePreviewVariant] =
    useState<ThemeVariant>("light");
  const [themePresetTarget, setThemePresetTarget] =
    useState<ThemePresetTarget>("both");
  const themePresetTargetRef = useRef<ThemePresetTarget>("both");
  const [builtInThemePresetsExpanded, setBuiltInThemePresetsExpanded] =
    useState<boolean>(false);
  const [editingBuiltInThemePresetId, setEditingBuiltInThemePresetId] =
    useState<string | null>(null);
  const [customThemePresetsLoaded, setCustomThemePresetsLoaded] =
    useState<boolean>(false);
  const [customThemePresets, setCustomThemePresets] = useState<
    CustomThemePreset[]
  >([]);
  const [customThemePresetName, setCustomThemePresetName] =
    useState<string>("");
  const [customThemePresetDescription, setCustomThemePresetDescription] =
    useState<string>("");
  const [editingCustomThemePresetId, setEditingCustomThemePresetId] = useState<
    string | null
  >(null);
  const [themeHexInputs, setThemeHexInputs] = useState<ThemeHexDraftState>(
    () => ({
      light: { ...DEFAULT_THEME_LIGHT },
      dark: { ...DEFAULT_THEME_DARK },
    }),
  );

  const previousThemeCssVarsRef = useRef<Record<string, string | null> | null>(
    null,
  );

  const effectiveUiTheme: ThemeVariant =
    uiThemeMode === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : uiThemeMode;

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (loading) return;

    const root = document.documentElement;
    const palette = effectiveUiTheme === "dark" ? themeDark : themeLight;
    const vars: Record<string, string> = {
      "--background": palette.background,
      "--foreground": palette.foreground,
      "--primary": palette.primary,
      "--secondary": palette.secondary,
      "--error": palette.error,
      "--card": palette.card,
      "--border": palette.border,
      "--scroll-thumb": palette.scrollThumb,
      "--scroll-track": palette.scrollTrack,
      "--field-ok-bg": palette.fieldOkBg,
      "--field-ok-border": palette.fieldOkBorder,
      "--field-error-bg": palette.fieldErrorBg,
      "--field-error-border": palette.fieldErrorBorder,
    };

    if (!previousThemeCssVarsRef.current) {
      const previous: Record<string, string | null> = {};
      for (const key of Object.keys(vars)) {
        const prevInline = root.style.getPropertyValue(key);
        previous[key] = prevInline.length > 0 ? prevInline : null;
      }
      previousThemeCssVarsRef.current = previous;
    }

    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }

    return () => {
      const previous = previousThemeCssVarsRef.current;
      if (!previous) return;

      for (const [key, value] of Object.entries(previous)) {
        if (value === null) {
          root.style.removeProperty(key);
        } else {
          root.style.setProperty(key, value);
        }
      }
    };
  }, [
    effectiveUiTheme,
    loading,
    systemPrefersDark,
    themeDark,
    themeLight,
    uiThemeMode,
  ]);

  useEffect(() => {
    themePresetTargetRef.current = themePresetTarget;
  }, [themePresetTarget]);

  useEffect(() => {
    if (!editingBuiltInThemePresetId || builtInThemePresetsExpanded) {
      return;
    }
    const beePresets = THEME_PRESETS.filter((p) =>
      BEE_LMS_PRESET_IDS.has(p.id),
    );
    const otherPresets = [
      ...THEME_PRESETS.filter((p) => !BEE_LMS_PRESET_IDS.has(p.id)),
    ].sort((a, b) => {
      const hueA = hueFromHex(a.light.primary);
      const hueB = hueFromHex(b.light.primary);
      if (Number.isNaN(hueA) && Number.isNaN(hueB)) return 0;
      if (Number.isNaN(hueA)) return 1;
      if (Number.isNaN(hueB)) return -1;
      return hueA - hueB;
    });
    const visibleIds = new Set([
      ...beePresets.map((p) => p.id),
      ...otherPresets
        .slice(0, OTHER_THEME_PRESETS_PREVIEW_COUNT)
        .map((p) => p.id),
    ]);
    if (!visibleIds.has(editingBuiltInThemePresetId)) {
      setBuiltInThemePresetsExpanded(true);
    }
  }, [builtInThemePresetsExpanded, editingBuiltInThemePresetId]);

  const applyThemePreset = (preset: ThemePreset) => {
    setEditingCustomThemePresetId(null);
    setCustomThemePresetName("");
    setCustomThemePresetDescription("");
    setEditingBuiltInThemePresetId(null);
    const target = themePresetTargetRef.current;
    if (target === "light" || target === "both") {
      setThemeLight(cloneThemePalette(preset.light));
      setThemeLightRedo({});
      setThemeHexInputs((prev) => ({
        ...prev,
        light: { ...preset.light },
      }));
    }
    if (target === "dark" || target === "both") {
      setThemeDark(cloneThemePalette(preset.dark));
      setThemeDarkRedo({});
      setThemeHexInputs((prev) => ({
        ...prev,
        dark: { ...preset.dark },
      }));
    }
    if (target === "light") {
      setThemePreviewVariant("light");
    }
    if (target === "dark") {
      setThemePreviewVariant("dark");
    }
    setThemeNotice({
      type: "success",
      message: `Приложих пресет "${preset.name}" (${THEME_PRESET_TARGET_LABEL[target]}). Натисни Запази за да го запазиш.`,
    });
  };

  const applyCustomThemePreset = (preset: CustomThemePreset) => {
    setEditingBuiltInThemePresetId(null);
    const target = themePresetTargetRef.current;
    if (target === "light" || target === "both") {
      setThemeLight(cloneThemePalette(preset.light));
      setThemeLightRedo({});
      setThemeHexInputs((prev) => ({
        ...prev,
        light: { ...preset.light },
      }));
    }
    if (target === "dark" || target === "both") {
      setThemeDark(cloneThemePalette(preset.dark));
      setThemeDarkRedo({});
      setThemeHexInputs((prev) => ({
        ...prev,
        dark: { ...preset.dark },
      }));
    }
    if (target === "light") {
      setThemePreviewVariant("light");
    }
    if (target === "dark") {
      setThemePreviewVariant("dark");
    }
    setThemeNotice({
      type: "success",
      message: `Приложих custom пресет "${preset.name}" (${THEME_PRESET_TARGET_LABEL[target]}). Натисни Запази за да го запазиш.`,
    });
  };

  const handleEditBuiltInThemePreset = (preset: ThemePreset) => {
    setThemePresetTarget("both");
    themePresetTargetRef.current = "both";
    setThemePreviewVariant("light");
    setThemeLight(cloneThemePalette(preset.light));
    setThemeDark(cloneThemePalette(preset.dark));
    setThemeLightRedo({});
    setThemeDarkRedo({});
    setEditingBuiltInThemePresetId(preset.id);
    setThemeHexInputs((prev) => ({
      ...prev,
      light: { ...preset.light },
      dark: { ...preset.dark },
    }));
    setEditingCustomThemePresetId(null);
    setCustomThemePresetName(preset.name);
    setCustomThemePresetDescription(preset.description);
    setThemeNotice({
      type: "alert",
      message: BUILT_IN_PRESET_EDIT_ALERT_MESSAGE,
    });
  };

  const handleEditCustomThemePreset = (preset: CustomThemePreset) => {
    setThemePresetTarget("both");
    themePresetTargetRef.current = "both";
    setThemePreviewVariant("light");
    setThemeLight(cloneThemePalette(preset.light));
    setThemeDark(cloneThemePalette(preset.dark));
    setThemeLightRedo({});
    setThemeDarkRedo({});
    setEditingBuiltInThemePresetId(null);
    setThemeHexInputs((prev) => ({
      ...prev,
      light: { ...preset.light },
      dark: { ...preset.dark },
    }));
    setEditingCustomThemePresetId(preset.id);
    setCustomThemePresetName(preset.name);
    setCustomThemePresetDescription(preset.description ?? "");
    setThemeNotice({
      type: "success",
      message: `Редактираш custom preset "${preset.name}". Промени цветовете и натисни Save preset.`,
    });
  };

  const persistCustomThemePresets = async (
    next: CustomThemePreset[],
    successMessage: string,
  ) => {
    await persistBrandingField(
      {
        customThemePresets: next.length > 0 ? next : null,
      },
      successMessage,
      "theme",
    );
  };

  const handleCreateCustomThemePreset = async () => {
    const name = (customThemePresetName ?? "").trim();
    if (name.length < 2) {
      setThemeNotice({
        type: "error",
        message: "Име на пресета трябва да е поне 2 символа.",
      });
      return;
    }

    const description = (customThemePresetDescription ?? "").trim();
    const normalizedName = name.toLowerCase();
    const builtInNameClash = THEME_PRESETS.some(
      (p) => p.name.trim().toLowerCase() === normalizedName,
    );
    if (builtInNameClash) {
      setThemeNotice({
        type: "error",
        message: `Име "${name}" вече съществува като предефиниран preset. Избери различно име.`,
      });
      return;
    }
    const editingIndex = editingCustomThemePresetId
      ? customThemePresets.findIndex((p) => p.id === editingCustomThemePresetId)
      : -1;
    const existingIndexByName = customThemePresets.findIndex(
      (p) => p.name.trim().toLowerCase() === normalizedName,
    );

    if (editingIndex < 0 && existingIndexByName >= 0) {
      setThemeNotice({
        type: "error",
        message: `Име "${name}" вече е заето от custom preset. Избери различно име.`,
      });
      return;
    }

    if (
      editingIndex >= 0 &&
      existingIndexByName >= 0 &&
      existingIndexByName !== editingIndex
    ) {
      setThemeNotice({
        type: "error",
        message: `Име "${name}" вече е заето от друг custom preset. Избери различно име.`,
      });
      return;
    }

    const existingIndex = editingIndex;
    const existing =
      existingIndex >= 0 ? customThemePresets[existingIndex] : null;

    const id =
      editingCustomThemePresetId ??
      existing?.id ??
      (typeof crypto !== "undefined" &&
      typeof (crypto as unknown as { randomUUID?: () => string }).randomUUID ===
        "function"
        ? (crypto as unknown as { randomUUID: () => string }).randomUUID()
        : `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`);

    const nextPreset: CustomThemePreset = {
      id,
      name,
      ...(description ? { description } : {}),
      light: cloneThemePalette(themeLight),
      dark: cloneThemePalette(themeDark),
    };

    const nextList = [...customThemePresets];
    if (existingIndex >= 0) {
      nextList[existingIndex] = nextPreset;
    } else {
      nextList.unshift(nextPreset);
    }

    setThemeNotice(null);
    await persistCustomThemePresets(
      nextList,
      `Custom пресет "${name}" е запазен.`,
    );

    setEditingCustomThemePresetId(null);
  };

  const handleDeleteCustomThemePreset = async (preset: CustomThemePreset) => {
    const ok = window.confirm(
      `Сигурен ли си, че искаш да изтриеш custom пресет "${preset.name}"?`,
    );
    if (!ok) return;

    const nextList = customThemePresets.filter((p) => p.id !== preset.id);
    setThemeNotice(null);
    await persistCustomThemePresets(
      nextList,
      `Custom пресет "${preset.name}" е изтрит.`,
    );

    if (editingCustomThemePresetId === preset.id) {
      setEditingCustomThemePresetId(null);
    }
  };

  useEffect(() => {
    setThemeHexInputs((prev) => ({
      ...prev,
      light: { ...themeLight },
    }));
  }, [themeLight]);

  useEffect(() => {
    setThemeHexInputs((prev) => ({
      ...prev,
      dark: { ...themeDark },
    }));
  }, [themeDark]);

  const mergeThemePalette = (
    prev: Record<ThemeFieldKey, string>,
    incoming:
      | Partial<Record<ThemeFieldKey, string | null | undefined>>
      | null
      | undefined,
  ): Record<ThemeFieldKey, string> => {
    const next = { ...prev };
    for (const [key, value] of Object.entries(incoming ?? {})) {
      const typedKey = key as ThemeFieldKey;
      if (typeof value === "string" && THEME_FIELD_KEYS.includes(typedKey)) {
        next[typedKey] = value;
      }
    }
    return next;
  };
  const [cursorUrl, setCursorUrl] = useState<string>("");
  const [cursorLightUrl, setCursorLightUrl] = useState<string>("");
  const [cursorDarkUrl, setCursorDarkUrl] = useState<string>("");
  const [cursorPointerUrl, setCursorPointerUrl] = useState<string>("");
  const [cursorPointerLightUrl, setCursorPointerLightUrl] =
    useState<string>("");
  const [cursorPointerDarkUrl, setCursorPointerDarkUrl] = useState<string>("");
  const [
    loginSocialUnavailableMessageEnabled,
    setLoginSocialUnavailableMessageEnabled,
  ] = useState<boolean>(true);
  const [
    loginSocialResetPasswordHintEnabled,
    setLoginSocialResetPasswordHintEnabled,
  ] = useState<boolean>(true);
  const [
    registerSocialUnavailableMessageEnabled,
    setRegisterSocialUnavailableMessageEnabled,
  ] = useState<boolean>(true);
  const [poweredByBeeLmsEnabled, setPoweredByBeeLmsEnabled] =
    useState<boolean>(false);
  const [poweredByBeeLmsUrl, setPoweredByBeeLmsUrl] = useState<string>("");
  const [footerSocialLinks, setFooterSocialLinks] = useState<
    FooterSocialLink[]
  >(DEFAULT_FOOTER_SOCIAL_LINKS);
  const footerSocialIconInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFooterSocialIconUpload, setPendingFooterSocialIconUpload] =
    useState<{ id: string; variant: "light" | "dark" } | null>(null);
  const [cursorHotspotX, setCursorHotspotX] = useState<string>("");
  const [cursorHotspotY, setCursorHotspotY] = useState<string>("");
  const cursorFileInputRef = useRef<HTMLInputElement | null>(null);
  const cursorLightFileInputRef = useRef<HTMLInputElement | null>(null);
  const cursorDarkFileInputRef = useRef<HTMLInputElement | null>(null);
  const cursorPointerFileInputRef = useRef<HTMLInputElement | null>(null);
  const cursorPointerLightFileInputRef = useRef<HTMLInputElement | null>(null);
  const cursorPointerDarkFileInputRef = useRef<HTMLInputElement | null>(null);
  const [cursorHotspotTestPos, setCursorHotspotTestPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [cursorHotspotTestClickPos, setCursorHotspotTestClickPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const cursorHotspotPersistedRef = useRef<{ x: string; y: string } | null>(
    null,
  );
  const [cursorHotspotPersistStatus, setCursorHotspotPersistStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [socialDescription, setSocialDescription] = useState<string>("");
  const [socialImageUrl, setSocialImageUrl] = useState<string>("");
  const socialImageInputRef = useRef<HTMLInputElement | null>(null);
  const [openGraphTitle, setOpenGraphTitle] = useState<string>("");
  const [openGraphDescription, setOpenGraphDescription] = useState<string>("");
  const [openGraphImageUrl, setOpenGraphImageUrl] = useState<string>("");
  const openGraphImageInputRef = useRef<HTMLInputElement | null>(null);
  const [twitterTitle, setTwitterTitle] = useState<string>("");
  const [twitterDescription, setTwitterDescription] = useState<string>("");
  const [twitterImageUrl, setTwitterImageUrl] = useState<string>("");
  const twitterImageInputRef = useRef<HTMLInputElement | null>(null);
  const [twitterCard, setTwitterCard] = useState<string>("summary_large_image");
  const [twitterAppName, setTwitterAppName] = useState<string>("");
  const [twitterAppIdIphone, setTwitterAppIdIphone] = useState<string>("");
  const [twitterAppIdIpad, setTwitterAppIdIpad] = useState<string>("");
  const [twitterAppIdGooglePlay, setTwitterAppIdGooglePlay] =
    useState<string>("");
  const [twitterAppUrlIphone, setTwitterAppUrlIphone] = useState<string>("");
  const [twitterAppUrlIpad, setTwitterAppUrlIpad] = useState<string>("");
  const [twitterAppUrlGooglePlay, setTwitterAppUrlGooglePlay] =
    useState<string>("");
  const [twitterPlayerUrl, setTwitterPlayerUrl] = useState<string>("");
  const [twitterPlayerWidth, setTwitterPlayerWidth] = useState<string>("");
  const [twitterPlayerHeight, setTwitterPlayerHeight] = useState<string>("");
  const [twitterPlayerStream, setTwitterPlayerStream] = useState<string>("");
  const [twitterPlayerStreamContentType, setTwitterPlayerStreamContentType] =
    useState<string>("");
  const [uploadingSocialImagePurpose, setUploadingSocialImagePurpose] =
    useState<SocialImagePurpose | null>(null);
  const [previewOrigin, setPreviewOrigin] = useState<string>(
    "https://example.com",
  );
  const [showMetaTagsSnippet, setShowMetaTagsSnippet] =
    useState<boolean>(false);
  const previewOriginRef = useRef<string>(previewOrigin);
  const [socialMetadataLastSaved, setSocialMetadataLastSaved] =
    useState<SocialMetadataSnapshot | null>(null);
  const [metaFetchStatus, setMetaFetchStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [metaFetchMessage, setMetaFetchMessage] = useState<string | null>(null);

  useEffect(() => {
    previewOriginRef.current = previewOrigin;
  }, [previewOrigin]);
  const normalizedPreviewUrl = useMemo(() => {
    const trimmed = previewOrigin.trim();
    if (!trimmed) {
      return "https://example.com";
    }
    try {
      const parsed = new URL(trimmed);
      if (
        !parsed.protocol ||
        parsed.protocol === "http:" ||
        parsed.protocol === "https:"
      ) {
        return parsed.toString();
      }
      return `https://${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return "https://example.com";
    }
  }, [previewOrigin]);
  const previewDomain = useMemo(() => {
    try {
      return new URL(normalizedPreviewUrl).hostname;
    } catch {
      return "example.com";
    }
  }, [normalizedPreviewUrl]);
  const isUploadingOgImage = uploadingSocialImagePurpose === "open-graph";
  const isUploadingTwitterImage = uploadingSocialImagePurpose === "twitter";
  const isUploadingSharedImage = uploadingSocialImagePurpose === "shared";
  const normalizedAppName = useMemo(
    () => (appName ?? "").replace(/\s+/g, " ").trim(),
    [appName],
  );
  const appNameValidation = useMemo(() => {
    const raw = appName ?? "";
    if (APP_NAME_CONTROL_CHARS.test(raw)) {
      return "App name не може да съдържа нов ред или control символи.";
    }
    if (normalizedAppName.length === 0) {
      return "App name е задължителен.";
    }
    if (normalizedAppName.length < APP_NAME_MIN_LENGTH) {
      return `App name трябва да е поне ${APP_NAME_MIN_LENGTH} символа.`;
    }
    if (normalizedAppName.length > APP_NAME_MAX_LENGTH) {
      return `App name е ограничен до ${APP_NAME_MAX_LENGTH} символа, за да не чупи header-а.`;
    }
    if (!APP_NAME_HAS_ALPHANUMERIC.test(normalizedAppName)) {
      return "App name трябва да съдържа поне една буква или цифра.";
    }
    return null;
  }, [appName, normalizedAppName]);
  const appNameCharsUsed = appName?.length ?? 0;
  const baseTitle =
    (browserTitle.trim() || normalizedAppName || "").trim() || "BeeLMS";
  const baseDescription =
    socialDescription.trim().length > 0
      ? socialDescription.trim()
      : "Добави описание, за да изглежда добре при споделяне.";
  const ogPreviewTitle =
    openGraphTitle.trim().length > 0 ? openGraphTitle.trim() : baseTitle;
  const ogPreviewDescription =
    openGraphDescription.trim().length > 0
      ? openGraphDescription.trim()
      : baseDescription;
  const fallbackSocialImage =
    socialImageUrl.trim().length > 0 ? socialImageUrl.trim() : null;
  const ogPreviewImage =
    openGraphImageUrl.trim().length > 0
      ? openGraphImageUrl.trim()
      : fallbackSocialImage;
  const twitterPreviewTitle =
    twitterTitle.trim().length > 0 ? twitterTitle.trim() : ogPreviewTitle;
  const twitterPreviewDescription =
    twitterDescription.trim().length > 0
      ? twitterDescription.trim()
      : ogPreviewDescription;
  const twitterPreviewImage =
    twitterImageUrl.trim().length > 0
      ? twitterImageUrl.trim()
      : fallbackSocialImage;
  const ogSectionHasContent = Boolean(
    openGraphTitle.trim().length ||
    openGraphDescription.trim().length ||
    openGraphImageUrl.trim().length,
  );
  const normalizedTwitterCard = twitterCard.trim() || "summary_large_image";
  const twitterAppHasMinimum =
    twitterAppName.trim().length > 0 && twitterAppIdIphone.trim().length > 0;
  const twitterPlayerHasMinimum =
    twitterPlayerUrl.trim().length > 0 &&
    Number.isFinite(Number(twitterPlayerWidth.trim())) &&
    Number.isFinite(Number(twitterPlayerHeight.trim()));
  const twitterCardCountsAsContent =
    normalizedTwitterCard === "summary" ||
    (normalizedTwitterCard === "app" && twitterAppHasMinimum) ||
    (normalizedTwitterCard === "player" && twitterPlayerHasMinimum);
  const twitterSectionHasContent = Boolean(
    twitterTitle.trim().length ||
    twitterDescription.trim().length ||
    twitterImageUrl.trim().length ||
    twitterCardCountsAsContent,
  );

  const twitterPlayerWidthNumber = Number.isFinite(
    Number(twitterPlayerWidth.trim()),
  )
    ? Number(twitterPlayerWidth.trim())
    : null;
  const twitterPlayerHeightNumber = Number.isFinite(
    Number(twitterPlayerHeight.trim()),
  )
    ? Number(twitterPlayerHeight.trim())
    : null;

  const twitterAppNameMissing =
    twitterCard === "app" && twitterAppName.trim().length === 0;
  const twitterAppIdIphoneMissing =
    twitterCard === "app" && twitterAppIdIphone.trim().length === 0;
  const twitterPlayerUrlMissing =
    twitterCard === "player" && twitterPlayerUrl.trim().length === 0;
  const twitterPlayerWidthMissing =
    twitterCard === "player" &&
    (!Number.isFinite(Number(twitterPlayerWidth.trim())) ||
      Number(twitterPlayerWidth.trim()) <= 0);
  const twitterPlayerHeightMissing =
    twitterCard === "player" &&
    (!Number.isFinite(Number(twitterPlayerHeight.trim())) ||
      Number(twitterPlayerHeight.trim()) <= 0);

  const twitterAppMissingFields = useMemo(() => {
    const fields: string[] = [];
    if (twitterAppNameMissing) fields.push("App name");
    if (twitterAppIdIphoneMissing) fields.push("App ID (iPhone)");
    return fields;
  }, [twitterAppIdIphoneMissing, twitterAppNameMissing]);

  const twitterPlayerMissingFields = useMemo(() => {
    const fields: string[] = [];
    if (twitterPlayerUrlMissing) fields.push("Player URL");
    if (twitterPlayerWidthMissing)
      fields.push("Player width (положително число)");
    if (twitterPlayerHeightMissing)
      fields.push("Player height (положително число)");
    return fields;
  }, [
    twitterPlayerHeightMissing,
    twitterPlayerUrlMissing,
    twitterPlayerWidthMissing,
  ]);

  const socialInputClassOk =
    "mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";
  const socialInputClassError =
    "mt-2 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

  const escapeMetaValue = (value: string) => {
    return value
      .replace(/\r?\n/g, " ")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .trim();
  };

  const socialMetaTagsSnippet = useMemo(() => {
    const ogTitleOut = escapeMetaValue(ogPreviewTitle || "");
    const ogDescriptionOut = escapeMetaValue(ogPreviewDescription || "");
    const ogImageOut = ogPreviewImage ? escapeMetaValue(ogPreviewImage) : "";

    const twitterTitleOut = escapeMetaValue(twitterPreviewTitle || "");
    const twitterDescriptionOut = escapeMetaValue(
      twitterPreviewDescription || "",
    );
    const twitterImageOut = twitterPreviewImage
      ? escapeMetaValue(twitterPreviewImage)
      : "";

    const isSummary = normalizedTwitterCard === "summary";
    const isApp = normalizedTwitterCard === "app";
    const isPlayer = normalizedTwitterCard === "player";
    const effectiveTwitterCard = isSummary
      ? "summary"
      : isApp
        ? twitterAppHasMinimum
          ? "app"
          : "summary_large_image"
        : isPlayer
          ? twitterPlayerHasMinimum
            ? "player"
            : "summary_large_image"
          : "summary_large_image";

    const lines: string[] = [];
    if (ogTitleOut)
      lines.push(`<meta property="og:title" content="${ogTitleOut}" />`);
    if (ogDescriptionOut)
      lines.push(
        `<meta property="og:description" content="${ogDescriptionOut}" />`,
      );
    if (ogImageOut)
      lines.push(`<meta property="og:image" content="${ogImageOut}" />`);

    lines.push(
      `<meta name="twitter:card" content="${effectiveTwitterCard}" />`,
    );
    if (twitterTitleOut)
      lines.push(`<meta name="twitter:title" content="${twitterTitleOut}" />`);
    if (twitterDescriptionOut)
      lines.push(
        `<meta name="twitter:description" content="${twitterDescriptionOut}" />`,
      );
    if (twitterImageOut)
      lines.push(`<meta name="twitter:image" content="${twitterImageOut}" />`);

    if (effectiveTwitterCard === "app") {
      const appNameOut = escapeMetaValue(twitterAppName || "");
      const idIphoneOut = escapeMetaValue(twitterAppIdIphone || "");
      const idIpadOut = escapeMetaValue(twitterAppIdIpad || "");
      const idGooglePlayOut = escapeMetaValue(twitterAppIdGooglePlay || "");
      const urlIphoneOut = escapeMetaValue(twitterAppUrlIphone || "");
      const urlIpadOut = escapeMetaValue(twitterAppUrlIpad || "");
      const urlGooglePlayOut = escapeMetaValue(twitterAppUrlGooglePlay || "");

      if (appNameOut)
        lines.push(
          `<meta name="twitter:app:name:iphone" content="${appNameOut}" />`,
        );
      if (appNameOut)
        lines.push(
          `<meta name="twitter:app:name:ipad" content="${appNameOut}" />`,
        );
      if (appNameOut)
        lines.push(
          `<meta name="twitter:app:name:googleplay" content="${appNameOut}" />`,
        );
      if (idIphoneOut)
        lines.push(
          `<meta name="twitter:app:id:iphone" content="${idIphoneOut}" />`,
        );
      if (idIpadOut)
        lines.push(
          `<meta name="twitter:app:id:ipad" content="${idIpadOut}" />`,
        );
      if (idGooglePlayOut)
        lines.push(
          `<meta name="twitter:app:id:googleplay" content="${idGooglePlayOut}" />`,
        );
      if (urlIphoneOut)
        lines.push(
          `<meta name="twitter:app:url:iphone" content="${urlIphoneOut}" />`,
        );
      if (urlIpadOut)
        lines.push(
          `<meta name="twitter:app:url:ipad" content="${urlIpadOut}" />`,
        );
      if (urlGooglePlayOut)
        lines.push(
          `<meta name="twitter:app:url:googleplay" content="${urlGooglePlayOut}" />`,
        );
    }

    if (effectiveTwitterCard === "player") {
      const playerUrlOut = escapeMetaValue(twitterPlayerUrl || "");
      const playerStreamOut = escapeMetaValue(twitterPlayerStream || "");
      const playerStreamTypeOut = escapeMetaValue(
        twitterPlayerStreamContentType || "",
      );

      if (playerUrlOut)
        lines.push(`<meta name="twitter:player" content="${playerUrlOut}" />`);
      if (twitterPlayerWidthNumber)
        lines.push(
          `<meta name="twitter:player:width" content="${twitterPlayerWidthNumber}" />`,
        );
      if (twitterPlayerHeightNumber)
        lines.push(
          `<meta name="twitter:player:height" content="${twitterPlayerHeightNumber}" />`,
        );
      if (playerStreamOut)
        lines.push(
          `<meta name="twitter:player:stream" content="${playerStreamOut}" />`,
        );
      if (playerStreamTypeOut)
        lines.push(
          `<meta name="twitter:player:stream:content_type" content="${playerStreamTypeOut}" />`,
        );
    }

    return lines.join("\n");
  }, [
    normalizedTwitterCard,
    ogPreviewDescription,
    ogPreviewImage,
    ogPreviewTitle,
    twitterAppHasMinimum,
    twitterAppIdGooglePlay,
    twitterAppIdIpad,
    twitterAppIdIphone,
    twitterAppName,
    twitterAppUrlGooglePlay,
    twitterAppUrlIpad,
    twitterAppUrlIphone,
    twitterPlayerHasMinimum,
    twitterPlayerHeightNumber,
    twitterPlayerStream,
    twitterPlayerStreamContentType,
    twitterPlayerUrl,
    twitterPlayerWidthNumber,
    twitterPreviewDescription,
    twitterPreviewImage,
    twitterPreviewTitle,
  ]);

  const validatorLinks = useMemo(() => {
    const encoded = encodeURIComponent(normalizedPreviewUrl);
    return {
      facebook: `https://developers.facebook.com/tools/debug/?q=${encoded}`,
      linkedin: `https://www.linkedin.com/post-inspector/inspect/${encoded}`,
      twitter: `https://cards-dev.twitter.com/validator?url=${encoded}`,
    };
  }, [normalizedPreviewUrl]);

  const currentSocialMetadataSnapshot = useMemo<SocialMetadataSnapshot>(() => {
    return {
      browserTitle,
      socialImageUrl,
      socialDescription,
      openGraphTitle,
      openGraphDescription,
      openGraphImageUrl,
      twitterTitle,
      twitterDescription,
      twitterImageUrl,
      twitterCard,
      twitterAppName,
      twitterAppIdIphone,
      twitterAppIdIpad,
      twitterAppIdGooglePlay,
      twitterAppUrlIphone,
      twitterAppUrlIpad,
      twitterAppUrlGooglePlay,
      twitterPlayerUrl,
      twitterPlayerWidth,
      twitterPlayerHeight,
      twitterPlayerStream,
      twitterPlayerStreamContentType,
      previewOrigin,
    };
  }, [
    browserTitle,
    openGraphDescription,
    openGraphImageUrl,
    openGraphTitle,
    previewOrigin,
    socialDescription,
    socialImageUrl,
    twitterAppIdGooglePlay,
    twitterAppIdIpad,
    twitterAppIdIphone,
    twitterAppName,
    twitterAppUrlGooglePlay,
    twitterAppUrlIpad,
    twitterAppUrlIphone,
    twitterCard,
    twitterDescription,
    twitterImageUrl,
    twitterPlayerHeight,
    twitterPlayerStream,
    twitterPlayerStreamContentType,
    twitterPlayerUrl,
    twitterPlayerWidth,
    twitterTitle,
  ]);

  const socialMetadataSnapshotFromState = (): SocialMetadataSnapshot => {
    return {
      browserTitle,
      socialImageUrl,
      socialDescription,
      openGraphTitle,
      openGraphDescription,
      openGraphImageUrl,
      twitterTitle,
      twitterDescription,
      twitterImageUrl,
      twitterCard,
      twitterAppName,
      twitterAppIdIphone,
      twitterAppIdIpad,
      twitterAppIdGooglePlay,
      twitterAppUrlIphone,
      twitterAppUrlIpad,
      twitterAppUrlGooglePlay,
      twitterPlayerUrl,
      twitterPlayerWidth,
      twitterPlayerHeight,
      twitterPlayerStream,
      twitterPlayerStreamContentType,
      previewOrigin,
    };
  };

  const applySocialMetadataSnapshot = (snapshot: SocialMetadataSnapshot) => {
    setBrowserTitle(snapshot.browserTitle);
    setSocialImageUrl(snapshot.socialImageUrl);
    setSocialDescription(snapshot.socialDescription);
    setOpenGraphTitle(snapshot.openGraphTitle);
    setOpenGraphDescription(snapshot.openGraphDescription);
    setOpenGraphImageUrl(snapshot.openGraphImageUrl);
    setTwitterTitle(snapshot.twitterTitle);
    setTwitterDescription(snapshot.twitterDescription);
    setTwitterImageUrl(snapshot.twitterImageUrl);
    setTwitterCard(snapshot.twitterCard);
    setTwitterAppName(snapshot.twitterAppName);
    setTwitterAppIdIphone(snapshot.twitterAppIdIphone);
    setTwitterAppIdIpad(snapshot.twitterAppIdIpad);
    setTwitterAppIdGooglePlay(snapshot.twitterAppIdGooglePlay);
    setTwitterAppUrlIphone(snapshot.twitterAppUrlIphone);
    setTwitterAppUrlIpad(snapshot.twitterAppUrlIpad);
    setTwitterAppUrlGooglePlay(snapshot.twitterAppUrlGooglePlay);
    setTwitterPlayerUrl(snapshot.twitterPlayerUrl);
    setTwitterPlayerWidth(snapshot.twitterPlayerWidth);
    setTwitterPlayerHeight(snapshot.twitterPlayerHeight);
    setTwitterPlayerStream(snapshot.twitterPlayerStream);
    setTwitterPlayerStreamContentType(snapshot.twitterPlayerStreamContentType);
    setPreviewOrigin(snapshot.previewOrigin);
  };

  const isSocialMetadataDirty = useMemo(() => {
    if (!socialMetadataLastSaved) {
      return false;
    }
    return (
      JSON.stringify(currentSocialMetadataSnapshot) !==
      JSON.stringify(socialMetadataLastSaved)
    );
  }, [currentSocialMetadataSnapshot, socialMetadataLastSaved]);

  const handleUndoSocialMetadataChanges = () => {
    if (!socialMetadataLastSaved) {
      return;
    }
    applySocialMetadataSnapshot(socialMetadataLastSaved);
    setError(null);
    setSuccess(
      "Върнах промените в Browser & Social metadata. Натисни Save ако искаш да ги запазиш отново.",
    );
  };

  const handleFetchMetadataFromUrl = async () => {
    setError(null);
    setSuccess(null);
    setMetaFetchStatus("loading");
    setMetaFetchMessage(null);

    try {
      const url = normalizedPreviewUrl;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "text/html",
        },
      });

      if (!res.ok) {
        setMetaFetchStatus("error");
        setMetaFetchMessage(
          `HTTP ${res.status} · Неуспешно зареждане на HTML.`,
        );
        return;
      }

      const html = await res.text();
      if (typeof DOMParser === "undefined") {
        setMetaFetchStatus("error");
        setMetaFetchMessage("DOMParser не е наличен в този браузър контекст.");
        return;
      }

      const doc = new DOMParser().parseFromString(html, "text/html");
      const readMeta = (selector: string): string => {
        const el = doc.querySelector(selector) as HTMLMetaElement | null;
        const content = el?.getAttribute("content");
        return (content ?? "").trim();
      };

      const nextOgTitle = readMeta('meta[property="og:title"]');
      const nextOgDescription = readMeta('meta[property="og:description"]');
      const nextOgImage = readMeta('meta[property="og:image"]');

      const nextTwitterTitle = readMeta('meta[name="twitter:title"]');
      const nextTwitterDescription = readMeta(
        'meta[name="twitter:description"]',
      );
      const nextTwitterImage = readMeta('meta[name="twitter:image"]');
      const nextTwitterCard = readMeta('meta[name="twitter:card"]');

      if (nextOgTitle) setOpenGraphTitle(nextOgTitle);
      if (nextOgDescription) setOpenGraphDescription(nextOgDescription);
      if (nextOgImage) setOpenGraphImageUrl(nextOgImage);
      if (nextTwitterTitle) setTwitterTitle(nextTwitterTitle);
      if (nextTwitterDescription) setTwitterDescription(nextTwitterDescription);
      if (nextTwitterImage) setTwitterImageUrl(nextTwitterImage);
      if (nextTwitterCard) setTwitterCard(nextTwitterCard);

      if (!browserTitle.trim()) {
        const docTitle = (doc.querySelector("title")?.textContent ?? "").trim();
        if (docTitle) {
          setBrowserTitle(docTitle);
        }
      }

      const foundAny =
        nextOgTitle ||
        nextOgDescription ||
        nextOgImage ||
        nextTwitterTitle ||
        nextTwitterDescription ||
        nextTwitterImage ||
        nextTwitterCard;

      setMetaFetchStatus("success");
      setMetaFetchMessage(
        foundAny
          ? "Изтеглих meta tags от URL. Провери стойностите и натисни Save."
          : "URL се зареди, но не намерих OG/Twitter meta tags в HTML.",
      );
    } catch (err) {
      setMetaFetchStatus("error");
      setMetaFetchMessage(
        err instanceof TypeError
          ? "Неуспешно fetch-ване на URL (вероятно CORS блокировка). Опитай с друг URL или използвай backend proxy."
          : err instanceof Error
            ? err.message
            : "Неуспешно fetch-ване на URL.",
      );
    }
  };

  const handleBrandingFontFileSelectedForLang: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const langCode = (pendingFontLang ?? "").trim().toLowerCase();
    if (!langCode) {
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (fontUrlByLang?.[langCode] ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings/branding/font`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на font файла.";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на font файла.");
        return;
      }

      setFontUrlByLang((prev) =>
        upsertStringDictionary(prev, langCode, data.url),
      );
      await persistBrandingField(
        { fontUrlByLang: { [langCode]: data.url } },
        `Font (${langCode}) файлът е качен и запазен. Refesh-ни страницата за да се приложи навсякъде.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Неуспешно качване на font файла.",
      );
    } finally {
      setPendingFontLang("");
    }
  };

  const handleBrandingFontLicenseFileSelectedForLang: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const langCode = (pendingFontLicenseLang ?? "").trim().toLowerCase();
    if (!langCode) {
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (fontLicenseUrlByLang?.[langCode] ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/font-license`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на license файла.";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на license файла.");
        return;
      }

      setFontLicenseUrlByLang((prev) =>
        upsertStringDictionary(prev, langCode, data.url),
      );
      await persistBrandingField(
        { fontLicenseUrlByLang: { [langCode]: data.url } },
        `License (${langCode}) файлът е качен и запазен.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на license файла.",
      );
    } finally {
      setPendingFontLicenseLang("");
    }
  };

  const handleCursorLightFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (cursorLightUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/cursor-light`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        const payload = (await res.json()) as { message?: string };
        setError(payload?.message ?? "Неуспешно качване на cursor файла.");
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на cursor файла.");
        return;
      }

      setCursorLightUrl(data.url);
      await persistBrandingField(
        { cursorLightUrl: data.url },
        "Cursor (light) файлът е качен и запазен. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на cursor файла.",
      );
    }
  };

  const handleCursorDarkFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (cursorDarkUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/cursor-dark`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        const payload = (await res.json()) as { message?: string };
        setError(payload?.message ?? "Неуспешно качване на cursor файла.");
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на cursor файла.");
        return;
      }

      setCursorDarkUrl(data.url);
      await persistBrandingField(
        { cursorDarkUrl: data.url },
        "Cursor (dark) файлът е качен и запазен. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на cursor файла.",
      );
    }
  };

  const handleCursorPointerFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (cursorPointerUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/cursor-pointer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        const payload = (await res.json()) as { message?: string };
        setError(payload?.message ?? "Неуспешно качване на cursor файла.");
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на cursor файла.");
        return;
      }

      setCursorPointerUrl(data.url);
      await persistBrandingField(
        { cursorPointerUrl: data.url },
        "Hover cursor файлът е качен и запазен. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на cursor файла.",
      );
    }
  };

  const handleCursorPointerLightFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (cursorPointerLightUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/cursor-pointer-light`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        const payload = (await res.json()) as { message?: string };
        setError(payload?.message ?? "Неуспешно качване на cursor файла.");
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на cursor файла.");
        return;
      }

      setCursorPointerLightUrl(data.url);
      await persistBrandingField(
        { cursorPointerLightUrl: data.url },
        "Hover cursor (light) файлът е качен и запазен. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на cursor файла.",
      );
    }
  };

  const handleCursorPointerDarkFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (cursorPointerDarkUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/cursor-pointer-dark`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        const payload = (await res.json()) as { message?: string };
        setError(payload?.message ?? "Неуспешно качване на cursor файла.");
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на cursor файла.");
        return;
      }

      setCursorPointerDarkUrl(data.url);
      await persistBrandingField(
        { cursorPointerDarkUrl: data.url },
        "Hover cursor (dark) файлът е качен и запазен. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на cursor файла.",
      );
    }
  };

  const handleBrandingFaviconUploadClick = () => {
    if (faviconFileInputRef.current) {
      faviconFileInputRef.current.value = "";
      faviconFileInputRef.current.click();
    }
  };

  const handleBrandingLogoUploadClick = () => {
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = "";
      logoFileInputRef.current.click();
    }
  };

  const handleBrandingLogoLightUploadClick = () => {
    if (logoLightFileInputRef.current) {
      logoLightFileInputRef.current.value = "";
      logoLightFileInputRef.current.click();
    }
  };

  const handleBrandingLogoDarkUploadClick = () => {
    if (logoDarkFileInputRef.current) {
      logoDarkFileInputRef.current.value = "";
      logoDarkFileInputRef.current.click();
    }
  };

  const handleBrandingFontUploadClick = () => {
    if (fontFileInputRef.current) {
      fontFileInputRef.current.value = "";
      fontFileInputRef.current.click();
    }
  };

  const handleBrandingFontLicenseUploadClick = () => {
    if (fontLicenseFileInputRef.current) {
      fontLicenseFileInputRef.current.value = "";
      fontLicenseFileInputRef.current.click();
    }
  };

  const handleBrandingFontUploadClickForLang = (langCode: string) => {
    if (perLangFontFileInputRef.current) {
      perLangFontFileInputRef.current.value = "";
      setPendingFontLang(langCode);
      perLangFontFileInputRef.current.click();
    }
  };

  const handleBrandingFontLicenseUploadClickForLang = (langCode: string) => {
    if (perLangFontLicenseFileInputRef.current) {
      perLangFontLicenseFileInputRef.current.value = "";
      setPendingFontLicenseLang(langCode);
      perLangFontLicenseFileInputRef.current.click();
    }
  };

  const persistBrandingField = async (
    patch: Record<string, unknown>,
    successMessage: string,
    noticeScope: "global" | "theme" = "global",
  ) => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    if (noticeScope === "theme") {
      setThemeNotice(null);
    } else {
      setError(null);
      setSuccess(null);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: "PATCH",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branding: patch,
        }),
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        const payload = (await res.json()) as { message?: string };
        setError(
          payload?.message ?? "Неуспешно запазване на branding настройките.",
        );
        return;
      }

      const updated = (await res.json()) as AdminSettingsResponse;
      setFaviconUrl(updated.branding?.faviconUrl ?? "");
      setGoogleFont(updated.branding?.googleFont ?? "");
      setGoogleFontByLang(
        sanitizeStringDictionary(updated.branding?.googleFontByLang),
      );
      setFontUrl(updated.branding?.fontUrl ?? "");
      setFontUrlByLang(
        sanitizeStringDictionary(updated.branding?.fontUrlByLang),
      );
      setLoginSocialUnavailableMessageEnabled(
        updated.branding?.loginSocialUnavailableMessageEnabled !== false,
      );
      setLoginSocialResetPasswordHintEnabled(
        updated.branding?.loginSocialResetPasswordHintEnabled !== false,
      );
      setRegisterSocialUnavailableMessageEnabled(
        updated.branding?.registerSocialUnavailableMessageEnabled !== false,
      );
      setCustomThemePresets(
        sanitizeCustomThemePresets(updated.branding?.customThemePresets),
      );
      setCustomThemePresetsLoaded(true);
      setLogoUrl(updated.branding?.logoUrl ?? "");
      setLogoLightUrl(updated.branding?.logoLightUrl ?? "");
      setLogoDarkUrl(updated.branding?.logoDarkUrl ?? "");
      setFooterSocialLinks(
        sanitizeFooterSocialLinks(updated.branding?.footerSocialLinks ?? null),
      );
      setSocialLoginIcons(
        updated.branding?.socialLoginIcons &&
          typeof updated.branding.socialLoginIcons === "object"
          ? (updated.branding.socialLoginIcons as never)
          : {},
      );
      {
        const modeRaw = updated.branding?.theme?.mode ?? "system";
        const mode =
          modeRaw === "light" || modeRaw === "dark" || modeRaw === "system"
            ? modeRaw
            : "system";
        setThemeMode(mode);
        setThemeLight((prev) => {
          const next = mergeThemePalette(prev, updated.branding?.theme?.light);
          setSavedThemeLight(next);
          setThemeLightRedo({});
          setThemeHexInputs((draftPrev) => ({
            ...draftPrev,
            light: { ...next },
          }));
          return next;
        });
        setThemeDark((prev) => {
          const next = mergeThemePalette(prev, updated.branding?.theme?.dark);
          setSavedThemeDark(next);
          setThemeDarkRedo({});
          setThemeHexInputs((draftPrev) => ({
            ...draftPrev,
            dark: { ...next },
          }));
          return next;
        });
      }
      setCursorUrl(updated.branding?.cursorUrl ?? "");
      setCursorLightUrl(updated.branding?.cursorLightUrl ?? "");
      setCursorDarkUrl(updated.branding?.cursorDarkUrl ?? "");
      setCursorPointerUrl(updated.branding?.cursorPointerUrl ?? "");
      setCursorPointerLightUrl(updated.branding?.cursorPointerLightUrl ?? "");
      setCursorPointerDarkUrl(updated.branding?.cursorPointerDarkUrl ?? "");
      setFooterSocialLinks(
        sanitizeFooterSocialLinks(updated.branding?.footerSocialLinks ?? null),
      );
      setCursorHotspotX(
        typeof updated.branding?.cursorHotspot?.x === "number"
          ? String(updated.branding.cursorHotspot.x)
          : "",
      );
      setCursorHotspotY(
        typeof updated.branding?.cursorHotspot?.y === "number"
          ? String(updated.branding.cursorHotspot.y)
          : "",
      );
      cursorHotspotPersistedRef.current = {
        x:
          typeof updated.branding?.cursorHotspot?.x === "number"
            ? String(updated.branding.cursorHotspot.x)
            : "",
        y:
          typeof updated.branding?.cursorHotspot?.y === "number"
            ? String(updated.branding.cursorHotspot.y)
            : "",
      };
      if (noticeScope === "theme") {
        setThemeNotice({ type: "success", message: successMessage });
      } else {
        setSuccess(successMessage);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Неуспешно запазване на branding.";
      if (noticeScope === "theme") {
        setThemeNotice({ type: "error", message });
      } else {
        setError(message);
      }
    }
  };

  const handleBrandingFaviconFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (faviconUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/favicon`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на favicon.";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на favicon.");
        return;
      }

      setFaviconUrl(data.url);
      await persistBrandingField(
        { faviconUrl: data.url },
        "Favicon е качен и запазен. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Неуспешно качване на favicon.",
      );
    }
  };

  const handleBrandingLogoFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (logoUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings/branding/logo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на logo.";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на logo.");
        return;
      }

      setLogoUrl(data.url);
      await persistBrandingField(
        { logoUrl: data.url },
        "Logo е качено и запазено. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Неуспешно качване на logo.",
      );
    }
  };

  const handleBrandingLogoLightFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (logoLightUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/logo-light`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на logo (light).";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на logo (light). ");
        return;
      }

      setLogoLightUrl(data.url);
      await persistBrandingField(
        { logoLightUrl: data.url },
        "Logo (light) е качено и запазено. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на logo (light).",
      );
    }
  };

  const handleBrandingLogoDarkFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (logoDarkUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/logo-dark`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на logo (dark).";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на logo (dark). ");
        return;
      }

      setLogoDarkUrl(data.url);
      await persistBrandingField(
        { logoDarkUrl: data.url },
        "Logo (dark) е качено и запазено. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на logo (dark).",
      );
    }
  };

  const handleBrandingFontFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (fontUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings/branding/font`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на font файла.";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на font файла.");
        return;
      }

      setFontUrl(data.url);
      await persistBrandingField(
        { fontUrl: data.url },
        "Font файлът е качен и запазен. Refesh-ни страницата за да се приложи навсякъде.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Неуспешно качване на font файла.",
      );
    }
  };

  const handleBrandingFontLicenseFileSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const previousUrl = (fontLicenseUrl ?? "").trim();
    const formData = new FormData();
    formData.append("file", files[0]);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/font-license`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на license файла.";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на license файла.");
        return;
      }

      setFontLicenseUrl(data.url);
      await persistBrandingField(
        { fontLicenseUrl: data.url },
        "License файлът е качен и запазен.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на license файла.",
      );
    }
  };
  const metadataSectionAccent = (filled: boolean) =>
    filled ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50";

  const [wiki, setWiki] = useState<boolean>(true);
  const [wikiPublic, setWikiPublic] = useState<boolean>(true);
  const [courses, setCourses] = useState<boolean>(true);
  const [coursesPublic, setCoursesPublic] = useState(true);
  const [myCourses, setMyCourses] = useState(true);
  const [profile, setProfile] = useState(true);
  const [accessibilityWidget, setAccessibilityWidget] = useState(true);
  const [seoEnabled, setSeoEnabled] = useState(true);
  const [themeLightEnabled, setThemeLightEnabled] = useState(true);
  const [themeDarkEnabled, setThemeDarkEnabled] = useState(true);
  const [themeModeSelectorEnabled, setThemeModeSelectorEnabled] =
    useState(true);
  const [auth, setAuth] = useState(true);
  const [authLogin, setAuthLogin] = useState(true);
  const [authRegister, setAuthRegister] = useState(true);
  const [auth2fa, setAuth2fa] = useState(false);
  const [captcha, setCaptcha] = useState(false);
  const [captchaLogin, setCaptchaLogin] = useState<boolean>(false);
  const [captchaRegister, setCaptchaRegister] = useState<boolean>(false);
  const [captchaForgotPassword, setCaptchaForgotPassword] =
    useState<boolean>(false);
  const [captchaChangePassword, setCaptchaChangePassword] =
    useState<boolean>(false);
  const [paidCourses, setPaidCourses] = useState<boolean>(true);
  const [socialGoogle, setSocialGoogle] = useState<boolean>(true);
  const [socialFacebook, setSocialFacebook] = useState<boolean>(true);
  const [socialGithub, setSocialGithub] = useState<boolean>(true);
  const [socialLinkedin, setSocialLinkedin] = useState<boolean>(true);
  const [infraRedis, setInfraRedis] = useState<boolean>(false);
  const [infraRedisUrl, setInfraRedisUrl] = useState<string>("");
  const [infraRabbitmq, setInfraRabbitmq] = useState<boolean>(false);
  const [infraRabbitmqUrl, setInfraRabbitmqUrl] = useState<string>("");
  const [infraMonitoring, setInfraMonitoring] = useState<boolean>(true);
  const [infraMonitoringUrl, setInfraMonitoringUrl] = useState<string>("");
  const [infraErrorTracking, setInfraErrorTracking] = useState<boolean>(false);
  const [infraErrorTrackingUrl, setInfraErrorTrackingUrl] =
    useState<string>("");

  const infraMonitoringUrlRef = useRef<HTMLInputElement | null>(null);
  const infraRedisUrlRef = useRef<HTMLInputElement | null>(null);
  const infraRabbitmqUrlRef = useRef<HTMLInputElement | null>(null);
  const infraErrorTrackingUrlRef = useRef<HTMLInputElement | null>(null);

  const poweredByBeeLmsUrlRef = useRef<HTMLInputElement | null>(null);
  const footerSocialUrlRefs = useRef<Record<string, HTMLInputElement | null>>(
    {},
  );

  const [infraToggleErrors, setInfraToggleErrors] = useState<
    Partial<
      Record<
        | "infraMonitoring"
        | "infraRedis"
        | "infraRabbitmq"
        | "infraErrorTracking",
        string
      >
    >
  >({});
  const [poweredByBeeLmsToggleError, setPoweredByBeeLmsToggleError] = useState<
    string | null
  >(null);
  const [footerSocialToggleErrors, setFooterSocialToggleErrors] = useState<
    Record<string, string | null>
  >({});

  const focusAndScroll = (el: HTMLElement | null) => {
    if (!el) return;
    el.focus();
    el.scrollIntoView({ block: "center" });
  };

  const handleToggleInfra = (
    key:
      | "infraMonitoring"
      | "infraRedis"
      | "infraRabbitmq"
      | "infraErrorTracking",
    next: boolean,
  ) => {
    if (!next) {
      setInfraToggleErrors((prev) => ({ ...prev, [key]: "" }));
      if (key === "infraMonitoring") setInfraMonitoring(false);
      if (key === "infraRedis") setInfraRedis(false);
      if (key === "infraRabbitmq") setInfraRabbitmq(false);
      if (key === "infraErrorTracking") setInfraErrorTracking(false);
      return;
    }

    if (key === "infraMonitoring") {
      const v = infraMonitoringUrl.trim();
      if (!isValidHttpUrl(v)) {
        const msg = "За да включиш Monitoring, въведи валиден http/https URL.";
        setInfraToggleErrors((prev) => ({ ...prev, infraMonitoring: msg }));
        setError(msg);
        focusAndScroll(infraMonitoringUrlRef.current);
        return;
      }
      setInfraToggleErrors((prev) => ({ ...prev, infraMonitoring: "" }));
      setInfraMonitoring(true);
      return;
    }

    if (key === "infraRedis") {
      const v = infraRedisUrl.trim();
      if (!isValidInfraRedisUrl(v)) {
        const msg =
          "За да включиш Redis, въведи redis://... или host:port (напр. localhost:6379).";
        setInfraToggleErrors((prev) => ({ ...prev, infraRedis: msg }));
        setError(msg);
        focusAndScroll(infraRedisUrlRef.current);
        return;
      }
      setInfraToggleErrors((prev) => ({ ...prev, infraRedis: "" }));
      setInfraRedis(true);
      return;
    }

    if (key === "infraRabbitmq") {
      const v = infraRabbitmqUrl.trim();
      if (!isValidInfraRabbitmqUrl(v)) {
        const msg =
          "За да включиш RabbitMQ, въведи валиден amqp/amqps URL (напр. amqp://localhost:5672).";
        setInfraToggleErrors((prev) => ({ ...prev, infraRabbitmq: msg }));
        setError(msg);
        focusAndScroll(infraRabbitmqUrlRef.current);
        return;
      }
      setInfraToggleErrors((prev) => ({ ...prev, infraRabbitmq: "" }));
      setInfraRabbitmq(true);
      return;
    }

    const v = infraErrorTrackingUrl.trim();
    if (!isValidHttpUrl(v)) {
      const msg =
        "За да включиш Error tracking, въведи валиден http/https URL.";
      setInfraToggleErrors((prev) => ({ ...prev, infraErrorTracking: msg }));
      setError(msg);
      focusAndScroll(infraErrorTrackingUrlRef.current);
      return;
    }
    setInfraToggleErrors((prev) => ({ ...prev, infraErrorTracking: "" }));
    setInfraErrorTracking(true);
  };

  const handleTogglePoweredByBeeLms = (next: boolean) => {
    if (!next) {
      setPoweredByBeeLmsToggleError(null);
      setPoweredByBeeLmsEnabled(false);
      return;
    }

    const trimmed = poweredByBeeLmsUrl.trim();
    if (trimmed.length > 0 && !isValidOptionalHttpUrl(trimmed)) {
      const msg =
        "За да включиш Powered by BeeLMS с URL, въведи валиден http/https адрес (или изчисти URL полето).";
      setPoweredByBeeLmsToggleError(msg);
      setError(msg);
      focusAndScroll(poweredByBeeLmsUrlRef.current);
      return;
    }
    setPoweredByBeeLmsToggleError(null);
    setPoweredByBeeLmsEnabled(true);
  };

  const handleToggleFooterSocialLink = (id: string, next: boolean) => {
    const current = footerSocialLinks.find((l) => l.id === id);
    if (!current) return;

    if (!next) {
      setFooterSocialToggleErrors((prev) => ({ ...prev, [id]: null }));
      setFooterSocialLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, enabled: false } : l)),
      );
      return;
    }

    const url = (current.url ?? "").trim();
    if (!url) {
      const msg =
        "За да активираш този линк, попълни URL (например https://...).";
      setFooterSocialToggleErrors((prev) => ({ ...prev, [id]: msg }));
      setError(msg);
      focusAndScroll(footerSocialUrlRefs.current[id] ?? null);
      return;
    }

    if (!isValidFooterSocialUrl(current.type, url)) {
      const msg = footerSocialUrlErrorMessage(current.type);
      setFooterSocialToggleErrors((prev) => ({ ...prev, [id]: msg }));
      setError(msg);
      focusAndScroll(footerSocialUrlRefs.current[id] ?? null);
      return;
    }

    setFooterSocialToggleErrors((prev) => ({ ...prev, [id]: null }));
    setFooterSocialLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: true } : l)),
    );
  };

  const [socialStatuses, setSocialStatuses] = useState<SocialProviderStatuses>(
    buildSocialStatuses(null),
  );

  const handleUseCurrentOrigin = () => {
    if (typeof window === "undefined") {
      return;
    }
    setPreviewOrigin(window.location.origin);
  };

  const handleUseLocalhostPreview = () => {
    setPreviewOrigin("http://localhost:3001/");
  };

  const copyToClipboardFallback = (text: string) => {
    if (typeof document === "undefined") {
      throw new Error("Clipboard unavailable");
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  const handleCopyMetaTags = async () => {
    setError(null);
    setSuccess(null);
    try {
      const payload = socialMetaTagsSnippet.trim();
      if (!payload) {
        setError("Няма meta tags за копиране.");
        return;
      }

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        copyToClipboardFallback(payload);
      }
      setSuccess("Meta tags са копирани в clipboard.");
    } catch {
      setError("Неуспешно копиране в clipboard.");
    }
  };

  const handleResetSocialMetadata = () => {
    const ok = window.confirm(
      "Reset social metadata? Това ще изчисти полетата за споделяне (shared/OG/Twitter).",
    );
    if (!ok) return;

    setBrowserTitle("");
    setSocialImageUrl("");
    setSocialDescription("");
    setOpenGraphTitle("");
    setOpenGraphDescription("");
    setOpenGraphImageUrl("");
    setTwitterTitle("");
    setTwitterDescription("");
    setTwitterImageUrl("");
    setTwitterCard("summary_large_image");

    setTwitterAppName("");
    setTwitterAppIdIphone("");
    setTwitterAppIdIpad("");
    setTwitterAppIdGooglePlay("");
    setTwitterAppUrlIphone("");
    setTwitterAppUrlIpad("");
    setTwitterAppUrlGooglePlay("");

    setTwitterPlayerUrl("");
    setTwitterPlayerWidth("");
    setTwitterPlayerHeight("");
    setTwitterPlayerStream("");
    setTwitterPlayerStreamContentType("");

    setPreviewOrigin("https://example.com");
    setError(null);
    setSuccess(
      "Social metadata полетата са нулирани. Натисни Save за да влезе в сила.",
    );
  };
  const [socialCredentialForms, setSocialCredentialForms] = useState<
    Record<SocialProvider, SocialCredentialFormState>
  >(() => buildSocialCredentialState());
  const [socialCredentialsDirty, setSocialCredentialsDirty] = useState(false);
  const [socialLoginIcons, setSocialLoginIcons] = useState<
    Partial<Record<SocialProvider, SocialLoginIconConfig>>
  >({});
  const socialLoginIconInputRef = useRef<HTMLInputElement | null>(null);
  const socialClientIdRefs = useRef<Record<string, HTMLInputElement | null>>(
    {},
  );
  const socialRedirectUriRefs = useRef<Record<string, HTMLInputElement | null>>(
    {},
  );
  const socialClientSecretRefs = useRef<
    Record<string, HTMLInputElement | null>
  >({});
  const [pendingSocialLoginIconUpload, setPendingSocialLoginIconUpload] =
    useState<{ provider: SocialProvider; variant: "light" | "dark" } | null>(
      null,
    );
  const [socialFieldErrors, setSocialFieldErrors] = useState<
    Record<SocialProvider, SocialFieldErrors>
  >(() => buildSocialFieldErrors());
  const [socialTestStates, setSocialTestStates] = useState<
    Record<SocialProvider, SocialTestState>
  >(() => buildSocialTestStates());

  const socialFeatureStates = useMemo(
    () => ({
      google: socialGoogle,
      facebook: socialFacebook,
      github: socialGithub,
      linkedin: socialLinkedin,
    }),
    [socialGoogle, socialFacebook, socialGithub, socialLinkedin],
  );

  const socialFeatureSetters: Record<SocialProvider, (value: boolean) => void> =
    {
      google: setSocialGoogle,
      facebook: setSocialFacebook,
      github: setSocialGithub,
      linkedin: setSocialLinkedin,
    };

  const socialInlineWarnings = useMemo(() => {
    return SOCIAL_PROVIDERS.reduce(
      (acc, provider) => {
        const warnings: string[] = [];
        const enabled = socialFeatureStates[provider];
        const configured = socialStatuses?.[provider]?.configured ?? false;
        if (!enabled) {
          acc[provider] = warnings;
          return acc;
        }

        // Ако backend казва, че доставчикът е configured (env или stored creds),
        // не показваме предупреждения за липсващи полета във формата.
        if (configured) {
          acc[provider] = warnings;
          return acc;
        }

        const form = socialCredentialForms[provider];
        const label = SOCIAL_PROVIDER_LABELS[provider];
        const clientId = form.clientId.trim();
        const redirectUri = form.redirectUri.trim();
        const hasNewSecret = form.clientSecretInput.trim().length > 0;
        const hasStoredSecret = form.hasClientSecret && !form.clearSecret;

        if (!clientId) {
          warnings.push(`Попълни Client ID за ${label}, за да остане активен.`);
        }

        if (!redirectUri) {
          warnings.push(
            `Попълни Redirect URL за ${label}, за да остане активен.`,
          );
        }

        if (form.clearSecret) {
          warnings.push(
            `Активиран доставчик не може да има изтрит secret. Въведи нов secret или изключи ${label}.`,
          );
        } else if (!hasNewSecret && !hasStoredSecret) {
          warnings.push(
            `Добави Client secret за ${label}, за да работи OAuth потока.`,
          );
        }

        acc[provider] = warnings;
        return acc;
      },
      {} as Record<SocialProvider, string[]>,
    );
  }, [socialCredentialForms, socialFeatureStates, socialStatuses]);

  const clearSocialFieldError = (
    provider: SocialProvider,
    field: SocialFieldKey,
  ) => {
    setSocialFieldErrors((prev) => {
      const current = prev[provider];
      if (!current?.[field]) {
        return prev;
      }
      return {
        ...prev,
        [provider]: {
          ...current,
          [field]: undefined,
        },
      };
    });
  };

  const setSocialFieldError = (
    provider: SocialProvider,
    field: SocialFieldKey,
    message: string,
  ) => {
    setSocialFieldErrors((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: message,
      },
    }));
  };

  const validateRedirectUri = (provider: SocialProvider, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      clearSocialFieldError(provider, "redirectUri");
      return true;
    }
    if (!isValidRedirectUrl(trimmed)) {
      setSocialFieldError(
        provider,
        "redirectUri",
        "Въведи валиден URL (започва с https:// или http://).",
      );
      return false;
    }
    clearSocialFieldError(provider, "redirectUri");
    return true;
  };

  const confirmDeleteStoredSecret = (provider: SocialProvider) => {
    const label = SOCIAL_PROVIDER_LABELS[provider];
    const confirmed = window.confirm(
      `Сигурен ли си, че искаш да изтриеш съхранения secret за ${label}? Това действие е необратимо и влиза в сила при запазване.`,
    );
    if (!confirmed) {
      return;
    }
    setSocialCredentialsDirty(true);
    setSocialCredentialForms((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        clearSecret: true,
        clientSecretInput: "",
      },
    }));
    clearSocialFieldError(provider, "clientSecret");
  };

  const cancelSecretDeletion = (provider: SocialProvider) => {
    setSocialCredentialsDirty(true);
    setSocialCredentialForms((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        clearSecret: false,
      },
    }));
  };

  const handleResetProviderFields = (provider: SocialProvider) => {
    const label = SOCIAL_PROVIDER_LABELS[provider];
    const confirmed = window.confirm(
      `Ще изтриеш всички OAuth стойности (Client ID, Redirect URL, secret, бележки) за ${label}. Това действие е необратимо и влиза в сила при запазване. Продължаваш ли?`,
    );
    if (!confirmed) {
      return;
    }
    setSocialCredentialsDirty(true);
    setSocialCredentialForms((prev) => {
      const current = prev[provider];
      const shouldClearSecret = current.hasClientSecret
        ? true
        : current.clearSecret;
      return {
        ...prev,
        [provider]: {
          ...current,
          clientId: "",
          redirectUri: "",
          clientSecretInput: "",
          notes: "",
          clearSecret: shouldClearSecret,
        },
      };
    });
    clearSocialFieldError(provider, "clientId");
    clearSocialFieldError(provider, "redirectUri");
    clearSocialFieldError(provider, "clientSecret");
  };

  const handleTestConnection = async (provider: SocialProvider) => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setSocialTestStates((prev) => ({
      ...prev,
      [provider]: {
        status: "loading",
        message: "Тествам връзката...",
        details: null,
        errorDetails: null,
      },
    }));

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/social/${provider}/test`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        const raw = await res.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = null;
        }
        const payload = parsed as {
          message?: string;
          details?: unknown;
        } | null;
        const message =
          payload?.message ?? `HTTP ${res.status} · неуспешен тест`;
        const detailSource =
          payload?.details ?? payload ?? (raw.length ? raw : null);
        const detailString =
          typeof detailSource === "string"
            ? detailSource
            : detailSource
              ? JSON.stringify(detailSource, null, 2)
              : null;

        setSocialTestStates((prev) => ({
          ...prev,
          [provider]: {
            status: "error",
            message,
            details: null,
            errorDetails: detailString,
          },
        }));
        return;
      }

      const data =
        (await res.json()) as SocialProviderTestResultResponse | null;

      setSocialTestStates((prev) => ({
        ...prev,
        [provider]: {
          status: "success",
          message: data?.checkedAt
            ? `Успех · ${new Date(data.checkedAt).toLocaleString()} · ${Math.round(
                data.latencyMs,
              )}ms`
            : "Успешен тест",
          details: data,
          errorDetails: null,
        },
      }));
    } catch (err) {
      setSocialTestStates((prev) => ({
        ...prev,
        [provider]: {
          status: "error",
          message:
            err instanceof Error ? err.message.slice(0, 200) : "Неуспешен тест",
          details: null,
          errorDetails: err instanceof Error ? err.message : null,
        },
      }));
    }
  };

  const handleToggleSocialProvider = (
    provider: SocialProvider,
    nextValue: boolean,
  ) => {
    if (!nextValue) {
      const label = SOCIAL_PROVIDER_LABELS[provider];
      const confirmed = window.confirm(
        `Изключването на ${label} ще спре възможността потребителите да влизат с този доставчик. Продължаваш ли?`,
      );
      if (!confirmed) {
        return;
      }
      clearSocialFieldError(provider, "clientId");
      clearSocialFieldError(provider, "redirectUri");
      clearSocialFieldError(provider, "clientSecret");
      socialFeatureSetters[provider](false);
      return;
    }

    const label = SOCIAL_PROVIDER_LABELS[provider];
    const form = socialCredentialForms[provider];
    const status = socialStatuses?.[provider];
    const configured = status?.configured ?? false;

    if (!configured) {
      const clientId = form.clientId.trim();
      const redirectUri = form.redirectUri.trim();
      const hasNewSecret = form.clientSecretInput.trim().length > 0;
      const hasStoredSecret = form.hasClientSecret && !form.clearSecret;

      if (!clientId) {
        const msg = `За да активираш ${label}, въведи Client ID.`;
        setSocialFieldError(provider, "clientId", msg);
        setError(msg);
        focusAndScroll(socialClientIdRefs.current[provider] ?? null);
        return;
      }

      if (!redirectUri) {
        const msg = `За да активираш ${label}, въведи Redirect URL.`;
        setSocialFieldError(provider, "redirectUri", msg);
        setError(msg);
        focusAndScroll(socialRedirectUriRefs.current[provider] ?? null);
        return;
      }

      if (!isValidRedirectUrl(redirectUri)) {
        const msg = `Redirect URL за ${label} е невалиден (трябва http/https).`;
        setSocialFieldError(provider, "redirectUri", msg);
        setError(msg);
        focusAndScroll(socialRedirectUriRefs.current[provider] ?? null);
        return;
      }

      if (form.clearSecret) {
        const msg = `Не можеш да активираш ${label} със secret за изтриване. Изключи изтриването или въведи нов secret.`;
        setSocialFieldError(provider, "clientSecret", msg);
        setError(msg);
        focusAndScroll(socialClientSecretRefs.current[provider] ?? null);
        return;
      }

      if (!hasNewSecret && !hasStoredSecret) {
        const msg = `За да активираш ${label}, въведи Client secret.`;
        setSocialFieldError(provider, "clientSecret", msg);
        setError(msg);
        focusAndScroll(socialClientSecretRefs.current[provider] ?? null);
        return;
      }
    }

    clearSocialFieldError(provider, "clientId");
    clearSocialFieldError(provider, "redirectUri");
    clearSocialFieldError(provider, "clientSecret");
    socialFeatureSetters[provider](true);
  };

  const [supportedLangs, setSupportedLangs] = useState<string[]>([
    "bg",
    "en",
    "de",
  ]);
  const [languageDraft, setLanguageDraft] = useState<string>("");
  const [defaultLang, setDefaultLang] = useState<string>("bg");
  const [languageIcons, setLanguageIcons] = useState<
    NonNullable<InstanceLanguages["icons"]>
  >({});
  const [languageFlagPickerGlobal, setLanguageFlagPickerGlobal] =
    useState<string>("");
  const [languageFlagPickerByLang, setLanguageFlagPickerByLang] = useState<
    Record<string, string>
  >({});

  const languageIconInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingLanguageIconUpload, setPendingLanguageIconUpload] = useState<{
    lang: string;
    variant: "light" | "dark";
  } | null>(null);

  const languageDraftAnalysis = useMemo(
    () => analyzeLanguageDraft(languageDraft),
    [languageDraft],
  );

  const persistLanguagesField = async (
    patch: Record<string, unknown>,
    successMessage: string,
  ) => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: "PATCH",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          languages: patch,
        }),
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        const payload = (await res.json()) as { message?: string };
        setError(payload?.message ?? "Неуспешно запазване на languages.");
        return;
      }

      const updated = (await res.json()) as AdminSettingsResponse;
      const l = updated.languages;
      setSupportedLangs(Array.isArray(l?.supported) ? l.supported : ["bg"]);
      setDefaultLang(l?.default ?? "bg");
      setLanguageIcons(
        l?.icons && typeof l.icons === "object" ? (l.icons as never) : {},
      );
      setLanguageFlagPickerGlobal((l?.flagPicker?.global ?? "").trim());
      setLanguageFlagPickerByLang(() => {
        const raw = l?.flagPicker?.byLang;
        const next: Record<string, string> = {};
        if (raw && typeof raw === "object") {
          for (const [k, v] of Object.entries(raw)) {
            if (typeof v === "string" && v.trim().length > 0) {
              next[(k ?? "").trim().toLowerCase()] = v.trim().toLowerCase();
            }
          }
        }
        return next;
      });
      setSuccess(successMessage);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно запазване на languages.",
      );
    }
  };

  const handleLanguageIconUploadClick = (
    lang: string,
    variant: "light" | "dark",
  ) => {
    const normalizedLang = (lang ?? "").trim().toLowerCase();
    if (!normalizedLang) return;
    if (languageIconInputRef.current) {
      languageIconInputRef.current.value = "";
      setPendingLanguageIconUpload({ lang: normalizedLang, variant });
      languageIconInputRef.current.click();
    }
  };

  const handleLanguageIconSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const pending = pendingLanguageIconUpload;
    if (!pending) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const current = languageIcons?.[pending.lang] ?? null;
    const previousUrl =
      pending.variant === "dark"
        ? (current?.darkUrl ?? "").trim()
        : (current?.lightUrl ?? "").trim();

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("lang", pending.lang);
    formData.append("variant", pending.variant);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings/languages/icon`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на language icon.";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на language icon.");
        return;
      }

      const nextIcons = {
        ...(languageIcons ?? {}),
        [pending.lang]: {
          ...(languageIcons?.[pending.lang] ?? null),
          ...(pending.variant === "dark"
            ? { darkUrl: data.url }
            : { lightUrl: data.url }),
        },
      } as NonNullable<InstanceLanguages["icons"]>;

      setLanguageIcons(nextIcons);
      await persistLanguagesField(
        { icons: { [pending.lang]: nextIcons[pending.lang] } },
        `Language icon (${pending.lang}, ${pending.variant}) е качен и запазен.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на language icon.",
      );
    } finally {
      setPendingLanguageIconUpload(null);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const token = getAccessToken();
      if (!token) {
        routerRef.current.replace("/auth/login");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/admin/settings`, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          routerRef.current.replace("/auth/login");
          return;
        }

        if (!res.ok) {
          if (!cancelled) {
            setError("Неуспешно зареждане на settings.");
          }
          return;
        }

        const data = (await res.json()) as AdminSettingsResponse;

        if (cancelled) return;

        setAppName(data.branding?.appName ?? "BeeLMS");
        setBrowserTitle(data.branding?.browserTitle ?? "");
        setLoginSocialUnavailableMessageEnabled(
          data.branding?.loginSocialUnavailableMessageEnabled !== false,
        );
        setLoginSocialResetPasswordHintEnabled(
          data.branding?.loginSocialResetPasswordHintEnabled !== false,
        );
        setRegisterSocialUnavailableMessageEnabled(
          data.branding?.registerSocialUnavailableMessageEnabled !== false,
        );
        setSocialDescription(data.branding?.socialDescription ?? "");
        setFaviconUrl(data.branding?.faviconUrl ?? "");
        setGoogleFont(data.branding?.googleFont ?? "");
        setGoogleFontByLang(
          sanitizeStringDictionary(data.branding?.googleFontByLang),
        );
        setFontUrl(data.branding?.fontUrl ?? "");
        setFontUrlByLang(
          sanitizeStringDictionary(data.branding?.fontUrlByLang),
        );
        setCustomThemePresets(
          sanitizeCustomThemePresets(data.branding?.customThemePresets),
        );
        setCustomThemePresetsLoaded(true);
        setLogoUrl(data.branding?.logoUrl ?? "");
        setLogoLightUrl(data.branding?.logoLightUrl ?? "");
        setLogoDarkUrl(data.branding?.logoDarkUrl ?? "");
        setCursorUrl(data.branding?.cursorUrl ?? "");
        const modeRaw = data.branding?.theme?.mode ?? "system";
        const mode =
          modeRaw === "light" || modeRaw === "dark" || modeRaw === "system"
            ? modeRaw
            : "system";
        setThemeMode(mode);
        setThemeLight((prev) => {
          const next = mergeThemePalette(prev, data.branding?.theme?.light);
          setSavedThemeLight(next);
          setThemeLightRedo({});
          return next;
        });
        setThemeDark((prev) => {
          const next = mergeThemePalette(prev, data.branding?.theme?.dark);
          setSavedThemeDark(next);
          setThemeDarkRedo({});
          return next;
        });
        setCursorUrl(data.branding?.cursorUrl ?? "");
        setCursorLightUrl(data.branding?.cursorLightUrl ?? "");
        setCursorDarkUrl(data.branding?.cursorDarkUrl ?? "");
        setCursorPointerUrl(data.branding?.cursorPointerUrl ?? "");
        setCursorPointerLightUrl(data.branding?.cursorPointerLightUrl ?? "");
        setCursorPointerDarkUrl(data.branding?.cursorPointerDarkUrl ?? "");
        setPoweredByBeeLmsEnabled(
          data.branding?.poweredByBeeLms?.enabled === true,
        );
        setPoweredByBeeLmsUrl(data.branding?.poweredByBeeLms?.url ?? "");
        setCursorHotspotX(
          typeof data.branding?.cursorHotspot?.x === "number"
            ? String(data.branding.cursorHotspot.x)
            : "",
        );
        setCursorHotspotY(
          typeof data.branding?.cursorHotspot?.y === "number"
            ? String(data.branding.cursorHotspot.y)
            : "",
        );
        cursorHotspotPersistedRef.current = {
          x:
            typeof data.branding?.cursorHotspot?.x === "number"
              ? String(data.branding.cursorHotspot.x)
              : "",
          y:
            typeof data.branding?.cursorHotspot?.y === "number"
              ? String(data.branding.cursorHotspot.y)
              : "",
        };
        setSocialImageUrl(data.branding?.socialImage?.imageUrl ?? "");
        setOpenGraphTitle(data.branding?.openGraph?.title ?? "");
        setOpenGraphDescription(data.branding?.openGraph?.description ?? "");
        setOpenGraphImageUrl(data.branding?.openGraph?.imageUrl ?? "");
        setFooterSocialLinks(
          sanitizeFooterSocialLinks(data.branding?.footerSocialLinks ?? null),
        );
        setTwitterTitle(data.branding?.twitter?.title ?? "");
        setTwitterDescription(data.branding?.twitter?.description ?? "");
        setTwitterImageUrl(data.branding?.twitter?.imageUrl ?? "");
        setTwitterCard(data.branding?.twitter?.card ?? "summary_large_image");
        setTwitterAppName(data.branding?.twitter?.app?.name ?? "");
        setTwitterAppIdIphone(data.branding?.twitter?.app?.id?.iphone ?? "");
        setTwitterAppIdIpad(data.branding?.twitter?.app?.id?.ipad ?? "");
        setTwitterAppIdGooglePlay(
          data.branding?.twitter?.app?.id?.googleplay ?? "",
        );
        setTwitterAppUrlIphone(data.branding?.twitter?.app?.url?.iphone ?? "");
        setTwitterAppUrlIpad(data.branding?.twitter?.app?.url?.ipad ?? "");
        setTwitterAppUrlGooglePlay(
          data.branding?.twitter?.app?.url?.googleplay ?? "",
        );
        setTwitterPlayerUrl(data.branding?.twitter?.player?.url ?? "");
        setTwitterPlayerWidth(
          data.branding?.twitter?.player?.width != null
            ? String(data.branding.twitter.player.width)
            : "",
        );
        setTwitterPlayerHeight(
          data.branding?.twitter?.player?.height != null
            ? String(data.branding.twitter.player.height)
            : "",
        );
        setTwitterPlayerStream(data.branding?.twitter?.player?.stream ?? "");
        setTwitterPlayerStreamContentType(
          data.branding?.twitter?.player?.streamContentType ?? "",
        );

        setSocialMetadataLastSaved({
          browserTitle: data.branding?.browserTitle ?? "",
          socialImageUrl: data.branding?.socialImage?.imageUrl ?? "",
          socialDescription: data.branding?.socialDescription ?? "",
          openGraphTitle: data.branding?.openGraph?.title ?? "",
          openGraphDescription: data.branding?.openGraph?.description ?? "",
          openGraphImageUrl: data.branding?.openGraph?.imageUrl ?? "",
          twitterTitle: data.branding?.twitter?.title ?? "",
          twitterDescription: data.branding?.twitter?.description ?? "",
          twitterImageUrl: data.branding?.twitter?.imageUrl ?? "",
          twitterCard: data.branding?.twitter?.card ?? "summary_large_image",
          twitterAppName: data.branding?.twitter?.app?.name ?? "",
          twitterAppIdIphone: data.branding?.twitter?.app?.id?.iphone ?? "",
          twitterAppIdIpad: data.branding?.twitter?.app?.id?.ipad ?? "",
          twitterAppIdGooglePlay:
            data.branding?.twitter?.app?.id?.googleplay ?? "",
          twitterAppUrlIphone: data.branding?.twitter?.app?.url?.iphone ?? "",
          twitterAppUrlIpad: data.branding?.twitter?.app?.url?.ipad ?? "",
          twitterAppUrlGooglePlay:
            data.branding?.twitter?.app?.url?.googleplay ?? "",
          twitterPlayerUrl: data.branding?.twitter?.player?.url ?? "",
          twitterPlayerWidth:
            data.branding?.twitter?.player?.width != null
              ? String(data.branding.twitter.player.width)
              : "",
          twitterPlayerHeight:
            data.branding?.twitter?.player?.height != null
              ? String(data.branding.twitter.player.height)
              : "",
          twitterPlayerStream: data.branding?.twitter?.player?.stream ?? "",
          twitterPlayerStreamContentType:
            data.branding?.twitter?.player?.streamContentType ?? "",
          previewOrigin: previewOriginRef.current,
        });

        const f = data.features;
        setWiki(f?.wiki !== false);
        setWikiPublic(f?.wikiPublic !== false);
        setCourses(f?.courses !== false);
        setCoursesPublic(f?.coursesPublic !== false);
        setMyCourses(f?.myCourses !== false);
        setProfile(f?.profile !== false);
        setAccessibilityWidget(f?.accessibilityWidget !== false);
        setSeoEnabled(f?.seo !== false);
        setThemeLightEnabled(f?.themeLight !== false);
        setThemeDarkEnabled(f?.themeDark !== false);
        setThemeModeSelectorEnabled(f?.themeModeSelector !== false);
        setAuth(f?.auth !== false);
        setAuthLogin(f?.authLogin !== false);
        setAuthRegister(f?.authRegister !== false);
        setAuth2fa(Boolean(f?.auth2fa));
        setCaptcha(Boolean(f?.captcha));
        setCaptchaLogin(Boolean(f?.captchaLogin));
        setCaptchaRegister(Boolean(f?.captchaRegister));
        setCaptchaForgotPassword(Boolean(f?.captchaForgotPassword));
        setCaptchaChangePassword(Boolean(f?.captchaChangePassword));
        setPaidCourses(f?.paidCourses !== false);
        setSocialGoogle(f?.socialGoogle !== false);
        setSocialFacebook(f?.socialFacebook !== false);
        setSocialGithub(f?.socialGithub !== false);
        setSocialLinkedin(f?.socialLinkedin !== false);
        setInfraRedis(Boolean(f?.infraRedis));
        setInfraRedisUrl(
          typeof f?.infraRedisUrl === "string" ? f.infraRedisUrl : "",
        );
        setInfraRabbitmq(Boolean(f?.infraRabbitmq));
        setInfraRabbitmqUrl(
          typeof f?.infraRabbitmqUrl === "string" ? f.infraRabbitmqUrl : "",
        );
        setInfraMonitoring(f?.infraMonitoring !== false);
        setInfraMonitoringUrl(
          typeof f?.infraMonitoringUrl === "string" ? f.infraMonitoringUrl : "",
        );
        setInfraErrorTracking(Boolean(f?.infraErrorTracking));
        setInfraErrorTrackingUrl(
          typeof f?.infraErrorTrackingUrl === "string"
            ? f.infraErrorTrackingUrl
            : "",
        );

        setInitialFeatures(f ?? null);
        setSocialStatuses(buildSocialStatuses(data.socialProviders ?? null));
        setSocialCredentialForms(
          buildSocialCredentialState(data.socialCredentials),
        );
        setSocialLoginIcons(
          data.branding?.socialLoginIcons &&
            typeof data.branding.socialLoginIcons === "object"
            ? (data.branding.socialLoginIcons as never)
            : {},
        );
        setSocialTestStates(buildSocialTestStates());

        {
          const s = data.seo;
          setSeoBaseUrl(s?.baseUrl ?? "");
          setSeoTitleTemplate(s?.titleTemplate ?? "{page} | {site}");
          setSeoDefaultTitle(s?.defaultTitle ?? "");
          setSeoDefaultDescription(s?.defaultDescription ?? "");
          setSeoRobotsIndex(s?.robots?.index !== false);
          setSeoSitemapEnabled(s?.sitemap?.enabled !== false);
          setSeoSitemapIncludeWiki(s?.sitemap?.includeWiki !== false);
          setSeoSitemapIncludeCourses(s?.sitemap?.includeCourses !== false);
          setSeoSitemapIncludeLegal(s?.sitemap?.includeLegal !== false);
        }

        const l = data.languages;
        setSupportedLangs(Array.isArray(l?.supported) ? l.supported : ["bg"]);
        setDefaultLang(l?.default ?? "bg");
        setLanguageIcons(
          l?.icons && typeof l.icons === "object" ? (l.icons as never) : {},
        );
        setLanguageFlagPickerGlobal((l?.flagPicker?.global ?? "").trim());
        setLanguageFlagPickerByLang(() => {
          const raw = l?.flagPicker?.byLang;
          const next: Record<string, string> = {};
          if (raw && typeof raw === "object") {
            for (const [k, v] of Object.entries(raw)) {
              if (typeof v === "string" && v.trim().length > 0) {
                next[(k ?? "").trim().toLowerCase()] = v.trim().toLowerCase();
              }
            }
          }
          return next;
        });
      } catch {
        if (!cancelled) {
          setError("Възникна грешка при връзката със сървъра.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setError(null);
    setSuccess(null);
    const nextFieldErrors = buildSocialFieldErrors();
    let hasFieldErrors = false;

    const token = getAccessToken();
    if (!token) {
      saveInFlightRef.current = false;
      router.replace("/auth/login");
      return;
    }

    if (appNameValidation) {
      saveInFlightRef.current = false;
      setError(appNameValidation);
      return;
    }

    const invalidFooterUrl = footerSocialLinks.find((l) => {
      const trimmed = (l.url ?? "").trim();
      if (!trimmed) return false;
      return !isValidFooterSocialUrl(l.type, trimmed);
    });
    if (invalidFooterUrl) {
      saveInFlightRef.current = false;
      setError(
        `Footer social link URL е невалиден (${invalidFooterUrl.id}). ${footerSocialUrlErrorMessage(invalidFooterUrl.type)}`,
      );
      return;
    }

    if (poweredByBeeLmsEnabled && !isValidOptionalHttpUrl(poweredByBeeLmsUrl)) {
      saveInFlightRef.current = false;
      setError("Powered by BeeLMS URL е невалиден.");
      return;
    }

    const nextAppName = normalizedAppName;
    if (nextAppName.length < 2) {
      saveInFlightRef.current = false;
      setError("App name трябва да е поне 2 символа.");
      return;
    }

    const normalizeNullableString = (value: string): string | null => {
      const trimmed = (value ?? "").trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const normalizeNullableHex = (value: string): string | null => {
      const trimmed = (value ?? "").trim();
      if (!trimmed) return null;
      return trimmed;
    };

    const normalizeNullableNumber = (value: string): number | null => {
      const trimmed = (value ?? "").trim();
      if (!trimmed) return null;
      const num = Number(trimmed);
      return Number.isFinite(num) ? num : null;
    };

    const nextBrowserTitle = normalizeNullableString(browserTitle);
    const nextFaviconUrl = normalizeNullableString(faviconUrl);
    const nextFontUrl = normalizeNullableString(fontUrl);
    const nextLogoUrl = normalizeNullableString(logoUrl);
    const nextLogoLightUrl = normalizeNullableString(logoLightUrl);
    const nextLogoDarkUrl = normalizeNullableString(logoDarkUrl);
    const nextCursorUrl = normalizeNullableString(cursorUrl);
    const nextCursorLightUrl = normalizeNullableString(cursorLightUrl);
    const nextCursorDarkUrl = normalizeNullableString(cursorDarkUrl);
    const nextCursorPointerUrl = normalizeNullableString(cursorPointerUrl);
    const nextCursorPointerLightUrl = normalizeNullableString(
      cursorPointerLightUrl,
    );
    const nextCursorPointerDarkUrl =
      normalizeNullableString(cursorPointerDarkUrl);
    const nextCursorHotspotX = normalizeNullableNumber(cursorHotspotX);
    const nextCursorHotspotY = normalizeNullableNumber(cursorHotspotY);
    const nextSocialImageUrl = normalizeNullableString(socialImageUrl);
    const nextSocialDescription = normalizeNullableString(socialDescription);
    const nextFooterSocialLinks =
      normalizeFooterSocialLinksForSave(footerSocialLinks);
    const nextPoweredByBeeLmsUrl = normalizeNullableString(poweredByBeeLmsUrl);
    const nextOpenGraphTitle = normalizeNullableString(openGraphTitle);
    const nextOpenGraphDescription =
      normalizeNullableString(openGraphDescription);
    const nextOpenGraphImageUrl = normalizeNullableString(openGraphImageUrl);
    const nextTwitterTitle = normalizeNullableString(twitterTitle);
    const nextTwitterDescription = normalizeNullableString(twitterDescription);
    const nextTwitterImageUrl = normalizeNullableString(twitterImageUrl);
    const nextTwitterCard = normalizeNullableString(twitterCard);
    const nextTwitterAppName = normalizeNullableString(twitterAppName);
    const nextTwitterAppIdIphone = normalizeNullableString(twitterAppIdIphone);
    const nextTwitterAppIdIpad = normalizeNullableString(twitterAppIdIpad);
    const nextTwitterAppIdGooglePlay = normalizeNullableString(
      twitterAppIdGooglePlay,
    );
    const nextTwitterAppUrlIphone =
      normalizeNullableString(twitterAppUrlIphone);
    const nextTwitterAppUrlIpad = normalizeNullableString(twitterAppUrlIpad);
    const nextTwitterAppUrlGooglePlay = normalizeNullableString(
      twitterAppUrlGooglePlay,
    );
    const nextTwitterPlayerUrl = normalizeNullableString(twitterPlayerUrl);
    const twitterPlayerWidthNumber = Number(twitterPlayerWidth.trim());
    const twitterPlayerHeightNumber = Number(twitterPlayerHeight.trim());
    const nextTwitterPlayerWidth = Number.isFinite(twitterPlayerWidthNumber)
      ? twitterPlayerWidthNumber
      : null;
    const nextTwitterPlayerHeight = Number.isFinite(twitterPlayerHeightNumber)
      ? twitterPlayerHeightNumber
      : null;
    const nextTwitterPlayerStream =
      normalizeNullableString(twitterPlayerStream);
    const nextTwitterPlayerStreamContentType = normalizeNullableString(
      twitterPlayerStreamContentType,
    );

    const nextTwitterApp =
      nextTwitterAppName ||
      nextTwitterAppIdIphone ||
      nextTwitterAppIdIpad ||
      nextTwitterAppIdGooglePlay ||
      nextTwitterAppUrlIphone ||
      nextTwitterAppUrlIpad ||
      nextTwitterAppUrlGooglePlay
        ? {
            name: nextTwitterAppName,
            id:
              nextTwitterAppIdIphone ||
              nextTwitterAppIdIpad ||
              nextTwitterAppIdGooglePlay
                ? {
                    iphone: nextTwitterAppIdIphone,
                    ipad: nextTwitterAppIdIpad,
                    googleplay: nextTwitterAppIdGooglePlay,
                  }
                : null,
            url:
              nextTwitterAppUrlIphone ||
              nextTwitterAppUrlIpad ||
              nextTwitterAppUrlGooglePlay
                ? {
                    iphone: nextTwitterAppUrlIphone,
                    ipad: nextTwitterAppUrlIpad,
                    googleplay: nextTwitterAppUrlGooglePlay,
                  }
                : null,
          }
        : null;

    const nextTwitterPlayer =
      nextTwitterPlayerUrl ||
      nextTwitterPlayerWidth != null ||
      nextTwitterPlayerHeight != null ||
      nextTwitterPlayerStream ||
      nextTwitterPlayerStreamContentType
        ? {
            url: nextTwitterPlayerUrl,
            width: nextTwitterPlayerWidth,
            height: nextTwitterPlayerHeight,
            stream: nextTwitterPlayerStream,
            streamContentType: nextTwitterPlayerStreamContentType,
          }
        : null;

    const nextSocialImage =
      nextSocialImageUrl === null
        ? null
        : nextSocialImageUrl
          ? { imageUrl: nextSocialImageUrl }
          : undefined;

    const nextCursorHotspot =
      nextCursorHotspotX === null && nextCursorHotspotY === null
        ? null
        : {
            ...(nextCursorHotspotX !== null ? { x: nextCursorHotspotX } : {}),
            ...(nextCursorHotspotY !== null ? { y: nextCursorHotspotY } : {}),
          };

    const nextOpenGraph =
      nextOpenGraphTitle || nextOpenGraphDescription || nextOpenGraphImageUrl
        ? {
            title: nextOpenGraphTitle,
            description: nextOpenGraphDescription,
            imageUrl: nextOpenGraphImageUrl,
          }
        : null;

    const nextTwitter =
      nextTwitterTitle ||
      nextTwitterDescription ||
      nextTwitterImageUrl ||
      nextTwitterCard ||
      nextTwitterApp ||
      nextTwitterPlayer
        ? {
            title: nextTwitterTitle,
            description: nextTwitterDescription,
            imageUrl: nextTwitterImageUrl,
            card: nextTwitterCard,
            app: nextTwitterApp,
            player: nextTwitterPlayer,
          }
        : null;

    const nextThemeLight = {
      background: normalizeNullableHex(themeLight.background),
      foreground: normalizeNullableHex(themeLight.foreground),
      primary: normalizeNullableHex(themeLight.primary),
      secondary: normalizeNullableHex(themeLight.secondary),
      error: normalizeNullableHex(themeLight.error),
      card: normalizeNullableHex(themeLight.card),
      border: normalizeNullableHex(themeLight.border),
      scrollThumb: normalizeNullableHex(themeLight.scrollThumb),
      scrollTrack: normalizeNullableHex(themeLight.scrollTrack),
      fieldOkBg: normalizeNullableHex(themeLight.fieldOkBg),
      fieldOkBorder: normalizeNullableHex(themeLight.fieldOkBorder),
      fieldAlertBg: normalizeNullableHex(themeLight.fieldAlertBg),
      fieldAlertBorder: normalizeNullableHex(themeLight.fieldAlertBorder),
      fieldErrorBg: normalizeNullableHex(themeLight.fieldErrorBg),
      fieldErrorBorder: normalizeNullableHex(themeLight.fieldErrorBorder),
    };
    const nextThemeDark = {
      background: normalizeNullableHex(themeDark.background),
      foreground: normalizeNullableHex(themeDark.foreground),
      primary: normalizeNullableHex(themeDark.primary),
      secondary: normalizeNullableHex(themeDark.secondary),
      error: normalizeNullableHex(themeDark.error),
      card: normalizeNullableHex(themeDark.card),
      border: normalizeNullableHex(themeDark.border),
      scrollThumb: normalizeNullableHex(themeDark.scrollThumb),
      scrollTrack: normalizeNullableHex(themeDark.scrollTrack),
      fieldOkBg: normalizeNullableHex(themeDark.fieldOkBg),
      fieldOkBorder: normalizeNullableHex(themeDark.fieldOkBorder),
      fieldAlertBg: normalizeNullableHex(themeDark.fieldAlertBg),
      fieldAlertBorder: normalizeNullableHex(themeDark.fieldAlertBorder),
      fieldErrorBg: normalizeNullableHex(themeDark.fieldErrorBg),
      fieldErrorBorder: normalizeNullableHex(themeDark.fieldErrorBorder),
    };

    if (supportedLangs.length < 1) {
      saveInFlightRef.current = false;
      setError(
        "languages.supported трябва да съдържа поне 1 език (напр. bg, en).",
      );
      return;
    }

    const nextDefaultLang = (defaultLang ?? "").trim().toLowerCase();
    if (!supportedLangs.includes(nextDefaultLang)) {
      saveInFlightRef.current = false;
      setError("languages.default трябва да е включен в languages.supported.");
      return;
    }

    const wasAuthEnabled = initialFeatures?.auth !== false;
    const wasAuthLoginEnabled = initialFeatures?.authLogin !== false;
    const wasAuthRegisterEnabled = initialFeatures?.authRegister !== false;
    const socialDisables: string[] = [];
    if (initialFeatures?.socialGoogle !== false && socialGoogle === false) {
      socialDisables.push("Google");
    }
    if (initialFeatures?.socialFacebook !== false && socialFacebook === false) {
      socialDisables.push("Facebook");
    }
    if (initialFeatures?.socialGithub !== false && socialGithub === false) {
      socialDisables.push("GitHub");
    }
    if (initialFeatures?.socialLinkedin !== false && socialLinkedin === false) {
      socialDisables.push("LinkedIn");
    }

    if (wasAuthEnabled && auth === false) {
      const ok = window.confirm(
        "Сигурен ли си, че искаш да изключиш AUTH? Това ще спре регистрация/логин/ресет на парола.",
      );
      if (!ok) return;
    }

    if (wasAuthLoginEnabled && authLogin === false) {
      const ok = window.confirm(
        "Сигурен ли си, че искаш да изключиш Login за потребители? Админ/учителски роли ще могат да се вписват, но стандартните потребители няма да могат.",
      );
      if (!ok) return;
    }

    if (wasAuthRegisterEnabled && authRegister === false) {
      const ok = window.confirm(
        "Сигурен ли си, че искаш да изключиш Register + Reset password? Това ще спре регистрацията и reset потока за пароли.",
      );
      if (!ok) return;
    }

    for (const provider of SOCIAL_PROVIDERS) {
      const enabled = socialFeatureStates[provider];
      if (!enabled) continue;

      const configured = socialStatuses?.[provider]?.configured ?? false;
      if (configured) {
        // Конфигурацията е налична чрез env или stored creds.
        // Не изискваме form полетата да са попълнени.
        continue;
      }

      const form = socialCredentialForms[provider];
      const label = SOCIAL_PROVIDER_LABELS[provider];
      const clientId = form.clientId.trim();
      const redirectUri = form.redirectUri.trim();
      const hasNewSecret = form.clientSecretInput.trim().length > 0;
      const hasStoredSecret = form.hasClientSecret && !form.clearSecret;

      if (!clientId) {
        nextFieldErrors[provider].clientId =
          `Въведи Client ID за ${label}, за да го активираш.`;
        hasFieldErrors = true;
      }

      if (!redirectUri) {
        nextFieldErrors[provider].redirectUri =
          `Въведи Redirect URL за ${label}, за да го активираш.`;
        hasFieldErrors = true;
      }

      if (form.clearSecret) {
        nextFieldErrors[provider].clientSecret =
          `Не можеш да изтриеш secret за активиран ${label}. Изключи доставчика или въведи нов secret.`;
        hasFieldErrors = true;
      } else if (!hasNewSecret && !hasStoredSecret) {
        nextFieldErrors[provider].clientSecret =
          `Въведи Client secret за ${label}, за да го активираш.`;
        hasFieldErrors = true;
      }
    }

    setSocialFieldErrors(nextFieldErrors);

    // Social OAuth конфигурацията не трябва да блокира запазването на останалите настройки
    // (напр. Theme). Ако има грешки, НЕ пращаме socialCredentials, но продължаваме със Save.
    const shouldPersistSocialCredentials =
      socialCredentialsDirty && !hasFieldErrors;

    setSaving(true);

    const socialCredentialPayload: Partial<
      Record<SocialProvider, SocialProviderCredentialRequest>
    > = {};

    for (const provider of SOCIAL_PROVIDERS) {
      const form = socialCredentialForms[provider];
      const payload: SocialProviderCredentialRequest = {};

      const normalizedClientId = form.clientId.trim();
      payload.clientId =
        normalizedClientId.length > 0 ? normalizedClientId : null;

      const normalizedRedirect = form.redirectUri.trim();
      payload.redirectUri =
        normalizedRedirect.length > 0 ? normalizedRedirect : null;

      const normalizedNotes = form.notes.trim();
      payload.notes = normalizedNotes.length > 0 ? normalizedNotes : null;

      if (form.clientSecretInput.trim().length > 0) {
        payload.clientSecret = form.clientSecretInput.trim();
      } else if (form.clearSecret) {
        payload.clientSecret = null;
      }

      if (
        typeof payload.clientId !== "undefined" ||
        typeof payload.clientSecret !== "undefined" ||
        typeof payload.redirectUri !== "undefined" ||
        typeof payload.notes !== "undefined"
      ) {
        socialCredentialPayload[provider] = payload;
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branding: {
            appName: nextAppName,
            browserTitle: nextBrowserTitle,
            poweredByBeeLms: {
              enabled: poweredByBeeLmsEnabled,
              url: poweredByBeeLmsEnabled ? nextPoweredByBeeLmsUrl : null,
            },
            faviconUrl: nextFaviconUrl,
            fontUrl: nextFontUrl,
            theme: {
              mode: themeMode,
              light: nextThemeLight,
              dark: nextThemeDark,
            },
            logoUrl: nextLogoUrl,
            logoLightUrl: nextLogoLightUrl,
            logoDarkUrl: nextLogoDarkUrl,
            cursorUrl: nextCursorUrl,
            cursorLightUrl: nextCursorLightUrl,
            cursorDarkUrl: nextCursorDarkUrl,
            cursorPointerUrl: nextCursorPointerUrl,
            cursorPointerLightUrl: nextCursorPointerLightUrl,
            cursorPointerDarkUrl: nextCursorPointerDarkUrl,
            cursorHotspot: nextCursorHotspot,
            socialImage: nextSocialImage,
            openGraph: nextOpenGraph,
            twitter: nextTwitter,
            socialDescription: nextSocialDescription,
            footerSocialLinks: nextFooterSocialLinks,
          },
          features: {
            wiki,
            wikiPublic,
            courses,
            coursesPublic,
            myCourses,
            profile,
            accessibilityWidget,
            seo: seoEnabled,
            themeLight: themeLightEnabled,
            themeDark: themeDarkEnabled,
            themeModeSelector: themeModeSelectorEnabled,
            auth,
            authLogin,
            authRegister,
            auth2fa,
            captcha,
            captchaLogin,
            captchaRegister,
            captchaForgotPassword,
            captchaChangePassword,
            paidCourses,
            socialGoogle,
            socialFacebook,
            socialGithub,
            socialLinkedin,
            infraRedis,
            infraRedisUrl: infraRedisUrl.trim() || null,
            infraRabbitmq,
            infraRabbitmqUrl: infraRabbitmqUrl.trim() || null,
            infraMonitoring,
            infraMonitoringUrl: infraMonitoringUrl.trim() || null,
            infraErrorTracking,
            infraErrorTrackingUrl: infraErrorTrackingUrl.trim() || null,
          },
          seo: {
            baseUrl: normalizeNullableString(seoBaseUrl),
            titleTemplate: normalizeNullableString(seoTitleTemplate),
            defaultTitle: normalizeNullableString(seoDefaultTitle),
            defaultDescription: normalizeNullableString(seoDefaultDescription),
            robots: {
              index: seoRobotsIndex,
            },
            sitemap: {
              enabled: seoSitemapEnabled,
              includeWiki: seoSitemapIncludeWiki,
              includeCourses: seoSitemapIncludeCourses,
              includeLegal: seoSitemapIncludeLegal,
            },
          },
          languages: {
            supported: supportedLangs,
            default: nextDefaultLang,
            icons:
              Object.keys(languageIcons ?? {}).length > 0
                ? languageIcons
                : null,
            flagPicker:
              (languageFlagPickerGlobal ?? "").trim().length > 0 ||
              Object.keys(languageFlagPickerByLang ?? {}).length > 0
                ? {
                    global: (languageFlagPickerGlobal ?? "").trim() || null,
                    byLang:
                      Object.keys(languageFlagPickerByLang ?? {}).length > 0
                        ? languageFlagPickerByLang
                        : null,
                  }
                : null,
          },
          socialCredentials:
            shouldPersistSocialCredentials &&
            Object.keys(socialCredentialPayload).length > 0
              ? socialCredentialPayload
              : undefined,
        }),
      });

      if (res.status === 401) {
        saveInFlightRef.current = false;
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let backendMessage: string | null = null;
        try {
          const payload = (await res.json()) as { message?: unknown };
          if (typeof payload?.message === "string") {
            const trimmed = payload.message.trim();
            if (trimmed.length > 0) {
              backendMessage = trimmed;
            }
          }
        } catch {
          // ignore
        }
        setError(
          backendMessage
            ? `Неуспешно запазване на настройките. ${backendMessage}`
            : "Неуспешно запазване на настройките.",
        );
        return;
      }

      const payload = (await res.json()) as unknown;
      const updated = payload as AdminSettingsResponse;
      const backendSuccessMessage =
        typeof (payload as { message?: unknown })?.message === "string"
          ? String((payload as { message?: unknown }).message).trim()
          : "";

      setInitialFeatures(updated.features ?? null);
      setSocialStatuses(buildSocialStatuses(updated.socialProviders ?? null));
      setSocialCredentialForms(
        buildSocialCredentialState(updated.socialCredentials ?? null),
      );
      setSocialCredentialsDirty(false);
      setCustomThemePresets(
        sanitizeCustomThemePresets(updated.branding?.customThemePresets),
      );
      setCustomThemePresetsLoaded(true);
      setFaviconUrl(updated.branding?.faviconUrl ?? "");
      setGoogleFont(updated.branding?.googleFont ?? "");
      setFontUrl(updated.branding?.fontUrl ?? "");
      setFontLicenseUrl(updated.branding?.fontLicenseUrl ?? "");
      setLogoUrl(updated.branding?.logoUrl ?? "");
      setLogoLightUrl(updated.branding?.logoLightUrl ?? "");
      setLogoDarkUrl(updated.branding?.logoDarkUrl ?? "");
      setCursorUrl(updated.branding?.cursorUrl ?? "");
      setCursorLightUrl(updated.branding?.cursorLightUrl ?? "");
      setCursorDarkUrl(updated.branding?.cursorDarkUrl ?? "");
      setCursorPointerUrl(updated.branding?.cursorPointerUrl ?? "");
      setCursorPointerLightUrl(updated.branding?.cursorPointerLightUrl ?? "");
      setCursorPointerDarkUrl(updated.branding?.cursorPointerDarkUrl ?? "");
      setCursorHotspotX(
        typeof updated.branding?.cursorHotspot?.x === "number"
          ? String(updated.branding.cursorHotspot.x)
          : "",
      );
      setCursorHotspotY(
        typeof updated.branding?.cursorHotspot?.y === "number"
          ? String(updated.branding.cursorHotspot.y)
          : "",
      );

      setSocialMetadataLastSaved(socialMetadataSnapshotFromState());

      {
        const modeRaw = updated.branding?.theme?.mode ?? "system";
        const mode =
          modeRaw === "light" || modeRaw === "dark" || modeRaw === "system"
            ? modeRaw
            : "system";
        setThemeMode(mode);

        const nextLight = mergeThemePalette(
          themeLight,
          updated.branding?.theme?.light,
        );
        const nextDark = mergeThemePalette(
          themeDark,
          updated.branding?.theme?.dark,
        );
        setThemeLight(nextLight);
        setThemeDark(nextDark);
        setSavedThemeLight(nextLight);
        setSavedThemeDark(nextDark);
        setThemeLightRedo({});
        setThemeDarkRedo({});
        setThemeHexInputs((draftPrev) => ({
          ...draftPrev,
          light: { ...nextLight },
          dark: { ...nextDark },
        }));
      }

      setSuccess(
        backendSuccessMessage.length > 0
          ? backendSuccessMessage
          : hasFieldErrors
            ? "Настройките са запазени (без Social OAuth credentials – има липсващи полета)."
            : "Настройките са запазени.",
      );
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
  };

  const handleCursorUploadClick = () => {
    if (cursorFileInputRef.current) {
      cursorFileInputRef.current.value = "";
      cursorFileInputRef.current.click();
    }
  };

  const handleCursorLightUploadClick = () => {
    if (cursorLightFileInputRef.current) {
      cursorLightFileInputRef.current.value = "";
      cursorLightFileInputRef.current.click();
    }
  };

  const handleCursorDarkUploadClick = () => {
    if (cursorDarkFileInputRef.current) {
      cursorDarkFileInputRef.current.value = "";
      cursorDarkFileInputRef.current.click();
    }
  };

  const handleCursorPointerUploadClick = () => {
    if (cursorPointerFileInputRef.current) {
      cursorPointerFileInputRef.current.value = "";
      cursorPointerFileInputRef.current.click();
    }
  };

  const handleCursorPointerLightUploadClick = () => {
    if (cursorPointerLightFileInputRef.current) {
      cursorPointerLightFileInputRef.current.value = "";
      cursorPointerLightFileInputRef.current.click();
    }
  };

  const handleCursorPointerDarkUploadClick = () => {
    if (cursorPointerDarkFileInputRef.current) {
      cursorPointerDarkFileInputRef.current.value = "";
      cursorPointerDarkFileInputRef.current.click();
    }
  };

  const handleFooterSocialIconUploadClick = (
    id: string,
    variant: "light" | "dark",
  ) => {
    if (footerSocialIconInputRef.current) {
      footerSocialIconInputRef.current.value = "";
      setPendingFooterSocialIconUpload({ id, variant });
      footerSocialIconInputRef.current.click();
    }
  };

  const handleFooterSocialIconSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const pending = pendingFooterSocialIconUpload;
    if (!pending) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const currentLink = footerSocialLinks.find((l) => l.id === pending.id);
    const previousUrl =
      pending.variant === "dark"
        ? (currentLink?.iconDarkUrl ?? "").trim()
        : (currentLink?.iconLightUrl ?? "").trim();

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("id", pending.id);
    formData.append("variant", pending.variant);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/footer-social-icon`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на footer social icon.";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на footer social icon.");
        return;
      }

      const nextList = footerSocialLinks.map((l) =>
        l.id === pending.id
          ? pending.variant === "dark"
            ? { ...l, iconDarkUrl: data.url }
            : { ...l, iconLightUrl: data.url }
          : l,
      );
      setFooterSocialLinks(nextList);
      await persistBrandingField(
        { footerSocialLinks: nextList },
        `Footer social icon (${pending.variant}) е качен и запазен.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на footer social icon.",
      );
    } finally {
      setPendingFooterSocialIconUpload(null);
    }
  };

  const handleSocialLoginIconUploadClick = (
    provider: SocialProvider,
    variant: "light" | "dark",
  ) => {
    if (!socialLoginIconInputRef.current) {
      return;
    }
    socialLoginIconInputRef.current.value = "";
    setPendingSocialLoginIconUpload({ provider, variant });
    socialLoginIconInputRef.current.click();
  };

  const handleSocialLoginIconSelected: ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const pending = pendingSocialLoginIconUpload;
    if (!pending) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    const current = socialLoginIcons?.[pending.provider] ?? null;
    const previousUrl =
      pending.variant === "dark"
        ? (current?.darkUrl ?? "").trim()
        : (current?.lightUrl ?? "").trim();

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("provider", pending.provider);
    formData.append("variant", pending.variant);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/social-login-icon`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        let message = "Неуспешно качване на social login icon.";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) message = payload.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на social login icon.");
        return;
      }

      const nextIcons = {
        ...(socialLoginIcons ?? {}),
        [pending.provider]: {
          ...(socialLoginIcons?.[pending.provider] ?? null),
          ...(pending.variant === "dark"
            ? { darkUrl: data.url }
            : { lightUrl: data.url }),
        },
      } as Partial<Record<SocialProvider, SocialLoginIconConfig>>;

      setSocialLoginIcons(nextIcons);
      await persistBrandingField(
        {
          socialLoginIcons: { [pending.provider]: nextIcons[pending.provider] },
        },
        `Social login icon (${pending.provider}, ${pending.variant}) е качен и запазен.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на social login icon.",
      );
    } finally {
      setPendingSocialLoginIconUpload(null);
    }
  };

  const persistCursorHotspot = async () => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const xRaw = (cursorHotspotX ?? "").trim();
    const yRaw = (cursorHotspotY ?? "").trim();
    const snapshot = { x: xRaw, y: yRaw };
    const prev = cursorHotspotPersistedRef.current;
    if (prev && prev.x === snapshot.x && prev.y === snapshot.y) {
      return;
    }

    const toNullableInt = (value: string): number | null => {
      if (!value) return null;
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    const x = toNullableInt(xRaw);
    const y = toNullableInt(yRaw);
    const cursorHotspot =
      x === null && y === null
        ? null
        : {
            ...(x !== null ? { x } : {}),
            ...(y !== null ? { y } : {}),
          };

    try {
      setCursorHotspotPersistStatus("saving");

      const brandingPayload: Record<string, unknown> = {
        cursorHotspot,
      };
      const cursorUrlTrimmed = (cursorUrl ?? "").trim();
      if (cursorUrlTrimmed.length > 0) {
        brandingPayload.cursorUrl = cursorUrlTrimmed;
      }

      const persistRes = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: "PATCH",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branding: {
            ...brandingPayload,
          },
        }),
      });

      if (persistRes.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!persistRes.ok) {
        setCursorHotspotPersistStatus("error");
        return;
      }

      const updated = (await persistRes.json()) as AdminSettingsResponse;
      setCursorUrl(updated.branding?.cursorUrl ?? "");
      setCursorHotspotX(
        typeof updated.branding?.cursorHotspot?.x === "number"
          ? String(updated.branding.cursorHotspot.x)
          : "",
      );
      setCursorHotspotY(
        typeof updated.branding?.cursorHotspot?.y === "number"
          ? String(updated.branding.cursorHotspot.y)
          : "",
      );
      cursorHotspotPersistedRef.current = snapshot;
      setCursorHotspotPersistStatus("saved");
      window.setTimeout(() => {
        setCursorHotspotPersistStatus((current) =>
          current === "saved" ? "idle" : current,
        );
      }, 1200);
    } catch {
      setCursorHotspotPersistStatus("error");
    }
  };

  const handleCursorFileSelected: ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);

      const res = await fetch(
        `${API_BASE_URL}/admin/settings/branding/cursor`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        const payload = (await res.json()) as { message?: string };
        setError(payload?.message ?? "Неуспешно качване на cursor файла.");
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на cursor файла.");
        return;
      }

      setCursorUrl(data.url);

      try {
        const persistRes = await fetch(`${API_BASE_URL}/admin/settings`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            branding: {
              cursorUrl: data.url,
            },
          }),
        });

        if (persistRes.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (!persistRes.ok) {
          setSuccess(
            "Cursor файлът е качен. Натисни Save за да го запазиш (автоматичното запазване не успя).",
          );
          return;
        }

        const updated = (await persistRes.json()) as AdminSettingsResponse;
        setCursorUrl(updated.branding?.cursorUrl ?? "");
        setCursorHotspotX(
          typeof updated.branding?.cursorHotspot?.x === "number"
            ? String(updated.branding.cursorHotspot.x)
            : "",
        );
        setCursorHotspotY(
          typeof updated.branding?.cursorHotspot?.y === "number"
            ? String(updated.branding.cursorHotspot.y)
            : "",
        );
        setSuccess(
          "Cursor файлът е качен и запазен. Refesh-ни страницата за да се приложи навсякъде.",
        );
      } catch {
        setSuccess(
          "Cursor файлът е качен. Натисни Save за да го запазиш (автоматичното запазване не успя).",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно качване на cursor файла.",
      );
    }
  };

  const handleSocialImageUploadClick = (purpose: SocialImagePurpose) => {
    const ref =
      purpose === "twitter"
        ? twitterImageInputRef.current
        : purpose === "open-graph"
          ? openGraphImageInputRef.current
          : socialImageInputRef.current;
    if (ref) {
      ref.value = "";
      ref.click();
    }
  };

  const handleSocialImageFileSelected =
    (purpose: SocialImagePurpose): ChangeEventHandler<HTMLInputElement> =>
    async (event) => {
      const files = event.target.files;
      if (!files || files.length === 0) {
        return;
      }

      const token = getAccessToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      setError(null);
      setSuccess(null);
      setUploadingSocialImagePurpose(purpose);

      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("purpose", purpose);

      let previousUrl = "";
      if (purpose === "twitter") {
        previousUrl = twitterImageUrl.trim();
      } else if (purpose === "open-graph") {
        previousUrl = openGraphImageUrl.trim();
      } else {
        previousUrl = socialImageUrl.trim();
      }
      if (previousUrl.length > 0) {
        formData.append("previousUrl", previousUrl);
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/admin/settings/branding/social-image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (!res.ok) {
          let message = "Неуспешно качване на social изображението.";
          try {
            const payload = (await res.json()) as { message?: string };
            if (payload?.message) {
              message = payload.message;
            }
          } catch {
            // ignore json errors
          }
          setError(message);
          return;
        }

        const data = (await res.json()) as { url: string };
        if (purpose === "twitter") {
          setTwitterImageUrl(data.url);
        } else if (purpose === "open-graph") {
          setOpenGraphImageUrl(data.url);
        } else {
          setSocialImageUrl(data.url);
        }
        setSuccess("Изображението е качено. Натисни Save за да влезе в сила.");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Неуспешно качване на social изображението.",
        );
      } finally {
        setUploadingSocialImagePurpose(null);
      }
    };

  const resolvedCursorUrl =
    effectiveUiTheme === "dark"
      ? (cursorDarkUrl ?? "").trim() || (cursorUrl ?? "").trim()
      : (cursorLightUrl ?? "").trim() || (cursorUrl ?? "").trim();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <AdminBreadcrumbs
          items={[
            { label: "Админ табло", href: "/admin" },
            { label: "Settings" },
          ]}
        />
        <h1 className="text-3xl font-semibold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-600">
          Feature toggles + languages config + branding.
        </p>
      </header>

      {loading && <p className="text-sm text-zinc-600">Зареждане...</p>}

      {!loading && (
        <div className="space-y-6">
          <AccordionSection
            title="Branding"
            description="Настройки за идентичност."
            headerAdornment={
              <InfoTooltip
                label="Какво включва Branding"
                title="Branding"
                description={
                  <div className="space-y-2">
                    <p>
                      Настройки за визуалната идентичност на системата – име,
                      theme, favicon/logo, шрифтове и курсор.
                    </p>
                    <p className="text-xs text-gray-500">
                      Промените влизат в сила след &quot;Запази&quot;.
                    </p>
                  </div>
                }
              />
            }
            open={Boolean(openSections.branding)}
            onToggle={() => toggleSection("branding")}
          >
            <div className="mt-4 max-w-md">
              <label
                htmlFor="branding-app-name"
                className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700"
              >
                <span className="flex items-center gap-2">
                  <span>App name</span>
                  <InfoTooltip
                    label="App name info"
                    title="App name"
                    description="Името на системата. Показва се в header-а (ако няма logo) и се използва като fallback за заглавия."
                  />
                </span>
              </label>
              <input
                id="branding-app-name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                maxLength={APP_NAME_MAX_LENGTH}
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="BeeLMS"
                disabled={saving}
              />
              {appNameValidation ? (
                <p className="mt-1 text-sm text-red-600">{appNameValidation}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Characters: {appNameCharsUsed}/{APP_NAME_MAX_LENGTH}
                </p>
              )}
            </div>

            <div className="mt-6">
              <p className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <span>Theme</span>
                <InfoTooltip
                  label="Theme info"
                  title="Theme"
                  description="Цветова схема за целия сайт. Light/Dark палитрите се използват според режима (или system настройката)."
                />
              </p>
              <div className="mt-3 max-w-md">
                <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-2">
                    <span>Mode</span>
                    <InfoTooltip
                      label="Theme mode info"
                      title="Theme mode"
                      description="system следва OS/browser настройката. light/dark форсират конкретен режим. Тази настройка задава default за системата. Ако Feature toggle 'Theme selector' е включен, потребителите могат да override-ват режима локално (localStorage). Ако е изключен, dropdown-ът изчезва и режимът е админски forced за всички."
                    />
                  </span>
                </label>
                <div className="mt-2">
                  <ListboxSelect
                    ariaLabel="Theme mode"
                    value={themeMode}
                    disabled={saving}
                    onChange={(next) =>
                      setThemeMode(next as "light" | "dark" | "system")
                    }
                    buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-70"
                    options={[
                      { value: "system", label: "system" },
                      { value: "light", label: "light" },
                      { value: "dark", label: "dark" },
                    ]}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <span>Presets</span>
                      <InfoTooltip
                        label="Presets info"
                        title="Presets"
                        description="Готови палитри, които можеш да приложиш към Light/Dark. Полезно за бърз старт или reset към добра комбинация."
                      />
                    </p>
                    <p className="text-sm text-gray-700">
                      Избери готова цветова палитра и я приложи към Light/Dark.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Apply to
                    </span>
                    <InfoTooltip
                      label="Apply to info"
                      title="Apply to"
                      description="Избираш дали preset-ът да се приложи към Light, Dark или и към двете палитри."
                    />
                    <div className="h-9">
                      <ListboxSelect
                        ariaLabel="Theme preset target"
                        value={themePresetTarget}
                        disabled={saving}
                        onChange={(value) => {
                          const next = value as ThemePresetTarget;
                          themePresetTargetRef.current = next;
                          setThemePresetTarget(next);
                        }}
                        buttonClassName="flex h-9 items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-70"
                        options={THEME_PRESET_TARGETS.map((target) => ({
                          value: target,
                          label: THEME_PRESET_TARGET_LABEL[target],
                        }))}
                      />
                    </div>
                  </div>
                </div>

                {(() => {
                  const beePresets = THEME_PRESETS.filter((p) =>
                    BEE_LMS_PRESET_IDS.has(p.id),
                  );
                  const otherPresetsSorted = [
                    ...THEME_PRESETS.filter(
                      (p) => !BEE_LMS_PRESET_IDS.has(p.id),
                    ),
                  ].sort((a, b) => {
                    const hueA = hueFromHex(a.light.primary);
                    const hueB = hueFromHex(b.light.primary);
                    if (Number.isNaN(hueA) && Number.isNaN(hueB)) return 0;
                    if (Number.isNaN(hueA)) return 1;
                    if (Number.isNaN(hueB)) return -1;
                    return hueA - hueB;
                  });

                  const visibleOtherPresets = builtInThemePresetsExpanded
                    ? otherPresetsSorted
                    : otherPresetsSorted.slice(
                        0,
                        OTHER_THEME_PRESETS_PREVIEW_COUNT,
                      );
                  const hiddenCount = Math.max(
                    0,
                    otherPresetsSorted.length - visibleOtherPresets.length,
                  );

                  const renderPresetCard = (preset: ThemePreset) => {
                    const isEditing = editingBuiltInThemePresetId === preset.id;
                    const lightForSwatches = isEditing
                      ? themeLight
                      : preset.light;
                    const darkForSwatches = isEditing ? themeDark : preset.dark;
                    const activePalette =
                      themePreviewVariant === "light" ? themeLight : themeDark;

                    return (
                      <div
                        key={preset.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {preset.name}
                            </p>
                            <p className="mt-1 text-xs text-gray-600">
                              {preset.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleEditBuiltInThemePreset(preset)
                              }
                              disabled={saving}
                              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => applyThemePreset(preset)}
                              disabled={saving}
                              className="inline-flex items-center justify-center rounded-md border bg-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                              style={{
                                borderColor: activePalette.primary,
                                color: activePalette.primary,
                              }}
                            >
                              Apply
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-10 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                              Light
                            </span>
                            <div className="flex items-center gap-1">
                              {THEME_PRESET_SWATCH_KEYS.map((key) => (
                                <span
                                  key={`light-${preset.id}-${key}`}
                                  className="h-4 w-4 rounded-full border border-gray-200"
                                  style={{
                                    backgroundColor: lightForSwatches[key],
                                  }}
                                  title={`Light ${key}: ${lightForSwatches[key]}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-10 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                              Dark
                            </span>
                            <div className="flex items-center gap-1">
                              {THEME_PRESET_SWATCH_KEYS.map((key) => (
                                <span
                                  key={`dark-${preset.id}-${key}`}
                                  className="h-4 w-4 rounded-full border border-gray-200"
                                  style={{
                                    backgroundColor: darkForSwatches[key],
                                  }}
                                  title={`Dark ${key}: ${darkForSwatches[key]}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="mt-4 space-y-4">
                      {beePresets.length > 0 ? (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            beeLMS
                          </p>
                          <div className="mt-2 grid gap-3 md:grid-cols-2">
                            {beePresets.map(renderPresetCard)}
                          </div>
                        </div>
                      ) : null}

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Curated
                        </p>
                        <div className="mt-2 grid gap-3 md:grid-cols-2">
                          {visibleOtherPresets.map(renderPresetCard)}
                        </div>

                        {hiddenCount > 0 || builtInThemePresetsExpanded ? (
                          <div className="mt-4 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() =>
                                setBuiltInThemePresetsExpanded((prev) => !prev)
                              }
                              disabled={saving}
                              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {builtInThemePresetsExpanded
                                ? "Скрий"
                                : `Покажи още (${hiddenCount})`}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <span>Custom presets</span>
                      <InfoTooltip
                        label="Custom presets info"
                        title="Custom presets"
                        description="Запази текущата Light+Dark конфигурация като preset (видим за всички админи). Можеш да Edit/Delete и да Apply върху текущите цветове."
                      />
                    </p>
                    <p className="text-sm text-gray-700">
                      Запази текущите Light+Dark цветове като споделен preset за
                      всички админи.
                    </p>
                  </div>
                </div>

                {themeNotice ? (
                  <div
                    className="mt-3 rounded-md border px-4 py-3 text-sm"
                    style={
                      themeNotice.type === "error"
                        ? ERROR_NOTICE_STYLE
                        : themeNotice.type === "alert"
                          ? ALERT_NOTICE_STYLE
                          : SUCCESS_NOTICE_STYLE
                    }
                  >
                    {themeNotice.message}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-gray-500">
                    {editingCustomThemePresetId
                      ? `Editing preset: ${editingCustomThemePresetId}`
                      : ""}
                  </p>
                  {editingCustomThemePresetId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCustomThemePresetId(null);
                        setCustomThemePresetName("");
                        setCustomThemePresetDescription("");
                        setThemeNotice(null);
                      }}
                      disabled={saving}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
                  <div className="grid gap-2">
                    <input
                      value={customThemePresetName}
                      onChange={(e) => setCustomThemePresetName(e.target.value)}
                      disabled={saving}
                      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="Име (напр. light-bee + dark-bee)"
                    />
                    <input
                      value={customThemePresetDescription}
                      onChange={(e) =>
                        setCustomThemePresetDescription(e.target.value)
                      }
                      disabled={saving}
                      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="Описание (по желание)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCreateCustomThemePreset()}
                    disabled={saving}
                    className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--foreground)",
                    }}
                  >
                    {editingCustomThemePresetId
                      ? "Update preset"
                      : "Save preset"}
                  </button>
                </div>

                <div className="mt-4">
                  {!customThemePresetsLoaded ? (
                    <p className="text-sm text-gray-500">Зареждане...</p>
                  ) : customThemePresets.length < 1 ? (
                    <p className="text-sm text-gray-500">
                      Нямаш записани custom presets.
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {customThemePresets.map((preset) => {
                        const isEditing =
                          editingCustomThemePresetId === preset.id;
                        const lightForSwatches = isEditing
                          ? themeLight
                          : preset.light;
                        const darkForSwatches = isEditing
                          ? themeDark
                          : preset.dark;
                        const activePalette =
                          themePreviewVariant === "light"
                            ? themeLight
                            : themeDark;

                        return (
                          <div
                            key={preset.id}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {preset.name}
                                </p>
                                {preset.description ? (
                                  <p className="mt-1 text-xs text-gray-600">
                                    {preset.description}
                                  </p>
                                ) : null}
                                {(preset.createdBy || preset.updatedBy) && (
                                  <p className="mt-1 text-[11px] text-gray-500">
                                    {preset.updatedBy
                                      ? `Updated by: ${preset.updatedBy}`
                                      : preset.createdBy
                                        ? `Created by: ${preset.createdBy}`
                                        : ""}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isEditing) {
                                      void handleCreateCustomThemePreset();
                                    } else {
                                      handleEditCustomThemePreset(preset);
                                    }
                                  }}
                                  disabled={saving}
                                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isEditing ? "Save new style" : "Edit"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyCustomThemePreset(preset)}
                                  disabled={saving}
                                  className="inline-flex items-center justify-center rounded-md border bg-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                  style={{
                                    borderColor: activePalette.primary,
                                    color: activePalette.primary,
                                  }}
                                >
                                  Apply
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDeleteCustomThemePreset(preset)
                                  }
                                  disabled={saving}
                                  className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="w-10 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                  Light
                                </span>
                                <div className="flex items-center gap-1">
                                  {THEME_PRESET_SWATCH_KEYS.map((key) => (
                                    <span
                                      key={`custom-light-${preset.id}-${key}`}
                                      className="h-4 w-4 rounded-full border border-gray-200"
                                      style={{
                                        backgroundColor: lightForSwatches[key],
                                      }}
                                      title={`Light ${key}: ${lightForSwatches[key]}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-10 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                  Dark
                                </span>
                                <div className="flex items-center gap-1">
                                  {THEME_PRESET_SWATCH_KEYS.map((key) => (
                                    <span
                                      key={`custom-dark-${preset.id}-${key}`}
                                      className="h-4 w-4 rounded-full border border-gray-200"
                                      style={{
                                        backgroundColor: darkForSwatches[key],
                                      }}
                                      title={`Dark ${key}: ${darkForSwatches[key]}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:z-20">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Live preview
                        </p>
                        <p className="text-sm text-gray-700">
                          Виж как ще изглеждат цветовете в UI.
                        </p>
                      </div>
                      <InfoTooltip
                        label="Live preview info"
                        title="Live preview"
                        description="Примерна UI визуализация на избраната палитра. Тук се виждат и рамките/фонът за OK/Error полета."
                      />
                      <div className="inline-flex rounded-md border border-gray-200">
                        {(["light", "dark"] as ThemeVariant[]).map(
                          (variant) => (
                            <button
                              key={variant}
                              type="button"
                              onClick={() => setThemePreviewVariant(variant)}
                              className={`px-3 py-1 text-sm font-medium ${
                                themePreviewVariant === variant
                                  ? "bg-gray-900 text-white"
                                  : "text-gray-700"
                              }`}
                            >
                              {variant}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <ThemePreviewCard
                        palette={
                          themePreviewVariant === "light"
                            ? themeLight
                            : themeDark
                        }
                        variant={themePreviewVariant}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ThemeFieldControls
                      title="Light palette"
                      palette={themeLight}
                      savedPalette={savedThemeLight}
                      redoMap={themeLightRedo}
                      setPalette={setThemeLight}
                      setRedo={setThemeLightRedo}
                      variant="light"
                      hexDraft={themeHexInputs.light}
                      setHexDraft={setThemeHexInputs}
                      disabled={saving}
                    />
                    <ThemeFieldControls
                      title="Dark palette"
                      palette={themeDark}
                      savedPalette={savedThemeDark}
                      redoMap={themeDarkRedo}
                      setPalette={setThemeDark}
                      setRedo={setThemeDarkRedo}
                      variant="dark"
                      hexDraft={themeHexInputs.dark}
                      setHexDraft={setThemeHexInputs}
                      disabled={saving}
                    />
                  </div>
                </div>
                <ThemePreviewLegend
                  lightPalette={themeLight}
                  darkPalette={themeDark}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Промяната важи за целия сайт (вкл. admin). За system режим се
                ползва настройката на OS/browser.
              </p>
            </div>

            <div className="mt-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span>Favicon</span>
                <InfoTooltip
                  label="Favicon info"
                  title="Favicon"
                  description="Иконка в browser таба. След промяна: refresh-ни страницата за да се приложи навсякъде."
                />
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleBrandingFaviconUploadClick}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload favicon
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void persistBrandingField(
                      { faviconUrl: null },
                      "Favicon е премахнат.",
                    );
                  }}
                  disabled={saving || faviconUrl.trim().length === 0}
                  className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
                <input
                  ref={faviconFileInputRef}
                  type="file"
                  accept="image/png,image/x-icon,image/vnd.microsoft.icon"
                  className="hidden"
                  onChange={handleBrandingFaviconFileSelected}
                />
                {faviconUrl ? (
                  <a
                    href={faviconUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                    aria-label="Favicon preview"
                    title="Open favicon"
                  >
                    <Image
                      src={faviconUrl}
                      alt="Favicon"
                      width={24}
                      height={24}
                      className="h-6 w-6"
                      unoptimized
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">(default)</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Препоръка: PNG/ICO, квадратна иконка (напр. 32x32 или 48x48),
                компресирана.
              </p>
            </div>

            <div className="mt-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span>Logo</span>
                <InfoTooltip
                  label="Logo info"
                  title="Logo"
                  description="Основното logo (fallback). Ако light/dark варианти липсват, използваме този файл."
                />
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleBrandingLogoUploadClick}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload logo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void persistBrandingField(
                      { logoUrl: null },
                      "Logo е премахнато.",
                    );
                  }}
                  disabled={saving || logoUrl.trim().length === 0}
                  className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/*,.svg"
                  className="hidden"
                  onChange={handleBrandingLogoFileSelected}
                />
                {logoUrl ? (
                  <a
                    href={logoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                    aria-label="Logo preview"
                    title="Open logo"
                  >
                    <Image
                      src={logoUrl}
                      alt="Logo"
                      width={160}
                      height={40}
                      className="h-10 w-auto"
                      unoptimized
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">(disabled)</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Препоръка: PNG/SVG, прозрачен фон, ширина ~120-200px (или high
                quality), компресирано.
              </p>
            </div>

            <div className="mt-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span>Logo (Light)</span>
                <InfoTooltip
                  label="Logo light info"
                  title="Logo (Light)"
                  description="Специфично logo за Light тема. Ако липсва, използваме fallback logo."
                />
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleBrandingLogoLightUploadClick}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload logo (light)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void persistBrandingField(
                      { logoLightUrl: null },
                      "Logo (light) е премахнато.",
                    );
                  }}
                  disabled={saving || logoLightUrl.trim().length === 0}
                  className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
                <input
                  ref={logoLightFileInputRef}
                  type="file"
                  accept="image/*,.svg"
                  className="hidden"
                  onChange={handleBrandingLogoLightFileSelected}
                />
                {logoLightUrl ? (
                  <a
                    href={logoLightUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                    aria-label="Logo light preview"
                    title="Open logo (light)"
                  >
                    <Image
                      src={logoLightUrl}
                      alt="Logo light"
                      width={160}
                      height={40}
                      className="h-10 w-auto"
                      unoptimized
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">(fallback)</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Показва се при Light тема. Ако няма зададено, системата ползва
                fallback logo.
              </p>
            </div>

            <div className="mt-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span>Logo (Dark)</span>
                <InfoTooltip
                  label="Logo dark info"
                  title="Logo (Dark)"
                  description="Специфично logo за Dark тема. Ако липсва, използваме fallback logo."
                />
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleBrandingLogoDarkUploadClick}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload logo (dark)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void persistBrandingField(
                      { logoDarkUrl: null },
                      "Logo (dark) е премахнато.",
                    );
                  }}
                  disabled={saving || logoDarkUrl.trim().length === 0}
                  className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
                <input
                  ref={logoDarkFileInputRef}
                  type="file"
                  accept="image/*,.svg"
                  className="hidden"
                  onChange={handleBrandingLogoDarkFileSelected}
                />
                {logoDarkUrl ? (
                  <a
                    href={logoDarkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                    aria-label="Logo dark preview"
                    title="Open logo (dark)"
                  >
                    <Image
                      src={logoDarkUrl}
                      alt="Logo dark"
                      width={160}
                      height={40}
                      className="h-10 w-auto"
                      unoptimized
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">(fallback)</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Показва се при Dark тема. Ако няма зададено, системата ползва
                fallback logo.
              </p>
            </div>

            <div className="mt-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span>Font</span>
                <InfoTooltip
                  label="Font info"
                  title="Font"
                  description="Качи собствен font файл (WOFF2/WOFF/TTF/OTF). Ако има качен font, той има приоритет над Google font."
                />
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleBrandingFontUploadClick}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload font
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void persistBrandingField(
                      { fontUrl: null },
                      "Font е премахнат.",
                    );
                  }}
                  disabled={saving || fontUrl.trim().length === 0}
                  className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
                <input
                  ref={fontFileInputRef}
                  type="file"
                  accept=".woff2,.woff,.ttf,.otf"
                  className="hidden"
                  onChange={handleBrandingFontFileSelected}
                />
                {fontUrl ? (
                  <a
                    href={fontUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-green-700 hover:underline"
                  >
                    Font file
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">(default)</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Препоръка: WOFF2 (най-добре), иначе WOFF/TTF/OTF. До ~2MB.
              </p>
              <p
                className="mt-2 rounded-md border px-3 py-2 text-xs"
                style={ALERT_NOTICE_STYLE}
              >
                Качените custom font-ове трябва да са със закупен лиценз.
              </p>

              <div className="mt-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span>Font license (optional)</span>
                  <InfoTooltip
                    label="Font license info"
                    title="Font license"
                    description="По желание: качи license файл (PDF/TXT/DOCX/IMG и т.н.), за да има доказателство за закупен лиценз. Не е задължително."
                  />
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBrandingFontLicenseUploadClick}
                    disabled={saving}
                    className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Upload license
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void persistBrandingField(
                        { fontLicenseUrl: null },
                        "License файлът е премахнат.",
                      );
                      setFontLicenseUrl("");
                    }}
                    disabled={saving || fontLicenseUrl.trim().length === 0}
                    className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove
                  </button>
                  <input
                    ref={fontLicenseFileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md,.rtf,.doc,.docx,.odt,image/*,.zip"
                    className="hidden"
                    onChange={handleBrandingFontLicenseFileSelected}
                  />
                  {fontLicenseUrl ? (
                    <a
                      href={fontLicenseUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-green-700 hover:underline"
                    >
                      License file
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500">(optional)</span>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <span>Google font (self-host, без външни заявки)</span>
                  <InfoTooltip
                    label="Google font info"
                    title="Google font (self-host)"
                    description="Избор от предварително включени @fontsource font-ове (без външни заявки). Ако има качен custom font файл, той има приоритет."
                  />
                </label>
                {(() => {
                  return (
                    <div className="flex flex-wrap items-center gap-2">
                      <ListboxSelect
                        ariaLabel="Google font"
                        value={googleFont}
                        disabled={saving}
                        onChange={(next) => {
                          setGoogleFont(next);
                          void persistBrandingField(
                            { googleFont: next || null },
                            "Google font изборът е запазен.",
                          );
                        }}
                        options={[
                          { value: "", label: "(custom upload или системен)" },
                          ...GOOGLE_FONTS.map((f) => ({
                            value: f.value,
                            label: `${f.label}${!f.supportsCyrillic ? " (Latin-only)" : ""}`,
                          })),
                        ]}
                      />
                    </div>
                  );
                })()}
                <p className="text-xs text-gray-500">
                  Статичен списък с популярни Google Fonts, self-host през
                  @fontsource.
                </p>

                <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                  <p className="text-xs font-semibold text-gray-700">
                    Преглед:
                  </p>
                  <p
                    className="mt-2 text-base text-gray-900"
                    style={
                      GOOGLE_FONTS.find((f) => f.value === googleFont)
                        ?.sampleStyle
                    }
                  >
                    Пример: Табло, Курсове, Потребители, Метрики, Активност.
                    Бърза проверка на кирилица: „Жълтият щъркел“.
                  </p>
                </div>

                <div className="mt-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      Per-language overrides
                    </p>
                    <InfoTooltip
                      label="Per-language overrides info"
                      title="Per-language overrides"
                      description="Override на font настройки по език. Празно означава, че ще се използват глобалните настройки за Font/Google font."
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Празно = използвай глобалните настройки.
                  </p>

                  <div className="mt-3 space-y-3">
                    {supportedLangs.map((code) => {
                      const langCode = (code ?? "").trim().toLowerCase();
                      const langUsesCyrillic = CYRILLIC_LANGS.has(langCode);
                      const perLangGoogle = googleFontByLang?.[langCode] ?? "";
                      const perLangFontUrl = fontUrlByLang?.[langCode] ?? "";
                      const perLangLicenseUrl =
                        fontLicenseUrlByLang?.[langCode] ?? "";

                      return (
                        <div
                          key={langCode}
                          className="rounded-md border border-gray-200 bg-gray-50 p-3"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-semibold text-gray-900">
                              {langCode}
                            </span>

                            <div className="min-w-[240px] flex-1">
                              <ListboxSelect
                                ariaLabel={`Google font (${langCode})`}
                                value={perLangGoogle}
                                disabled={saving}
                                onChange={(next) => {
                                  setGoogleFontByLang((prev) =>
                                    upsertStringDictionary(
                                      prev,
                                      langCode,
                                      next,
                                    ),
                                  );
                                  void persistBrandingField(
                                    {
                                      googleFontByLang: {
                                        [langCode]: next || null,
                                      },
                                    },
                                    `Google font (${langCode}) изборът е запазен.`,
                                  );
                                }}
                                options={[
                                  { value: "", label: "(use global)" },
                                  ...GOOGLE_FONTS.filter(
                                    (f) =>
                                      !(
                                        langUsesCyrillic && !f.supportsCyrillic
                                      ),
                                  ).map((f) => ({
                                    value: f.value,
                                    label: f.label,
                                  })),
                                ]}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleBrandingFontUploadClickForLang(langCode)
                              }
                              disabled={saving}
                              className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Upload font
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setFontUrlByLang((prev) =>
                                  upsertStringDictionary(prev, langCode, null),
                                );
                                void persistBrandingField(
                                  { fontUrlByLang: { [langCode]: null } },
                                  `Font (${langCode}) е премахнат.`,
                                );
                              }}
                              disabled={
                                saving || perLangFontUrl.trim().length === 0
                              }
                              className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Remove
                            </button>

                            {perLangFontUrl ? (
                              <a
                                href={perLangFontUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-green-700 hover:underline"
                              >
                                Font file
                              </a>
                            ) : (
                              <span className="text-xs text-gray-500">
                                (global)
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleBrandingFontLicenseUploadClickForLang(
                                  langCode,
                                )
                              }
                              disabled={saving}
                              className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Upload license
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setFontLicenseUrlByLang((prev) =>
                                  upsertStringDictionary(prev, langCode, null),
                                );
                                void persistBrandingField(
                                  {
                                    fontLicenseUrlByLang: { [langCode]: null },
                                  },
                                  `License (${langCode}) е премахнат.`,
                                );
                              }}
                              disabled={
                                saving || perLangLicenseUrl.trim().length === 0
                              }
                              className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Remove
                            </button>

                            {perLangLicenseUrl ? (
                              <a
                                href={perLangLicenseUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-green-700 hover:underline"
                              >
                                License file
                              </a>
                            ) : (
                              <span className="text-xs text-gray-500">
                                (optional)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <input
                    ref={perLangFontFileInputRef}
                    type="file"
                    accept=".woff2,.woff,.ttf,.otf"
                    className="hidden"
                    onChange={handleBrandingFontFileSelectedForLang}
                  />
                  <input
                    ref={perLangFontLicenseFileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md,.rtf,.doc,.docx,.odt,image/*,.zip"
                    className="hidden"
                    onChange={handleBrandingFontLicenseFileSelectedForLang}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span>Cursor</span>
                <InfoTooltip
                  label="Cursor info"
                  title="Cursor"
                  description="Качи иконка за custom cursor. Може да има общ cursor или отделни light/dark. След промяна: refresh-ни страницата."
                />
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCursorUploadClick}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload cursor icon
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void persistBrandingField(
                      { cursorUrl: null },
                      "Cursor е премахнат.",
                    );
                  }}
                  disabled={saving || cursorUrl.trim().length === 0}
                  className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
                <input
                  ref={cursorFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCursorFileSelected}
                />
                {cursorUrl ? (
                  <a
                    href={cursorUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                    aria-label="Cursor image preview"
                    title="Open cursor image"
                  >
                    <Image
                      src={cursorUrl}
                      alt="Cursor"
                      width={28}
                      height={28}
                      className="h-7 w-7"
                      unoptimized
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">(disabled)</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Препоръка: PNG, малка иконка (между 32x32 и 50x50). След upload
                натисни Save и refresh-нете страницата.
              </p>

              <div className="mt-6">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span>Cursor (Light)</span>
                  <InfoTooltip
                    label="Cursor light info"
                    title="Cursor (Light)"
                    description="Cursor само за Light тема. Ако липсва, използваме общия cursor."
                  />
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCursorLightUploadClick}
                    disabled={saving}
                    className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Upload cursor (light)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void persistBrandingField(
                        { cursorLightUrl: null },
                        "Cursor (light) е премахнат.",
                      );
                    }}
                    disabled={saving || cursorLightUrl.trim().length === 0}
                    className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove
                  </button>
                  <input
                    ref={cursorLightFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCursorLightFileSelected}
                  />
                  {cursorLightUrl ? (
                    <a
                      href={cursorLightUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                      aria-label="Cursor light image preview"
                      title="Open cursor (light) image"
                    >
                      <Image
                        src={cursorLightUrl}
                        alt="Cursor light"
                        width={28}
                        height={28}
                        className="h-7 w-7"
                        unoptimized
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500">(fallback)</span>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span>Cursor (Dark)</span>
                  <InfoTooltip
                    label="Cursor dark info"
                    title="Cursor (Dark)"
                    description="Cursor само за Dark тема. Ако липсва, използваме общия cursor."
                  />
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCursorDarkUploadClick}
                    disabled={saving}
                    className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Upload cursor (dark)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void persistBrandingField(
                        { cursorDarkUrl: null },
                        "Cursor (dark) е премахнат.",
                      );
                    }}
                    disabled={saving || cursorDarkUrl.trim().length === 0}
                    className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove
                  </button>
                  <input
                    ref={cursorDarkFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCursorDarkFileSelected}
                  />
                  {cursorDarkUrl ? (
                    <a
                      href={cursorDarkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                      aria-label="Cursor dark image preview"
                      title="Open cursor (dark) image"
                    >
                      <Image
                        src={cursorDarkUrl}
                        alt="Cursor dark"
                        width={28}
                        height={28}
                        className="h-7 w-7"
                        unoptimized
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500">(fallback)</span>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span>Hover Cursor (Links/Buttons)</span>
                  <InfoTooltip
                    label="Hover cursor info"
                    title="Hover Cursor (Links/Buttons)"
                    description="Cursor иконка, която се показва при hover върху линкове/бутони. Ако липсва, ще се използва regular cursor."
                  />
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCursorPointerUploadClick}
                    disabled={saving}
                    className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Upload hover cursor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void persistBrandingField(
                        { cursorPointerUrl: null },
                        "Hover cursor е премахнат.",
                      );
                    }}
                    disabled={saving || cursorPointerUrl.trim().length === 0}
                    className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove
                  </button>
                  <input
                    ref={cursorPointerFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCursorPointerFileSelected}
                  />
                  {cursorPointerUrl ? (
                    <a
                      href={cursorPointerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                      aria-label="Hover cursor image preview"
                      title="Open hover cursor image"
                    >
                      <Image
                        src={cursorPointerUrl}
                        alt="Hover cursor"
                        width={28}
                        height={28}
                        className="h-7 w-7"
                        unoptimized
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500">(fallback)</span>
                  )}
                </div>

                <div className="mt-6">
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span>Hover Cursor (Light)</span>
                    <InfoTooltip
                      label="Hover cursor light info"
                      title="Hover Cursor (Light)"
                      description="Hover cursor само за Light тема. Ако липсва, използваме hover cursor (общия) или regular cursor."
                    />
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCursorPointerLightUploadClick}
                      disabled={saving}
                      className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Upload hover cursor (light)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void persistBrandingField(
                          { cursorPointerLightUrl: null },
                          "Hover cursor (light) е премахнат.",
                        );
                      }}
                      disabled={
                        saving || cursorPointerLightUrl.trim().length === 0
                      }
                      className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Remove
                    </button>
                    <input
                      ref={cursorPointerLightFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCursorPointerLightFileSelected}
                    />
                    {cursorPointerLightUrl ? (
                      <a
                        href={cursorPointerLightUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                        aria-label="Hover cursor light image preview"
                        title="Open hover cursor (light) image"
                      >
                        <Image
                          src={cursorPointerLightUrl}
                          alt="Hover cursor light"
                          width={28}
                          height={28}
                          className="h-7 w-7"
                          unoptimized
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500">(fallback)</span>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span>Hover Cursor (Dark)</span>
                    <InfoTooltip
                      label="Hover cursor dark info"
                      title="Hover Cursor (Dark)"
                      description="Hover cursor само за Dark тема. Ако липсва, използваме hover cursor (общия) или regular cursor."
                    />
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCursorPointerDarkUploadClick}
                      disabled={saving}
                      className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Upload hover cursor (dark)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void persistBrandingField(
                          { cursorPointerDarkUrl: null },
                          "Hover cursor (dark) е премахнат.",
                        );
                      }}
                      disabled={
                        saving || cursorPointerDarkUrl.trim().length === 0
                      }
                      className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Remove
                    </button>
                    <input
                      ref={cursorPointerDarkFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCursorPointerDarkFileSelected}
                    />
                    {cursorPointerDarkUrl ? (
                      <a
                        href={cursorPointerDarkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                        aria-label="Hover cursor dark image preview"
                        title="Open hover cursor (dark) image"
                      >
                        <Image
                          src={cursorPointerDarkUrl}
                          alt="Hover cursor dark"
                          width={28}
                          height={28}
                          className="h-7 w-7"
                          unoptimized
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500">(fallback)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid max-w-md grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    Hotspot X
                    <InfoTooltip
                      label="Cursor hotspot X"
                      title="Cursor hotspot X"
                      description="Пикселно изместване по хоризонтал от горния ляв ъгъл на иконата до точката на клик."
                    />
                  </label>
                  <input
                    value={cursorHotspotX}
                    onChange={(e) => setCursorHotspotX(e.target.value)}
                    onBlur={() => {
                      void persistCursorHotspot();
                    }}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="напр. 8"
                    disabled={saving}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    Hotspot Y
                    <InfoTooltip
                      label="Cursor hotspot Y"
                      title="Cursor hotspot Y"
                      description="Пикселно изместване по вертикал от горния ляв ъгъл на иконата до точката на клик."
                    />
                  </label>
                  <input
                    value={cursorHotspotY}
                    onChange={(e) => setCursorHotspotY(e.target.value)}
                    onBlur={() => {
                      void persistCursorHotspot();
                    }}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="напр. 8"
                    disabled={saving}
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="mt-2 max-w-md text-xs text-gray-500">
                {cursorHotspotPersistStatus === "saving" ? (
                  <span>Saving…</span>
                ) : cursorHotspotPersistStatus === "saved" ? (
                  <span className="font-semibold text-green-700">Saved</span>
                ) : cursorHotspotPersistStatus === "error" ? (
                  <span className="font-semibold text-red-700">
                    Save failed
                  </span>
                ) : (
                  <span> </span>
                )}
              </div>

              <div className="mt-4 max-w-md rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Hotspot tester
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Движи мишката в кутията: червената точка показва реалната
                      точка на клик (hotspot). Иконката се рисува с отместването
                      X/Y.
                    </p>
                  </div>
                  <InfoTooltip
                    label="Hotspot tester info"
                    title="Как да тествам hotspot-а?"
                    description={
                      <div className="space-y-2">
                        <p>1) Настрой Hotspot X/Y.</p>
                        <p>
                          2) В кутията отдолу целта е червената точка да съвпада
                          с мястото, което визуално считаш за “връх” на курсора.
                        </p>
                        <p>
                          3) Ако изглежда изместено, промени X/Y и пробвай пак.
                        </p>
                      </div>
                    }
                  />
                </div>

                <div
                  className="relative mt-3 h-40 w-full rounded-md border border-dashed border-gray-300 bg-gray-50"
                  style={{ cursor: resolvedCursorUrl ? "none" : "default" }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setCursorHotspotTestPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onMouseLeave={() => setCursorHotspotTestPos(null)}
                  onClick={() => {
                    if (cursorHotspotTestPos) {
                      setCursorHotspotTestClickPos(cursorHotspotTestPos);
                    }
                  }}
                >
                  {resolvedCursorUrl && cursorHotspotTestPos ? (
                    (() => {
                      const xRaw = Number((cursorHotspotX ?? "").trim());
                      const yRaw = Number((cursorHotspotY ?? "").trim());
                      const hotspotX = Number.isFinite(xRaw) ? xRaw : 8;
                      const hotspotY = Number.isFinite(yRaw) ? yRaw : 8;
                      return (
                        <>
                          <div
                            className="pointer-events-none absolute z-20 h-2 w-2 rounded-full bg-red-600"
                            style={{
                              left: cursorHotspotTestPos.x,
                              top: cursorHotspotTestPos.y,
                              transform: "translate(-50%, -50%)",
                            }}
                          />
                          <Image
                            src={resolvedCursorUrl}
                            alt="Cursor test"
                            width={32}
                            height={32}
                            className="pointer-events-none absolute z-10"
                            style={{
                              left: cursorHotspotTestPos.x - hotspotX,
                              top: cursorHotspotTestPos.y - hotspotY,
                            }}
                            unoptimized
                          />
                        </>
                      );
                    })()
                  ) : (
                    <div className="absolute left-3 top-3 text-xs text-gray-500">
                      {resolvedCursorUrl
                        ? "Движи мишката вътре за визуализация"
                        : "Качи cursor icon (или light/dark) за да тестваш hotspot"}
                    </div>
                  )}
                </div>

                {cursorHotspotTestClickPos ? (
                  <p className="mt-2 text-xs text-gray-600">
                    Last click: x={Math.round(cursorHotspotTestClickPos.x)}, y=
                    {Math.round(cursorHotspotTestClickPos.y)}
                  </p>
                ) : null}
              </div>

              <div className="mt-6">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span>Footer & Social links</span>
                  <InfoTooltip
                    label="Footer & Social links info"
                    title="Footer & Social links"
                    description="Линкове към социални мрежи във footer-а. Можеш да включваш/изключваш predefined (Facebook/X/YouTube) и да добавяш custom линкове. По желание: качи custom икони за Light/Dark."
                  />
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Промените по URL/label/enabled се записват при Save.
                </p>

                <div className="mt-3 rounded-md border border-gray-200 bg-white p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span>Powered by BeeLMS</span>
                        <InfoTooltip
                          label="Powered by BeeLMS info"
                          title="Powered by BeeLMS"
                          description="Показва текст във footer-а. По желание можеш да зададеш URL, който да отвори линка при клик. URL трябва да е валиден http/https адрес."
                        />
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Показва текст във footer-а. По желание можеш да зададеш
                        URL.
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={poweredByBeeLmsEnabled}
                      disabled={saving}
                      label="Powered by BeeLMS enabled"
                      onChange={(next) => handleTogglePoweredByBeeLms(next)}
                    />
                  </div>
                  {poweredByBeeLmsToggleError ? (
                    <p className="mt-2 text-xs text-red-600" role="alert">
                      {poweredByBeeLmsToggleError}
                    </p>
                  ) : null}
                  <div className="mt-3 max-w-md">
                    <label className="text-sm font-medium text-gray-700">
                      URL (optional)
                    </label>
                    <input
                      ref={poweredByBeeLmsUrlRef}
                      value={poweredByBeeLmsUrl}
                      onChange={(e) => setPoweredByBeeLmsUrl(e.target.value)}
                      onInput={() => {
                        if (poweredByBeeLmsToggleError) {
                          setPoweredByBeeLmsToggleError(null);
                        }
                      }}
                      disabled={saving || !poweredByBeeLmsEnabled}
                      className={`mt-2 w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 ${
                        poweredByBeeLmsUrl.trim().length > 0 &&
                        !isValidOptionalHttpUrl(poweredByBeeLmsUrl)
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-green-500 focus:ring-green-500"
                      }`}
                      placeholder="https://beelms.com"
                    />
                    {poweredByBeeLmsUrl.trim().length > 0 &&
                    !isValidOptionalHttpUrl(poweredByBeeLmsUrl) ? (
                      <p className="mt-1 text-xs text-red-600">
                        Невалиден URL. Използвай http:// или https://
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  {footerSocialLinks.map((link) => {
                    const isCustom = link.type === "custom";
                    const resolvedLabel =
                      link.label ??
                      (link.type === "facebook"
                        ? "Facebook"
                        : link.type === "youtube"
                          ? "YouTube"
                          : link.type === "x"
                            ? "X"
                            : "Link");

                    return (
                      <div
                        key={link.id}
                        className="rounded-md border border-gray-200 bg-white p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {resolvedLabel}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              type:{" "}
                              <span className="font-semibold">{link.type}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <ToggleSwitch
                              checked={link.enabled !== false}
                              disabled={saving}
                              label={`Footer social ${link.id} enabled`}
                              onChange={(next) =>
                                handleToggleFooterSocialLink(link.id, next)
                              }
                            />
                            {isCustom ? (
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => {
                                  const ok = window.confirm(
                                    "Сигурен ли си, че искаш да изтриеш този custom social link?",
                                  );
                                  if (!ok) return;
                                  setFooterSocialLinks((prev) =>
                                    prev.filter((l) => l.id !== link.id),
                                  );
                                }}
                                className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <span>ID</span>
                              <InfoTooltip
                                label="Footer social id info"
                                title="ID"
                                description="Уникален идентификатор (slug) за линка. Използва се за upload на иконите. Само малки букви/цифри, '-' и '_'."
                              />
                            </label>
                            <input
                              value={link.id}
                              disabled={saving || !isCustom}
                              onChange={(e) => {
                                const next = e.target.value
                                  .trim()
                                  .toLowerCase();
                                if (!next) return;
                                if (!isValidFooterSocialId(next)) {
                                  return;
                                }
                                setFooterSocialLinks((prev) => {
                                  if (prev.some((l) => l.id === next)) {
                                    return prev;
                                  }
                                  return prev.map((l) =>
                                    l.id === link.id ? { ...l, id: next } : l,
                                  );
                                });
                              }}
                              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            />
                            {!isCustom ? (
                              <p className="mt-1 text-xs text-gray-500">
                                (predefined)
                              </p>
                            ) : null}
                          </div>

                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <span>Label</span>
                              <InfoTooltip
                                label="Footer social label info"
                                title="Label"
                                description="Текст, който се показва до иконата във footer-а."
                              />
                            </label>
                            <input
                              value={link.label ?? ""}
                              disabled={saving}
                              onChange={(e) => {
                                const v = e.target.value;
                                setFooterSocialLinks((prev) =>
                                  prev.map((l) =>
                                    l.id === link.id
                                      ? { ...l, label: v || null }
                                      : l,
                                  ),
                                );
                              }}
                              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder={resolvedLabel}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <span>URL</span>
                              <InfoTooltip
                                label="Footer social url info"
                                title="URL"
                                description="Линк към социалната мрежа. Препоръка: https://..."
                              />
                            </label>
                            {(() => {
                              const rawUrl = link.url ?? "";
                              const trimmed = rawUrl.trim();
                              const invalid =
                                trimmed.length > 0 &&
                                !isValidFooterSocialUrl(link.type, trimmed);
                              return invalid ? (
                                <p className="mt-1 text-xs text-red-600">
                                  {footerSocialUrlErrorMessage(link.type)}
                                </p>
                              ) : null;
                            })()}
                            <input
                              value={link.url ?? ""}
                              disabled={saving}
                              ref={(el) => {
                                footerSocialUrlRefs.current[link.id] = el;
                              }}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (footerSocialToggleErrors[link.id]) {
                                  setFooterSocialToggleErrors((prev) => ({
                                    ...prev,
                                    [link.id]: null,
                                  }));
                                }
                                setFooterSocialLinks((prev) =>
                                  prev.map((l) =>
                                    l.id === link.id
                                      ? { ...l, url: v || null }
                                      : l,
                                  ),
                                );
                              }}
                              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder="https://..."
                            />
                            {footerSocialToggleErrors[link.id] ? (
                              <p
                                className="mt-1 text-xs text-red-600"
                                role="alert"
                              >
                                {footerSocialToggleErrors[link.id]}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {isCustom ? (
                          <div className="mt-4">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <span>Predefined icon</span>
                              <InfoTooltip
                                label="Footer social icon key info"
                                title="Predefined icon"
                                description="Избери икона за custom линк. Ако качиш custom icon (Light/Dark), той ще има приоритет."
                              />
                            </label>
                            <FooterSocialIconPicker
                              value={link.iconKey ?? null}
                              disabled={saving}
                              onChange={(nextKey) => {
                                setFooterSocialLinks((prev) =>
                                  prev.map((l) =>
                                    l.id === link.id
                                      ? { ...l, iconKey: nextKey }
                                      : l,
                                  ),
                                );
                              }}
                            />
                          </div>
                        ) : null}

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <span>Icon (Light)</span>
                              <InfoTooltip
                                label="Footer social icon light info"
                                title="Icon (Light)"
                                description="По желание: custom икона за Light тема. Ако няма, ще се ползва built-in иконата."
                              />
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  handleFooterSocialIconUploadClick(
                                    link.id,
                                    "light",
                                  )
                                }
                                disabled={saving}
                                className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Upload
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextList = footerSocialLinks.map((l) =>
                                    l.id === link.id
                                      ? { ...l, iconLightUrl: null }
                                      : l,
                                  );
                                  setFooterSocialLinks(nextList);
                                  void persistBrandingField(
                                    { footerSocialLinks: nextList },
                                    "Footer social icon (light) е премахнат.",
                                  );
                                }}
                                disabled={
                                  saving || !(link.iconLightUrl ?? "").trim()
                                }
                                className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Remove
                              </button>
                              {(link.iconLightUrl ?? "").trim() ? (
                                <a
                                  href={link.iconLightUrl ?? ""}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                                  aria-label="Footer icon light preview"
                                  title="Open icon (light)"
                                >
                                  <Image
                                    src={link.iconLightUrl ?? ""}
                                    alt="Footer icon light"
                                    width={28}
                                    height={28}
                                    className="h-7 w-7"
                                    unoptimized
                                    loading="lazy"
                                  />
                                </a>
                              ) : (
                                <span className="text-xs text-gray-500">
                                  (built-in)
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <span>Icon (Dark)</span>
                              <InfoTooltip
                                label="Footer social icon dark info"
                                title="Icon (Dark)"
                                description="По желание: custom икона за Dark тема. Ако няма, ще се ползва built-in иконата."
                              />
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  handleFooterSocialIconUploadClick(
                                    link.id,
                                    "dark",
                                  )
                                }
                                disabled={saving}
                                className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Upload
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextList = footerSocialLinks.map((l) =>
                                    l.id === link.id
                                      ? { ...l, iconDarkUrl: null }
                                      : l,
                                  );
                                  setFooterSocialLinks(nextList);
                                  void persistBrandingField(
                                    { footerSocialLinks: nextList },
                                    "Footer social icon (dark) е премахнат.",
                                  );
                                }}
                                disabled={
                                  saving || !(link.iconDarkUrl ?? "").trim()
                                }
                                className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Remove
                              </button>
                              {(link.iconDarkUrl ?? "").trim() ? (
                                <a
                                  href={link.iconDarkUrl ?? ""}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1 shadow-sm hover:bg-gray-50"
                                  aria-label="Footer icon dark preview"
                                  title="Open icon (dark)"
                                >
                                  <Image
                                    src={link.iconDarkUrl ?? ""}
                                    alt="Footer icon dark"
                                    width={28}
                                    height={28}
                                    className="h-7 w-7"
                                    unoptimized
                                    loading="lazy"
                                  />
                                </a>
                              ) : (
                                <span className="text-xs text-gray-500">
                                  (built-in)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          const rawId = window.prompt(
                            "ID за custom линк (само a-z, 0-9, '-' и '_')",
                            `custom-${Date.now()}`,
                          );
                          if (rawId === null) return;
                          const id = rawId.trim().toLowerCase();
                          if (!id || !isValidFooterSocialId(id)) {
                            window.alert("Невалиден ID.");
                            return;
                          }
                          if (footerSocialLinks.some((l) => l.id === id)) {
                            window.alert("ID вече съществува.");
                            return;
                          }
                          setFooterSocialLinks((prev) => [
                            ...prev,
                            {
                              id,
                              type: "custom",
                              label: "",
                              url: null,
                              enabled: true,
                              iconLightUrl: null,
                              iconDarkUrl: null,
                            },
                          ]);
                        }}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Add custom link
                      </button>
                      <InfoTooltip
                        label="Add custom link info"
                        title="Add custom link"
                        description="Добавя нов custom линк във footer-а. След като го добавиш, попълни Label + URL и натисни Save. ID-то се използва и за upload на иконите."
                      />
                    </div>
                  </div>
                </div>

                <input
                  ref={footerSocialIconInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleFooterSocialIconSelected}
                />
              </div>
            </div>
          </AccordionSection>

          <AccordionSection
            title="Metadata & SEO"
            description="Browser title + Social metadata (Open Graph/Twitter) и (ако е активирано) safe SEO настройки като canonical base URL, title template, robots и sitemap."
            headerAdornment={
              <InfoTooltip
                label="Какво включва Metadata & SEO"
                title="Metadata & SEO"
                description={
                  <div className="space-y-2">
                    <p className="text-sm">
                      Настрой задаването на meta тагове при споделяне на
                      платформата в социални мрежи.
                    </p>
                    <ul className="list-inside list-disc text-sm leading-relaxed">
                      <li>Качи fallback social изображение и описание.</li>
                      <li>
                        Поддържай Open Graph и Twitter карти (summary, app,
                        player).
                      </li>
                      <li>
                        По желание: включи SEO (canonical URL, title template,
                        robots, sitemap).
                      </li>
                      <li>
                        Виж live preview + meta snippet и бързи линкове към
                        външни валидатори.
                      </li>
                    </ul>
                  </div>
                }
              />
            }
            open={Boolean(openSections.metadata)}
            onToggle={() => toggleSection("metadata")}
          >
            <div className="mt-4 space-y-6">
              {seoEnabled ? (
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">SEO</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Safe SEO настройки за публичните страници.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span>Base URL (canonical)</span>
                        <InfoTooltip
                          label="Base URL info"
                          title="Base URL (canonical)"
                          description="Базовият домейн за canonical URL-и. Ако е празно, системата няма да добавя canonical тагове."
                        />
                      </label>
                      <input
                        value={seoBaseUrl}
                        onChange={(e) => setSeoBaseUrl(e.target.value)}
                        disabled={saving}
                        placeholder="https://example.com"
                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span>Title template</span>
                        <InfoTooltip
                          label="Title template info"
                          title="Title template"
                          description="Шаблон за заглавие. Позволени placeholders: {page} и {site}. Други символи се филтрират за безопасност."
                        />
                      </label>
                      <input
                        value={seoTitleTemplate}
                        onChange={(e) => setSeoTitleTemplate(e.target.value)}
                        disabled={saving}
                        placeholder="{page} | {site}"
                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Разрешени placeholders: {"{page}"} и {"{site}"}.
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span>Default title</span>
                        <InfoTooltip
                          label="Default title info"
                          title="Default title"
                          description="Fallback заглавие за страници без специфично заглавие."
                        />
                      </label>
                      <input
                        value={seoDefaultTitle}
                        onChange={(e) => setSeoDefaultTitle(e.target.value)}
                        disabled={saving}
                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span>Default description</span>
                        <InfoTooltip
                          label="Default description info"
                          title="Default description"
                          description="Fallback описание за meta description."
                        />
                      </label>
                      <input
                        value={seoDefaultDescription}
                        onChange={(e) =>
                          setSeoDefaultDescription(e.target.value)
                        }
                        disabled={saving}
                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-md border border-gray-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <span>Robots index</span>
                          <InfoTooltip
                            label="Robots index info"
                            title="Robots index"
                            description="Когато е изключено, системата може да задава noindex (ако има имплементация на публичните страници)."
                          />
                        </span>
                        <ToggleSwitch
                          checked={seoRobotsIndex}
                          disabled={saving}
                          label="Robots index"
                          onChange={(next) => setSeoRobotsIndex(next)}
                        />
                      </div>
                    </div>

                    <div className="rounded-md border border-gray-200 bg-white p-3">
                      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span>Sitemap</span>
                        <InfoTooltip
                          label="Sitemap info"
                          title="Sitemap"
                          description="Контролира дали sitemap се генерира и кои секции се включват."
                        />
                      </p>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-700">Enabled</span>
                          <ToggleSwitch
                            checked={seoSitemapEnabled}
                            disabled={saving}
                            label="Sitemap enabled"
                            onChange={(next) => setSeoSitemapEnabled(next)}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-700">Wiki</span>
                          <ToggleSwitch
                            checked={seoSitemapIncludeWiki}
                            disabled={saving}
                            label="Sitemap wiki"
                            onChange={(next) => setSeoSitemapIncludeWiki(next)}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-700">Courses</span>
                          <ToggleSwitch
                            checked={seoSitemapIncludeCourses}
                            disabled={saving}
                            label="Sitemap courses"
                            onChange={(next) =>
                              setSeoSitemapIncludeCourses(next)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-700">Legal</span>
                          <ToggleSwitch
                            checked={seoSitemapIncludeLegal}
                            disabled={saving}
                            label="Sitemap legal"
                            onChange={(next) => setSeoSitemapIncludeLegal(next)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-gray-500">
                  Промените в тази секция влизат в сила след Save.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleUndoSocialMetadataChanges}
                    disabled={
                      saving ||
                      !socialMetadataLastSaved ||
                      !isSocialMetadataDirty
                    }
                    className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Undo changes
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSocialMetadata}
                    disabled={saving}
                    className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reset social metadata
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Guidelines
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Практични препоръки за да изглежда добре при споделяне.
                    </p>
                  </div>
                  <StatusBadge
                    variant={
                      ogSectionHasContent || twitterSectionHasContent
                        ? "ok"
                        : "missing"
                    }
                    label={
                      ogSectionHasContent || twitterSectionHasContent
                        ? "HAS META"
                        : "EMPTY"
                    }
                  />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-gray-700 md:grid-cols-2">
                  <div>
                    <p className="font-semibold text-gray-900">Images</p>
                    <p className="mt-1">
                      1200×630px (1.91:1), JPG/PNG/WEBP, ≤1MB.
                    </p>
                    <p className="mt-1">Избягвай прозрачност за OG.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Text</p>
                    <p className="mt-1">
                      Title: ~50–70 символа (не е твърд лимит).
                    </p>
                    <p className="mt-1">Description: ~120–200 символа.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Twitter cards</p>
                    <p className="mt-1">
                      summary / summary_large_image: стандартни preview карти.
                    </p>
                    <p className="mt-1">
                      app: за мобилни приложения (App IDs).
                    </p>
                    <p className="mt-1">
                      player: за embedded video/audio (player URL + размери).
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Fallbacks</p>
                    <p className="mt-1">
                      Shared image/description се ползват ако OG/Twitter са
                      празни.
                    </p>
                    <p className="mt-1">
                      За app/player без задължителни полета падаме на
                      summary_large_image.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      <span>Browser title</span>
                      <InfoTooltip
                        label="Browser title info"
                        title="Browser title"
                        description="Това е заглавието в браузър таба. Използва се и като база, ако OG/Twitter title са празни."
                      />
                    </span>
                    <StatusBadge
                      variant={
                        browserTitle.trim().length > 0 ? "ok" : "fallback"
                      }
                      label={browserTitle.trim().length > 0 ? "SET" : "APPNAME"}
                    />
                  </label>
                  <input
                    value={browserTitle}
                    onChange={(e) => setBrowserTitle(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="BeeLMS"
                    disabled={saving}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ако е празно, ще се използва App name.
                  </p>
                </div>
                <div>
                  <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      <span>Shared social image (fallback)</span>
                      <InfoTooltip
                        label="Shared social image info"
                        title="Shared social image"
                        description="Общо изображение при споделяне. Използва се, ако OG или Twitter image липсват."
                      />
                    </span>
                    <StatusBadge
                      variant={
                        socialImageUrl.trim().length > 0 ? "ok" : "missing"
                      }
                      label={socialImageUrl.trim().length > 0 ? "SET" : "EMPTY"}
                    />
                  </label>
                  <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                    <input
                      value={socialImageUrl}
                      onChange={(e) => setSocialImageUrl(e.target.value)}
                      className="w-full flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="https://..."
                      disabled={saving}
                    />
                    <div className="flex flex-shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSocialImageUploadClick("shared")}
                        disabled={saving || isUploadingSharedImage}
                        className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUploadingSharedImage ? "Качване..." : "Upload image"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSocialImageUrl("")}
                        disabled={saving || socialImageUrl.length === 0}
                        className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <input
                    ref={socialImageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleSocialImageFileSelected("shared")}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Общ fallback за всяка платформа. Препоръки: 1200x630px,
                    JPG/PNG/WEBP, ≤1MB.
                  </p>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-2">
                    <span>Shared social description</span>
                    <InfoTooltip
                      label="Shared social description info"
                      title="Shared social description"
                      description="Общо описание при споделяне. Използва се, ако OG или Twitter description липсват."
                    />
                  </span>
                  <StatusBadge
                    variant={
                      socialDescription.trim().length > 0 ? "ok" : "missing"
                    }
                    label={
                      socialDescription.trim().length > 0 ? "SET" : "EMPTY"
                    }
                  />
                </label>
                <textarea
                  value={socialDescription}
                  onChange={(e) => setSocialDescription(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Използва се, когато OG/Twitter description са празни."
                  disabled={saving}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Общ fallback текст. Ако OG или Twitter description са празни,
                  ще се използва това описание.
                </p>
              </div>

              <div
                className={`rounded-lg border px-4 py-4 transition-colors ${metadataSectionAccent(
                  ogSectionHasContent,
                )}`}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Open Graph
                  </p>
                  <p className="text-xs text-gray-500">
                    Използва се от Facebook/LinkedIn и други платформи.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span>OG title</span>
                        <InfoTooltip
                          label="OG title info"
                          title="OG title"
                          description="Заглавие за Open Graph (Facebook/LinkedIn). Ако е празно, падаме към Browser title."
                        />
                      </span>
                      <StatusBadge
                        variant={
                          openGraphTitle.trim().length > 0 ? "ok" : "fallback"
                        }
                        label={
                          openGraphTitle.trim().length > 0 ? "SET" : "BASE"
                        }
                      />
                    </label>
                    <input
                      value={openGraphTitle}
                      onChange={(e) => setOpenGraphTitle(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="(по желание)"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span>OG image URL</span>
                        <InfoTooltip
                          label="OG image info"
                          title="OG image"
                          description="Специално изображение за Open Graph. Ако липсва, използваме Shared social image."
                        />
                      </span>
                      <StatusBadge
                        variant={
                          openGraphImageUrl.trim().length > 0
                            ? "ok"
                            : socialImageUrl.trim().length > 0
                              ? "fallback"
                              : "missing"
                        }
                        label={
                          openGraphImageUrl.trim().length > 0
                            ? "SET"
                            : socialImageUrl.trim().length > 0
                              ? "SHARED"
                              : "EMPTY"
                        }
                      />
                    </label>
                    <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                      <input
                        value={openGraphImageUrl}
                        onChange={(e) => setOpenGraphImageUrl(e.target.value)}
                        className="w-full flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="https://..."
                        disabled={saving}
                      />
                      <div className="flex flex-shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSocialImageUploadClick("open-graph")
                          }
                          disabled={saving || isUploadingOgImage}
                          className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUploadingOgImage ? "Качване..." : "Upload image"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenGraphImageUrl("")}
                          disabled={saving || openGraphImageUrl.length === 0}
                          className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <input
                      ref={openGraphImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleSocialImageFileSelected("open-graph")}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Препоръки: 1200x630px (1.91:1), JPG/PNG/WEBP, ≤1MB, без
                      прозрачност.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span>OG description</span>
                        <InfoTooltip
                          label="OG description info"
                          title="OG description"
                          description="Описание за Open Graph. Ако липсва, използваме Shared social description."
                        />
                      </span>
                      <StatusBadge
                        variant={
                          openGraphDescription.trim().length > 0
                            ? "ok"
                            : socialDescription.trim().length > 0
                              ? "fallback"
                              : "missing"
                        }
                        label={
                          openGraphDescription.trim().length > 0
                            ? "SET"
                            : socialDescription.trim().length > 0
                              ? "SHARED"
                              : "EMPTY"
                        }
                      />
                    </label>
                    <textarea
                      value={openGraphDescription}
                      onChange={(e) => setOpenGraphDescription(e.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="(по желание)"
                      disabled={saving}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <SocialPreviewCard
                      platform="facebook"
                      domain={previewDomain}
                      title={ogPreviewTitle}
                      description={ogPreviewDescription}
                      imageUrl={ogPreviewImage || undefined}
                      twitterCardType={null}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`rounded-lg border px-4 py-4 transition-colors ${metadataSectionAccent(
                  twitterSectionHasContent,
                )}`}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-gray-900">Twitter</p>
                  <p className="text-xs text-gray-500">
                    Използва се от X/Twitter cards.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span>Twitter title</span>
                        <InfoTooltip
                          label="Twitter title info"
                          title="Twitter title"
                          description="Заглавие за X/Twitter cards. Ако липсва, използваме OG title."
                        />
                      </span>
                      <StatusBadge
                        variant={
                          twitterTitle.trim().length > 0 ? "ok" : "fallback"
                        }
                        label={twitterTitle.trim().length > 0 ? "SET" : "OG"}
                      />
                    </label>
                    <input
                      value={twitterTitle}
                      onChange={(e) => setTwitterTitle(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="(по желание)"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span>Twitter image URL</span>
                        <InfoTooltip
                          label="Twitter image info"
                          title="Twitter image"
                          description="Специално изображение за X/Twitter. Ако липсва, използваме Shared social image."
                        />
                      </span>
                      <StatusBadge
                        variant={
                          twitterImageUrl.trim().length > 0
                            ? "ok"
                            : socialImageUrl.trim().length > 0
                              ? "fallback"
                              : "missing"
                        }
                        label={
                          twitterImageUrl.trim().length > 0
                            ? "SET"
                            : socialImageUrl.trim().length > 0
                              ? "SHARED"
                              : "EMPTY"
                        }
                      />
                    </label>
                    <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                      <input
                        value={twitterImageUrl}
                        onChange={(e) => setTwitterImageUrl(e.target.value)}
                        className="w-full flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="https://..."
                        disabled={saving}
                      />
                      <div className="flex flex-shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSocialImageUploadClick("twitter")
                          }
                          disabled={saving || isUploadingTwitterImage}
                          className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUploadingTwitterImage
                            ? "Качване..."
                            : "Upload image"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTwitterImageUrl("")}
                          disabled={saving || twitterImageUrl.length === 0}
                          className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <input
                      ref={twitterImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleSocialImageFileSelected("twitter")}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Ако няма отделно изображение, ще се използва Shared social
                      image.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span>Twitter description</span>
                        <InfoTooltip
                          label="Twitter description info"
                          title="Twitter description"
                          description="Описание за X/Twitter. Ако липсва, падаме към OG description или Shared social description."
                        />
                      </span>
                      <StatusBadge
                        variant={
                          twitterDescription.trim().length > 0
                            ? "ok"
                            : openGraphDescription.trim().length > 0 ||
                                socialDescription.trim().length > 0
                              ? "fallback"
                              : "missing"
                        }
                        label={
                          twitterDescription.trim().length > 0
                            ? "SET"
                            : openGraphDescription.trim().length > 0
                              ? "OG"
                              : socialDescription.trim().length > 0
                                ? "SHARED"
                                : "EMPTY"
                        }
                      />
                    </label>
                    <textarea
                      value={twitterDescription}
                      onChange={(e) => setTwitterDescription(e.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="(по желание)"
                      disabled={saving}
                    />
                  </div>
                  <div className="md:col-span-2 max-w-md">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <span>Twitter card</span>
                      <InfoTooltip
                        label="Информация за Twitter cards"
                        title="Какво е Twitter card?"
                        description={
                          <div className="space-y-2">
                            <p>
                              Twitter card определя как изглежда preview-то при
                              споделяне на линк в X/Twitter.
                            </p>
                            <p>
                              <span className="font-semibold text-gray-900">
                                summary
                              </span>{" "}
                              = компактна карта (малка снимка).
                            </p>
                            <p>
                              <span className="font-semibold text-gray-900">
                                summary_large_image
                              </span>
                              = голяма снимка.
                            </p>
                            <p>
                              <span className="font-semibold text-gray-900">
                                app
                              </span>{" "}
                              = CTA към App Store/Google Play (изисква App name
                              + App ID за iPhone минимум).
                            </p>
                            <p>
                              <span className="font-semibold text-gray-900">
                                player
                              </span>{" "}
                              = embedded player (изисква Player URL +
                              width/height минимум).
                            </p>
                            <p className="text-xs text-gray-500">
                              Ако избереш app/player, но липсват задължителните
                              полета, системата автоматично ще използва
                              summary_large_image, за да не се счупи metadata.
                            </p>
                          </div>
                        }
                      />
                    </label>
                    <div className="mt-2">
                      <ListboxSelect
                        ariaLabel="Twitter card"
                        value={twitterCard}
                        disabled={saving}
                        onChange={(next) => setTwitterCard(next)}
                        options={[
                          {
                            value: "summary_large_image",
                            label: "summary_large_image",
                          },
                          { value: "summary", label: "summary" },
                          { value: "app", label: "app" },
                          { value: "player", label: "player" },
                        ]}
                      />
                    </div>
                  </div>

                  {twitterCard === "app" ? (
                    <div className="md:col-span-2 rounded-md border border-gray-200 bg-white p-4">
                      <p className="text-sm font-semibold text-gray-900">
                        Twitter App card
                      </p>
                      {twitterAppMissingFields.length > 0 ? (
                        <div className="mt-1 text-xs text-red-700">
                          <p className="font-semibold">
                            Липсващи задължителни полета:
                          </p>
                          <ul className="mt-1 list-disc pl-5">
                            {twitterAppMissingFields.map((field) => (
                              <li key={field}>{field}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">
                          App name + App IDs/URLs се използват за Twitter app
                          card meta.
                        </p>
                      )}
                      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            App name
                          </label>
                          <input
                            value={twitterAppName}
                            onChange={(e) => setTwitterAppName(e.target.value)}
                            className={
                              twitterAppNameMissing
                                ? socialInputClassError
                                : socialInputClassOk
                            }
                            placeholder="twitter_app"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            App ID (iPhone)
                          </label>
                          <input
                            value={twitterAppIdIphone}
                            onChange={(e) =>
                              setTwitterAppIdIphone(e.target.value)
                            }
                            className={
                              twitterAppIdIphoneMissing
                                ? socialInputClassError
                                : socialInputClassOk
                            }
                            placeholder="twitter_app://iphone"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            App ID (iPad)
                          </label>
                          <input
                            value={twitterAppIdIpad}
                            onChange={(e) =>
                              setTwitterAppIdIpad(e.target.value)
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="twitter_app://ipad"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            App ID (Google Play)
                          </label>
                          <input
                            value={twitterAppIdGooglePlay}
                            onChange={(e) =>
                              setTwitterAppIdGooglePlay(e.target.value)
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="twitter_app://googleplay"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            App URL (iPhone)
                          </label>
                          <input
                            value={twitterAppUrlIphone}
                            onChange={(e) =>
                              setTwitterAppUrlIphone(e.target.value)
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="https://iphone_url"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            App URL (iPad)
                          </label>
                          <input
                            value={twitterAppUrlIpad}
                            onChange={(e) =>
                              setTwitterAppUrlIpad(e.target.value)
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="https://ipad_url"
                            disabled={saving}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            App URL (Google Play)
                          </label>
                          <input
                            value={twitterAppUrlGooglePlay}
                            onChange={(e) =>
                              setTwitterAppUrlGooglePlay(e.target.value)
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="https://googleplay_url"
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {twitterCard === "player" ? (
                    <div className="md:col-span-2 rounded-md border border-gray-200 bg-white p-4">
                      <p className="text-sm font-semibold text-gray-900">
                        Twitter Player card
                      </p>
                      {twitterPlayerMissingFields.length > 0 ? (
                        <div className="mt-1 text-xs text-red-700">
                          <p className="font-semibold">
                            Липсващи задължителни полета:
                          </p>
                          <ul className="mt-1 list-disc pl-5">
                            {twitterPlayerMissingFields.map((field) => (
                              <li key={field}>{field}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">
                          Player URL/size се използват за embedded player card
                          meta.
                        </p>
                      )}
                      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Player URL
                          </label>
                          <input
                            value={twitterPlayerUrl}
                            onChange={(e) =>
                              setTwitterPlayerUrl(e.target.value)
                            }
                            className={
                              twitterPlayerUrlMissing
                                ? socialInputClassError
                                : socialInputClassOk
                            }
                            placeholder="https://player_url"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Player width
                          </label>
                          <input
                            value={twitterPlayerWidth}
                            onChange={(e) =>
                              setTwitterPlayerWidth(e.target.value)
                            }
                            className={
                              twitterPlayerWidthMissing
                                ? socialInputClassError
                                : socialInputClassOk
                            }
                            placeholder="640"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Player height
                          </label>
                          <input
                            value={twitterPlayerHeight}
                            onChange={(e) =>
                              setTwitterPlayerHeight(e.target.value)
                            }
                            className={
                              twitterPlayerHeightMissing
                                ? socialInputClassError
                                : socialInputClassOk
                            }
                            placeholder="360"
                            disabled={saving}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Player stream URL (optional)
                          </label>
                          <input
                            value={twitterPlayerStream}
                            onChange={(e) =>
                              setTwitterPlayerStream(e.target.value)
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="https://stream_url"
                            disabled={saving}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Stream content type (optional)
                          </label>
                          <input
                            value={twitterPlayerStreamContentType}
                            onChange={(e) =>
                              setTwitterPlayerStreamContentType(e.target.value)
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="video/mp4"
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="md:col-span-2">
                    <SocialPreviewCard
                      platform="twitter"
                      domain={previewDomain}
                      title={twitterPreviewTitle}
                      description={twitterPreviewDescription}
                      imageUrl={twitterPreviewImage || undefined}
                      twitterCardType={twitterCard}
                      twitterAppName={twitterAppName}
                      twitterPlayerUrl={twitterPlayerUrl}
                      twitterPlayerWidth={twitterPlayerWidthNumber}
                      twitterPlayerHeight={twitterPlayerHeightNumber}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
                <div className="flex flex-col gap-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span>Validator helpers</span>
                    <InfoTooltip
                      label="Validator helpers info"
                      title="Validator helpers"
                      description="Помощни инструменти за бързо тестване на OG/Twitter meta tags във външни валидатори."
                    />
                  </p>
                  <p className="text-xs text-gray-500">
                    Бърз достъп до Facebook / LinkedIn / Twitter проверките.
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span>Preview URL за тестове</span>
                        <InfoTooltip
                          label="Preview URL info"
                          title="Preview URL"
                          description="URL на страницата, която искаш да тестваш във валидаторите. Използва се за генерираните линкове и за Fetch from URL."
                        />
                      </span>
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleUseCurrentOrigin}
                          className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Use current origin
                        </button>
                        <InfoTooltip
                          label="Use current origin info"
                          title="Use current origin"
                          description="Попълва Preview URL с текущия домейн (origin) на отворената страница."
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleUseLocalhostPreview}
                          className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Use localhost:3001
                        </button>
                        <InfoTooltip
                          label="Use localhost info"
                          title="Use localhost:3001"
                          description="Попълва Preview URL с localhost адрес (подходящо за локално тестване)."
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleCopyMetaTags}
                          className="inline-flex items-center rounded border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                        >
                          Copy meta tags
                        </button>
                        <InfoTooltip
                          label="Copy meta tags info"
                          title="Copy meta tags"
                          description="Копира генерирания meta tags snippet в clipboard (за paste в validator-и или за debug)."
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleFetchMetadataFromUrl}
                          disabled={metaFetchStatus === "loading"}
                          className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {metaFetchStatus === "loading"
                            ? "Fetching..."
                            : "Fetch from URL"}
                        </button>
                        <InfoTooltip
                          label="Fetch from URL info"
                          title="Fetch from URL"
                          description="Прави заявка към Preview URL и извлича meta информация за сравнение/диагностика."
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setShowMetaTagsSnippet((prev) => !prev)
                          }
                          className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {showMetaTagsSnippet
                            ? "Hide meta tags"
                            : "View meta tags"}
                        </button>
                        <InfoTooltip
                          label="View meta tags info"
                          title="View meta tags"
                          description="Показва/скрива ориентировъчен snippet на генерираните meta tags (read-only)."
                        />
                      </div>
                    </div>
                    <input
                      value={previewOrigin}
                      onChange={(e) => setPreviewOrigin(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="https://example.com/страница"
                    />
                    {showMetaTagsSnippet ? (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Generated meta tags (read-only)
                        </label>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusBadge
                            variant={ogPreviewImage ? "ok" : "missing"}
                            label={ogPreviewImage ? "OG IMG" : "OG IMG MISSING"}
                          />
                          <StatusBadge
                            variant={twitterPreviewImage ? "ok" : "missing"}
                            label={
                              twitterPreviewImage ? "TW IMG" : "TW IMG MISSING"
                            }
                          />
                          {twitterCard === "app" ? (
                            <StatusBadge
                              variant={twitterAppHasMinimum ? "ok" : "missing"}
                              label={
                                twitterAppHasMinimum
                                  ? "APP OK"
                                  : "APP INCOMPLETE"
                              }
                            />
                          ) : null}
                          {twitterCard === "player" ? (
                            <StatusBadge
                              variant={
                                twitterPlayerHasMinimum ? "ok" : "missing"
                              }
                              label={
                                twitterPlayerHasMinimum
                                  ? "PLAYER OK"
                                  : "PLAYER INCOMPLETE"
                              }
                            />
                          ) : null}
                        </div>
                        <textarea
                          value={socialMetaTagsSnippet}
                          readOnly
                          rows={10}
                          className="mt-2 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Това е ориентировъчен snippet за debug/validator-и.
                          Реалните meta tags се генерират автоматично от
                          приложението.
                        </p>
                      </div>
                    ) : null}
                    {metaFetchMessage ? (
                      <p
                        className={`mt-2 text-xs ${
                          metaFetchStatus === "error"
                            ? "text-red-700"
                            : metaFetchStatus === "success"
                              ? "text-green-700"
                              : "text-gray-600"
                        }`}
                      >
                        {metaFetchMessage}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-gray-500">
                      Този URL се използва за валидаторите. Използвай реалната
                      страница, която искаш да тестваш.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <a
                        href={validatorLinks.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50"
                      >
                        Facebook Debugger
                      </a>
                      <InfoTooltip
                        label="Facebook debugger info"
                        title="Facebook Debugger"
                        description="Отваря Facebook Sharing Debugger за да видиш как Facebook прочита OG meta tags и да trigger-неш re-scrape."
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={validatorLinks.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50"
                      >
                        LinkedIn Inspector
                      </a>
                      <InfoTooltip
                        label="LinkedIn inspector info"
                        title="LinkedIn Inspector"
                        description="Отваря LinkedIn Post Inspector за да провериш Open Graph preview и cache."
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={validatorLinks.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50"
                      >
                        Twitter Card Validator
                      </a>
                      <InfoTooltip
                        label="Twitter validator info"
                        title="Twitter Card Validator"
                        description="Отваря Twitter/X card валидатор за да провериш как се визуализира preview-то (title/description/image/card type)."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection
            title="Feature toggles"
            description="Изключването на feature връща 404 за публичните endpoint-и."
            headerAdornment={
              <InfoTooltip
                label="Какво включва Feature toggles"
                title="Feature toggles"
                description={
                  <div className="space-y-2">
                    <p>
                      Управлява кои функционалности са активни за потребителите.
                    </p>
                    <p className="text-xs text-gray-500">
                      Когато feature е OFF, UI елементите се скриват и
                      публичните маршрути за него връщат 404.
                    </p>
                  </div>
                }
              />
            }
            open={Boolean(openSections.features)}
            onToggle={() => toggleSection("features")}
          >
            <div className="mt-4 space-y-3">
              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  accessibilityWidget
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Accessibility tool"
                  featureKey="accessibilityWidget"
                />
                <ToggleSwitch
                  checked={accessibilityWidget}
                  disabled={saving}
                  label="Accessibility tool"
                  onChange={(next) => setAccessibilityWidget(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  themeLightEnabled
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Theme: Light"
                  featureKey="themeLight"
                />
                <ToggleSwitch
                  checked={themeLightEnabled}
                  disabled={saving}
                  label="Theme Light"
                  onChange={(next) => {
                    setThemeLightEnabled(next);
                    if (!next) {
                      setThemeDarkEnabled(true);
                    }
                  }}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  themeDarkEnabled
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Theme: Dark"
                  featureKey="themeDark"
                />
                <ToggleSwitch
                  checked={themeDarkEnabled}
                  disabled={saving}
                  label="Theme Dark"
                  onChange={(next) => {
                    setThemeDarkEnabled(next);
                    if (!next) {
                      setThemeLightEnabled(true);
                    }
                  }}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  themeModeSelectorEnabled
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Theme selector"
                  featureKey="themeModeSelector"
                />
                <ToggleSwitch
                  checked={themeModeSelectorEnabled}
                  disabled={saving}
                  label="Theme selector"
                  onChange={(next) => setThemeModeSelectorEnabled(next)}
                />
              </div>
              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  wiki
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel label="Wiki" featureKey="wiki" />
                <ToggleSwitch
                  checked={wiki}
                  disabled={saving}
                  label="Wiki"
                  onChange={(next) => {
                    setWiki(next);
                    if (!next) {
                      setWikiPublic(false);
                    }
                  }}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  wikiPublic
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Wiki public"
                  featureKey="wikiPublic"
                />
                <ToggleSwitch
                  checked={wikiPublic}
                  disabled={saving || wiki === false}
                  label="Wiki public"
                  onChange={(next) => setWikiPublic(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  courses
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel label="Courses" featureKey="courses" />
                <ToggleSwitch
                  checked={courses}
                  disabled={saving}
                  label="Courses"
                  onChange={(next) => {
                    setCourses(next);
                    if (!next) {
                      setCoursesPublic(false);
                      setMyCourses(false);
                    }
                  }}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  coursesPublic
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Courses public"
                  featureKey="coursesPublic"
                />
                <ToggleSwitch
                  checked={coursesPublic}
                  disabled={saving || courses === false}
                  label="Courses public"
                  onChange={(next) => setCoursesPublic(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  myCourses
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel label="My Courses" featureKey="myCourses" />
                <ToggleSwitch
                  checked={myCourses}
                  disabled={saving || courses === false}
                  label="My Courses"
                  onChange={(next) => setMyCourses(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  profile
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel label="Profile" featureKey="profile" />
                <ToggleSwitch
                  checked={profile}
                  disabled={saving}
                  label="Profile"
                  onChange={(next) => setProfile(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  auth
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel label="Auth (risk)" featureKey="auth" />
                <ToggleSwitch
                  checked={auth}
                  disabled={saving}
                  label="Auth"
                  onChange={(next) => {
                    if (auth === true && next === false) {
                      setAuthRiskAcknowledged(false);
                      setAuthRiskModalOpen(true);
                      return;
                    }
                    setAuth(next);
                  }}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  authLogin
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Auth: Login (users)"
                  featureKey="authLogin"
                />
                <ToggleSwitch
                  checked={authLogin}
                  disabled={saving || auth === false}
                  label="Auth Login"
                  onChange={(next) => setAuthLogin(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  authRegister
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Auth: Register + Reset password"
                  featureKey="authRegister"
                />
                <ToggleSwitch
                  checked={authRegister}
                  disabled={saving || auth === false}
                  label="Auth Register"
                  onChange={(next) => setAuthRegister(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  auth2fa
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Auth: 2FA (TOTP)"
                  featureKey="auth2fa"
                />
                <ToggleSwitch
                  checked={auth2fa}
                  disabled={saving || auth === false}
                  label="Auth 2FA"
                  onChange={(next) => setAuth2fa(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  captcha
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Captcha (global)"
                  featureKey="captcha"
                />
                <ToggleSwitch
                  checked={captcha}
                  disabled={saving}
                  label="Captcha"
                  onChange={(next) => {
                    setCaptcha(next);
                    if (!next) {
                      setCaptchaLogin(false);
                      setCaptchaRegister(false);
                      setCaptchaForgotPassword(false);
                      setCaptchaChangePassword(false);
                    }
                  }}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  captchaLogin
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Captcha: Login"
                  featureKey="captchaLogin"
                />
                <ToggleSwitch
                  checked={captchaLogin}
                  disabled={saving || captcha === false}
                  label="Captcha Login"
                  onChange={(next) => setCaptchaLogin(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  captchaRegister
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Captcha: Register"
                  featureKey="captchaRegister"
                />
                <ToggleSwitch
                  checked={captchaRegister}
                  disabled={saving || captcha === false}
                  label="Captcha Register"
                  onChange={(next) => setCaptchaRegister(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  captchaForgotPassword
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Captcha: Forgot password"
                  featureKey="captchaForgotPassword"
                />
                <ToggleSwitch
                  checked={captchaForgotPassword}
                  disabled={saving || captcha === false}
                  label="Captcha Forgot password"
                  onChange={(next) => setCaptchaForgotPassword(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  captchaChangePassword
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Captcha: Change password"
                  featureKey="captchaChangePassword"
                />
                <ToggleSwitch
                  checked={captchaChangePassword}
                  disabled={saving || captcha === false}
                  label="Captcha Change password"
                  onChange={(next) => setCaptchaChangePassword(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  paidCourses
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Paid courses"
                  featureKey="paidCourses"
                />
                <ToggleSwitch
                  checked={paidCourses}
                  disabled={saving}
                  label="Paid courses"
                  onChange={(next) => setPaidCourses(next)}
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  infraMonitoring
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Infra: Monitoring"
                  featureKey="infraMonitoring"
                />
                <input
                  ref={infraMonitoringUrlRef}
                  value={infraMonitoringUrl}
                  onChange={(e) => {
                    if (infraToggleErrors.infraMonitoring) {
                      setInfraToggleErrors((prev) => ({
                        ...prev,
                        infraMonitoring: "",
                      }));
                    }
                    setInfraMonitoringUrl(e.target.value);
                  }}
                  disabled={saving}
                  placeholder="https://..."
                  className={`ml-auto w-72 rounded-md border bg-white px-2 py-1 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-1 ${
                    infraToggleErrors.infraMonitoring
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-green-500 focus:ring-green-500"
                  }`}
                />
                <ToggleSwitch
                  checked={infraMonitoring}
                  disabled={saving}
                  label="Infra Monitoring"
                  onChange={(next) =>
                    handleToggleInfra("infraMonitoring", next)
                  }
                />
              </div>
              {infraToggleErrors.infraMonitoring ? (
                <p className="-mt-2 text-xs text-red-600" role="alert">
                  {infraToggleErrors.infraMonitoring}
                </p>
              ) : null}

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  infraRedis
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Infra: Redis"
                  featureKey="infraRedis"
                />
                <input
                  ref={infraRedisUrlRef}
                  value={infraRedisUrl}
                  onChange={(e) => {
                    if (infraToggleErrors.infraRedis) {
                      setInfraToggleErrors((prev) => ({
                        ...prev,
                        infraRedis: "",
                      }));
                    }
                    setInfraRedisUrl(e.target.value);
                  }}
                  disabled={saving}
                  placeholder="redis://... или host:port"
                  className={`ml-auto w-72 rounded-md border bg-white px-2 py-1 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-1 ${
                    infraToggleErrors.infraRedis
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-green-500 focus:ring-green-500"
                  }`}
                />
                <ToggleSwitch
                  checked={infraRedis}
                  disabled={saving}
                  label="Infra Redis"
                  onChange={(next) => handleToggleInfra("infraRedis", next)}
                />
              </div>
              {infraToggleErrors.infraRedis ? (
                <p className="-mt-2 text-xs text-red-600" role="alert">
                  {infraToggleErrors.infraRedis}
                </p>
              ) : null}

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  infraRabbitmq
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Infra: RabbitMQ"
                  featureKey="infraRabbitmq"
                />
                <input
                  ref={infraRabbitmqUrlRef}
                  value={infraRabbitmqUrl}
                  onChange={(e) => {
                    if (infraToggleErrors.infraRabbitmq) {
                      setInfraToggleErrors((prev) => ({
                        ...prev,
                        infraRabbitmq: "",
                      }));
                    }
                    setInfraRabbitmqUrl(e.target.value);
                  }}
                  disabled={saving}
                  placeholder="amqp://..."
                  className={`ml-auto w-72 rounded-md border bg-white px-2 py-1 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-1 ${
                    infraToggleErrors.infraRabbitmq
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-green-500 focus:ring-green-500"
                  }`}
                />
                <ToggleSwitch
                  checked={infraRabbitmq}
                  disabled={saving}
                  label="Infra RabbitMQ"
                  onChange={(next) => handleToggleInfra("infraRabbitmq", next)}
                />
              </div>
              {infraToggleErrors.infraRabbitmq ? (
                <p className="-mt-2 text-xs text-red-600" role="alert">
                  {infraToggleErrors.infraRabbitmq}
                </p>
              ) : null}

              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  infraErrorTracking
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="Infra: Error tracking"
                  featureKey="infraErrorTracking"
                />
                <input
                  ref={infraErrorTrackingUrlRef}
                  value={infraErrorTrackingUrl}
                  onChange={(e) => {
                    if (infraToggleErrors.infraErrorTracking) {
                      setInfraToggleErrors((prev) => ({
                        ...prev,
                        infraErrorTracking: "",
                      }));
                    }
                    setInfraErrorTrackingUrl(e.target.value);
                  }}
                  disabled={saving}
                  placeholder="https://..."
                  className={`ml-auto w-72 rounded-md border bg-white px-2 py-1 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-1 ${
                    infraToggleErrors.infraErrorTracking
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-green-500 focus:ring-green-500"
                  }`}
                />
                <ToggleSwitch
                  checked={infraErrorTracking}
                  disabled={saving}
                  label="Infra Error tracking"
                  onChange={(next) =>
                    handleToggleInfra("infraErrorTracking", next)
                  }
                />
              </div>
              {infraToggleErrors.infraErrorTracking ? (
                <p className="-mt-2 text-xs text-red-600" role="alert">
                  {infraToggleErrors.infraErrorTracking}
                </p>
              ) : null}
            </div>
          </AccordionSection>

          <AccordionSection
            title="Social login & OAuth креденшъли"
            description="Тук администрираш кои социални доставчици (Google, Facebook, GitHub, LinkedIn) са достъпни за потребителите и задаваш техните OAuth креденшъли."
            headerAdornment={
              <InfoTooltip
                label="Какво включва Social login"
                title="Social login & OAuth"
                description={
                  <div className="space-y-2">
                    <p>
                      Активирай/деактивирай социални доставчици и запази OAuth
                      креденшъли (Client ID/Secret + Redirect URL).
                    </p>
                    <p className="text-xs text-gray-500">
                      Secret се показва само като статус; нови стойности се
                      изпращат еднократно при Save.
                    </p>
                  </div>
                }
              />
            }
            open={Boolean(openSections.social)}
            onToggle={() => toggleSection("social")}
          >
            <div className="mt-4 space-y-5">
              <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">
                  Login съобщения (social)
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Контролираш дали да се показват помощните съобщения на login
                  страницата, когато social login е изключен или неуспешен.
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-800">
                      Показвай “Social входовете са изключени…”
                    </div>
                    <ToggleSwitch
                      checked={loginSocialUnavailableMessageEnabled}
                      disabled={saving}
                      label="Login social unavailable message"
                      onChange={(next) => {
                        setLoginSocialUnavailableMessageEnabled(next);
                        void persistBrandingField(
                          { loginSocialUnavailableMessageEnabled: next },
                          next
                            ? "Login съобщението за изключен social login е включено."
                            : "Login съобщението за изключен social login е изключено.",
                        );
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-800">
                      Показвай “Ако social входът е изключен… (Forgot password
                      ↗)”
                    </div>
                    <ToggleSwitch
                      checked={loginSocialResetPasswordHintEnabled}
                      disabled={saving}
                      label="Login social reset password hint"
                      onChange={(next) => {
                        setLoginSocialResetPasswordHintEnabled(next);
                        void persistBrandingField(
                          { loginSocialResetPasswordHintEnabled: next },
                          next
                            ? "Login подсказката за Forgot password е включена."
                            : "Login подсказката за Forgot password е изключена.",
                        );
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">
                  Register съобщения (social)
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Контролираш дали да се показва съобщението на register
                  страницата, когато social registration е изключен.
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-800">
                      Показвай “Социалните регистрации са изключени…”
                    </div>
                    <ToggleSwitch
                      checked={registerSocialUnavailableMessageEnabled}
                      disabled={saving}
                      label="Register social unavailable message"
                      onChange={(next) => {
                        setRegisterSocialUnavailableMessageEnabled(next);
                        void persistBrandingField(
                          { registerSocialUnavailableMessageEnabled: next },
                          next
                            ? "Register съобщението за изключен social register е включено."
                            : "Register съобщението за изключен social register е изключено.",
                        );
                      }}
                    />
                  </div>
                </div>
              </div>

              {SOCIAL_PROVIDERS.map((provider) => {
                const form = socialCredentialForms[provider];
                const status = socialStatuses?.[provider];
                const label = SOCIAL_PROVIDER_LABELS[provider];
                const configured = status?.configured ?? false;
                const enabled = socialFeatureStates[provider];
                const iconConfig = socialLoginIcons?.[provider] ?? null;
                const iconLightUrl = (iconConfig?.lightUrl ?? "").trim();
                const iconDarkUrl = (iconConfig?.darkUrl ?? "").trim();
                const trimmedClientId = form.clientId.trim();
                const trimmedRedirectUri = form.redirectUri.trim();
                const trimmedNotes = form.notes.trim();
                const hasSecretInput = form.clientSecretInput.trim().length > 0;
                const hasStoredSecret =
                  form.hasClientSecret && !form.clearSecret;
                const canTestConnection =
                  enabled &&
                  (configured ||
                    (trimmedClientId.length > 0 &&
                      trimmedRedirectUri.length > 0 &&
                      (hasSecretInput || hasStoredSecret)));
                const hasAnyStoredValue =
                  trimmedClientId.length > 0 ||
                  trimmedRedirectUri.length > 0 ||
                  trimmedNotes.length > 0 ||
                  hasStoredSecret ||
                  hasSecretInput ||
                  form.clearSecret;
                const secretBadgeStyle: CSSProperties = form.clearSecret
                  ? {
                      backgroundColor: "var(--field-alert-bg)",
                      borderColor: "var(--field-alert-border)",
                      color: "var(--foreground)",
                    }
                  : form.hasClientSecret
                    ? {
                        backgroundColor: "var(--field-ok-bg)",
                        borderColor: "var(--field-ok-border)",
                        color: "var(--primary)",
                      }
                    : {
                        backgroundColor: "var(--field-error-bg)",
                        borderColor: "var(--field-error-border)",
                        color: "var(--error)",
                      };
                const secretBadgeText = form.clearSecret
                  ? "за изтриване"
                  : form.hasClientSecret
                    ? "запазен"
                    : "липсва";
                const statusDescription = configured
                  ? enabled
                    ? "Настроен и активен"
                    : "Настроен"
                  : "⚠ Не е конфигуриран – ще се използват env fallback-и ако има";
                const testState = socialTestStates[provider];
                const cardColorClasses = enabled
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50";
                return (
                  <div
                    key={provider}
                    className={`rounded-lg border p-4 shadow-sm transition-colors ${cardColorClasses}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          <ToggleSwitch
                            checked={enabled}
                            disabled={saving}
                            label={`Активирай ${label}`}
                            onChange={(next) =>
                              handleToggleSocialProvider(provider, next)
                            }
                          />
                          <span className="text-sm font-medium text-gray-800">
                            Активирай
                          </span>
                        </div>
                        <div>
                          <p className="text-base font-medium text-gray-900">
                            {label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {statusDescription}
                          </p>
                        </div>
                      </div>
                      <span
                        className="rounded-full border px-3 py-1 text-xs font-semibold"
                        style={secretBadgeStyle}
                      >
                        Secret: {secretBadgeText}
                      </span>
                    </div>

                    <div className="mt-3 rounded-md border border-gray-200 bg-white px-3 py-3">
                      <p className="text-xs font-semibold text-gray-800">
                        Social login икони (custom)
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        По желание: качи custom икони за {label}. Ако не са
                        зададени, системата използва вградените.
                      </p>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-700">
                                Light
                              </span>
                              {iconLightUrl.length > 0 ? (
                                <Image
                                  src={iconLightUrl}
                                  alt=""
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 rounded bg-white object-contain"
                                />
                              ) : (
                                <span className="text-xs text-gray-500">—</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  handleSocialLoginIconUploadClick(
                                    provider,
                                    "light",
                                  )
                                }
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Upload
                              </button>
                              <button
                                type="button"
                                disabled={saving || iconLightUrl.length < 1}
                                onClick={() => {
                                  const ok = window.confirm(
                                    `Премахване на light иконата за ${label}?`,
                                  );
                                  if (!ok) return;
                                  setSocialLoginIcons((prev) => ({
                                    ...(prev ?? {}),
                                    [provider]: {
                                      ...(prev?.[provider] ?? null),
                                      lightUrl: null,
                                    },
                                  }));
                                  void persistBrandingField(
                                    {
                                      socialLoginIcons: {
                                        [provider]: { lightUrl: null },
                                      },
                                    },
                                    `Social login icon (${provider}, light) е премахнат.`,
                                  );
                                }}
                                className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-700">
                                Dark
                              </span>
                              {iconDarkUrl.length > 0 ? (
                                <Image
                                  src={iconDarkUrl}
                                  alt=""
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 rounded bg-white object-contain"
                                />
                              ) : (
                                <span className="text-xs text-gray-500">—</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  handleSocialLoginIconUploadClick(
                                    provider,
                                    "dark",
                                  )
                                }
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Upload
                              </button>
                              <button
                                type="button"
                                disabled={saving || iconDarkUrl.length < 1}
                                onClick={() => {
                                  const ok = window.confirm(
                                    `Премахване на dark иконата за ${label}?`,
                                  );
                                  if (!ok) return;
                                  setSocialLoginIcons((prev) => ({
                                    ...(prev ?? {}),
                                    [provider]: {
                                      ...(prev?.[provider] ?? null),
                                      darkUrl: null,
                                    },
                                  }));
                                  void persistBrandingField(
                                    {
                                      socialLoginIcons: {
                                        [provider]: { darkUrl: null },
                                      },
                                    },
                                    `Social login icon (${provider}, dark) е премахнат.`,
                                  );
                                }}
                                className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {hasAnyStoredValue ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleResetProviderFields(provider)}
                          disabled={saving}
                          className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Изчисти всички стойности
                        </button>
                      </div>
                    ) : null}
                    {canTestConnection ? (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleTestConnection(provider)}
                          disabled={testState.status === "loading"}
                          className="inline-flex items-center rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {testState.status === "loading"
                            ? "Тествам..."
                            : "Тествай връзката"}
                        </button>
                        {testState.message ? (
                          <span
                            className={`text-xs ${
                              testState.status === "success"
                                ? "text-green-700"
                                : testState.status === "error"
                                  ? "text-red-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {testState.message}
                            {testState.status === "success" &&
                            testState.details?.endpoint
                              ? ` · ${testState.details.endpoint}`
                              : ""}
                          </span>
                        ) : null}
                        {testState.status === "error" &&
                        testState.errorDetails ? (
                          <pre className="w-full whitespace-pre-wrap rounded-md bg-red-50 p-2 text-xs text-red-700">
                            {testState.errorDetails}
                          </pre>
                        ) : null}
                      </div>
                    ) : null}
                    {form.updatedBy || form.updatedAt ? (
                      <p className="mt-2 text-xs text-gray-500">
                        Последна промяна:{" "}
                        {form.updatedAt
                          ? new Date(form.updatedAt).toLocaleString()
                          : "—"}{" "}
                        · {form.updatedBy ?? "неизвестен потребител"}
                      </p>
                    ) : null}
                    {socialInlineWarnings[provider]?.length ? (
                      <div className="mt-3 space-y-1 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
                        {socialInlineWarnings[provider].map((warning, idx) => (
                          <p key={`${provider}-warning-${idx}`}>{warning}</p>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-3">
                      <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                        <span className="flex items-center gap-2">
                          <span>Бележки / инструкции (само за админи)</span>
                          <InfoTooltip
                            label="Social notes info"
                            title="Бележки / инструкции"
                            description="Вътрешни бележки за админи – не се виждат от потребители. Полезно за контакти, инструкции и къде се съхраняват ключове."
                          />
                        </span>
                      </label>
                      <textarea
                        value={form.notes}
                        onChange={(e) =>
                          setSocialCredentialForms((prev) => ({
                            ...prev,
                            [provider]: {
                              ...prev[provider],
                              notes: e.target.value,
                            },
                          }))
                        }
                        onInput={() => setSocialCredentialsDirty(true)}
                        rows={3}
                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="Пример: Креденшъли в 1Password → BeeLMS Social creds. Или инструкции за запитване към IT."
                        disabled={saving}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Тези бележки не се виждат от потребители – използвай ги
                        за вътрешни инструкции, контакти или къде се съхраняват
                        OAuth ключовете.
                      </p>
                    </div>

                    <div className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      {SOCIAL_PROVIDER_SCOPE_HINTS[provider]}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                          <span className="flex items-center gap-2">
                            <span>Client ID</span>
                            <InfoTooltip
                              label="OAuth client id info"
                              title="Client ID"
                              description="OAuth Client ID от доставчика (Google/Facebook/GitHub/LinkedIn)."
                            />
                          </span>
                        </label>
                        <input
                          ref={(el) => {
                            socialClientIdRefs.current[provider] = el;
                          }}
                          value={form.clientId}
                          onChange={(e) =>
                            setSocialCredentialForms((prev) => ({
                              ...prev,
                              [provider]: {
                                ...prev[provider],
                                clientId: e.target.value,
                              },
                            }))
                          }
                          onInput={() => {
                            setSocialCredentialsDirty(true);
                            clearSocialFieldError(provider, "clientId");
                          }}
                          onBlur={() =>
                            clearSocialFieldError(provider, "clientId")
                          }
                          className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="например 123.apps.googleusercontent.com"
                          spellCheck={false}
                          disabled={saving}
                        />
                        {socialFieldErrors[provider]?.clientId && (
                          <p className="mt-1 text-xs text-red-600">
                            {socialFieldErrors[provider]?.clientId}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                          <span className="flex items-center gap-2">
                            <span>Redirect URL</span>
                            <InfoTooltip
                              label="OAuth redirect url info"
                              title="Redirect URL"
                              description="Callback/Redirect URL, която трябва да е whitelisted при доставчика. Трябва да съвпада 1:1."
                            />
                          </span>
                        </label>
                        <input
                          ref={(el) => {
                            socialRedirectUriRefs.current[provider] = el;
                          }}
                          value={form.redirectUri}
                          onChange={(e) =>
                            setSocialCredentialForms((prev) => ({
                              ...prev,
                              [provider]: {
                                ...prev[provider],
                                redirectUri: e.target.value,
                              },
                            }))
                          }
                          onInput={(e) => {
                            setSocialCredentialsDirty(true);
                            validateRedirectUri(
                              provider,
                              e.currentTarget.value,
                            );
                          }}
                          onBlur={() =>
                            validateRedirectUri(provider, form.redirectUri)
                          }
                          className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder={SOCIAL_PROVIDER_REDIRECT_HINTS[provider]}
                          spellCheck={false}
                          disabled={saving}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Пример: {SOCIAL_PROVIDER_REDIRECT_HINTS[provider]}
                        </p>
                        {socialFieldErrors[provider]?.redirectUri && (
                          <p className="mt-1 text-xs text-red-600">
                            {socialFieldErrors[provider]?.redirectUri}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                        <span className="flex items-center gap-2">
                          <span>
                            Client secret (въвеждане на нова стойност)
                          </span>
                          <InfoTooltip
                            label="OAuth client secret info"
                            title="Client secret"
                            description="Secret ключът от доставчика. За сигурност не се показва. Можеш да зададеш нов secret, или да изтриеш стария."
                          />
                        </span>
                      </label>
                      <input
                        ref={(el) => {
                          socialClientSecretRefs.current[provider] = el;
                        }}
                        type="password"
                        value={form.clientSecretInput}
                        disabled={
                          saving || (form.hasClientSecret && !form.clearSecret)
                        }
                        onChange={(e) =>
                          setSocialCredentialForms((prev) => ({
                            ...prev,
                            [provider]: {
                              ...prev[provider],
                              clientSecretInput: e.target.value,
                              clearSecret: false,
                            },
                          }))
                        }
                        onInput={() => {
                          setSocialCredentialsDirty(true);
                          clearSocialFieldError(provider, "clientSecret");
                        }}
                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder={
                          form.hasClientSecret
                            ? "•••••• (въведи нов secret, за да го замениш)"
                            : "няма записан secret"
                        }
                        autoComplete="new-password"
                      />
                      {socialFieldErrors[provider]?.clientSecret && (
                        <p className="mt-1 text-xs text-red-600">
                          {socialFieldErrors[provider]?.clientSecret}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        Стойността се изпраща еднократно и не се съхранява във
                        фронтенда. За да зададеш нов secret, първо използвай
                        „Изтрий запазения secret“, което ще позволи въвеждане на
                        нова стойност.
                      </p>
                      {form.hasClientSecret && !form.clearSecret ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                          <span>Съществува записан secret.</span>
                          <button
                            type="button"
                            onClick={() => confirmDeleteStoredSecret(provider)}
                            disabled={saving}
                            className="inline-flex items-center rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Изтрий запазения secret
                          </button>
                        </div>
                      ) : null}
                      {form.clearSecret ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
                          <span>
                            Secret ще бъде изтрит при запазване на настройките.
                          </span>
                          <button
                            type="button"
                            onClick={() => cancelSecretDeletion(provider)}
                            disabled={saving}
                            className="inline-flex items-center rounded-md border border-yellow-300 px-2 py-1 text-xs font-semibold text-yellow-900 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Отмени
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              <input
                ref={socialLoginIconInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleSocialLoginIconSelected}
              />
            </div>
          </AccordionSection>

          <AccordionSection
            title="Languages"
            description="Поддържани езици (custom). Трябва да има поне 1 език, а default трябва да е сред избраните."
            headerAdornment={
              <InfoTooltip
                label="Какво включва Languages"
                title="Languages"
                description={
                  <div className="space-y-2">
                    <p>
                      Управлява списъка с поддържани езикови кодове и кой е
                      default за системата.
                    </p>
                    <p className="text-xs text-gray-500">
                      Default трябва да е сред поддържаните езици.
                    </p>
                  </div>
                }
              />
            }
            open={Boolean(openSections.languages)}
            onToggle={() => toggleSection("languages")}
          >
            <div className="mt-4 space-y-4">
              <input
                ref={languageIconInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLanguageIconSelected}
                disabled={saving}
              />

              <div className="max-w-2xl">
                <div className="min-w-[240px]">
                  <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      <span>
                        Добави language code (можеш и няколко: bg, en, de)
                      </span>
                      <InfoTooltip
                        label="Supported languages info"
                        title="Supported languages"
                        description="Добави езикови кодове (ISO 639-1) разделени със запетая. Пример: bg, en, de."
                      />
                    </span>
                  </label>
                  <LanguageDraftAutocomplete
                    value={languageDraft}
                    disabled={saving}
                    ariaLabel="Supported language codes"
                    placeholder="bg, en, de"
                    flagByLang={languageFlagPickerByLang}
                    flagGlobal={languageFlagPickerGlobal}
                    onChange={(next) => setLanguageDraft(next)}
                  />
                  {languageDraftAnalysis.invalid.length > 0 ? (
                    <p className="mt-1 text-sm text-red-600">
                      Невалидни кодове:{" "}
                      {languageDraftAnalysis.invalid.join(", ")}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      {languageDraft.trim().length} знака
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={
                      saving ||
                      languageDraft.trim().length === 0 ||
                      languageDraftAnalysis.invalid.length > 0
                    }
                    onClick={() => {
                      const analysis = analyzeLanguageDraft(languageDraft);
                      const incoming = analysis.incoming;
                      if (incoming.length < 1) {
                        setLanguageDraft("");
                        return;
                      }

                      const unknownCodes = analysis.unknown;
                      if (unknownCodes.length > 0) {
                        const confirmed = window.confirm(
                          `Код(ове) ${unknownCodes.join(", ")} не са сред познатите предложения (ISO 639-1). Сигурен ли си, че искаш да ги добавиш?`,
                        );
                        if (!confirmed) {
                          return;
                        }
                      }

                      setSupportedLangs((prev) => {
                        const merged = Array.from(
                          new Set([...prev, ...incoming]),
                        );
                        return merged;
                      });
                      setLanguageDraft("");
                    }}
                    className="mt-2 inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Добави
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {supportedLangs.length < 1 ? (
                  <p className="text-sm text-red-700">
                    Трябва да има поне 1 език.
                  </p>
                ) : null}
                {supportedLangs.map((code) => (
                  <div
                    key={code}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2 ${"border-green-100 bg-green-50"}`}
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {code}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-600">flag</span>
                      <FlagCodeAutocomplete
                        value={languageFlagPickerByLang?.[code] ?? ""}
                        disabled={saving}
                        ariaLabel={`Flag for ${code}`}
                        onSelect={(rawNext) => {
                          const next = (rawNext ?? "").trim().toLowerCase();
                          setLanguageFlagPickerByLang((prev) => {
                            const nextMap = { ...(prev ?? {}) };
                            if (!next) {
                              delete nextMap[code];
                            } else {
                              nextMap[code] = next;
                            }
                            return nextMap;
                          });
                          void persistLanguagesField(
                            {
                              flagPicker: {
                                byLang: {
                                  [code]: next || null,
                                },
                              },
                            },
                            `Flag (${code}) е запазен.`,
                          );
                        }}
                      />
                      {code === "en" &&
                      !(languageFlagPickerByLang?.[code] ?? "").trim()
                        .length ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            setLanguageFlagPickerByLang((prev) => ({
                              ...(prev ?? {}),
                              en: "gb",
                            }));
                            void persistLanguagesField(
                              {
                                flagPicker: {
                                  byLang: {
                                    en: "gb",
                                  },
                                },
                              },
                              "Flag (en) е настроен на GB.",
                            );
                          }}
                          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          GB
                        </button>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-600">light</span>
                        {languageIcons?.[code]?.lightUrl ? (
                          <Image
                            alt={`Lang ${code} light icon`}
                            src={languageIcons[code].lightUrl}
                            className="h-6 w-6 rounded border border-gray-200 bg-white object-contain"
                            width={24}
                            height={24}
                            unoptimized
                          />
                        ) : (
                          <span className="text-[11px] text-gray-500">—</span>
                        )}
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            handleLanguageIconUploadClick(code, "light")
                          }
                          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Upload
                        </button>
                        <button
                          type="button"
                          disabled={
                            saving ||
                            !(languageIcons?.[code]?.lightUrl ?? "").trim()
                              .length
                          }
                          onClick={() => {
                            setLanguageIcons((prev) => ({
                              ...prev,
                              [code]: {
                                ...(prev?.[code] ?? null),
                                lightUrl: null,
                              },
                            }));
                            void persistLanguagesField(
                              { icons: { [code]: { lightUrl: null } } },
                              `Language icon (${code}, light) е премахнат.`,
                            );
                          }}
                          className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-600">dark</span>
                        {languageIcons?.[code]?.darkUrl ? (
                          <Image
                            alt={`Lang ${code} dark icon`}
                            src={languageIcons[code].darkUrl}
                            className="h-6 w-6 rounded border border-gray-200 bg-white object-contain"
                            width={24}
                            height={24}
                            unoptimized
                          />
                        ) : (
                          <span className="text-[11px] text-gray-500">—</span>
                        )}
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            handleLanguageIconUploadClick(code, "dark")
                          }
                          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Upload
                        </button>
                        <button
                          type="button"
                          disabled={
                            saving ||
                            !(languageIcons?.[code]?.darkUrl ?? "").trim()
                              .length
                          }
                          onClick={() => {
                            setLanguageIcons((prev) => ({
                              ...prev,
                              [code]: {
                                ...(prev?.[code] ?? null),
                                darkUrl: null,
                              },
                            }));
                            void persistLanguagesField(
                              { icons: { [code]: { darkUrl: null } } },
                              `Language icon (${code}, dark) е премахнат.`,
                            );
                          }}
                          className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <span className="ml-auto text-xs text-gray-500">
                      {code === defaultLang ? "default" : ""}
                    </span>
                    <ToggleSwitch
                      checked={true}
                      disabled={saving}
                      label={`Language ${code}`}
                      onChange={() => {
                        setSupportedLangs((prev) => {
                          const next = prev.filter((x) => x !== code);
                          if (next.length > 0 && defaultLang === code) {
                            setDefaultLang(next[0]);
                          }
                          if (next.length === 0) {
                            setDefaultLang("");
                          }
                          return next;
                        });
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="max-w-md">
                <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-2">
                    <span>Default</span>
                    <InfoTooltip
                      label="Default language info"
                      title="Default language"
                      description="Езикът по подразбиране за системата. Използва се за fallback-и, когато липсва езикова настройка."
                    />
                  </span>
                </label>
                <DefaultLanguageDropdown
                  value={defaultLang}
                  disabled={saving || supportedLangs.length < 1}
                  ariaLabel="Default language"
                  options={supportedLangs}
                  onSelect={(next) => setDefaultLang(next)}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Default трябва да е един от поддържаните езици.
                </p>
              </div>
            </div>
          </AccordionSection>

          {error && (
            <div
              className="rounded-md border px-4 py-3 text-sm"
              style={ERROR_NOTICE_STYLE}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="rounded-md border px-4 py-3 text-sm"
              style={SUCCESS_NOTICE_STYLE}
            >
              {success}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Някои промени (напр. favicon, meta preview/cache) може да се видят
              коректно след refresh.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm hover:opacity-90 disabled:opacity-70"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--foreground)",
                }}
              >
                {saving ? "Запазване..." : "Запази"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={authRiskModalOpen}
        title="Изключване на Auth (risk)"
        description="Това действие може да направи системата неизползваема за потребители без активна сесия."
        confirmLabel="Turn it off!"
        cancelLabel="Cancel"
        confirmEnabled={authRiskAcknowledged && !saving}
        onCancel={() => {
          setAuthRiskModalOpen(false);
          setAuthRiskAcknowledged(false);
        }}
        onConfirm={() => {
          setAuth(false);
          setAuthLogin(false);
          setAuthRegister(false);
          setAuthRiskModalOpen(false);
          setAuthRiskAcknowledged(false);
        }}
      >
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Риск:</p>
          <p className="mt-1">
            {FEATURE_TOGGLE_INFO.auth?.risk ??
              "Изключването на auth може да блокира потребителите."}
          </p>
          <p className="mt-2">
            <span className="font-semibold">Влияние:</span>{" "}
            {FEATURE_TOGGLE_INFO.auth?.impact}
          </p>
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={authRiskAcknowledged}
            onChange={(e) => setAuthRiskAcknowledged(e.target.checked)}
          />
          Разбирам риска и искам да изключа Auth.
        </label>
      </ConfirmModal>
    </div>
  );
}
