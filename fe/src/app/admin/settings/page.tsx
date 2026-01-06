"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChangeEventHandler,
  CSSProperties,
  Dispatch,
  MouseEvent,
  ReactNode,
  SetStateAction,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";
import { AdminBreadcrumbs } from "../_components/admin-breadcrumbs";
import { WikiMarkdown } from "../../wiki/_components/wiki-markdown";

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
  fieldErrorBg: "#fef2f2",
  fieldErrorBorder: "#fee2e2",
};

const DEFAULT_THEME_DARK: Record<ThemeFieldKey, string> = {
  background: "#0a0a0a",
  foreground: "#ededed",
  primary: "#22c55e",
  secondary: "#60a5fa",
  error: "#f87171",
  card: "#111827",
  border: "#374151",
  scrollThumb: "#16a34a",
  scrollTrack: "#0b2a16",
  fieldOkBg: "#052e16",
  fieldOkBorder: "#14532d",
  fieldErrorBg: "#450a0a",
  fieldErrorBorder: "#7f1d1d",
};

const THEME_PRESETS: ThemePreset[] = [
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
      fieldErrorBg: "#3a1f1f",
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
      card: "#1a2938",
      border: "#2c4558",
      scrollThumb: "#4a7ba7",
      scrollTrack: "#141f2b",
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
      primary: "#a8324e",
      secondary: "#d4727e",
      error: "#c62828",
      card: "#ffffff",
      border: "#ecd7dc",
      scrollThumb: "#c97b8a",
      scrollTrack: "#f5eaed",
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
      primary: "#1a4d7c",
      secondary: "#3d6b98",
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
      primary: "#e9b3c5",
      secondary: "#c28b9f",
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
      error: "#dc2626",
      card: "#ffffff",
      border: "#e5e7eb",
      scrollThumb: "#9ca3af",
      scrollTrack: "#f3f4f6",
      fieldOkBg: "#ecfdf5",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#fef2f2",
      fieldErrorBorder: "#f87171",
    },
    dark: {
      background: "#111827",
      foreground: "#f3f4f6",
      primary: "#9ca3af",
      secondary: "#6b7280",
      error: "#ef4444",
      card: "#1f2937",
      border: "#374151",
      scrollThumb: "#4b5563",
      scrollTrack: "#0f1419",
      fieldOkBg: "#064e3b",
      fieldOkBorder: "#6ee7b7",
      fieldErrorBg: "#450a0a",
      fieldErrorBorder: "#f87171",
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
const THEME_PRESET_TARGETS: ThemePresetTarget[] = ["light", "dark", "both"];
const THEME_PRESET_TARGET_LABEL: Record<ThemePresetTarget, string> = {
  light: "Light",
  dark: "Dark",
  both: "Light + Dark",
};
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
type InstanceBranding = {
  appName: string;
  browserTitle?: string | null;
  notFoundTitle?: string | null;
  notFoundMarkdown?: string | null;
  notFoundTitleByLang?: Record<string, string | null> | null;
  notFoundMarkdownByLang?: Record<string, string | null> | null;
  cursorUrl?: string | null;
  cursorLightUrl?: string | null;
  cursorDarkUrl?: string | null;
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
  captcha: boolean;
  captchaLogin: boolean;
  captchaRegister: boolean;
  captchaForgotPassword: boolean;
  captchaChangePassword: boolean;
  paidCourses: boolean;
  gdprLegal: boolean;
  socialGoogle: boolean;
  socialFacebook: boolean;
  socialGithub: boolean;
  socialLinkedin: boolean;
  infraRedis: boolean;
  infraRabbitmq: boolean;
  infraMonitoring: boolean;
  infraErrorTracking: boolean;
};

type InstanceLanguages = {
  supported: string[];
  default: string;
};

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
  openGraph?: {
    defaultTitle?: string | null;
    defaultDescription?: string | null;
    imageUrl?: string | null;
  } | null;
  twitter?: {
    card?: "summary" | "summary_large_image" | null;
    defaultTitle?: string | null;
    defaultDescription?: string | null;
    imageUrl?: string | null;
  } | null;
};

type SocialProvider = "google" | "facebook" | "github" | "linkedin";

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
  gdprLegal: {
    title: "GDPR / Legal (risk)",
    description:
      "Навигация към Terms/Privacy + GDPR инструменти (export/delete).",
    impact:
      "OFF скрива правните страници и disable-ва GDPR self-service действия.",
    risk: "Може да доведе до регулаторни нарушения – увери се, че имаш друго покритие.",
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

  const stopPropagation = (event: MouseEvent<HTMLButtonElement>) => {
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
  const inputError: CSSProperties = {
    backgroundColor: palette.fieldErrorBg,
    color: palette.foreground,
    borderColor: palette.fieldErrorBorder,
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
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {variant === "light" ? "Light preview" : "Dark preview"}
            </p>
            <h3 className="text-lg font-semibold">UI sample headline</h3>
            <p className="mt-1 text-sm text-gray-600">
              Примерен текст за основния body цвят и контрасти.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className="h-12 w-2 rounded-full border border-gray-200"
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
            <span className="text-[10px] font-medium text-gray-500">
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
          style={errorChip}
        >
          ⚠ Error state
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
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
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
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
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
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
  const classes =
    variant === "ok"
      ? "border-green-200 bg-green-50 text-green-700"
      : variant === "fallback"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-red-200 bg-red-50 text-red-700";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${classes}`}
    >
      {label}
    </span>
  );
}

export function InfoTooltip({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: ReactNode;
}) {
  const stopPropagation = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <button
      type="button"
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      className="group relative inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-[11px] font-semibold text-gray-600 transition hover:border-green-500 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
      aria-label={label}
    >
      ?
      <div className="pointer-events-none absolute right-0 top-6 z-20 hidden w-80 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 shadow-xl group-hover:block group-focus-visible:block">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </p>
        <div className="mt-2 text-sm leading-relaxed text-gray-800">
          {description}
        </div>
      </div>
    </button>
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

function parseSupportedLangs(raw: string): string[] {
  const parts = (raw ?? "")
    .split(/[,\n\r\t\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const normalized = parts
    .map((p) => p.toLowerCase())
    .filter((p) => /^[a-z]{2,5}$/.test(p));

  return Array.from(new Set(normalized));
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

export default function AdminSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [themeNotice, setThemeNotice] = useState<{
    type: "error" | "success";
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
  const [notFoundTitle, setNotFoundTitle] = useState<string>("");
  const [notFoundMarkdown, setNotFoundMarkdown] = useState<string>("");
  const [notFoundTitleByLang, setNotFoundTitleByLang] =
    useState<StringDictionary>({});
  const [notFoundMarkdownByLang, setNotFoundMarkdownByLang] =
    useState<StringDictionary>({});
  const [notFoundEditingLang, setNotFoundEditingLang] =
    useState<string>("__global");
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
  const [seoOpenGraphTitle, setSeoOpenGraphTitle] = useState<string>("");
  const [seoOpenGraphDescription, setSeoOpenGraphDescription] =
    useState<string>("");
  const [seoOpenGraphImageUrl, setSeoOpenGraphImageUrl] = useState<string>("");
  const [seoTwitterCard, setSeoTwitterCard] = useState<string>(
    "summary_large_image",
  );
  const [seoTwitterTitle, setSeoTwitterTitle] = useState<string>("");
  const [seoTwitterDescription, setSeoTwitterDescription] =
    useState<string>("");
  const [seoTwitterImageUrl, setSeoTwitterImageUrl] = useState<string>("");
  const seoOpenGraphFileInputRef = useRef<HTMLInputElement | null>(null);
  const seoTwitterFileInputRef = useRef<HTMLInputElement | null>(null);
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
  }, [effectiveUiTheme, systemPrefersDark, themeDark, themeLight, uiThemeMode]);

  useEffect(() => {
    themePresetTargetRef.current = themePresetTarget;
  }, [themePresetTarget]);

  useEffect(() => {
    if (!editingBuiltInThemePresetId || builtInThemePresetsExpanded) {
      return;
    }
    const visibleIds = new Set(THEME_PRESETS.slice(0, 2).map((p) => p.id));
    if (!visibleIds.has(editingBuiltInThemePresetId)) {
      setBuiltInThemePresetsExpanded(true);
    }
  }, [builtInThemePresetsExpanded, editingBuiltInThemePresetId]);

  const applyThemePreset = (preset: ThemePreset) => {
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
      type: "success",
      message: `Заредих preset "${preset.name}" за редакция. Промени цветовете и натисни Save preset (ще се запази като custom).`,
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
  const [cursorHotspotX, setCursorHotspotX] = useState<string>("");
  const [cursorHotspotY, setCursorHotspotY] = useState<string>("");
  const cursorFileInputRef = useRef<HTMLInputElement | null>(null);
  const cursorLightFileInputRef = useRef<HTMLInputElement | null>(null);
  const cursorDarkFileInputRef = useRef<HTMLInputElement | null>(null);
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
  const baseTitle = (browserTitle.trim() || appName || "").trim() || "BeeLMS";
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
  const twitterSectionHasContent = Boolean(
    twitterTitle.trim().length ||
    twitterDescription.trim().length ||
    twitterImageUrl.trim().length ||
    (twitterCard.trim().length > 0 && twitterCard !== "summary_large_image") ||
    twitterAppName.trim().length ||
    twitterAppIdIphone.trim().length ||
    twitterAppIdIpad.trim().length ||
    twitterAppIdGooglePlay.trim().length ||
    twitterAppUrlIphone.trim().length ||
    twitterAppUrlIpad.trim().length ||
    twitterAppUrlGooglePlay.trim().length ||
    twitterPlayerUrl.trim().length ||
    twitterPlayerWidth.trim().length ||
    twitterPlayerHeight.trim().length ||
    twitterPlayerStream.trim().length ||
    twitterPlayerStreamContentType.trim().length,
  );
  const twitterAppHasMinimum =
    twitterAppName.trim().length > 0 && twitterAppIdIphone.trim().length > 0;
  const twitterPlayerHasMinimum =
    twitterPlayerUrl.trim().length > 0 &&
    Number.isFinite(Number(twitterPlayerWidth.trim())) &&
    Number.isFinite(Number(twitterPlayerHeight.trim()));

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

    const isSummary = twitterCard === "summary";
    const isApp = twitterCard === "app";
    const isPlayer = twitterCard === "player";
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
    twitterCard,
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

  const persistSeoField = async (
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
          seo: patch,
        }),
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setError("Неуспешно запазване на SEO настройките.");
        return;
      }

      const updated = (await res.json()) as AdminSettingsResponse;
      const s = updated.seo;
      setSeoBaseUrl(s?.baseUrl ?? "");
      setSeoTitleTemplate(s?.titleTemplate ?? "{page} | {site}");
      setSeoDefaultTitle(s?.defaultTitle ?? "");
      setSeoDefaultDescription(s?.defaultDescription ?? "");
      setSeoRobotsIndex(s?.robots?.index !== false);
      setSeoSitemapEnabled(s?.sitemap?.enabled !== false);
      setSeoSitemapIncludeWiki(s?.sitemap?.includeWiki !== false);
      setSeoSitemapIncludeCourses(s?.sitemap?.includeCourses !== false);
      setSeoSitemapIncludeLegal(s?.sitemap?.includeLegal !== false);
      setSeoOpenGraphTitle(s?.openGraph?.defaultTitle ?? "");
      setSeoOpenGraphDescription(s?.openGraph?.defaultDescription ?? "");
      setSeoOpenGraphImageUrl(s?.openGraph?.imageUrl ?? "");
      setSeoTwitterTitle(s?.twitter?.defaultTitle ?? "");
      setSeoTwitterDescription(s?.twitter?.defaultDescription ?? "");
      setSeoTwitterImageUrl(s?.twitter?.imageUrl ?? "");
      setSeoTwitterCard(s?.twitter?.card ?? "summary_large_image");

      setSuccess(successMessage);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Неуспешно запазване на SEO настройките.",
      );
    }
  };

  const handleSeoOpenGraphUploadClick = () => {
    if (seoOpenGraphFileInputRef.current) {
      seoOpenGraphFileInputRef.current.value = "";
      seoOpenGraphFileInputRef.current.click();
    }
  };

  const handleSeoTwitterUploadClick = () => {
    if (seoTwitterFileInputRef.current) {
      seoTwitterFileInputRef.current.value = "";
      seoTwitterFileInputRef.current.click();
    }
  };

  const handleSeoImageSelected = async (
    purpose: "open-graph" | "twitter",
    event: React.ChangeEvent<HTMLInputElement>,
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

    const previousUrl =
      purpose === "twitter"
        ? (seoTwitterImageUrl ?? "").trim()
        : (seoOpenGraphImageUrl ?? "").trim();

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("purpose", purpose);
    if (previousUrl.length > 0) {
      formData.append("previousUrl", previousUrl);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings/seo/image`, {
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
        setError("Неуспешно качване на SEO image.");
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (typeof data.url !== "string") {
        setError("Неуспешно качване на SEO image.");
        return;
      }

      if (purpose === "twitter") {
        setSeoTwitterImageUrl(data.url);
        await persistSeoField(
          { twitter: { imageUrl: data.url } },
          "Twitter image е качен и запазен.",
        );
      } else {
        setSeoOpenGraphImageUrl(data.url);
        await persistSeoField(
          { openGraph: { imageUrl: data.url } },
          "Open Graph image е качен и запазен.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Неуспешно качване на SEO image.",
      );
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
        if (noticeScope === "theme") {
          setThemeNotice({
            type: "error",
            message: "Неуспешно запазване на branding настройките.",
          });
        } else {
          setError("Неуспешно запазване на branding настройките.");
        }
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
      setCustomThemePresets(
        sanitizeCustomThemePresets(updated.branding?.customThemePresets),
      );
      setCustomThemePresetsLoaded(true);
      setLogoUrl(updated.branding?.logoUrl ?? "");
      setLogoLightUrl(updated.branding?.logoLightUrl ?? "");
      setLogoDarkUrl(updated.branding?.logoDarkUrl ?? "");
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
  const [captcha, setCaptcha] = useState(false);
  const [captchaLogin, setCaptchaLogin] = useState<boolean>(false);
  const [captchaRegister, setCaptchaRegister] = useState<boolean>(false);
  const [captchaForgotPassword, setCaptchaForgotPassword] =
    useState<boolean>(false);
  const [captchaChangePassword, setCaptchaChangePassword] =
    useState<boolean>(false);
  const [paidCourses, setPaidCourses] = useState<boolean>(true);
  const [gdprLegal, setGdprLegal] = useState<boolean>(true);
  const [socialGoogle, setSocialGoogle] = useState<boolean>(true);
  const [socialFacebook, setSocialFacebook] = useState<boolean>(true);
  const [socialGithub, setSocialGithub] = useState<boolean>(true);
  const [socialLinkedin, setSocialLinkedin] = useState<boolean>(true);
  const [infraRedis, setInfraRedis] = useState<boolean>(false);
  const [infraRabbitmq, setInfraRabbitmq] = useState<boolean>(false);
  const [infraMonitoring, setInfraMonitoring] = useState<boolean>(true);
  const [infraErrorTracking, setInfraErrorTracking] = useState<boolean>(false);
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
        if (!enabled) {
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
  }, [socialCredentialForms, socialFeatureStates]);

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
    }
    socialFeatureSetters[provider](nextValue);
  };

  const [supportedLangs, setSupportedLangs] = useState<string[]>([
    "bg",
    "en",
    "de",
  ]);
  const [languageDraft, setLanguageDraft] = useState<string>("");
  const [defaultLang, setDefaultLang] = useState<string>("bg");

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const token = getAccessToken();
      if (!token) {
        router.replace("/auth/login");
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
          router.replace("/auth/login");
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
        setNotFoundTitle(data.branding?.notFoundTitle ?? "");
        setNotFoundMarkdown(data.branding?.notFoundMarkdown ?? "");
        setNotFoundTitleByLang(
          sanitizeStringDictionary(data.branding?.notFoundTitleByLang),
        );
        setNotFoundMarkdownByLang(
          sanitizeStringDictionary(data.branding?.notFoundMarkdownByLang),
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
        setCaptcha(Boolean(f?.captcha));
        setCaptchaLogin(Boolean(f?.captchaLogin));
        setCaptchaRegister(Boolean(f?.captchaRegister));
        setCaptchaForgotPassword(Boolean(f?.captchaForgotPassword));
        setCaptchaChangePassword(Boolean(f?.captchaChangePassword));
        setPaidCourses(f?.paidCourses !== false);
        setGdprLegal(f?.gdprLegal !== false);
        setSocialGoogle(f?.socialGoogle !== false);
        setSocialFacebook(f?.socialFacebook !== false);
        setSocialGithub(f?.socialGithub !== false);
        setSocialLinkedin(f?.socialLinkedin !== false);
        setInfraRedis(Boolean(f?.infraRedis));
        setInfraRabbitmq(Boolean(f?.infraRabbitmq));
        setInfraMonitoring(f?.infraMonitoring !== false);
        setInfraErrorTracking(Boolean(f?.infraErrorTracking));

        setInitialFeatures(f ?? null);
        setSocialStatuses(buildSocialStatuses(data.socialProviders ?? null));
        setSocialCredentialForms(
          buildSocialCredentialState(data.socialCredentials),
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
          setSeoOpenGraphTitle(s?.openGraph?.defaultTitle ?? "");
          setSeoOpenGraphDescription(s?.openGraph?.defaultDescription ?? "");
          setSeoOpenGraphImageUrl(s?.openGraph?.imageUrl ?? "");
          setSeoTwitterTitle(s?.twitter?.defaultTitle ?? "");
          setSeoTwitterDescription(s?.twitter?.defaultDescription ?? "");
          setSeoTwitterImageUrl(s?.twitter?.imageUrl ?? "");
          setSeoTwitterCard(s?.twitter?.card ?? "summary_large_image");
        }

        const l = data.languages;
        setSupportedLangs(Array.isArray(l?.supported) ? l.supported : ["bg"]);
        setDefaultLang(l?.default ?? "bg");
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
  }, [router]);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    const nextFieldErrors = buildSocialFieldErrors();
    let hasFieldErrors = false;

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const nextAppName = (appName ?? "").trim();
    if (nextAppName.length < 2) {
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
    const nextNotFoundTitle = normalizeNullableString(notFoundTitle);
    const nextNotFoundMarkdown = normalizeNullableString(notFoundMarkdown);
    const nextNotFoundTitleByLang =
      Object.keys(notFoundTitleByLang).length > 0 ? notFoundTitleByLang : null;
    const nextNotFoundMarkdownByLang =
      Object.keys(notFoundMarkdownByLang).length > 0
        ? notFoundMarkdownByLang
        : null;
    const nextFaviconUrl = normalizeNullableString(faviconUrl);
    const nextFontUrl = normalizeNullableString(fontUrl);
    const nextLogoUrl = normalizeNullableString(logoUrl);
    const nextLogoLightUrl = normalizeNullableString(logoLightUrl);
    const nextLogoDarkUrl = normalizeNullableString(logoDarkUrl);
    const nextCursorUrl = normalizeNullableString(cursorUrl);
    const nextCursorLightUrl = normalizeNullableString(cursorLightUrl);
    const nextCursorDarkUrl = normalizeNullableString(cursorDarkUrl);
    const nextCursorHotspotX = normalizeNullableNumber(cursorHotspotX);
    const nextCursorHotspotY = normalizeNullableNumber(cursorHotspotY);
    const nextSocialImageUrl = normalizeNullableString(socialImageUrl);
    const nextSocialDescription = normalizeNullableString(socialDescription);
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
      fieldErrorBg: normalizeNullableHex(themeDark.fieldErrorBg),
      fieldErrorBorder: normalizeNullableHex(themeDark.fieldErrorBorder),
    };

    if (supportedLangs.length < 1) {
      setError(
        "languages.supported трябва да съдържа поне 1 език (напр. bg, en).",
      );
      return;
    }

    const nextDefaultLang = (defaultLang ?? "").trim().toLowerCase();
    if (!supportedLangs.includes(nextDefaultLang)) {
      setError("languages.default трябва да е включен в languages.supported.");
      return;
    }

    const wasAuthEnabled = initialFeatures?.auth !== false;
    const wasAuthLoginEnabled = initialFeatures?.authLogin !== false;
    const wasAuthRegisterEnabled = initialFeatures?.authRegister !== false;
    const wasGdprEnabled = initialFeatures?.gdprLegal !== false;
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

    if (wasGdprEnabled && gdprLegal === false) {
      const ok = window.confirm(
        "Сигурен ли си, че искаш да изключиш GDPR/Legal? Това ще скрие legal навигация и ще disable-не GDPR export/delete.",
      );
      if (!ok) return;
    }

    for (const provider of SOCIAL_PROVIDERS) {
      const enabled = socialFeatureStates[provider];
      if (!enabled) continue;
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
    const shouldPersistSocialCredentials = !hasFieldErrors;

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
            notFoundTitle: nextNotFoundTitle,
            notFoundMarkdown: nextNotFoundMarkdown,
            notFoundTitleByLang: nextNotFoundTitleByLang,
            notFoundMarkdownByLang: nextNotFoundMarkdownByLang,
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
            cursorHotspot: nextCursorHotspot,
            socialImage: nextSocialImage,
            openGraph: nextOpenGraph,
            twitter: nextTwitter,
            socialDescription: nextSocialDescription,
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
            captcha,
            captchaLogin,
            captchaRegister,
            captchaForgotPassword,
            captchaChangePassword,
            paidCourses,
            gdprLegal,
            socialGoogle,
            socialFacebook,
            socialGithub,
            socialLinkedin,
            infraRedis,
            infraRabbitmq,
            infraMonitoring,
            infraErrorTracking,
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
            openGraph: {
              defaultTitle: normalizeNullableString(seoOpenGraphTitle),
              defaultDescription: normalizeNullableString(
                seoOpenGraphDescription,
              ),
              imageUrl: normalizeNullableString(seoOpenGraphImageUrl),
            },
            twitter: {
              card: seoTwitterCard,
              defaultTitle: normalizeNullableString(seoTwitterTitle),
              defaultDescription: normalizeNullableString(
                seoTwitterDescription,
              ),
              imageUrl: normalizeNullableString(seoTwitterImageUrl),
            },
          },
          languages: {
            supported: supportedLangs,
            default: nextDefaultLang,
          },
          socialCredentials:
            shouldPersistSocialCredentials &&
            Object.keys(socialCredentialPayload).length > 0
              ? socialCredentialPayload
              : undefined,
        }),
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setError("Неуспешно запазване на настройките.");
        return;
      }

      const updated = (await res.json()) as AdminSettingsResponse;
      setInitialFeatures(updated.features);
      setSocialStatuses(buildSocialStatuses(updated.socialProviders ?? null));
      setSocialCredentialForms(
        buildSocialCredentialState(updated.socialCredentials),
      );
      setCustomThemePresets(
        sanitizeCustomThemePresets(updated.branding?.customThemePresets),
      );
      setCustomThemePresetsLoaded(true);
      setFaviconUrl(updated.branding?.faviconUrl ?? "");
      setGoogleFont(updated.branding?.googleFont ?? "");
      setFontUrl(updated.branding?.fontUrl ?? "");
      setFontLicenseUrl(updated.branding?.fontLicenseUrl ?? "");
      setNotFoundTitle(updated.branding?.notFoundTitle ?? "");
      setNotFoundMarkdown(updated.branding?.notFoundMarkdown ?? "");
      setNotFoundTitleByLang(
        sanitizeStringDictionary(updated.branding?.notFoundTitleByLang),
      );
      setNotFoundMarkdownByLang(
        sanitizeStringDictionary(updated.branding?.notFoundMarkdownByLang),
      );
      setLogoUrl(updated.branding?.logoUrl ?? "");
      setLogoLightUrl(updated.branding?.logoLightUrl ?? "");
      setLogoDarkUrl(updated.branding?.logoDarkUrl ?? "");
      setCursorUrl(updated.branding?.cursorUrl ?? "");
      setCursorLightUrl(updated.branding?.cursorLightUrl ?? "");
      setCursorDarkUrl(updated.branding?.cursorDarkUrl ?? "");
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
        hasFieldErrors
          ? "Настройките са запазени (без Social OAuth credentials – има липсващи полета)."
          : "Настройките са запазени.",
      );
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
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

      {!loading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
                      404 страница, theme, favicon/logo, шрифтове и курсор.
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
              <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
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
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="BeeLMS"
                disabled={saving}
              />
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    404 Page
                  </p>
                  <p className="text-sm text-gray-700">
                    Редактирай глобалната 404 страница (title + Markdown
                    съдържание).
                  </p>
                </div>
                <InfoTooltip
                  label="404 page info"
                  title="404 Page"
                  description="Това съдържание се показва при несъществуващ URL. Промените влизат в сила след Save."
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      <span>Language override</span>
                      <InfoTooltip
                        label="404 language override info"
                        title="Language override"
                        description="Избери за кой език редактираш 404 текста. Ако за даден език липсва override, ще се ползва Global (default)."
                      />
                    </span>
                  </label>
                  <select
                    value={notFoundEditingLang}
                    onChange={(e) => setNotFoundEditingLang(e.target.value)}
                    disabled={saving}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="__global">Global (default)</option>
                    {supportedLangs.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      <span>404 title</span>
                      <InfoTooltip
                        label="404 title info"
                        title="404 title"
                        description="Заглавието на 404 страницата. Може да е различно по езици чрез Language override."
                      />
                    </span>
                  </label>
                  <input
                    value={
                      notFoundEditingLang === "__global"
                        ? notFoundTitle
                        : (notFoundTitleByLang[notFoundEditingLang] ?? "")
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      if (notFoundEditingLang === "__global") {
                        setNotFoundTitle(v);
                        return;
                      }
                      setNotFoundTitleByLang((prev) =>
                        upsertStringDictionary(prev, notFoundEditingLang, v),
                      );
                    }}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Страницата не е намерена"
                    disabled={saving}
                  />

                  <label className="mt-4 flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      <span>404 markdown</span>
                      <InfoTooltip
                        label="404 markdown info"
                        title="404 markdown"
                        description="Markdown съдържание за 404 страницата. Поддържа линкове, списъци и др. Ако override е празен, се използва Global."
                      />
                    </span>
                  </label>
                  <textarea
                    value={
                      notFoundEditingLang === "__global"
                        ? notFoundMarkdown
                        : (notFoundMarkdownByLang[notFoundEditingLang] ?? "")
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      if (notFoundEditingLang === "__global") {
                        setNotFoundMarkdown(v);
                        return;
                      }
                      setNotFoundMarkdownByLang((prev) =>
                        upsertStringDictionary(prev, notFoundEditingLang, v),
                      );
                    }}
                    rows={10}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Можеш да ползваш Markdown – линкове, списъци и т.н."
                    disabled={saving}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ако override е празно за избрания език, ще се ползва Global.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Preview</p>
                  <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3">
                    {(() => {
                      const effectiveMarkdown =
                        notFoundEditingLang === "__global"
                          ? notFoundMarkdown
                          : (notFoundMarkdownByLang[notFoundEditingLang] ??
                              "") ||
                            notFoundMarkdown;
                      return effectiveMarkdown.trim().length > 0 ? (
                        <div className="prose prose-zinc max-w-none">
                          <WikiMarkdown content={effectiveMarkdown} />
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          (Няма зададен Markdown. Ще се използва default 404
                          текст.)
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
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
                <select
                  value={themeMode}
                  onChange={(e) =>
                    setThemeMode(e.target.value as "light" | "dark" | "system")
                  }
                  disabled={saving}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="system">system</option>
                  <option value="light">light</option>
                  <option value="dark">dark</option>
                </select>
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
                    <select
                      value={themePresetTarget}
                      onChange={(e) => {
                        const next = e.target.value as ThemePresetTarget;
                        themePresetTargetRef.current = next;
                        setThemePresetTarget(next);
                        if (next === "light" || next === "dark") {
                          setThemePreviewVariant(next);
                        }
                      }}
                      disabled={saving}
                      className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      {THEME_PRESET_TARGETS.map((target) => (
                        <option key={target} value={target}>
                          {THEME_PRESET_TARGET_LABEL[target]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {(builtInThemePresetsExpanded
                    ? THEME_PRESETS
                    : THEME_PRESETS.slice(0, 2)
                  ).map((preset) => {
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
                  })}
                </div>

                {THEME_PRESETS.length > 2 ? (
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
                        : `Покажи още (${THEME_PRESETS.length - 2})`}
                    </button>
                  </div>
                ) : null}
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
                    className={`mt-3 rounded-md border px-4 py-3 text-sm ${
                      themeNotice.type === "error"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-green-200 bg-green-50 text-green-700"
                    }`}
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
                      backgroundColor: (themePreviewVariant === "light"
                        ? themeLight
                        : themeDark
                      ).primary,
                      color: (themePreviewVariant === "light"
                        ? themeLight
                        : themeDark
                      ).foreground,
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
                                  onClick={() =>
                                    handleEditCustomThemePreset(preset)
                                  }
                                  disabled={saving}
                                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Edit
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
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
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
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
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
                      <select
                        value={googleFont}
                        disabled={saving}
                        onChange={(e) => {
                          const next = e.target.value;
                          setGoogleFont(next);
                          void persistBrandingField(
                            { googleFont: next || null },
                            "Google font изборът е запазен.",
                          );
                        }}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="">(custom upload или системен)</option>
                        {GOOGLE_FONTS.map((f) => (
                          <option
                            key={f.value}
                            value={f.value}
                            style={f.sampleStyle}
                            disabled={!f.supportsCyrillic}
                          >
                            {f.label}
                            {!f.supportsCyrillic ? " (Latin-only)" : ""}
                          </option>
                        ))}
                      </select>
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
                              <select
                                value={perLangGoogle}
                                disabled={saving}
                                onChange={(e) => {
                                  const next = e.target.value;
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
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                              >
                                <option value="">(use global)</option>
                                {GOOGLE_FONTS.map((f) => (
                                  <option
                                    key={`${langCode}-${f.value}`}
                                    value={f.value}
                                    style={f.sampleStyle}
                                    disabled={
                                      langUsesCyrillic && !f.supportsCyrillic
                                    }
                                  >
                                    {f.label}
                                  </option>
                                ))}
                              </select>
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
            </div>
          </AccordionSection>

          {seoEnabled ? (
            <AccordionSection
              title="SEO"
              description="Safe SEO настройки за публичните страници: base URL, title template, robots, sitemap, Open Graph и Twitter."
              headerAdornment={
                <InfoTooltip
                  label="SEO settings info"
                  title="SEO"
                  description="Тези настройки контролират метаданни за публичните страници (без HTML). Полетата са ограничени до безопасни стойности."
                />
              }
              open={Boolean(openSections.seo)}
              onToggle={() => toggleSection("seo")}
            >
              <div className="mt-4 max-w-2xl space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-900">
                    Base URL (canonical)
                  </label>
                  <input
                    value={seoBaseUrl}
                    onChange={(e) => setSeoBaseUrl(e.target.value)}
                    disabled={saving}
                    placeholder="https://example.com"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-900">
                    Title template
                  </label>
                  <input
                    value={seoTitleTemplate}
                    onChange={(e) => setSeoTitleTemplate(e.target.value)}
                    disabled={saving}
                    placeholder="{page} | {site}"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                  <p className="text-xs text-gray-500">
                    Разрешени placeholders: {"{page}"} и {"{site}"}.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-900">
                      Default title
                    </label>
                    <input
                      value={seoDefaultTitle}
                      onChange={(e) => setSeoDefaultTitle(e.target.value)}
                      disabled={saving}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-900">
                      Default description
                    </label>
                    <input
                      value={seoDefaultDescription}
                      onChange={(e) => setSeoDefaultDescription(e.target.value)}
                      disabled={saving}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-gray-200 bg-white p-3">
                    <p className="text-sm font-semibold text-gray-900">
                      Robots
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700">Index</span>
                      <ToggleSwitch
                        checked={seoRobotsIndex}
                        disabled={saving}
                        label="Robots index"
                        onChange={(next) => setSeoRobotsIndex(next)}
                      />
                    </div>
                  </div>

                  <div className="rounded-md border border-gray-200 bg-white p-3">
                    <p className="text-sm font-semibold text-gray-900">
                      Sitemap
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
                          onChange={(next) => setSeoSitemapIncludeCourses(next)}
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

                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Open Graph
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Default title
                      </label>
                      <input
                        value={seoOpenGraphTitle}
                        onChange={(e) => setSeoOpenGraphTitle(e.target.value)}
                        disabled={saving}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Default description
                      </label>
                      <input
                        value={seoOpenGraphDescription}
                        onChange={(e) =>
                          setSeoOpenGraphDescription(e.target.value)
                        }
                        disabled={saving}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSeoOpenGraphUploadClick}
                      disabled={saving}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-60"
                    >
                      Upload image
                    </button>
                    <span className="text-xs text-gray-500">
                      {seoOpenGraphImageUrl
                        ? seoOpenGraphImageUrl
                        : "(no image)"}
                    </span>
                  </div>
                </div>

                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <p className="text-sm font-semibold text-gray-900">Twitter</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Card type
                      </label>
                      <select
                        value={seoTwitterCard}
                        onChange={(e) => setSeoTwitterCard(e.target.value)}
                        disabled={saving}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="summary">summary</option>
                        <option value="summary_large_image">
                          summary_large_image
                        </option>
                      </select>
                    </div>
                    <div />
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Default title
                      </label>
                      <input
                        value={seoTwitterTitle}
                        onChange={(e) => setSeoTwitterTitle(e.target.value)}
                        disabled={saving}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Default description
                      </label>
                      <input
                        value={seoTwitterDescription}
                        onChange={(e) =>
                          setSeoTwitterDescription(e.target.value)
                        }
                        disabled={saving}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSeoTwitterUploadClick}
                      disabled={saving}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-60"
                    >
                      Upload image
                    </button>
                    <span className="text-xs text-gray-500">
                      {seoTwitterImageUrl ? seoTwitterImageUrl : "(no image)"}
                    </span>
                  </div>
                </div>

                <div className="hidden">
                  <input
                    ref={seoOpenGraphFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) =>
                      void handleSeoImageSelected("open-graph", e)
                    }
                  />
                  <input
                    ref={seoTwitterFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => void handleSeoImageSelected("twitter", e)}
                  />
                </div>
              </div>
            </AccordionSection>
          ) : null}

          <AccordionSection
            title="Browser & Social metadata"
            description="Управлява браузър title, споделена social снимка/описание, Open Graph/Twitter специфики, live preview и validator помощници."
            headerAdornment={
              <InfoTooltip
                label="Какво включва Browser & Social metadata"
                title="Browser & Social metadata"
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
                    <select
                      value={twitterCard}
                      onChange={(e) => setTwitterCard(e.target.value)}
                      disabled={saving}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="summary_large_image">
                        summary_large_image
                      </option>
                      <option value="summary">summary</option>
                      <option value="app">app</option>
                      <option value="player">player</option>
                    </select>
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
                  gdprLegal
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <FeatureToggleLabel
                  label="GDPR / Legal (risk)"
                  featureKey="gdprLegal"
                />
                <ToggleSwitch
                  checked={gdprLegal}
                  disabled={saving}
                  label="GDPR / Legal"
                  onChange={(next) => setGdprLegal(next)}
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
                <ToggleSwitch
                  checked={infraMonitoring}
                  disabled={saving}
                  label="Infra Monitoring"
                  onChange={(next) => setInfraMonitoring(next)}
                />
              </div>

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
                <ToggleSwitch
                  checked={infraRedis}
                  disabled={saving}
                  label="Infra Redis"
                  onChange={(next) => setInfraRedis(next)}
                />
              </div>

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
                <ToggleSwitch
                  checked={infraRabbitmq}
                  disabled={saving}
                  label="Infra RabbitMQ"
                  onChange={(next) => setInfraRabbitmq(next)}
                />
              </div>

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
                <ToggleSwitch
                  checked={infraErrorTracking}
                  disabled={saving}
                  label="Infra Error tracking"
                  onChange={(next) => setInfraErrorTracking(next)}
                />
              </div>
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
              {SOCIAL_PROVIDERS.map((provider) => {
                const form = socialCredentialForms[provider];
                const status = socialStatuses?.[provider];
                const label = SOCIAL_PROVIDER_LABELS[provider];
                const configured = status?.configured ?? false;
                const enabled = socialFeatureStates[provider];
                const trimmedClientId = form.clientId.trim();
                const trimmedRedirectUri = form.redirectUri.trim();
                const trimmedNotes = form.notes.trim();
                const hasSecretInput = form.clientSecretInput.trim().length > 0;
                const hasStoredSecret =
                  form.hasClientSecret && !form.clearSecret;
                const canTestConnection =
                  enabled &&
                  trimmedClientId.length > 0 &&
                  trimmedRedirectUri.length > 0 &&
                  (hasSecretInput || hasStoredSecret);
                const hasAnyStoredValue =
                  trimmedClientId.length > 0 ||
                  trimmedRedirectUri.length > 0 ||
                  trimmedNotes.length > 0 ||
                  hasStoredSecret ||
                  hasSecretInput ||
                  form.clearSecret;
                const secretBadgeClasses = form.clearSecret
                  ? "bg-yellow-100 text-yellow-700"
                  : form.hasClientSecret
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600";
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
                  ? "border-green-100 bg-green-50"
                  : "border-red-100 bg-red-50";
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
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${secretBadgeClasses}`}
                      >
                        Secret: {secretBadgeText}
                      </span>
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

                    {enabled ? (
                      <>
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
                            rows={3}
                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="Пример: Креденшъли в 1Password → BeeLMS Social creds. Или инструкции за запитване към IT."
                            disabled={saving}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Тези бележки не се виждат от потребители – използвай
                            ги за вътрешни инструкции, контакти или къде се
                            съхраняват OAuth ключовете.
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
                              onBlur={() =>
                                clearSocialFieldError(provider, "clientId")
                              }
                              onInput={() =>
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
                              onBlur={() =>
                                validateRedirectUri(provider, form.redirectUri)
                              }
                              onInput={(e) =>
                                validateRedirectUri(
                                  provider,
                                  e.currentTarget.value,
                                )
                              }
                              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder={
                                SOCIAL_PROVIDER_REDIRECT_HINTS[provider]
                              }
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
                            type="password"
                            value={form.clientSecretInput}
                            disabled={
                              saving ||
                              (form.hasClientSecret && !form.clearSecret)
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
                            onInput={() =>
                              clearSocialFieldError(provider, "clientSecret")
                            }
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
                            Стойността се изпраща еднократно и не се съхранява
                            във фронтенда. За да зададеш нов secret, първо
                            използвай „Изтрий запазения secret“, което ще
                            позволи въвеждане на нова стойност.
                          </p>
                          {form.hasClientSecret && !form.clearSecret ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                              <span>Съществува записан secret.</span>
                              <button
                                type="button"
                                onClick={() =>
                                  confirmDeleteStoredSecret(provider)
                                }
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
                                Secret ще бъде изтрит при запазване на
                                настройките.
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
                      </>
                    ) : (
                      <p className="mt-4 text-xs text-gray-500">
                        За да редактираш и съхраниш креденшъли за {label},
                        активирай доставчика.
                      </p>
                    )}
                  </div>
                );
              })}
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
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[240px] flex-1">
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
                  <input
                    value={languageDraft}
                    onChange={(e) => setLanguageDraft(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="bg, en, de"
                    disabled={saving}
                  />
                </div>
                <button
                  type="button"
                  disabled={saving || languageDraft.trim().length === 0}
                  onClick={() => {
                    const incoming = parseSupportedLangs(languageDraft);
                    if (incoming.length < 1) {
                      setLanguageDraft("");
                      return;
                    }
                    setSupportedLangs((prev) => {
                      const merged = Array.from(
                        new Set([...prev, ...incoming]),
                      );
                      return merged;
                    });
                    setLanguageDraft("");
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Добави
                </button>
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
                <select
                  value={defaultLang}
                  onChange={(e) => setDefaultLang(e.target.value)}
                  disabled={saving || supportedLangs.length < 1}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">—</option>
                  {supportedLangs.map((code) => (
                    <option key={`default-${code}`} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Default трябва да е един от поддържаните езици.
                </p>
              </div>
            </div>
          </AccordionSection>

          {success && (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
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
                className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-70"
              >
                {saving ? "Запазване..." : "Запази"}
              </button>
              <Link
                href="/admin"
                className="text-sm text-green-700 hover:text-green-800"
              >
                Назад към админ таблото →
              </Link>
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
