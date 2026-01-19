"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

function formatDateTime(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return dateIso;
    return d.toLocaleString("bg-BG", {
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
  const [form, setForm] = useState<CreateCourseForm>(() =>
    createDefaultCourseForm(defaultLanguage),
  );
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
    setLanguageFilters((prev) => prev.filter((l) => languageOptions.includes(l)));
  }, [languageOptions]);

  const languageFiltersLabel = useMemo(() => {
    const unique = Array.from(
      new Set(
        (languageFilters ?? [])
          .map((l) => (l ?? "").trim().toLowerCase())
          .filter((l) => l.length > 0),
      ),
    );
    if (unique.length === 0) return "All languages";
    if (unique.length === 1) return unique[0]!.toUpperCase();
    return `${unique.length} languages`;
  }, [languageFilters]);

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

  const toggleLanguageFilter = useCallback(
    (code: string) => {
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
    },
    [],
  );

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

  const createLanguagesLabel = useMemo(() => {
    const unique = Array.from(createSelectedLanguagesSet);
    if (unique.length === 0) return "Select languages";
    if (unique.length === 1) return unique[0]!.toUpperCase();
    return `${unique.length} languages`;
  }, [createSelectedLanguagesSet]);

  const toggleCreateLanguage = useCallback(
    (code: string) => {
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
    },
    [],
  );

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
    setCategoryCreating(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setCategoryCreateError(t(lang, "common", "adminUsersNoToken"));
        setCategoryCreating(false);
        return;
      }

      const slug = categoryCreate.slug.trim().toLowerCase();
      const title = categoryCreate.title.trim();
      const orderRaw = categoryCreate.order.trim();
      const order = orderRaw.length > 0 ? Number(orderRaw) : 0;

      if (!slug) {
        setCategoryCreateError("Slug е задължителен.");
        setCategoryCreating(false);
        return;
      }

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        setCategoryCreateError(
          "Slug трябва да е в формат: lower-case, цифри и тирета (напр. web-development).",
        );
        setCategoryCreating(false);
        return;
      }

      if (!title) {
        setCategoryCreateError("Title е задължителен.");
        setCategoryCreating(false);
        return;
      }

      if (
        orderRaw.length > 0 &&
        (!Number.isFinite(order) || !Number.isInteger(order) || order < 0)
      ) {
        setCategoryCreateError("Order трябва да е цяло число >= 0.");
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
        setCategoryCreateError("Неуспешно създаване на категория.");
        setCategoryCreating(false);
        return;
      }

      const created = (await res.json()) as { id?: string; title?: string };
      const id = (created?.id ?? "").trim();
      const createdTitle = (created?.title ?? "").trim();
      if (!id || !createdTitle) {
        setCategoryCreateError("Неуспешно създаване на категория.");
        setCategoryCreating(false);
        return;
      }

      setCategories((prev) => [{ id, title: createdTitle }, ...prev]);
      setCategoryCreate({ slug: "", title: "", order: "0", active: true });
      setCategoryCreateSuccess("Категорията е създадена.");
      setCategoryCreating(false);
    } catch {
      setCategoryCreateError("Неуспешно създаване на категория.");
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
          setError(t(lang, "common", "adminUsersNoToken"));
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
          setError("Възникна грешка при зареждане на курсовете.");
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
        setError("Възникна грешка при зареждане на курсовете.");
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
      const filename = match?.[1] ? match[1] : "courses.csv";
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
    setCreating(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setCreateError(t(lang, "common", "adminUsersNoToken"));
        setCreating(false);
        return;
      }

      const currency = form.currency.trim().toLowerCase();

      const priceRaw = form.priceCents.trim();
      const priceCents = /^\d+$/.test(priceRaw)
        ? Number.parseInt(priceRaw, 10)
        : NaN;

      const effectiveIsPaid = paidCourseDisabled ? false : form.isPaid;

      if (effectiveIsPaid) {
        if (!/^[a-z]{3}$/.test(currency)) {
          setCreateError("Paid course изисква валидна валута (напр. EUR).");
          setCreating(false);
          return;
        }
        if (!Number.isFinite(priceCents) || priceCents <= 0) {
          setCreateError(
            "Paid course изисква валидна цена в cents (напр. 999).",
          );
          setCreating(false);
          return;
        }
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        language: (form.language ?? "").trim().toLowerCase(),
        languages: Array.from(
          new Set(
            (form.languages ?? [])
              .map((l) => (l ?? "").trim().toLowerCase())
              .filter((l) => l.length > 0),
          ),
        ),
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
        setCreateError("Неуспешно създаване на курс.");
        setCreating(false);
        return;
      }

      const created = (await res.json()) as CourseDetail;
      setForm(createDefaultCourseForm(defaultLanguage));
      setCreating(false);

      setCourses((prev) => [created, ...prev]);
      setCreateSuccess("Курсът е създаден.");
      setCreatedCourseId(created.id);
    } catch {
      setCreateError("Неусешно създаване на курс.");
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <AdminBreadcrumbs
          items={[
            { label: "Админ табло", href: "/admin" },
            { label: "Courses" },
          ]}
        />

        <div>
          <div className="flex items-center gap-2">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
              Courses
            </h1>
            <InfoTooltip
              label="Courses admin info"
              title="Courses"
              description="Администрация на курсове: създаване, филтри, сортиране, pagination и export CSV."
            />
          </div>
          <p className="text-gray-600">Администрация на курсове (MVP).</p>
          <div className="mt-2">
            <Link
              href="/admin/courses/categories"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--primary)" }}
            >
              Manage course categories →
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            <InfoTooltip
              label="Course categories info"
              title="Course categories"
              description="Категориите се използват за групиране на курсовете. Ако изтриеш категория, курсовете към нея НЕ се изтриват — остават некатегоризирани."
            />
          </div>

          <Link
            href="/admin/courses/categories"
            className="text-sm font-medium hover:underline"
            style={{ color: "var(--primary)" }}
          >
            Manage categories →
          </Link>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Използвай категориите, за да филтрираш и организираш course catalog-а.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleCreateCategory}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">Slug</span>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                value={categoryCreate.slug}
                onChange={(e) =>
                  setCategoryCreate((p) => ({ ...p, slug: e.target.value }))
                }
                placeholder="e.g. web-development"
                disabled={categoryCreating}
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-gray-600">Title</span>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                value={categoryCreate.title}
                onChange={(e) =>
                  setCategoryCreate((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g. Web development"
                disabled={categoryCreating}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">Order</span>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                value={categoryCreate.order}
                onChange={(e) =>
                  setCategoryCreate((p) => ({ ...p, order: e.target.value }))
                }
                inputMode="numeric"
                disabled={categoryCreating}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={categoryCreate.active}
              onChange={(e) =>
                setCategoryCreate((p) => ({ ...p, active: e.target.checked }))
              }
              disabled={categoryCreating}
            />
            Active
          </label>

          {categoryCreateError && (
            <div
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {categoryCreateError}
            </div>
          )}

          {categoryCreateSuccess && (
            <div
              className="rounded-md border border-[color:var(--primary)] bg-white px-4 py-3 text-sm text-[color:var(--primary)]"
              role="status"
            >
              {categoryCreateSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={categoryCreating}
            className="inline-flex items-center rounded-lg border bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-gray-50 disabled:opacity-60"
            style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
          >
            {categoryCreating ? "Creating..." : "Create category"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Create course</h2>

        <form className="mt-4 space-y-4" onSubmit={handleCreate}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">Title</span>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">
                Language
              </span>
              <div className="relative" ref={createLanguageDropdownRef}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  onClick={() =>
                    setCreateLanguageDropdownOpen((prev) => !prev)
                  }
                  aria-haspopup="listbox"
                  aria-expanded={createLanguageDropdownOpen}
                >
                  <span>{createLanguagesLabel}</span>
                  <span className="text-gray-400">▾</span>
                </button>

                {createLanguageDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                    <div className="max-h-60 overflow-y-auto">
                      {languageOptions.map((code) => (
                        <label
                          key={code}
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
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
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">Status</span>
              <ListboxSelect
                ariaLabel="Course status"
                value={form.status}
                onChange={(next) => setForm((p) => ({ ...p, status: next }))}
                buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                options={[
                  { value: "draft", label: "draft" },
                  { value: "active", label: "active" },
                  { value: "inactive", label: "inactive" },
                ]}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">
                Category
              </span>
              <input
                className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search category..."
                disabled={creating}
              />
              <ListboxSelect
                ariaLabel="Course category"
                value={form.categoryId}
                disabled={creating}
                onChange={(next) =>
                  setForm((p) => ({ ...p, categoryId: next }))
                }
                buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:bg-gray-50"
                options={[
                  { value: "", label: "(none)" },
                  ...filteredCategories.map((c) => ({
                    value: c.id,
                    label: c.title,
                  })),
                ]}
              />
            </label>

            <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPaid}
                  disabled={creating || paidCourseDisabled}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isPaid: e.target.checked }))
                  }
                />
                <span className="text-sm text-gray-700">Paid course</span>
              </label>
              {paidCourseDisabled ? (
                <InfoTooltip
                  label="Paid course disabled info"
                  title="Paid course"
                  description="Опцията става активна след като активираш поне един метод за плащане от Admin → Payments (и той е configured)."
                />
              ) : null}
            </div>

            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">
                Currency
              </span>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50"
                value={form.currency}
                onChange={(e) =>
                  setForm((p) => ({ ...p, currency: e.target.value }))
                }
                disabled={!form.isPaid || paidCourseDisabled}
                required={form.isPaid}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">
                Price (cents)
              </span>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50"
                value={form.priceCents}
                onChange={(e) =>
                  setForm((p) => ({ ...p, priceCents: e.target.value }))
                }
                disabled={!form.isPaid || paidCourseDisabled}
                inputMode="numeric"
                required={form.isPaid}
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Description
            </span>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              required
            />
          </label>

          {createError && (
            <div
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {createError}
            </div>
          )}

          {createSuccess && (
            <div
              className="rounded-md border border-[color:var(--primary)] bg-white px-4 py-3 text-sm text-[color:var(--primary)]"
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
                    Open course →
                  </Link>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Courses list</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              onClick={exportCsv}
              disabled={loading || Boolean(error) || totalCount === 0}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="text-sm font-medium hover:opacity-80"
              style={{ color: "var(--primary)" }}
              onClick={reload}
            >
              Reload
            </button>
          </div>
        </div>

        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <form
              className="md:col-span-2 flex items-center gap-3"
              onSubmit={handleSearchSubmit}
            >
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
                  placeholder="Search by title, id, category..."
                  className="w-full rounded-lg border border-[color:var(--border)] bg-white py-2 pl-9 pr-3 text-sm text-[color:var(--foreground)] shadow-sm placeholder:text-gray-400 focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
                style={{ backgroundColor: "var(--primary)" }}
              >
                Search
              </button>
            </form>

            <div>
              <ListboxSelect
                ariaLabel="Courses status"
                value={statusFilter}
                onChange={(next) => {
                  setCurrentPage(1);
                  setStatusFilter(next);
                }}
                options={[
                  { value: "", label: "All Status" },
                  { value: "draft", label: "draft" },
                  { value: "active", label: "active" },
                  { value: "inactive", label: "inactive" },
                ]}
              />
            </div>

            <div>
              <div className="relative" ref={languageDropdownRef}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm hover:bg-gray-50 focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  onClick={() => setLanguageDropdownOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={languageDropdownOpen}
                >
                  <span>{languageFiltersLabel}</span>
                  <span className="text-gray-400">▾</span>
                </button>

                {languageDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                    <label className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                        checked={languageFilters.length === 0}
                        onChange={() => toggleAllLanguages()}
                      />
                      <span>All languages</span>
                    </label>

                    <div className="max-h-60 overflow-y-auto border-t border-gray-100">
                      {languageOptions.map((code) => (
                        <label
                          key={code}
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
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
                ariaLabel="Courses pricing"
                value={paidFilter}
                onChange={(next) => {
                  setCurrentPage(1);
                  setPaidFilter(next);
                }}
                options={[
                  { value: "", label: "All pricing" },
                  { value: "free", label: "Free" },
                  { value: "paid", label: "Paid" },
                ]}
              />
            </div>

            <div className="md:col-span-2">
              <ListboxSelect
                ariaLabel="Courses category"
                value={categoryFilter}
                onChange={(next) => {
                  setCurrentPage(1);
                  setCategoryFilter(next);
                }}
                options={[
                  { value: "", label: "All categories" },
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
          <p className="mt-3 text-sm text-gray-500">Loading courses...</p>
        )}

        {!loading && error && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <p className="mt-3 text-sm text-gray-600">No courses found.</p>
        )}

        {!loading && !error && courses.length > 0 && (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-700">
                  Selected: {selectedCourseIds.length}
                </span>
                <button
                  type="button"
                  className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!hasAnySelected}
                  onClick={() => {
                    setBulkActionError(null);
                    setBulkDeleteOpen(true);
                  }}
                >
                  Delete selected
                </button>
                <div className="flex items-center gap-2">
                  <ListboxSelect
                    ariaLabel="Bulk status"
                    value={bulkStatus}
                    onChange={(next) => setBulkStatus(next)}
                    options={[
                      { value: "", label: "Bulk status..." },
                      { value: "draft", label: "draft" },
                      { value: "active", label: "active" },
                      { value: "inactive", label: "inactive" },
                    ]}
                  />
                  <button
                    type="button"
                    className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!hasAnySelected || !bulkStatus}
                    onClick={() => {
                      setBulkActionError(null);
                      setBulkStatusOpen(true);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  className="rounded-md border border-[color:var(--field-error-border)] bg-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ color: "var(--error)" }}
                  disabled={purgeTotalCount <= 0}
                  onClick={() => {
                    setBulkActionError(null);
                    setPurgeAllOpen(true);
                  }}
                >
                  Delete all ({purgeTotalCount})
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
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
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
                        ariaLabel="Select all visible"
                      />
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("createdAt")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        Created {buildSortIndicator("createdAt")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("title")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        Title {buildSortIndicator("title")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("updatedAt")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        Updated {buildSortIndicator("updatedAt")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("category")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        Category {buildSortIndicator("category")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("language")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        Language {buildSortIndicator("language")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("status")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        Status {buildSortIndicator("status")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("paid")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        Paid {buildSortIndicator("paid")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleSort("price")}
                        className="inline-flex items-center gap-2 text-[color:var(--foreground)] hover:text-[color:var(--primary)]"
                      >
                        Price {buildSortIndicator("price")}
                      </button>
                    </th>
                    <th className="px-3 py-2 align-middle">Created by</th>
                    <th className="px-3 py-2 align-middle text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-3 py-2 align-middle">
                        <StyledCheckbox
                          checked={selectedSet.has(course.id)}
                          onChange={() => toggleSelected(course.id)}
                          ariaLabel={`Select ${course.title}`}
                        />
                      </td>
                      <td className="px-3 py-2 align-middle text-gray-700">
                        {formatDateTime(course.createdAt)}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div>
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-[color:var(--primary)] hover:underline"
                          >
                            {course.title}
                          </Link>
                          <div className="text-[11px] text-gray-500">
                            ID: {course.id}
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                            {course.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle text-gray-700">
                        {formatDateTime(course.updatedAt)}
                      </td>
                      <td className="px-3 py-2 align-middle text-gray-700">
                        {course.category?.title ?? "-"}
                      </td>
                      <td className="px-3 py-2 align-middle text-gray-700">
                        {course.language}
                      </td>
                      <td className="px-3 py-2 align-middle text-gray-700">
                        {course.status}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                            course.isPaid
                              ? "border-[color:var(--primary)] bg-white text-[color:var(--primary)]"
                              : "border-gray-200 bg-gray-50 text-gray-600"
                          }`}
                        >
                          {course.isPaid ? "Paid" : "Free"}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle text-gray-700">
                        {course.isPaid && typeof course.priceCents === "number"
                          ? `${(course.priceCents / 100).toFixed(2)} ${(
                              course.currency ?? "eur"
                            ).toUpperCase()}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 align-middle text-gray-700">
                        {course.createdByUserId ?? "-"}
                      </td>
                      <td className="px-3 py-2 align-middle text-right text-sm">
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalCount > 0 && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-200 px-3 py-3 text-xs text-gray-600 md:text-sm">
                  <p>
                    Showing{" "}
                    <span className="font-semibold">
                      {(effectivePage - 1) * pageSize + 1}
                    </span>
                    -
                    <span className="font-semibold">
                      {Math.min(effectivePage * pageSize, totalCount)}
                    </span>{" "}
                    of <span className="font-semibold">{totalCount}</span>{" "}
                    courses
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
          title="Изтриване на избраните курсове"
          description="Избраните курсове ще бъдат физически изтрити. Това действие е необратимо."
          details={
            <div>
              Брой избрани:{" "}
              <span className="font-semibold">{selectedCourseIds.length}</span>
            </div>
          }
          confirmLabel="Изтрий"
          cancelLabel="Отказ"
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
                setBulkActionError("Възникна грешка при bulk изтриването.");
              } finally {
                setBulkDeleteSubmitting(false);
              }
            })();
          }}
        />

        <ConfirmDialog
          open={bulkStatusOpen}
          title="Промяна на статуса"
          description="Ще промените статуса на всички избрани курсове."
          details={
            <div>
              Нов статус: <span className="font-semibold">{bulkStatus}</span>
              <br />
              Брой избрани:{" "}
              <span className="font-semibold">{selectedCourseIds.length}</span>
            </div>
          }
          confirmLabel="OK"
          cancelLabel="Отказ"
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
                  "Възникна грешка при bulk промяна на статуса.",
                );
              } finally {
                setBulkStatusSubmitting(false);
              }
            })();
          }}
        />

        <ConfirmDialog
          open={purgeAllOpen}
          title="Изтриване на всички курсове"
          description={`Ще изтриете абсолютно всички курсове (${purgeTotalCount}). Това действие е необратимо.`}
          confirmLabel="Изтрий всички"
          cancelLabel="Отказ"
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
                  "Възникна грешка при изтриване на всички курсове.",
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
