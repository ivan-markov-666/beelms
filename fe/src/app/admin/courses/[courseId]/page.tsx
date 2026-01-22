"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getAccessToken } from "../../../auth-token";
import { getApiBaseUrl } from "../../../api-url";
import { AdminBreadcrumbs } from "../../_components/admin-breadcrumbs";
import { InfoTooltip } from "../../_components/info-tooltip";
import Link from "next/link";
import { ListboxSelect } from "../../../_components/listbox-select";
import { useCurrentLang } from "../../../../i18n/useCurrentLang";
import { t } from "../../../../i18n/t";
import { useAdminSupportedLanguages } from "../../_hooks/use-admin-supported-languages";

const API_BASE_URL = getApiBaseUrl();

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

type CourseModuleItem = {
  id: string;
  itemType: "wiki" | "task" | "quiz";
  title: string;
  order: number;
  wikiSlug: string | null;
  taskId: string | null;
  quizId: string | null;
};

type CourseDetail = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  isPaid: boolean;
  currency: string | null;
  priceCents: number | null;
  categoryId: string | null;
  category: {
    slug: string;
    title: string;
  } | null;
  curriculum: CourseModuleItem[];
};

type CourseEditForm = {
  title: string;
  description: string;
  language: string;
  status: string;
  isPaid: boolean;
  currency: string;
  priceCents: string;
  categoryId: string;
};

type CourseCategory = {
  id: string;
  slug: string;
  title: string;
  order: number;
  active: boolean;
};

type CreateCurriculumItemForm = {
  itemType: "wiki" | "quiz" | "task";
  title: string;
  wikiSlug: string;
  taskId: string;
  quizId: string;
  order: string;
};

const DEFAULT_FORM: CreateCurriculumItemForm = {
  itemType: "wiki",
  title: "",
  wikiSlug: "",
  taskId: "",
  quizId: "",
  order: "",
};

const CURRICULUM_ITEM_TYPES: CourseModuleItem["itemType"][] = [
  "wiki",
  "task",
  "quiz",
];

type AdminQuizListItem = {
  id: string;
  title: string;
  language: string;
  status: string;
};

type AdminTaskListItem = {
  id: string;
  title: string;
  language: string;
  status: string;
};

export default function AdminCourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId;
  const lang = useCurrentLang();
  const { languages: supportedAdminLangs } = useAdminSupportedLanguages();

  const languageOptions = useMemo(
    () => (supportedAdminLangs.length > 0 ? supportedAdminLangs : ["bg"]),
    [supportedAdminLangs],
  );

  const languageListboxOptions = useMemo(
    () =>
      languageOptions.map((code) => ({
        value: code,
        label: code.toUpperCase(),
      })),
    [languageOptions],
  );

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

  const curriculumTypeLabels = useMemo(
    () => ({
      wiki: t(lang, "common", "adminCoursesDetailCurriculumTypeWiki"),
      task: t(lang, "common", "adminCoursesDetailCurriculumTypeTask"),
      quiz: t(lang, "common", "adminCoursesDetailCurriculumTypeQuiz"),
    }),
    [lang],
  );

  const getCurriculumTypeLabel = useCallback(
    (type: CourseModuleItem["itemType"]) => curriculumTypeLabels[type] ?? type,
    [curriculumTypeLabels],
  );

  const languageLabelByCode = useMemo(() => {
    return languageListboxOptions.reduce<Record<string, string>>(
      (acc, option) => {
        acc[option.value] = option.label;
        return acc;
      },
      {},
    );
  }, [languageListboxOptions]);

  const curriculumTypeOptions = useMemo(
    () =>
      CURRICULUM_ITEM_TYPES.map((type) => ({
        value: type,
        label: curriculumTypeLabels[type] ?? type,
      })),
    [curriculumTypeLabels],
  );

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [curriculum, setCurriculum] = useState<CourseModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [courseForm, setCourseForm] = useState<CourseEditForm | null>(null);
  const [courseSaving, setCourseSaving] = useState(false);
  const [courseSaveError, setCourseSaveError] = useState<string | null>(null);
  const [courseSaveSuccess, setCourseSaveSuccess] = useState<string | null>(
    null,
  );

  const [form, setForm] = useState<CreateCurriculumItemForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [quizzes, setQuizzes] = useState<AdminQuizListItem[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizzesError, setQuizzesError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<AdminTaskListItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [categorySearch, setCategorySearch] = useState<string>("");

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

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    title: string;
    wikiSlug: string;
    taskId: string;
    quizId: string;
    order: string;
  } | null>(null);

  const breadcrumbItems = useMemo(
    () => [
      { label: t(lang, "common", "adminDashboardTitle"), href: "/admin" },
      {
        label: t(lang, "common", "adminDashboardTabCourses"),
        href: "/admin/courses",
      },
      {
        label:
          course?.title ??
          t(lang, "common", "adminCoursesDetailBreadcrumbFallback"),
      },
    ],
    [course?.title, lang],
  );

  const isCourseDirty = useMemo(() => {
    if (!course || !courseForm) return false;
    return (
      courseForm.title.trim() !== course.title ||
      courseForm.description.trim() !== course.description ||
      courseForm.language !== course.language ||
      courseForm.status !== course.status ||
      courseForm.isPaid !== course.isPaid ||
      (courseForm.categoryId || "") !== (course.categoryId ?? "") ||
      (courseForm.currency.trim() || "") !== (course.currency ?? "") ||
      (courseForm.priceCents.trim() || "") !==
        (typeof course.priceCents === "number" ? String(course.priceCents) : "")
    );
  }, [course, courseForm]);

  const readErrorMessage = useCallback(
    async (res: Response): Promise<string> => {
      try {
        const body = (await res.json()) as { message?: unknown };
        if (typeof body?.message === "string" && body.message.trim()) {
          return body.message;
        }
      } catch {}

      return t(lang, "common", "adminCoursesRequestFailed");
    },
    [lang],
  );

  const quizById = useMemo(() => {
    return new Map(quizzes.map((q) => [q.id, q] as const));
  }, [quizzes]);

  const taskById = useMemo(() => {
    return new Map(tasks.map((t) => [t.id, t] as const));
  }, [tasks]);

  const sortedCurriculum = useMemo(() => {
    return curriculum.slice().sort((a, b) => a.order - b.order);
  }, [curriculum]);

  const load = useCallback(async () => {
    if (typeof window === "undefined") return;

    setLoading(true);
    setError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setError(t(lang, "common", "adminErrorMissingApiAccess"));
        setLoading(false);
        return;
      }

      if (!courseId) {
        setError(t(lang, "common", "adminCoursesDetailMissingCourseId"));
        setLoading(false);
        return;
      }

      const [detailRes, curriculumRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/courses/${encodeURIComponent(courseId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(
          `${API_BASE_URL}/admin/courses/${encodeURIComponent(courseId)}/curriculum`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      ]);

      if (!detailRes.ok) {
        setError(t(lang, "common", "adminCoursesDetailLoadError"));
        setLoading(false);
        return;
      }

      const detail = (await detailRes.json()) as CourseDetail;
      setCourse(detail);
      setCourseForm({
        title: detail.title,
        description: detail.description,
        language: detail.language,
        status: detail.status,
        isPaid: !!detail.isPaid,
        categoryId: detail.categoryId ?? "",
        currency: detail.currency ?? "",
        priceCents:
          typeof detail.priceCents === "number"
            ? String(detail.priceCents)
            : "",
      });

      if (!curriculumRes.ok) {
        setCurriculum([]);
        setLoading(false);
        return;
      }

      const items = (await curriculumRes.json()) as CourseModuleItem[];
      setCurriculum(Array.isArray(items) ? items : []);
      setLoading(false);
    } catch {
      setError(t(lang, "common", "adminCoursesDetailLoadError"));
      setLoading(false);
    }
  }, [courseId, lang]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [load]);

  const loadQuizzes = useCallback(async () => {
    if (typeof window === "undefined") return;

    setQuizzesLoading(true);
    setQuizzesError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setQuizzesError(t(lang, "common", "adminErrorMissingApiAccess"));
        setQuizzesLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/quizzes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setQuizzesError(
          t(lang, "common", "adminCoursesDetailQuizzesLoadError"),
        );
        setQuizzesLoading(false);
        return;
      }

      const data = (await res.json()) as AdminQuizListItem[];
      setQuizzes(Array.isArray(data) ? data : []);
      setQuizzesLoading(false);
    } catch {
      setQuizzesError(
        t(lang, "common", "adminCoursesDetailQuizzesLoadError"),
      );
      setQuizzesLoading(false);
    }
  }, [lang]);

  const loadCategories = useCallback(async () => {
    if (typeof window === "undefined") return;

    setCategoriesLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/course-categories`);
      if (!res.ok) {
        setCategories([]);
        setCategoriesLoading(false);
        return;
      }

      const data = (await res.json()) as CourseCategory[];
      setCategories(Array.isArray(data) ? data : []);
      setCategoriesLoading(false);
    } catch {
      setCategories([]);
      setCategoriesLoading(false);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    if (typeof window === "undefined") return;

    setTasksLoading(true);
    setTasksError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setTasksError(t(lang, "common", "adminErrorMissingApiAccess"));
        setTasksLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setTasksError(
          t(lang, "common", "adminCoursesDetailTasksLoadError"),
        );
        setTasksLoading(false);
        return;
      }

      const data = (await res.json()) as AdminTaskListItem[];
      setTasks(Array.isArray(data) ? data : []);
      setTasksLoading(false);
    } catch {
      setTasksError(t(lang, "common", "adminCoursesDetailTasksLoadError"));
      setTasksLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQuizzes();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadQuizzes]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTasks();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadTasks]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCategories();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadCategories]);

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
        } catch {
          // ignore
        }
      })();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleAddCurriculumItem = async () => {
    if (typeof window === "undefined") return;
    if (!courseId) return;

    setSaveError(null);
    setSaveSuccess(null);
    setSaving(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setSaveError(t(lang, "common", "adminErrorMissingApiAccess"));
        setSaving(false);
        return;
      }

      const title = form.title.trim();
      if (!title) {
        setSaveError(
          t(lang, "common", "adminCoursesDetailItemTitleRequired"),
        );
        setSaving(false);
        return;
      }

      const payload: Record<string, unknown> = {
        itemType: form.itemType,
        title,
      };

      if (form.itemType === "wiki") {
        const wikiSlug = form.wikiSlug.trim();
        if (!wikiSlug) {
          setSaveError(
            t(lang, "common", "adminCoursesDetailWikiSlugRequired"),
          );
          setSaving(false);
          return;
        }
        payload.wikiSlug = wikiSlug;
      }

      if (form.itemType === "task") {
        const taskId = form.taskId.trim();
        if (!taskId) {
          setSaveError(
            t(lang, "common", "adminCoursesDetailTaskIdRequired"),
          );
          setSaving(false);
          return;
        }
        payload.taskId = taskId;
      }

      if (form.itemType === "quiz") {
        const quizId = form.quizId.trim();
        if (!quizId) {
          setSaveError(
            t(lang, "common", "adminCoursesDetailQuizIdRequired"),
          );
          setSaving(false);
          return;
        }
        payload.quizId = quizId;
      }

      const maybeOrder = Number(form.order);
      if (form.order.trim() && Number.isFinite(maybeOrder) && maybeOrder > 0) {
        payload.order = maybeOrder;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/courses/${encodeURIComponent(courseId)}/curriculum`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setSaveError(
          msg || t(lang, "common", "adminCoursesDetailCurriculumAddError"),
        );
        setSaving(false);
        return;
      }

      const created = (await res.json()) as CourseModuleItem;
      setCurriculum((prev) => [...prev, created]);
      setForm(DEFAULT_FORM);
      setSaveSuccess(t(lang, "common", "adminCoursesDetailCurriculumAddSuccess"));
      setSaving(false);
    } catch {
      setSaveError(t(lang, "common", "adminCoursesDetailCurriculumAddError"));
      setSaving(false);
    }
  };

  const saveCourse = async () => {
    if (typeof window === "undefined") return;
    if (!courseId || !course || !courseForm) return;

    setCourseSaveError(null);
    setCourseSaveSuccess(null);
    setCourseSaving(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setCourseSaveError(t(lang, "common", "adminErrorMissingApiAccess"));
        setCourseSaving(false);
        return;
      }

      const payload: Record<string, unknown> = {};

      const nextTitle = courseForm.title.trim();
      const nextDescription = courseForm.description.trim();

      if (nextTitle !== course.title) {
        payload.title = nextTitle;
      }
      if (nextDescription !== course.description) {
        payload.description = nextDescription;
      }
      if (courseForm.language !== course.language) {
        payload.language = courseForm.language;
      }
      if (courseForm.status !== course.status) {
        payload.status = courseForm.status;
      }

      const nextCategoryId = courseForm.categoryId.trim();
      const currentCategoryId = course.categoryId ?? "";
      if (nextCategoryId !== currentCategoryId) {
        payload.categoryId = nextCategoryId ? nextCategoryId : null;
      }
      if (courseForm.isPaid !== course.isPaid) {
        if (courseForm.isPaid && paidCourseDisabled) {
          setCourseSaveError(
            t(
              lang,
              "common",
              "adminCoursesDetailPaidCourseDisabledError",
            ),
          );
          setCourseSaving(false);
          return;
        }
        payload.isPaid = courseForm.isPaid;
      }

      const nextCurrency = courseForm.currency.trim().toLowerCase();
      const nextPriceRaw = courseForm.priceCents.trim();
      const nextPriceCents = Number(nextPriceRaw);

      if (courseForm.isPaid) {
        if (!/^[a-z]{3}$/.test(nextCurrency)) {
          setCourseSaveError(
            t(lang, "common", "adminCoursesCurrencyInvalid"),
          );
          setCourseSaving(false);
          return;
        }

        if (
          !nextPriceRaw ||
          !Number.isFinite(nextPriceCents) ||
          nextPriceCents <= 0
        ) {
          setCourseSaveError(
            t(lang, "common", "adminCoursesPriceInvalid"),
          );
          setCourseSaving(false);
          return;
        }

        if (nextCurrency !== (course.currency ?? "")) {
          payload.currency = nextCurrency;
        }

        if (nextPriceCents !== (course.priceCents ?? null)) {
          payload.priceCents = nextPriceCents;
        }
      } else {
        if (course.currency !== null) {
          payload.currency = null;
        }
        if (course.priceCents !== null) {
          payload.priceCents = null;
        }
      }

      if (Object.keys(payload).length === 0) {
        setCourseSaveSuccess(
          t(lang, "common", "adminCoursesNoChanges"),
        );
        setCourseSaving(false);
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/courses/${encodeURIComponent(courseId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setCourseSaveError(msg || t(lang, "common", "adminCoursesSaveError"));
        setCourseSaving(false);
        return;
      }

      const updated = (await res.json()) as CourseDetail;
      setCourse(updated);
      setCurriculum(
        Array.isArray(updated.curriculum) ? updated.curriculum : [],
      );
      setCourseForm({
        title: updated.title,
        description: updated.description,
        language: updated.language,
        status: updated.status,
        isPaid: !!updated.isPaid,
        categoryId: updated.categoryId ?? "",
        currency: updated.currency ?? "",
        priceCents:
          typeof updated.priceCents === "number"
            ? String(updated.priceCents)
            : "",
      });
      setCourseSaveSuccess(t(lang, "common", "adminCoursesSaved"));
      setCourseSaving(false);
    } catch {
      setCourseSaveError(t(lang, "common", "adminCoursesSaveError"));
      setCourseSaving(false);
    }
  };

  const startEditItem = (item: CourseModuleItem) => {
    setActionError(null);
    setActionSuccess(null);
    setEditingItemId(item.id);
    setEditDraft({
      title: item.title,
      wikiSlug: item.wikiSlug ?? "",
      taskId: item.taskId ?? "",
      quizId: item.quizId ?? "",
      order: String(item.order),
    });
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
    setEditDraft(null);
  };

  const saveEditItem = async (item: CourseModuleItem) => {
    if (typeof window === "undefined") return;
    if (!courseId) return;
    if (!editDraft) return;

    setActionError(null);
    setActionSuccess(null);
    setActionBusyId(item.id);

    try {
      const token = getAccessToken();
      if (!token) {
        setActionError(t(lang, "common", "adminErrorMissingApiAccess"));
        setActionBusyId(null);
        return;
      }

      const payload: Record<string, unknown> = {};

      const nextTitle = editDraft.title.trim();
      const nextWikiSlug = editDraft.wikiSlug.trim();
      const nextTaskId = editDraft.taskId.trim();
      const nextQuizId = editDraft.quizId.trim();
      const nextOrder = Number(editDraft.order);

      if (nextTitle && nextTitle !== item.title) {
        payload.title = nextTitle;
      }

      if (item.itemType === "wiki") {
        if (nextWikiSlug && nextWikiSlug !== (item.wikiSlug ?? "")) {
          payload.wikiSlug = nextWikiSlug;
        }
      }

      if (item.itemType === "quiz") {
        if (nextQuizId && nextQuizId !== (item.quizId ?? "")) {
          payload.quizId = nextQuizId;
        }
      }

      if (item.itemType === "task") {
        if (nextTaskId && nextTaskId !== (item.taskId ?? "")) {
          payload.taskId = nextTaskId;
        }
      }

      if (
        Number.isFinite(nextOrder) &&
        nextOrder > 0 &&
        nextOrder !== item.order
      ) {
        payload.order = nextOrder;
      }

      if (Object.keys(payload).length === 0) {
        setActionSuccess(t(lang, "common", "adminCoursesNoChanges"));
        setActionBusyId(null);
        cancelEditItem();
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/courses/${encodeURIComponent(
          courseId,
        )}/curriculum/${encodeURIComponent(item.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setActionError(
          msg || t(lang, "common", "adminCoursesDetailSaveItemError"),
        );
        setActionBusyId(null);
        return;
      }

      await load();
      setActionSuccess(t(lang, "common", "adminCoursesSaved"));
      setActionBusyId(null);
      cancelEditItem();
    } catch {
      setActionError(t(lang, "common", "adminCoursesDetailSaveItemError"));
      setActionBusyId(null);
    }
  };

  const moveItem = async (item: CourseModuleItem, delta: -1 | 1) => {
    if (typeof window === "undefined") return;
    if (!courseId) return;

    setActionError(null);
    setActionSuccess(null);
    setActionBusyId(item.id);

    const targetOrder = item.order + delta;
    if (targetOrder < 1) {
      setActionBusyId(null);
      return;
    }

    try {
      const token = getAccessToken();
      if (!token) {
        setActionError(t(lang, "common", "adminErrorMissingApiAccess"));
        setActionBusyId(null);
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/courses/${encodeURIComponent(
          courseId,
        )}/curriculum/${encodeURIComponent(item.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order: targetOrder }),
        },
      );

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setActionError(
          msg || t(lang, "common", "adminCoursesDetailReorderError"),
        );
        setActionBusyId(null);
        return;
      }

      await load();
      setActionSuccess(t(lang, "common", "adminCoursesDetailReordered"));
      setActionBusyId(null);
    } catch {
      setActionError(t(lang, "common", "adminCoursesDetailReorderError"));
      setActionBusyId(null);
    }
  };

  const deleteItem = async (item: CourseModuleItem) => {
    if (typeof window === "undefined") return;
    if (!courseId) return;

    const ok = window.confirm(
      `${t(lang, "common", "adminCoursesDetailDeleteConfirmPrefix")} "${item.title}"?`,
    );
    if (!ok) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setActionBusyId(item.id);

    try {
      const token = getAccessToken();
      if (!token) {
        setActionError("Липсва достъп до Admin API.");
        setActionBusyId(null);
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/courses/${encodeURIComponent(
          courseId,
        )}/curriculum/${encodeURIComponent(item.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok && res.status !== 204) {
        const msg = await readErrorMessage(res);
        setActionError(
          msg || t(lang, "common", "adminCoursesDetailDeleteError"),
        );
        setActionBusyId(null);
        return;
      }

      await load();
      setActionSuccess(t(lang, "common", "adminCoursesDetailDeleted"));
      setActionBusyId(null);
    } catch {
      setActionError(t(lang, "common", "adminCoursesDetailDeleteError"));
      setActionBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <AdminBreadcrumbs items={breadcrumbItems} />
        <p className="text-sm text-gray-500">Loading course...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="space-y-4">
        <AdminBreadcrumbs items={breadcrumbItems} />
        <p className="text-sm text-red-700">{error ?? "Course not found"}</p>
        <Link
          href="/admin/courses"
          className="mt-3 inline-block text-sm font-medium text-green-700 hover:text-green-900 hover:underline"
        >
          ← Back to courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={breadcrumbItems} />

      <section className="space-y-3">
        <Link
          href="/admin/courses"
          className="text-sm font-medium text-green-700 hover:text-green-900 hover:underline"
        >
          ← Back to courses
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            {course.title}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{course.description}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-1">
              {course.language}
            </span>
            <span className="rounded bg-gray-100 px-2 py-1">
              {course.status}
            </span>
            <span className="rounded bg-gray-100 px-2 py-1">
              {course.isPaid ? "paid" : "free"}
            </span>
            {course.isPaid && course.priceCents && (
              <span className="rounded bg-gray-100 px-2 py-1">
                {(course.priceCents / 100).toFixed(2)}{" "}
                {(course.currency ?? "eur").toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Course settings
          </h2>
          <button
            type="button"
            className="text-sm font-medium text-green-700 hover:text-green-900 disabled:opacity-60"
            disabled={courseSaving || !isCourseDirty}
            onClick={() => void saveCourse()}
          >
            {courseSaving ? "Saving..." : "Save"}
          </button>
        </div>

        {courseSaveError && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {courseSaveError}
          </div>
        )}

        {courseSaveSuccess && (
          <div
            className="mt-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            role="status"
          >
            {courseSaveSuccess}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Title</span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              value={courseForm?.title ?? ""}
              onChange={(e) =>
                setCourseForm((p) => (p ? { ...p, title: e.target.value } : p))
              }
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Language</span>
            <ListboxSelect
              ariaLabel="Course language"
              value={courseForm?.language ?? "bg"}
              onChange={(next) =>
                setCourseForm((p) => (p ? { ...p, language: next } : p))
              }
              buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              options={[
                { value: "bg", label: "bg" },
                { value: "en", label: "en" },
              ]}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Status</span>
            <ListboxSelect
              ariaLabel="Course status"
              value={courseForm?.status ?? "draft"}
              onChange={(next) =>
                setCourseForm((p) => (p ? { ...p, status: next } : p))
              }
              buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              options={[
                { value: "draft", label: "draft" },
                { value: "active", label: "active" },
                { value: "inactive", label: "inactive" },
              ]}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Category</span>
            <input
              className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Search category..."
              disabled={categoriesLoading}
            />
            <ListboxSelect
              ariaLabel="Course category"
              value={courseForm?.categoryId ?? ""}
              disabled={categoriesLoading}
              onChange={(next) =>
                setCourseForm((p) => (p ? { ...p, categoryId: next } : p))
              }
              buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:bg-gray-50"
              options={[
                { value: "", label: "(none)" },
                ...categories
                  .filter((c) => {
                    const q = categorySearch.trim().toLowerCase();
                    if (!q) return true;
                    return (c.title ?? "").toLowerCase().includes(q);
                  })
                  .map((c) => ({ value: c.id, label: c.title })),
              ]}
            />
          </label>

          <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={courseForm?.isPaid ?? false}
                disabled={
                  courseSaving ||
                  (paidCourseDisabled && !(courseForm?.isPaid ?? false))
                }
                onChange={(e) =>
                  setCourseForm((p) =>
                    p ? { ...p, isPaid: e.target.checked } : p,
                  )
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
            <span className="text-xs font-medium text-gray-600">Currency</span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50"
              value={courseForm?.currency ?? ""}
              onChange={(e) =>
                setCourseForm((p) =>
                  p ? { ...p, currency: e.target.value } : p,
                )
              }
              disabled={!(courseForm?.isPaid ?? false) || paidCourseDisabled}
              placeholder="eur"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Price (cents)
            </span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50"
              value={courseForm?.priceCents ?? ""}
              onChange={(e) =>
                setCourseForm((p) =>
                  p ? { ...p, priceCents: e.target.value } : p,
                )
              }
              disabled={!(courseForm?.isPaid ?? false) || paidCourseDisabled}
              inputMode="numeric"
              placeholder="999"
            />
          </label>
        </div>

        <label className="mt-4 block space-y-1">
          <span className="text-xs font-medium text-gray-600">Description</span>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            rows={3}
            value={courseForm?.description ?? ""}
            onChange={(e) =>
              setCourseForm((p) =>
                p ? { ...p, description: e.target.value } : p,
              )
            }
          />
        </label>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Curriculum</h2>
          <button
            type="button"
            className="text-sm font-medium text-green-700 hover:text-green-900"
            onClick={() => void load()}
          >
            Reload
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Type</span>
            <ListboxSelect
              ariaLabel="Curriculum item type"
              value={form.itemType}
              onChange={(next) =>
                setForm((p) => ({
                  ...p,
                  itemType: next as "wiki" | "quiz" | "task",
                }))
              }
              buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              options={[
                { value: "wiki", label: "wiki" },
                { value: "task", label: "task" },
                { value: "quiz", label: "quiz" },
              ]}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Title</span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
            />
          </label>

          {form.itemType === "wiki" ? (
            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">
                Wiki slug
              </span>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                value={form.wikiSlug}
                onChange={(e) =>
                  setForm((p) => ({ ...p, wikiSlug: e.target.value }))
                }
              />
            </label>
          ) : form.itemType === "task" ? (
            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">Task</span>
              <ListboxSelect
                ariaLabel="Task"
                value={form.taskId}
                onChange={(next) => setForm((p) => ({ ...p, taskId: next }))}
                buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                options={[
                  { value: "", label: "(select task)" },
                  ...tasks.map((t) => ({
                    value: t.id,
                    label: `${t.title} (${t.language}, ${t.status})`,
                  })),
                ]}
              />
            </label>
          ) : (
            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">Quiz</span>
              <ListboxSelect
                ariaLabel="Quiz"
                value={form.quizId}
                onChange={(next) => setForm((p) => ({ ...p, quizId: next }))}
                buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                options={[
                  { value: "", label: "(select quiz)" },
                  ...quizzes.map((q) => ({
                    value: q.id,
                    label: `${q.title} (${q.language}, ${q.status})`,
                  })),
                ]}
              />
            </label>
          )}

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Order (optional)
            </span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              value={form.order}
              onChange={(e) =>
                setForm((p) => ({ ...p, order: e.target.value }))
              }
              placeholder="e.g. 1"
            />
          </label>
        </div>

        {quizzesLoading && (
          <p className="mt-3 text-sm text-gray-500">Loading quizzes...</p>
        )}

        {!quizzesLoading && quizzesError && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {quizzesError}
          </div>
        )}

        {tasksLoading && (
          <p className="mt-3 text-sm text-gray-500">Loading tasks...</p>
        )}

        {!tasksLoading && tasksError && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {tasksError}
          </div>
        )}

        {saveError && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {saveError}
          </div>
        )}

        {saveSuccess && (
          <div
            className="mt-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            role="status"
          >
            {saveSuccess}
          </div>
        )}

        <button
          type="button"
          className="mt-3 inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
          disabled={
            saving ||
            !form.title.trim() ||
            (form.itemType === "wiki"
              ? !form.wikiSlug.trim()
              : form.itemType === "task"
                ? !form.taskId.trim()
                : !form.quizId.trim())
          }
          onClick={() => void handleAddCurriculumItem()}
        >
          {saving
            ? "Adding..."
            : form.itemType === "wiki"
              ? "Add wiki item"
              : form.itemType === "task"
                ? "Add task item"
                : "Add quiz item"}
        </button>

        {actionError && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {actionError}
          </div>
        )}

        {actionSuccess && (
          <div
            className="mt-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            role="status"
          >
            {actionSuccess}
          </div>
        )}

        {sortedCurriculum.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No curriculum items.</p>
        ) : (
          <ol className="mt-4 space-y-2">
            {sortedCurriculum.map((item, idx) => {
              const isEditing = editingItemId === item.id;
              const draft = isEditing ? editDraft : null;

              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <div>
                    {isEditing && draft ? (
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <label className="space-y-1">
                          <span className="text-[11px] font-medium text-gray-600">
                            Title
                          </span>
                          <input
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
                            value={draft.title}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, title: e.target.value } : p,
                              )
                            }
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-[11px] font-medium text-gray-600">
                            Order
                          </span>
                          <input
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
                            value={draft.order}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, order: e.target.value } : p,
                              )
                            }
                          />
                        </label>

                        {item.itemType === "wiki" ? (
                          <label className="space-y-1">
                            <span className="text-[11px] font-medium text-gray-600">
                              Wiki slug
                            </span>
                            <input
                              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
                              value={draft.wikiSlug}
                              onChange={(e) =>
                                setEditDraft((p) =>
                                  p ? { ...p, wikiSlug: e.target.value } : p,
                                )
                              }
                            />
                          </label>
                        ) : item.itemType === "task" ? (
                          <label className="space-y-1">
                            <span className="text-[11px] font-medium text-gray-600">
                              Task
                            </span>
                            <ListboxSelect
                              ariaLabel="Task"
                              value={draft.taskId}
                              onChange={(next) =>
                                setEditDraft((p) =>
                                  p ? { ...p, taskId: next } : p,
                                )
                              }
                              buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                              options={[
                                { value: "", label: "(select task)" },
                                ...tasks.map((t) => ({
                                  value: t.id,
                                  label: `${t.title} (${t.language}, ${t.status})`,
                                })),
                              ]}
                            />
                          </label>
                        ) : item.itemType === "quiz" ? (
                          <label className="space-y-1">
                            <span className="text-[11px] font-medium text-gray-600">
                              Quiz
                            </span>
                            <ListboxSelect
                              ariaLabel="Quiz"
                              value={draft.quizId}
                              onChange={(next) =>
                                setEditDraft((p) =>
                                  p ? { ...p, quizId: next } : p,
                                )
                              }
                              buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                              options={[
                                { value: "", label: "(select quiz)" },
                                ...quizzes.map((q) => ({
                                  value: q.id,
                                  label: `${q.title} (${q.language}, ${q.status})`,
                                })),
                              ]}
                            />
                          </label>
                        ) : (
                          <div />
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.order}. {item.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.itemType}
                          {item.wikiSlug ? ` • ${item.wikiSlug}` : ""}
                          {item.taskId ? ` • ${item.taskId}` : ""}
                          {item.quizId ? ` • ${item.quizId}` : ""}
                        </p>
                        {item.itemType === "task" && item.taskId && (
                          <div className="mt-1">
                            <Link
                              href={`/admin/tasks/${item.taskId}`}
                              className="text-xs font-medium text-green-700 hover:text-green-900 hover:underline"
                            >
                              {taskById.get(item.taskId)?.title ?? "Open task"}{" "}
                              →
                            </Link>
                          </div>
                        )}
                        {item.itemType === "quiz" && item.quizId && (
                          <div className="mt-1">
                            <Link
                              href={`/admin/quizzes/${item.quizId}`}
                              className="text-xs font-medium text-green-700 hover:text-green-900 hover:underline"
                            >
                              {quizById.get(item.quizId)?.title ?? "Open quiz"}{" "}
                              →
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                          disabled={actionBusyId === item.id}
                          onClick={() => void saveEditItem(item)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                          disabled={actionBusyId === item.id}
                          onClick={() => cancelEditItem()}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        disabled={actionBusyId === item.id || !!editingItemId}
                        onClick={() => startEditItem(item)}
                      >
                        Edit
                      </button>
                    )}

                    <button
                      type="button"
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      disabled={actionBusyId === item.id || idx === 0}
                      onClick={() => void moveItem(item, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      disabled={
                        actionBusyId === item.id ||
                        idx === sortedCurriculum.length - 1
                      }
                      onClick={() => void moveItem(item, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="rounded border border-red-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                      disabled={actionBusyId === item.id}
                      onClick={() => void deleteItem(item)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
