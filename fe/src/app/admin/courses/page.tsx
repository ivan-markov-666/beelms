"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type SupportedLang } from "../../../i18n/config";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";
import { AdminBreadcrumbs } from "../_components/admin-breadcrumbs";
import Link from "next/link";
import { Pagination } from "../../_components/pagination";
import { InfoTooltip } from "../_components/info-tooltip";
import { ListboxSelect } from "../../_components/listbox-select";
import { ConfirmDialog } from "../_components/confirm-dialog";
import { StyledCheckbox } from "../_components/styled-checkbox";
import { useAdminSupportedLanguages } from "../_hooks/use-admin-supported-languages";

const API_BASE_URL = getApiBaseUrl();

const DEFAULT_PAGE_SIZE = 20;

type CourseSortKey =
  | "createdAt"
  | "updatedAt"
  | "title"
  | "category"
  | "language"
  | "status"
  | "paid"
  | "price";
type SortDir = "asc" | "desc";

function langToLocale(lang: SupportedLang): string {
  const normalized = (lang ?? "").trim().toLowerCase();
  if (!normalized) return "en-US";
  if (normalized === "bg") return "bg-BG";
  if (normalized === "en") return "en-US";
  if (normalized === "de") return "de-DE";
  if (normalized === "es") return "es-ES";
  if (normalized === "pt") return "pt-PT";
  if (normalized === "pl") return "pl-PL";
  if (normalized === "ua") return "uk-UA";
  if (normalized === "ru") return "ru-RU";
  if (normalized === "fr") return "fr-FR";
  if (normalized === "tr") return "tr-TR";
  if (normalized === "ro") return "ro-RO";
  if (normalized === "hi") return "hi-IN";
  if (normalized === "vi") return "vi-VN";
  if (normalized === "id") return "id-ID";
  if (normalized === "it") return "it-IT";
  if (normalized === "ko") return "ko-KR";
  if (normalized === "ja") return "ja-JP";
  if (normalized === "nl") return "nl-NL";
  if (normalized === "cs") return "cs-CZ";
  if (normalized === "ar") return "ar-SA";
  return normalized;
}

function formatDateTime(locale: string, dateIso: string): string {
  try {
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return dateIso;
    return d.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateIso;
  }
}

type CourseSummary = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  isPaid: boolean;
  currency: string | null;
  priceCents: number | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  category: {
    slug: string;
    title: string;
  } | null;
};

type CourseDetail = CourseSummary & {
  curriculum: unknown[];
};

type CreateCourseForm = {
  title: string;
  description: string;
  language: string;
  languages: string[];
  status: string;
  isPaid: boolean;
  categoryId: string;
  currency: string;
  priceCents: string;
};

type PaymentProviderStatus = {
  configured: boolean;
  enabled: boolean;
};

type PaymentProvidersStatusResponse = {
  stripe: PaymentProviderStatus;
  paypal: PaymentProviderStatus;
  mypos: PaymentProviderStatus;
  revolut: PaymentProviderStatus;
};

type CategoryCreateFieldErrors = {
  slug?: string;
  title?: string;
};

type CreateCourseFieldErrors = {
  title?: string;
  description?: string;
  languages?: string;
  currency?: string;
  priceCents?: string;
};

function parsePriceToCents(raw: string): number {
  const normalized = (raw ?? "").trim();
  if (!normalized) return NaN;

  if (/^\d+$/.test(normalized)) {
    return Number.parseInt(normalized, 10);
  }

  const match = normalized.match(/^(\d+)([.,](\d{1,2}))$/);
  if (!match) return NaN;

  const whole = Number.parseInt(match[1] ?? "", 10);
  const decimals = match[3] ?? "";
  if (!Number.isFinite(whole) || whole < 0) return NaN;
  const padded = (decimals + "00").slice(0, 2);
  const fractional = Number.parseInt(padded, 10);
  if (!Number.isFinite(fractional) || fractional < 0 || fractional > 99) return NaN;

  return whole * 100 + fractional;
}

const createDefaultCourseForm = (language: string): CreateCourseForm => ({
  title: "",
  description: "",
  language: language || "bg",
  languages: [(language || "bg").trim().toLowerCase()].filter(Boolean),
  status: "draft",
  isPaid: false,
  categoryId: "",
  currency: "eur",
  priceCents: "999",
});

export default function AdminCoursesPage() {
  const lang = useCurrentLang();
  const locale = useMemo(() => langToLocale(lang), [lang]);
  const { languages: supportedAdminLangs, defaultLanguage } =
    useAdminSupportedLanguages();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentRole, setCurrentRole] = useState<
    "user" | "admin" | "monitoring" | "teacher" | "author" | null
  >(null);
  const isAdmin = currentRole === "admin";

  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const selectedSet = useMemo(
    () => new Set(selectedCourseIds),
    [selectedCourseIds],
  );
  const [form, setForm] = useState<CreateCourseForm>(
    createDefaultCourseForm(defaultLanguage),
  );
  const [createFieldErrors, setCreateFieldErrors] =
    useState<CreateCourseFieldErrors>({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteSubmitting, setBulkDeleteSubmitting] = useState(false);

  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkStatusSubmitting, setBulkStatusSubmitting] = useState(false);

  const [purgeTotalCount, setPurgeTotalCount] = useState<number>(0);
  const [purgeAllOpen, setPurgeAllOpen] = useState(false);
  const [purgeAllSubmitting, setPurgeAllSubmitting] = useState(false);

  const [totalCount, setTotalCount] = useState<number>(0);
  const [categories, setCategories] = useState<
    Array<{ id: string; title: string }>
  >([]);

  const [search, setSearch] = useState("");
  const [effectiveSearch, setEffectiveSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState("");
  const [languageFilters, setLanguageFilters] = useState<string[]>([]);
  const [paidFilter, setPaidFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState<CourseSortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const courseStatusOptions = useMemo(
    () => [
      {
        value: "draft",
        label: t(lang, "common", "adminCoursesStatusDraft"),
      },
      {
        value: "active",
        label: t(lang, "common", "adminCoursesStatusActive"),
      },
      {
        value: "inactive",
        label: t(lang, "common", "adminCoursesStatusInactive"),
      },
    ],
    [lang],
  );

  const courseStatusLabels = useMemo(() => {
    return courseStatusOptions.reduce<Record<string, string>>((acc, option) => {
      acc[option.value] = option.label;
      return acc;
    }, {});
  }, [courseStatusOptions]);

  const getStatusLabel = useCallback(
    (status: string) => courseStatusLabels[status] ?? status,
    [courseStatusLabels],
  );

  const languageOptions = useMemo(() => {
    return supportedAdminLangs.length > 0 ? supportedAdminLangs : ["bg"];
  }, [supportedAdminLangs]);

  const [createLanguageDropdownOpen, setCreateLanguageDropdownOpen] =
    useState(false);
  const createLanguageDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!createLanguageDropdownOpen) return;

    const onMouseDown = (event: MouseEvent) => {
      const el = createLanguageDropdownRef.current;
      if (!el) return;
      if (event.target instanceof Node && !el.contains(event.target)) {
        setCreateLanguageDropdownOpen(false);
      }
    };

    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [createLanguageDropdownOpen]);

  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!languageDropdownOpen) return;

    const onMouseDown = (event: MouseEvent) => {
      const el = languageDropdownRef.current;
      if (!el) return;
      if (event.target instanceof Node && !el.contains(event.target)) {
        setLanguageDropdownOpen(false);
      }
    };

    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [languageDropdownOpen]);

  useEffect(() => {
    setLanguageFilters((prev) =>
      prev.filter((l) => languageOptions.includes(l)),
    );
  }, [languageOptions]);

  const languageFiltersLabel = useMemo(() => {
    const unique = Array.from(
      new Set(
        (languageFilters ?? [])
          .map((l) => (l ?? "").trim().toLowerCase())
          .filter((l) => l.length > 0),
      ),
    );
    if (unique.length === 0)
      return t(lang, "common", "adminCoursesLanguagesAll");
    if (unique.length === 1) return unique[0]!.toUpperCase();
    return `${unique.length} ${t(
      lang,
      "common",
      "adminCoursesLanguagesCountSuffix",
    )}`;
  }, [languageFilters, lang]);

  const selectedLanguagesSet = useMemo(() => {
    return new Set(
      (languageFilters ?? [])
        .map((l) => (l ?? "").trim().toLowerCase())
        .filter((l) => l.length > 0),
    );
  }, [languageFilters]);

  const toggleAllLanguages = useCallback(() => {
    setCurrentPage(1);
    setLanguageFilters([]);
  }, []);

  const toggleLanguageFilter = useCallback((code: string) => {
    const normalized = (code ?? "").trim().toLowerCase();
    if (!normalized) return;

    setCurrentPage(1);
    setLanguageFilters((prev) => {
      const prevNormalized = (prev ?? [])
        .map((l) => (l ?? "").trim().toLowerCase())
        .filter((l) => l.length > 0);

      if (prevNormalized.length === 0) {
        return [normalized];
      }

      const set = new Set(prevNormalized);
      if (set.has(normalized)) {
        set.delete(normalized);
      } else {
        set.add(normalized);
      }
      return Array.from(set);
    });
  }, []);

  useEffect(() => {
    setForm((prev) => {
      const normalized = (prev.language ?? "").trim().toLowerCase();
      const validOptions = languageOptions;
      if (!normalized || !validOptions.includes(normalized)) {
        return {
          ...prev,
          language: validOptions[0] ?? defaultLanguage ?? "bg",
        };
      }
      return prev;
    });
  }, [languageOptions, defaultLanguage]);

  useEffect(() => {
    setForm((prev) => {
      const valid = new Set(languageOptions.map((l) => l.trim().toLowerCase()));
      const next = Array.from(
        new Set(
          (prev.languages ?? [])
            .map((l) => (l ?? "").trim().toLowerCase())
            .filter((l) => l.length > 0 && valid.has(l)),
        ),
      );

      const fallback = (prev.language ?? "").trim().toLowerCase();
      if (next.length === 0) {
        const first =
          (fallback && valid.has(fallback)
            ? fallback
            : valid.size > 0
              ? Array.from(valid)[0]
              : "bg") ?? "bg";
        return { ...prev, language: first, languages: [first] };
      }

      const primary = next[0] ?? fallback;
      return primary && primary !== prev.language
        ? { ...prev, language: primary, languages: next }
        : { ...prev, languages: next };
    });
  }, [languageOptions]);

  const createSelectedLanguagesSet = useMemo(() => {
    return new Set(
      (form.languages ?? [])
        .map((l) => (l ?? "").trim().toLowerCase())
        .filter((l) => l.length > 0),
    );
  }, [form.languages]);

  const createAllLanguagesSelected = useMemo(() => {
    if (!languageOptions.length) return false;
    const valid = new Set(languageOptions.map((l) => l.trim().toLowerCase()));
    if (createSelectedLanguagesSet.size !== valid.size) return false;
    for (const code of valid) {
      if (!createSelectedLanguagesSet.has(code)) return false;
    }
    return true;
  }, [createSelectedLanguagesSet, languageOptions]);

  const createLanguagesLabel = useMemo(() => {
    if (createAllLanguagesSelected)
      return t(lang, "common", "adminCoursesLanguagesAll");
    const unique = Array.from(createSelectedLanguagesSet);
    if (unique.length === 0)
      return t(lang, "common", "adminCoursesLanguagesSelect");
    if (unique.length === 1) return unique[0]!.toUpperCase();
    return `${unique.length} ${t(
      lang,
      "common",
      "adminCoursesLanguagesCountSuffix",
    )}`;
  }, [createAllLanguagesSelected, createSelectedLanguagesSet, lang]);

  const toggleCreateAllLanguages = useCallback(() => {
    setForm((prev) => {
      const valid = Array.from(
        new Set(languageOptions.map((l) => l.trim().toLowerCase()).filter(Boolean)),
      );
      if (valid.length === 0) return prev;

      if (createAllLanguagesSelected) {
        const fallback = (prev.language ?? "").trim().toLowerCase();
        const primary = fallback && valid.includes(fallback) ? fallback : valid[0]!;
        return { ...prev, language: primary, languages: [primary] };
      }

      return { ...prev, language: valid[0]!, languages: valid };
    });
  }, [createAllLanguagesSelected, languageOptions]);

  const toggleCreateLanguage = useCallback((code: string) => {
    const normalized = (code ?? "").trim().toLowerCase();
    if (!normalized) return;

    setForm((prev) => {
      const prevNormalized = (prev.languages ?? [])
        .map((l) => (l ?? "").trim().toLowerCase())
        .filter((l) => l.length > 0);
      const set = new Set(prevNormalized);
      if (set.has(normalized)) {
        set.delete(normalized);
      } else {
        set.add(normalized);
      }
      const next = Array.from(set);
      if (next.length === 0) {
        return prev;
      }
      const primary = next[0] ?? prev.language;
      return { ...prev, language: primary, languages: next };
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const loadRole = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          if (!cancelled) setCurrentRole(null);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (!cancelled) setCurrentRole(null);
          return;
        }

        const data = (await res.json()) as { role?: string };
        const role = (data.role ?? "").trim();
        if (!cancelled) {
          setCurrentRole(
            role === "admin" ||
              role === "author" ||
              role === "teacher" ||
              role === "monitoring" ||
              role === "user"
              ? (role as "user" | "admin" | "monitoring" | "teacher" | "author")
              : null,
          );
        }
      } catch {
        if (!cancelled) setCurrentRole(null);
      }
    };

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (typeof window === "undefined") return;

    let cancelled = false;

    const loadCount = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/admin/courses/count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;

        const data = (await res.json()) as { total?: number };
        const total = typeof data.total === "number" ? data.total : 0;

        if (!cancelled) {
          setPurgeTotalCount(Number.isFinite(total) && total >= 0 ? total : 0);
        }
      } catch {
        // ignore
      }
    };

    void loadCount();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const [categorySearch, setCategorySearch] = useState("");
  const normalizedCategorySearch = categorySearch.trim().toLowerCase();
  const filteredCategories = useMemo(() => {
    if (!normalizedCategorySearch) return categories;
    return categories.filter((c) =>
      c.title.toLowerCase().includes(normalizedCategorySearch),
    );
  }, [categories, normalizedCategorySearch]);

  const [categoryCreate, setCategoryCreate] = useState({
    slug: "",
    title: "",
    order: "0",
    active: true,
  });
  const [categoryCreateFieldErrors, setCategoryCreateFieldErrors] =
    useState<CategoryCreateFieldErrors>({});
  const [categoryCreating, setCategoryCreating] = useState(false);
  const [categoryCreateError, setCategoryCreateError] = useState<string | null>(
    null,
  );
  const [categoryCreateSuccess, setCategoryCreateSuccess] = useState<
    string | null
  >(null);

  const [paymentProvidersStatus, setPaymentProvidersStatus] =
    useState<PaymentProvidersStatusResponse | null>(null);

  const hasActivePaymentProvider = useMemo(() => {
    const s = paymentProvidersStatus;
    if (!s) return true;
    return (
      (s.stripe.enabled && s.stripe.configured) ||
      (s.paypal.enabled && s.paypal.configured) ||
      (s.mypos.enabled && s.mypos.configured) ||
      (s.revolut.enabled && s.revolut.configured)
    );
  }, [paymentProvidersStatus]);

  const paidCourseDisabled = paymentProvidersStatus
    ? !hasActivePaymentProvider
    : false;

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typeof window === "undefined") return;

    setCategoryCreateError(null);
    setCategoryCreateSuccess(null);
    setCategoryCreateFieldErrors({});
    setCategoryCreating(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setCategoryCreateError(t(lang, "common", "adminErrorMissingApiAccess"));
        setCategoryCreating(false);
        return;
      }

      const slug = categoryCreate.slug.trim().toLowerCase();
      const title = categoryCreate.title.trim();
      const orderRaw = categoryCreate.order.trim();
      const order = orderRaw.length > 0 ? Number(orderRaw) : 0;

      const fieldErrors: CategoryCreateFieldErrors = {};

      if (!slug) {
        fieldErrors.slug = t(lang, "common", "adminCoursesCategoriesSlugRequired");
      }

      if (!title) {
        fieldErrors.title = t(lang, "common", "adminCoursesCategoriesTitleRequired");
      }

      if (Object.keys(fieldErrors).length > 0) {
        setCategoryCreateFieldErrors(fieldErrors);
        setCategoryCreateError(
          t(lang, "common", "adminCoursesCategoriesRequiredFields"),
        );
        setCategoryCreating(false);
        return;
      }

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        setCategoryCreateError(t(lang, "common", "adminCoursesCategoriesSlugFormatInvalid"));
        setCategoryCreateFieldErrors((prev) => ({
          ...prev,
          slug:
            t(lang, "common", "adminCoursesCategoriesSlugFormatInvalid"),
        }));
        setCategoryCreating(false);
        return;
      }

      if (
        orderRaw.length > 0 &&
        (!Number.isFinite(order) || !Number.isInteger(order) || order < 0)
      ) {
        setCategoryCreateError(
          t(lang, "common", "adminCoursesCategoriesOrderInvalid"),
        );
        setCategoryCreating(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/course-categories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          title,
          order: orderRaw.length > 0 ? order : 0,
          active: !!categoryCreate.active,
        }),
      });

      if (!res.ok) {
        setCategoryCreateError(t(lang, "common", "adminCoursesCategoriesCreateError"));
        setCategoryCreating(false);
        return;
      }

      const created = (await res.json()) as { id?: string; title?: string };
      const id = (created?.id ?? "").trim();
      const createdTitle = (created?.title ?? "").trim();
      if (!id || !createdTitle) {
        setCategoryCreateError(t(lang, "common", "adminCoursesCategoriesCreateError"));
        setCategoryCreating(false);
        return;
      }

      setCategories((prev) => [{ id, title: createdTitle }, ...prev]);
      setCategoryCreate({ slug: "", title: "", order: "0", active: true });
      setCategoryCreateSuccess(
        t(lang, "common", "adminCoursesCategoriesCreateSuccess"),
      );
      setCategoryCreating(false);
    } catch {
      setCategoryCreateError(t(lang, "common", "adminCoursesCategoriesCreateError"));
      setCategoryCreating(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = getAccessToken();
      if (!token) return;

      void (async () => {
        try {
          const res = await fetch(
            `${API_BASE_URL}/admin/payments/providers/status`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            },
          );

          if (res.status === 401) {
            return;
          }

          if (!res.ok) {
            return;
          }

          const data = (await res.json()) as PaymentProvidersStatusResponse;
          setPaymentProvidersStatus(data);

          const anyActive =
            (data.stripe.enabled && data.stripe.configured) ||
            (data.paypal.enabled && data.paypal.configured) ||
            (data.mypos.enabled && data.mypos.configured) ||
            (data.revolut.enabled && data.revolut.configured);
          if (!anyActive) {
            setForm((p) => (p.isPaid ? { ...p, isPaid: false } : p));
          }
        } catch {
          // ignore
        }
      })();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const loadCategories = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const token = getAccessToken();
      if (!token) {
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/course-categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        return;
      }

      const data = (await res.json()) as Array<{ id?: string; title?: string }>;
      const safe = Array.isArray(data)
        ? data
            .map((c) => ({
              id: (c.id ?? "").trim(),
              title: (c.title ?? "").trim(),
            }))
            .filter((c) => Boolean(c.id) && Boolean(c.title))
        : [];
      setCategories(safe);
    } catch {
      // ignore
    }
  }, []);

  const loadCourses = useCallback(
    async (options?: {
      query?: string;
      page?: number;
      pageSize?: number;
      status?: string;
      languages?: string[];
      paid?: string;
      categoryId?: string;
      sortKey?: CourseSortKey;
      sortDir?: SortDir;
    }) => {
      if (typeof window === "undefined") return;

      setLoading(true);
      setError(null);
      setTotalCount(0);

      try {
        const token = getAccessToken();
        if (!token) {
          setError(t(lang, "common", "adminErrorMissingApiAccess"));
          setLoading(false);
          return;
        }
        const query = options?.query;
        const page = options?.page && options.page > 0 ? options.page : 1;
        const pageSize =
          options?.pageSize && options.pageSize > 0
            ? Math.min(options.pageSize, 100)
            : DEFAULT_PAGE_SIZE;
        const status = options?.status;
        const languages = options?.languages;
        const paid = options?.paid;
        const categoryId = options?.categoryId;
        const sortKey = options?.sortKey;
        const sortDir = options?.sortDir;

        const params = new URLSearchParams();
        if (query && query.trim().length > 0) {
          params.set("q", query.trim());
        }
        if (status) {
          params.set("status", status);
        }
        const normalizedLanguages = Array.from(
          new Set(
            (languages ?? [])
              .map((l) => (l ?? "").trim().toLowerCase())
              .filter((l) => l.length > 0),
          ),
        );
        if (normalizedLanguages.length > 0) {
          params.set("languages", normalizedLanguages.join(","));
        }
        if (paid) {
          params.set("paid", paid);
        }
        if (categoryId) {
          params.set("categoryId", categoryId);
        }
        if (sortKey) {
          params.set("sortKey", sortKey);
        }
        if (sortDir) {
          params.set("sortDir", sortDir);
        }
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));

        const url = `${API_BASE_URL}/admin/courses?${params.toString()}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setError(t(lang, "common", "adminCoursesLoadError"));
          setLoading(false);
          return;
        }

        const totalRaw = res.headers?.get?.("X-Total-Count");
        const total = totalRaw ? Number(totalRaw) : 0;
        setTotalCount(Number.isFinite(total) && total >= 0 ? total : 0);

        const data = (await res.json()) as CourseSummary[];
        setCourses(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch {
        setError(t(lang, "common", "adminCoursesLoadError"));
        setLoading(false);
      }
    },
    [lang],
  );

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = search.trim();
    setCurrentPage(1);
    setEffectiveSearch(trimmed);
  };

  const reload = () => {
    void loadCourses({
      query: effectiveSearch,
      page: effectivePage,
      pageSize,
      status: statusFilter || undefined,
      languages: languageFilters.length > 0 ? languageFilters : undefined,
      paid: paidFilter || undefined,
      categoryId: categoryFilter || undefined,
      sortKey,
      sortDir,
    });
  };

  useEffect(() => {
    const allowed = new Set(courses.map((c) => c.id));
    setSelectedCourseIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [courses]);

  const isAllVisibleSelected =
    courses.length > 0 && courses.every((c) => selectedSet.has(c.id));
  const hasAnySelected = selectedCourseIds.length > 0;

  const selectAllVisible = () => {
    const visibleIds = courses.map((c) => c.id);
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) next.add(id);
      return Array.from(next);
    });
  };

  const clearAllVisible = () => {
    const visible = new Set(courses.map((c) => c.id));
    setSelectedCourseIds((prev) => prev.filter((id) => !visible.has(id)));
  };

  const toggleSelected = (id: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const effectivePage = Math.min(Math.max(currentPage, 1), totalPages);

  const toggleSort = (nextKey: CourseSortKey) => {
    setCurrentPage(1);
    if (nextKey === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(nextKey);
      setSortDir(nextKey === "price" ? "desc" : "asc");
    }
  };

  const buildSortIndicator = (key: CourseSortKey): string => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? "▲" : "▼";
  };

  const exportCsv = async () => {
    if (typeof window === "undefined") return;

    try {
      const token = getAccessToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (effectiveSearch.trim()) params.set("q", effectiveSearch.trim());
      if (statusFilter) params.set("status", statusFilter);
      const normalizedLanguages = Array.from(
        new Set(
          (languageFilters ?? [])
            .map((l) => (l ?? "").trim().toLowerCase())
            .filter((l) => l.length > 0),
        ),
      );
      if (normalizedLanguages.length > 0) {
        params.set("languages", normalizedLanguages.join(","));
      }
      if (paidFilter) params.set("paid", paidFilter);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      if (sortKey) params.set("sortKey", sortKey);
      if (sortDir) params.set("sortDir", sortDir);

      const url = `${API_BASE_URL}/admin/courses/export.csv?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        return;
      }

      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const header = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="?([^";]+)"?/i.exec(header);
      const filename = match?.[1]
        ? match[1]
        : t(lang, "common", "adminCoursesExportCsvFilename");
      a.href = dlUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCategories();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCategories]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCourses({
        query: effectiveSearch,
        page: effectivePage,
        pageSize,
        status: statusFilter || undefined,
        languages: languageFilters.length > 0 ? languageFilters : undefined,
        paid: paidFilter || undefined,
        categoryId: categoryFilter || undefined,
        sortKey,
        sortDir,
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    loadCourses,
    effectiveSearch,
    effectivePage,
    pageSize,
    statusFilter,
    languageFilters,
    paidFilter,
    categoryFilter,
    sortKey,
    sortDir,
  ]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typeof window === "undefined") return;

    setCreateError(null);
    setCreateSuccess(null);
    setCreatedCourseId(null);
    setCreateFieldErrors({});
    setCreating(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setCreateError(t(lang, "common", "adminErrorMissingApiAccess"));
        setCreating(false);
        return;
      }

      const currency = form.currency.trim().toLowerCase();

      const priceRaw = form.priceCents.trim();
      const priceCents = parsePriceToCents(priceRaw);

      const effectiveIsPaid = paidCourseDisabled ? false : form.isPaid;

      const fieldErrors: CreateCourseFieldErrors = {};

      if (!form.title.trim()) {
        fieldErrors.title = t(lang, "common", "adminCoursesCreateTitleRequired");
      }

      if (!form.description.trim()) {
        fieldErrors.description = t(
          lang,
          "common",
          "adminCoursesCreateDescriptionRequired",
        );
      }

      const languages = Array.from(
        new Set(
          (form.languages ?? [])
            .map((l) => (l ?? "").trim().toLowerCase())
            .filter((l) => l.length > 0),
        ),
      );
      if (languages.length === 0) {
        fieldErrors.languages = t(
          lang,
          "common",
          "adminCoursesCreateLanguagesRequired",
        );
      }

      if (Object.keys(fieldErrors).length > 0) {
        setCreateFieldErrors(fieldErrors);
        setCreateError(t(lang, "common", "adminCoursesCreateRequiredFields"));
        setCreating(false);
        return;
      }

      if (effectiveIsPaid) {
        if (!/^[a-z]{3}$/.test(currency)) {
          setCreateError(t(lang, "common", "adminCoursesCurrencyInvalid"));
          setCreateFieldErrors((prev) => ({
            ...prev,
            currency: t(lang, "common", "adminCoursesCurrencyInvalid"),
          }));
          setCreating(false);
          return;
        }
        if (!Number.isFinite(priceCents) || priceCents <= 0) {
          setCreateError(
            t(lang, "common", "adminCoursesPriceInvalid"),
          );
          setCreateFieldErrors((prev) => ({
            ...prev,
            priceCents: t(lang, "common", "adminCoursesPriceInvalid"),
          }));
          setCreating(false);
          return;
        }
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        language: (form.language ?? "").trim().toLowerCase(),
        languages,
        status: form.status,
        isPaid: effectiveIsPaid,
        ...(form.categoryId.trim()
          ? {
              categoryId: form.categoryId.trim(),
            }
          : {}),
        ...(effectiveIsPaid
          ? {
              currency,
              priceCents,
            }
          : {}),
      };

      const res = await fetch(`${API_BASE_URL}/admin/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setCreateError(t(lang, "common", "adminCoursesCreateError"));
        setCreating(false);
        return;
      }

      const created = (await res.json()) as CourseDetail;
      setForm(createDefaultCourseForm(defaultLanguage));
      setCreating(false);

      setCourses((prev) => [created, ...prev]);
      setCreateSuccess(t(lang, "common", "adminCoursesCreateSuccess"));
      setCreatedCourseId(created.id);
    } catch {
      setCreateError(t(lang, "common", "adminCoursesCreateError"));
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <AdminBreadcrumbs
          items={[
            { label: t(lang, "common", "adminDashboardTitle"), href: "/admin" },
            { label: t(lang, "common", "adminDashboardTabCourses") },
          ]}
        />

        <div>
          <div className="flex items-center gap-2">
            <h1 className="mb-2 text-3xl font-bold text-[color:var(--foreground)] md:text-4xl">
              {t(lang, "common", "adminCoursesTitle")}
            </h1>
            <InfoTooltip
              label={t(lang, "common", "adminCoursesInfoTooltipLabel")}
              title={t(lang, "common", "adminCoursesInfoTooltipTitle")}
              description={t(lang, "common", "adminCoursesInfoTooltipDescription")}
            />
          </div>
          <p className="text-[color:var(--foreground)] opacity-80">
            {t(lang, "common", "adminCoursesSubtitle")}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
              {t(lang, "common", "adminCoursesCategoriesCardTitle")}
            </h2>
            <InfoTooltip
              label={t(lang, "common", "adminCoursesCategoriesInfoTooltipLabel")}
              title={t(lang, "common", "adminCoursesCategoriesInfoTooltipTitle")}
              description={t(
                lang,
                "common",
                "adminCoursesCategoriesInfoTooltipDescription",
              )}
            />
          </div>

          <Link
            href="/admin/courses/categories"
            className="be-btn-primary inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm"
          >
            {t(lang, "common", "adminCoursesCategoriesManageCta")}
          </Link>
        </div>
        <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-80">
          {t(lang, "common", "adminCoursesCategoriesSubtitle")}
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleCreateCategory}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <label className="space-y-1">
              <span className="flex items-center gap-2 text-xs font-medium text-[color:var(--foreground)] opacity-80">
                <span>
                  {t(lang, "common", "adminCoursesCategoriesSlugLabel")} {" "}
                  <span style={{ color: "var(--error)" }}>*</span>
                </span>
                <InfoTooltip
                  label={t(lang, "common", "adminCoursesCategoriesInfoTooltipLabel")}
                  title={t(lang, "common", "adminCoursesCategoriesSlugHelpTitle")}
                  description={t(
                    lang,
                    "common",
                    "adminCoursesCategoriesSlugHelpDescription",
                  )}
                />
              </span>
              <input
                className={`w-full rounded-md border bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)] placeholder:opacity-50 focus:outline-none focus:ring-2 ${
                  categoryCreateFieldErrors.slug
                    ? "border-[color:var(--field-error-border)] bg-[color:var(--field-error-bg)] focus:border-[color:var(--error)] focus:ring-[color:var(--error)]"
                    : "border-[color:var(--border)] focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                }`}
                value={categoryCreate.slug}
                onChange={(e) =>
                  setCategoryCreate((p) => ({ ...p, slug: e.target.value }))
                }
                onInput={() =>
                  setCategoryCreateFieldErrors((prev) => ({
                    ...prev,
                    slug: undefined,
                  }))
                }
                placeholder={t(lang, "common", "adminCoursesCategoriesSlugPlaceholder")}
                disabled={categoryCreating}
                aria-invalid={Boolean(categoryCreateFieldErrors.slug)}
              />
              {categoryCreateFieldErrors.slug ? (
                <p className="text-xs" style={{ color: "var(--error)" }}>
                  {categoryCreateFieldErrors.slug}
                </p>
              ) : null}
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="flex items-center gap-2 text-xs font-medium text-[color:var(--foreground)] opacity-80">
                <span>
                  {t(lang, "common", "adminCoursesCategoriesNameLabel")} {" "}
                  <span style={{ color: "var(--error)" }}>*</span>
                </span>
                <InfoTooltip
                  label={t(lang, "common", "adminCoursesCategoriesInfoTooltipLabel")}
                  title={t(lang, "common", "adminCoursesCategoriesTitleHelpTitle")}
                  description={t(
                    lang,
                    "common",
                    "adminCoursesCategoriesTitleHelpDescription",
                  )}
                />
              </span>
              <input
                className={`w-full rounded-md border bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)] placeholder:opacity-50 focus:outline-none focus:ring-2 ${
                  categoryCreateFieldErrors.title
                    ? "border-[color:var(--field-error-border)] bg-[color:var(--field-error-bg)] focus:border-[color:var(--error)] focus:ring-[color:var(--error)]"
                    : "border-[color:var(--border)] focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                }`}
                value={categoryCreate.title}
                onChange={(e) =>
                  setCategoryCreate((p) => ({ ...p, title: e.target.value }))
                }
                onInput={() =>
                  setCategoryCreateFieldErrors((prev) => ({
                    ...prev,
                    title: undefined,
                  }))
                }
                placeholder={t(lang, "common", "adminCoursesCategoriesNamePlaceholder")}
                disabled={categoryCreating}
                aria-invalid={Boolean(categoryCreateFieldErrors.title)}
              />
              {categoryCreateFieldErrors.title ? (
                <p className="text-xs" style={{ color: "var(--error)" }}>
                  {categoryCreateFieldErrors.title}
                </p>
              ) : null}
            </label>

            <label className="space-y-1">
              <span className="flex items-center gap-2 text-xs font-medium text-[color:var(--foreground)] opacity-80">
                <span>{t(lang, "common", "adminCoursesCategoriesOrderLabel")}</span>
                <InfoTooltip
                  label={t(lang, "common", "adminCoursesCategoriesInfoTooltipLabel")}
                  title={t(lang, "common", "adminCoursesCategoriesOrderHelpTitle")}
                  description={t(
                    lang,
                    "common",
                    "adminCoursesCategoriesOrderHelpDescription",
                  )}
                />
              </span>
              <input
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)] placeholder:opacity-50 focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                value={categoryCreate.order}
                onChange={(e) =>
                  setCategoryCreate((p) => ({ ...p, order: e.target.value }))
                }
                inputMode="numeric"
                disabled={categoryCreating}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-[color:var(--foreground)] opacity-80">
            <input
              type="checkbox"
              className="h-6 w-6"
              style={{ accentColor: "var(--primary)" }}
              checked={categoryCreate.active}
              onChange={(e) =>
                setCategoryCreate((p) => ({ ...p, active: e.target.checked }))
              }
              disabled={categoryCreating}
            />
            {t(lang, "common", "adminCoursesCategoriesActiveLabel")}
          </label>

          {categoryCreateError && (
            <div
              className="rounded-md border px-4 py-3 text-sm"
              style={{
                backgroundColor: "var(--field-error-bg)",
                borderColor: "var(--field-error-border)",
                color: "var(--error)",
              }}
              role="alert"
            >
              {categoryCreateError}
            </div>
          )}

          {categoryCreateSuccess && (
            <div
              className="rounded-md border px-4 py-3 text-sm"
              style={{
                backgroundColor: "var(--field-ok-bg)",
                borderColor: "var(--field-ok-border)",
                color: "var(--primary)",
              }}
              role="status"
            >
              {categoryCreateSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={categoryCreating}
            className="be-btn-primary inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-60"
          >
            {categoryCreating
              ? t(lang, "common", "adminCoursesCategoriesCreating")
              : t(lang, "common", "adminCoursesCategoriesCreate")}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
          {t(lang, "common", "adminCoursesCreateTitle")}
        </h2>

        <form className="mt-4 space-y-4" onSubmit={handleCreate}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-[color:var(--foreground)] opacity-80">
                {t(lang, "common", "adminCoursesCreateCourseTitleLabel")} {" "}
                <span className="text-red-500">*</span>
              </span>
              <input
                className={`w-full rounded-md border bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)] placeholder:opacity-50 focus:outline-none focus:ring-2 ${
                  createFieldErrors.title
                    ? "border-[color:var(--field-error-border)] bg-[color:var(--field-error-bg)] focus:border-[color:var(--error)] focus:ring-[color:var(--error)]"
                    : "border-[color:var(--border)] focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                }`}
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                onInput={() =>
                  setCreateFieldErrors((prev) => ({ ...prev, title: undefined }))
                }
                aria-invalid={Boolean(createFieldErrors.title)}
              />
              {createFieldErrors.title ? (
                <p className="text-xs" style={{ color: "var(--error)" }}>
                  {createFieldErrors.title}
                </p>
              ) : null}
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-[color:var(--foreground)] opacity-80">
                {t(lang, "common", "adminCoursesCreateCourseLanguageLabel")} {" "}
                <span className="text-red-500">*</span>
              </span>
              <div className="relative" ref={createLanguageDropdownRef}>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between gap-2 rounded-md border bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,var(--card))] focus:outline-none focus:ring-2 ${
                    createFieldErrors.languages
                      ? "border-[color:var(--field-error-border)] bg-[color:var(--field-error-bg)] focus:border-[color:var(--error)] focus:ring-[color:var(--error)]"
                      : "border-[color:var(--border)] focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                  }`}
                  onClick={() => setCreateLanguageDropdownOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={createLanguageDropdownOpen}
                >
                  <span>{createLanguagesLabel}</span>
                  <span className="text-[color:var(--foreground)] opacity-60">
                    ▾
                  </span>
                </button>

                {createLanguageDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg">
                    <label className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-[color:var(--foreground)] hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,var(--card))]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[color:var(--border)] text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                        checked={createAllLanguagesSelected}
                        onChange={toggleCreateAllLanguages}
                      />
                      <span>{t(lang, "common", "adminCoursesLanguagesAll")}</span>
                    </label>

                    <div className="max-h-60 overflow-y-auto border-t border-[color:var(--border)]">
                      {languageOptions.map((code) => (
                        <label
                          key={code}
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-[color:var(--foreground)] hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,var(--card))]"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[color:var(--border)] text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                            checked={createSelectedLanguagesSet.has(
                              code.trim().toLowerCase(),
                            )}
                            onChange={() => toggleCreateLanguage(code)}
                          />
                          <span>{code.toUpperCase()}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {createFieldErrors.languages ? (
                <p className="text-xs" style={{ color: "var(--error)" }}>
                  {createFieldErrors.languages}
                </p>
              ) : null}
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-[color:var(--foreground)] opacity-80">
                {t(lang, "common", "adminCoursesCreateCourseStatusLabel")}
              </span>
              <ListboxSelect
                ariaLabel={t(lang, "common", "adminCoursesCreateCourseStatusAria")}
                value={form.status}
                onChange={(next) => setForm((p) => ({ ...p, status: next }))}
                buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)]"
                options={courseStatusOptions}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-[color:var(--foreground)] opacity-80">
                {t(lang, "common", "adminCoursesCreateCourseCategoryLabel")}
              </span>
              <input
                className="mb-2 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)] placeholder:opacity-50 focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder={t(lang, "common", "adminCoursesCategorySearchPlaceholder")}
                disabled={creating}
              />
              <ListboxSelect
                ariaLabel={t(lang, "common", "adminCoursesCreateCourseCategoryAria")}
                value={form.categoryId}
                disabled={creating}
                onChange={(next) =>
                  setForm((p) => ({ ...p, categoryId: next }))
                }
                buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)] disabled:opacity-60"
                options={[
                  {
                    value: "",
                    label: t(lang, "common", "adminCoursesCategoryNone"),
                  },
                  ...filteredCategories.map((c) => ({
                    value: c.id,
                    label: c.title,
                  })),
                ]}
              />
            </label>

            <div className="flex items-center justify-between gap-2 rounded-md border border-[color:var(--border)] px-3 py-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.isPaid}
                  disabled={creating || paidCourseDisabled}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isPaid: e.target.checked }))
                  }
                />
                <span className="text-sm text-[color:var(--foreground)] opacity-80">
                  {t(lang, "common", "adminCoursesPaidCourseLabel")}
                </span>
                <span
                  className="relative inline-flex h-6 w-11 items-center rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_8%,var(--card))] transition peer-checked:border-[color:var(--primary)] peer-checked:bg-[color:var(--primary)] peer-disabled:opacity-60"
                  aria-hidden="true"
                >
                  <span className="sr-only">
                    {t(lang, "common", "adminCoursesPaidCourseToggleAria")}
                  </span>
                  <span className="inline-block h-5 w-5 translate-x-0.5 rounded-full bg-[color:var(--card)] shadow-sm transition peer-checked:translate-x-5" />
                </span>
              </label>
              {paidCourseDisabled ? (
                <InfoTooltip
                  label={t(lang, "common", "adminCoursesPaidDisabledTooltipLabel")}
                  title={t(lang, "common", "adminCoursesPaidDisabledTooltipTitle")}
                  description={t(
                    lang,
                    "common",
                    "adminCoursesPaidDisabledTooltipDescription",
                  )}
                />
              ) : null}
            </div>

            {form.isPaid && !paidCourseDisabled ? (
              <>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-[color:var(--foreground)] opacity-80">
                    {t(lang, "common", "adminCoursesCurrencyLabel")} {" "}
                    <span className="text-red-500">*</span>
                  </span>
                  <input
                    className={`w-full rounded-md border bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)] placeholder:opacity-50 focus:outline-none focus:ring-2 disabled:opacity-60 ${
                      createFieldErrors.currency
                        ? "border-[color:var(--field-error-border)] bg-[color:var(--field-error-bg)] focus:border-[color:var(--error)] focus:ring-[color:var(--error)]"
                        : "border-[color:var(--border)] focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                    }`}
                    value={form.currency}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, currency: e.target.value }))
                    }
                    onInput={() =>
                      setCreateFieldErrors((prev) => ({
                        ...prev,
                        currency: undefined,
                      }))
                    }
                    aria-invalid={Boolean(createFieldErrors.currency)}
                    required
                  />
                  {createFieldErrors.currency ? (
                    <p className="text-xs" style={{ color: "var(--error)" }}>
                      {createFieldErrors.currency}
                    </p>
                  ) : null}
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium text-[color:var(--foreground)] opacity-80">
                    {t(lang, "common", "adminCoursesPriceLabel")} {" "}
                    <span className="text-red-500">*</span>
                  </span>
                  <input
                    className={`w-full rounded-md border bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)] placeholder:opacity-50 focus:outline-none focus:ring-2 disabled:opacity-60 ${
                      createFieldErrors.priceCents
                        ? "border-[color:var(--field-error-border)] bg-[color:var(--field-error-bg)] focus:border-[color:var(--error)] focus:ring-[color:var(--error)]"
                        : "border-[color:var(--border)] focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                    }`}
                    value={form.priceCents}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, priceCents: e.target.value }))
                    }
                    onInput={() =>
                      setCreateFieldErrors((prev) => ({
                        ...prev,
                        priceCents: undefined,
                      }))
                    }
                    placeholder={t(lang, "common", "adminCoursesPricePlaceholder")}
                    inputMode="decimal"
                    aria-invalid={Boolean(createFieldErrors.priceCents)}
                    required
                  />
                  <span className="block text-xs text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminCoursesPriceHint")}
                  </span>
                  {createFieldErrors.priceCents ? (
                    <p className="text-xs" style={{ color: "var(--error)" }}>
                      {createFieldErrors.priceCents}
                    </p>
                  ) : null}
                </label>
              </>
            ) : null}
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[color:var(--foreground)] opacity-80">
              {t(lang, "common", "adminCoursesDescriptionLabel")} {" "}
              <span className="text-red-500">*</span>
            </span>
            <textarea
              className={`w-full rounded-md border bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)] placeholder:opacity-50 focus:outline-none focus:ring-2 ${
                createFieldErrors.description
                  ? "border-[color:var(--field-error-border)] bg-[color:var(--field-error-bg)] focus:border-[color:var(--error)] focus:ring-[color:var(--error)]"
                  : "border-[color:var(--border)] focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]"
              }`}
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              onInput={() =>
                setCreateFieldErrors((prev) => ({
                  ...prev,
                  description: undefined,
                }))
              }
              maxLength={420}
              aria-invalid={Boolean(createFieldErrors.description)}
            />
            <span className="block text-xs text-[color:var(--foreground)] opacity-60">
              {form.description.length}/420
            </span>
            {createFieldErrors.description ? (
              <p className="text-xs" style={{ color: "var(--error)" }}>
                {createFieldErrors.description}
              </p>
            ) : null}
          </label>

          {createError && (
            <div
              className="rounded-md border px-4 py-3 text-sm"
              style={{
                backgroundColor: "var(--field-error-bg)",
                borderColor: "var(--field-error-border)",
                color: "var(--error)",
              }}
              role="alert"
            >
              {createError}
            </div>
          )}

          {createSuccess && (
            <div
              className="rounded-md border px-4 py-3 text-sm"
              style={{
                backgroundColor: "var(--field-ok-bg)",
                borderColor: "var(--field-ok-border)",
                color: "var(--foreground)",
              }}
              role="status"
            >
              <div className="flex items-center justify-between gap-3">
                <span>{createSuccess}</span>
                {createdCourseId && (
                  <Link
                    href={`/admin/courses/${createdCourseId}`}
                    className="font-medium hover:underline"
                    style={{ color: "var(--primary)" }}
                  >
                    {t(lang, "common", "adminCoursesOpenCourseCta")}
                  </Link>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="be-btn-primary mt-10 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60"
          >
            {creating
              ? t(lang, "common", "adminCoursesCreating")
              : t(lang, "common", "adminCoursesCreate")}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
            {t(lang, "common", "adminCoursesListTitle")}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="be-btn-ghost rounded-md border px-3 py-2 text-sm font-medium shadow-sm"
              onClick={exportCsv}
              disabled={loading || Boolean(error) || totalCount === 0}
            >
              {t(lang, "common", "adminCoursesExportCsv")}
            </button>
            <button
              type="button"
              className="text-sm font-medium hover:opacity-80"
              style={{ color: "var(--primary)" }}
              onClick={reload}
            >
              {t(lang, "common", "adminCoursesReload")}
            </button>
          </div>
        </div>

        <section className="mt-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <form
              className="md:col-span-2 flex items-center gap-3"
              onSubmit={handleSearchSubmit}
            >
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground)] opacity-60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="search"
                  placeholder={t(lang, "common", "adminCoursesSearchPlaceholder")}
                  className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] py-2 pl-9 pr-3 text-sm text-[color:var(--foreground)] shadow-sm placeholder:text-[color:var(--foreground)] placeholder:opacity-50 focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <button
                type="submit"
                className="be-btn-primary inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium shadow-sm"
              >
                {t(lang, "common", "adminCoursesSearchButton")}
              </button>
            </form>

            <div>
              <ListboxSelect
                ariaLabel={t(lang, "common", "adminCoursesStatusFilterAria")}
                value={statusFilter}
                onChange={(next) => {
                  setCurrentPage(1);
                  setStatusFilter(next);
                }}
                buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)]"
                options={[
                  {
                    value: "",
                    label: t(lang, "common", "adminCoursesFilterAllStatus"),
                  },
                  ...courseStatusOptions,
                ]}
              />
            </div>

            <div>
              <div className="relative" ref={languageDropdownRef}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,var(--card))] focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  onClick={() => setLanguageDropdownOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={languageDropdownOpen}
                >
                  <span>{languageFiltersLabel}</span>
                  <span className="text-[color:var(--foreground)] opacity-60">▾</span>
                </button>

                {languageDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg">
                    <label className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-[color:var(--foreground)] hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,var(--card))]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[color:var(--border)] text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                        checked={languageFilters.length === 0}
                        onChange={() => toggleAllLanguages()}
                      />
                      <span>{t(lang, "common", "adminCoursesLanguagesAll")}</span>
                    </label>

                    <div className="max-h-60 overflow-y-auto border-t border-[color:var(--border)]">
                      {languageOptions.map((code) => (
                        <label
                          key={code}
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-[color:var(--foreground)] hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,var(--card))]"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[color:var(--border)] text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                            checked={selectedLanguagesSet.has(code)}
                            onChange={() => toggleLanguageFilter(code)}
                          />
                          <span>{code.toUpperCase()}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <ListboxSelect
                ariaLabel={t(lang, "common", "adminCoursesPricingFilterAria")}
                value={paidFilter}
                onChange={(next) => {
                  setCurrentPage(1);
                  setPaidFilter(next);
                }}
                buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)]"
                options={[
                  {
                    value: "",
                    label: t(lang, "common", "adminCoursesPricingAll"),
                  },
                  {
                    value: "free",
                    label: t(lang, "common", "adminCoursesPricingFree"),
                  },
                  {
                    value: "paid",
                    label: t(lang, "common", "adminCoursesPricingPaid"),
                  },
                ]}
              />
            </div>

            <div className="md:col-span-2">
              <ListboxSelect
                ariaLabel={t(lang, "common", "adminCoursesCategoryFilterAria")}
                value={categoryFilter}
                onChange={(next) => {
                  setCurrentPage(1);
                  setCategoryFilter(next);
                }}
                buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)]"
                options={[
                  {
                    value: "",
                    label: t(lang, "common", "adminCoursesFilterAllCategories"),
                  },
                  ...categories.map((cat) => ({
                    value: cat.id,
                    label: cat.title,
                  })),
                ]}
              />
            </div>
          </div>
        </section>

        {loading && (
          <p className="mt-3 text-sm text-[color:var(--foreground)] opacity-60">
            {t(lang, "common", "adminCoursesLoading")}
          </p>
        )}

        {!loading && error && (
          <div
            className="mt-3 rounded-md border px-4 py-3 text-sm"
            style={{
              backgroundColor: "var(--field-error-bg)",
              borderColor: "var(--field-error-border)",
              color: "var(--error)",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <p className="mt-3 text-sm text-[color:var(--foreground)] opacity-70">
            {t(lang, "common", "adminCoursesEmpty")}
          </p>
        )}

        {!loading && !error && courses.length > 0 && (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_3%,var(--card))] px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[color:var(--foreground)] opacity-80">
                  {t(lang, "common", "adminCoursesSelectedCountLabel")}: {selectedCourseIds.length}
                </span>
                <button
                  type="button"
                  className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!hasAnySelected}
                  onClick={() => {
                    setBulkActionError(null);
                    setBulkDeleteOpen(true);
                  }}
                >
                  {t(lang, "common", "adminCoursesBulkDeleteSelected")}
                </button>
                <div className="flex items-center gap-2">
                  <ListboxSelect
                    ariaLabel={t(lang, "common", "adminCoursesBulkStatusAria")}
                    value={bulkStatus}
                    onChange={(next) => setBulkStatus(next)}
                    buttonClassName="flex w-36 items-center justify-between gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-1.5 text-xs text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)]"
                    options={[
                      {
                        value: "",
                        label: t(
                          lang,
                          "common",
                          "adminCoursesBulkStatusPlaceholder",
                        ),
                      },
                      ...courseStatusOptions,
                    ]}
                  />
                  <button
                    type="button"
                    className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!hasAnySelected || !bulkStatus}
                    onClick={() => {
                      setBulkActionError(null);
                      setBulkStatusOpen(true);
                    }}
                  >
                    {t(lang, "common", "adminCoursesBulkStatusApply")}
                  </button>
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  className="rounded-md border border-[color:var(--field-error-border)] bg-[color:var(--card)] px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,var(--card))] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ color: "var(--error)" }}
                  disabled={purgeTotalCount <= 0}
                  onClick={() => {
                    setBulkActionError(null);
                    setPurgeAllOpen(true);
                  }}
                >
                  {t(lang, "common", "adminCoursesBulkDeleteAllPrefix")} ({purgeTotalCount})
                </button>
              )}
            </div>

            {bulkActionError && (
              <div
                className="mt-3 rounded-md border px-4 py-3 text-sm"
                style={{
                  backgroundColor: "var(--field-error-bg)",
                  borderColor: "var(--field-error-border)",
                  color: "var(--error)",
                }}
                role="alert"
              >
                {bulkActionError}
              </div>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full table-fixed border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_3%,var(--card))] text-left text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-70">
                    <th className="px-3 py-2 align-middle">
                      <StyledCheckbox
                        checked={isAllVisibleSelected}
                        onChange={(checked) => {
                          if (checked) {
                            selectAllVisible();
                          } else {
                            clearAllVisible();
                          }
                        }}
                        ariaLabel={t(
                          lang,
                          "common",
                          "adminCoursesSelectAllVisible",
                        )}
                      />
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("createdAt")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        {t(lang, "common", "adminCoursesColCreated")} {" "}
                        {buildSortIndicator("createdAt")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("title")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        {t(lang, "common", "adminCoursesColTitle")} {" "}
                        {buildSortIndicator("title")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("updatedAt")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        {t(lang, "common", "adminCoursesColUpdated")} {" "}
                        {buildSortIndicator("updatedAt")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("category")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        {t(lang, "common", "adminCoursesColCategory")} {" "}
                        {buildSortIndicator("category")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("language")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        {t(lang, "common", "adminCoursesColLanguage")} {" "}
                        {buildSortIndicator("language")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("status")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        {t(lang, "common", "adminCoursesColStatus")} {" "}
                        {buildSortIndicator("status")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("paid")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        {t(lang, "common", "adminCoursesColPaid")} {" "}
                        {buildSortIndicator("paid")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("price")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        {t(lang, "common", "adminCoursesColPrice")} {" "}
                        {buildSortIndicator("price")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      {t(lang, "common", "adminCoursesColCreatedBy")}
                    </th>
                    <th className="px-3 py-2 align-middle text-right">
                      {t(lang, "common", "adminCoursesColActions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b border-[color:var(--border)] last:border-b-0 hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,var(--card))]"
                    >
                      <td className="px-3 py-2 align-middle">
                        <StyledCheckbox
                          checked={selectedSet.has(course.id)}
                          onChange={() => toggleSelected(course.id)}
                          ariaLabel={`${t(
                            lang,
                            "common",
                            "adminCoursesSelectCoursePrefix",
                          )} ${course.title}`}
                        />
                      </td>
                      <td className="px-3 py-2 align-middle text-[color:var(--foreground)] opacity-80">
                        {formatDateTime(locale, course.createdAt)}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div>
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="text-sm font-medium text-[color:var(--foreground)] hover:text-[color:var(--primary)] hover:underline"
                          >
                            {course.title}
                          </Link>
                          <div className="text-[11px] text-[color:var(--foreground)] opacity-60">
                            {t(lang, "common", "adminCoursesIdPrefix")}: {course.id}
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-xs text-[color:var(--foreground)] opacity-60">
                            {course.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle text-[color:var(--foreground)] opacity-80">
                        {formatDateTime(locale, course.updatedAt)}
                      </td>
                      <td className="px-3 py-2 align-middle text-[color:var(--foreground)] opacity-80">
                        {course.category?.title ??
                          t(lang, "common", "adminCoursesPlaceholderDash")}
                      </td>
                      <td className="px-3 py-2 align-middle text-[color:var(--foreground)] opacity-80">
                        {course.language}
                      </td>
                      <td className="px-3 py-2 align-middle text-[color:var(--foreground)] opacity-80">
                        {getStatusLabel(course.status)}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                            course.isPaid
                              ? "border-[color:var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_12%,var(--card))] text-[color:var(--primary)]"
                              : "border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_3%,var(--card))] text-[color:var(--foreground)] opacity-70"
                          }`}
                        >
                          {course.isPaid
                            ? t(lang, "common", "adminCoursesPricingPaid")
                            : t(lang, "common", "adminCoursesPricingFree")}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle text-[color:var(--foreground)] opacity-80">
                        {course.isPaid && typeof course.priceCents === "number"
                          ? `${(course.priceCents / 100).toFixed(2)} ${(
                              course.currency ?? "eur"
                            ).toUpperCase()}`
                          : t(lang, "common", "adminCoursesPlaceholderDash")}
                      </td>
                      <td className="px-3 py-2 align-middle text-[color:var(--foreground)] opacity-80">
                        {course.createdByUserId ??
                          t(lang, "common", "adminCoursesPlaceholderDash")}
                      </td>
                      <td className="px-3 py-2 align-middle text-right text-sm">
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="font-medium text-[color:var(--primary)] hover:opacity-90"
                        >
                          {t(lang, "common", "adminCoursesOpen")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalCount > 0 && (
                <div className="mt-4 flex items-center justify-between border-t border-[color:var(--border)] px-3 py-3 text-xs text-[color:var(--foreground)] opacity-80 md:text-sm">
                  <p>
                    {t(lang, "common", "adminCoursesPaginationShowingPrefix")}{" "}
                    <span className="font-semibold">
                      {(effectivePage - 1) * pageSize + 1}
                    </span>
                    -
                    <span className="font-semibold">
                      {Math.min(effectivePage * pageSize, totalCount)}
                    </span>{" "}
                    {t(lang, "common", "adminCoursesPaginationOf")}{" "}
                    <span className="font-semibold">{totalCount}</span>{" "}
                    {t(lang, "common", "adminCoursesPaginationCoursesSuffix")}
                  </p>
                  <Pagination
                    currentPage={effectivePage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                    pageSize={pageSize}
                    onPageSizeChange={(next) => {
                      setCurrentPage(1);
                      setPageSize(next);
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}

        <ConfirmDialog
          open={bulkDeleteOpen}
          title={t(lang, "common", "adminCoursesBulkDeleteDialogTitle")}
          description={t(lang, "common", "adminCoursesBulkDeleteDialogDescription")}
          details={
            <div>
              {t(lang, "common", "adminCoursesSelectedCountLabel")}:{" "}
              <span className="font-semibold">{selectedCourseIds.length}</span>
            </div>
          }
          confirmLabel={t(lang, "common", "adminCoursesDelete")}
          cancelLabel={t(lang, "common", "adminCoursesCancel")}
          danger
          submitting={bulkDeleteSubmitting}
          error={bulkActionError}
          onCancel={() => {
            if (bulkDeleteSubmitting) return;
            setBulkDeleteOpen(false);
            setBulkActionError(null);
          }}
          onConfirm={() => {
            if (bulkDeleteSubmitting) return;
            void (async () => {
              setBulkDeleteSubmitting(true);
              setBulkActionError(null);
              try {
                const token = getAccessToken();
                if (!token) throw new Error("missing-token");

                const res = await fetch(`${API_BASE_URL}/admin/courses/bulk`, {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ ids: selectedCourseIds }),
                });

                if (!res.ok) {
                  throw new Error(`failed-${res.status}`);
                }

                const data = (await res.json()) as { deleted?: number };
                const deleted =
                  typeof data.deleted === "number" && data.deleted > 0
                    ? data.deleted
                    : 0;

                setBulkDeleteOpen(false);
                setSelectedCourseIds([]);
                reload();
                if (isAdmin && deleted > 0) {
                  setPurgeTotalCount((p) => Math.max(0, p - deleted));
                }
              } catch {
                setBulkActionError(t(lang, "common", "adminCoursesBulkDeleteError"));
              } finally {
                setBulkDeleteSubmitting(false);
              }
            })();
          }}
        />

        <ConfirmDialog
          open={bulkStatusOpen}
          title={t(lang, "common", "adminCoursesBulkStatusDialogTitle")}
          description={t(lang, "common", "adminCoursesBulkStatusDialogDescription")}
          details={
            <div>
              {t(lang, "common", "adminCoursesBulkStatusNewStatusLabel")}: {" "}
              <span className="font-semibold">{getStatusLabel(bulkStatus)}</span>
              <br />
              {t(lang, "common", "adminCoursesSelectedCountLabel")}:{" "}
              <span className="font-semibold">{selectedCourseIds.length}</span>
            </div>
          }
          confirmLabel={t(lang, "common", "adminCoursesOk")}
          cancelLabel={t(lang, "common", "adminCoursesCancel")}
          submitting={bulkStatusSubmitting}
          error={bulkActionError}
          onCancel={() => {
            if (bulkStatusSubmitting) return;
            setBulkStatusOpen(false);
            setBulkActionError(null);
          }}
          onConfirm={() => {
            if (bulkStatusSubmitting) return;
            void (async () => {
              setBulkStatusSubmitting(true);
              setBulkActionError(null);
              try {
                const token = getAccessToken();
                if (!token) throw new Error("missing-token");

                const res = await fetch(
                  `${API_BASE_URL}/admin/courses/status/bulk`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      ids: selectedCourseIds,
                      status: bulkStatus,
                    }),
                  },
                );

                if (!res.ok) {
                  throw new Error(`failed-${res.status}`);
                }

                setBulkStatusOpen(false);
                reload();
              } catch {
                setBulkActionError(
                  t(lang, "common", "adminCoursesBulkStatusError"),
                );
              } finally {
                setBulkStatusSubmitting(false);
              }
            })();
          }}
        />

        <ConfirmDialog
          open={purgeAllOpen}
          title={t(lang, "common", "adminCoursesPurgeAllDialogTitle")}
          description={`${t(
            lang,
            "common",
            "adminCoursesPurgeAllDialogDescriptionPrefix",
          )} (${purgeTotalCount}). ${t(
            lang,
            "common",
            "adminCoursesPurgeAllDialogDescriptionSuffix",
          )}`}
          confirmLabel={t(lang, "common", "adminCoursesDeleteAll")}
          cancelLabel={t(lang, "common", "adminCoursesCancel")}
          danger
          submitting={purgeAllSubmitting}
          error={bulkActionError}
          onCancel={() => {
            if (purgeAllSubmitting) return;
            setPurgeAllOpen(false);
            setBulkActionError(null);
          }}
          onConfirm={() => {
            if (purgeAllSubmitting) return;
            void (async () => {
              setPurgeAllSubmitting(true);
              setBulkActionError(null);
              try {
                const token = getAccessToken();
                if (!token) throw new Error("missing-token");

                const res = await fetch(
                  `${API_BASE_URL}/admin/courses/purge-all`,
                  {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  },
                );

                if (!res.ok) {
                  throw new Error(`failed-${res.status}`);
                }

                const data = (await res.json()) as { deleted?: number };
                const deleted =
                  typeof data.deleted === "number" && data.deleted > 0
                    ? data.deleted
                    : 0;

                setPurgeAllOpen(false);
                setSelectedCourseIds([]);
                setCourses([]);
                setTotalCount(0);
                setPurgeTotalCount(Math.max(0, purgeTotalCount - deleted));
              } catch {
                setBulkActionError(
                  t(lang, "common", "adminCoursesPurgeAllError"),
                );
              } finally {
                setPurgeAllSubmitting(false);
              }
            })();
          }}
        />
      </section>
    </div>
  );
}
