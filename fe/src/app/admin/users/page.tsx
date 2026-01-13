"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";
import { AdminBreadcrumbs } from "../_components/admin-breadcrumbs";
import { Pagination } from "../../_components/pagination";
import { InfoTooltip } from "../_components/info-tooltip";
import { ListboxSelect } from "../../_components/listbox-select";
import { ConfirmDialog } from "../_components/confirm-dialog";
import { StyledCheckbox } from "../_components/styled-checkbox";

const API_BASE_URL = getApiBaseUrl();

const DEFAULT_PAGE_SIZE = 20;

type UserRole = "user" | "admin" | "monitoring" | "teacher" | "author";

const USER_ROLES: readonly UserRole[] = [
  "user",
  "admin",
  "monitoring",
  "teacher",
  "author",
];

type AdminUser = {
  id: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

type AdminUsersStats = {
  totalUsers: number;
  activeUsers: number;
  deactivatedUsers: number;
  adminUsers: number;
};

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

function getUserInitials(email: string): string {
  const [localPart] = email.split("@");
  const safeLocal = localPart ?? "";

  if (!safeLocal) return "?";

  const parts = safeLocal
    .split(/[._-]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return safeLocal.slice(0, 2).toUpperCase();
}

export default function AdminUsersPage() {
  const lang = useCurrentLang();
  const searchParams = useSearchParams();
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [effectiveSearch, setEffectiveSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null);
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminUsersStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [didInitFromQuery, setDidInitFromQuery] = useState(false);

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const selectedSet = useMemo(
    () => new Set(selectedUserIds),
    [selectedUserIds],
  );
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteSubmitting, setBulkDeleteSubmitting] = useState(false);
  const [purgeTotalCount, setPurgeTotalCount] = useState<number>(0);
  const [purgeAllOpen, setPurgeAllOpen] = useState(false);
  const [purgeAllSubmitting, setPurgeAllSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const loadMe = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;

        const data = (await res.json()) as { id?: string };
        const id = (data.id ?? "").trim();
        if (!cancelled) {
          setMyUserId(id || null);
        }
      } catch {
        // ignore
      }
    };

    void loadMe();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (didInitFromQuery) return;

    const statusParam = (searchParams.get("status") ?? "").toLowerCase();
    const roleParam = (searchParams.get("role") ?? "").toLowerCase();

    if (statusParam === "active" || statusParam === "deactivated") {
      setStatusFilter(statusParam);
    }

    if (USER_ROLES.includes(roleParam as UserRole)) {
      setRoleFilter(roleParam);
    }

    setDidInitFromQuery(true);
  }, [searchParams, didInitFromQuery]);

  const loadUsers = useCallback(
    async (options?: {
      query?: string;
      page?: number;
      pageSize?: number;
      status?: string;
      role?: string;
    }) => {
      if (typeof window === "undefined") return;

      setLoading(true);
      setError(null);
      setToggleError(null);
      setRoleUpdateError(null);
      setBulkActionError(null);

      const query = options?.query;
      const page = options?.page && options.page > 0 ? options.page : 1;
      const pageSize =
        options?.pageSize && options.pageSize > 0
          ? options.pageSize
          : DEFAULT_PAGE_SIZE;
      const status = options?.status;
      const role = options?.role;

      try {
        const token = getAccessToken();
        if (!token) {
          setError(t(lang, "common", "adminUsersNoToken"));
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();
        if (query && query.trim().length > 0) {
          params.set("q", query.trim());
        }
        if (status) {
          params.set("status", status);
        }
        if (role) {
          params.set("role", role);
        }
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));

        const url = `${API_BASE_URL}/admin/users?${params.toString()}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setError(t(lang, "common", "adminUsersError"));
          setLoading(false);
          return;
        }

        const raw = (await res.json()) as unknown;
        const data = Array.isArray(raw)
          ? (raw as AdminUser[])
          : Array.isArray((raw as { items?: unknown }).items)
            ? ((raw as { items: AdminUser[] }).items ?? [])
            : Array.isArray((raw as { users?: unknown }).users)
              ? ((raw as { users: AdminUser[] }).users ?? [])
              : [];
        setUsers(data);

        const rawTotal = res.headers?.get?.("X-Total-Count") ?? "";
        const parsedTotal = Number.parseInt(rawTotal, 10);
        if (Number.isFinite(parsedTotal) && parsedTotal >= 0) {
          setTotalCount(parsedTotal);
        } else {
          setTotalCount(data.length);
        }

        setLoading(false);
      } catch {
        setError(t(lang, "common", "adminUsersError"));
        setLoading(false);
      }
    },
    [lang],
  );

  const loadPurgeCount = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const token = getAccessToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/admin/users/count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;

      const data = (await res.json()) as { total?: number };
      const total = typeof data.total === "number" ? data.total : 0;
      setPurgeTotalCount(Number.isFinite(total) && total >= 0 ? total : 0);
    } catch {
      // ignore
    }
  }, []);

  const exportCsv = async () => {
    if (typeof window === "undefined") return;

    try {
      const token = getAccessToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (effectiveSearch.trim()) params.set("q", effectiveSearch.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (roleFilter) params.set("role", roleFilter);

      const url = `${API_BASE_URL}/admin/users/export.csv?${params.toString()}`;
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
      const header = res.headers?.get?.("Content-Disposition") ?? "";
      const match = /filename="?([^";]+)"?/i.exec(header);
      const filename = match?.[1] ? match[1] : "users.csv";
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

  const loadStats = useCallback(async () => {
    if (typeof window === "undefined") return;

    setStatsLoading(true);
    setStatsError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setStatsError(t(lang, "common", "adminUsersNoToken"));
        setStatsLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/users/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setStatsError(t(lang, "common", "adminUsersStatsError"));
        setStatsLoading(false);
        return;
      }

      const data = (await res.json()) as AdminUsersStats;
      setStats(data);
      setStatsLoading(false);
    } catch {
      setStatsError(t(lang, "common", "adminUsersStatsError"));
      setStatsLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    void loadUsers({
      query: effectiveSearch,
      page: currentPage,
      pageSize,
      status: statusFilter || undefined,
      role: roleFilter || undefined,
    });
  }, [
    loadUsers,
    effectiveSearch,
    currentPage,
    pageSize,
    statusFilter,
    roleFilter,
  ]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void loadPurgeCount();
  }, [loadPurgeCount]);

  useEffect(() => {
    const allowed = new Set(users.map((u) => u.id));
    setSelectedUserIds((prev) =>
      prev.filter((id) => allowed.has(id) && id !== myUserId),
    );
  }, [users, myUserId]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = search.trim();
    setCurrentPage(1);
    setEffectiveSearch(trimmed);
  };

  const handleChangeRole = async (userId: string, nextRole: UserRole) => {
    if (typeof window === "undefined") return;

    setRoleUpdateError(null);
    setRoleUpdatingId(userId);

    const previousUsers = users;

    const optimisticUsers = users.map((user) =>
      user.id === userId ? { ...user, role: nextRole } : user,
    );
    setUsers(optimisticUsers);

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("missing-token");
      }

      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });

      if (!res.ok) {
        throw new Error(`failed-${res.status}`);
      }

      const updated = (await res.json()) as AdminUser;

      setUsers((current) =>
        current.map((user) =>
          user.id === userId ? { ...user, ...updated } : user,
        ),
      );
    } catch {
      setUsers(previousUsers);
      setRoleUpdateError(t(lang, "common", "adminUsersRoleUpdateError"));
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    if (typeof window === "undefined") return;

    setToggleError(null);
    setTogglingId(userId);

    const previousUsers = users;

    const optimisticUsers = users.map((user) =>
      user.id === userId ? { ...user, active: !currentActive } : user,
    );
    setUsers(optimisticUsers);

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("missing-token");
      }

      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!res.ok) {
        throw new Error(`failed-${res.status}`);
      }

      const updated = (await res.json()) as AdminUser;

      setUsers((current) =>
        current.map((user) =>
          user.id === userId ? { ...user, ...updated } : user,
        ),
      );
    } catch {
      setUsers(previousUsers);
      setToggleError(t(lang, "common", "adminUsersToggleError"));
    } finally {
      setTogglingId(null);
    }
  };

  const hasUsers = !loading && !error && users.length > 0;

  const selectableUsers = users.filter((u) => u.id !== myUserId);
  const isAllVisibleSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((u) => selectedSet.has(u.id));
  const hasAnySelected = selectedUserIds.length > 0;

  const selectAllVisible = () => {
    const visibleIds = selectableUsers.map((u) => u.id);
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) next.add(id);
      return Array.from(next);
    });
  };

  const clearAllVisible = () => {
    const visible = new Set(selectableUsers.map((u) => u.id));
    setSelectedUserIds((prev) => prev.filter((id) => !visible.has(id)));
  };

  const toggleSelected = (id: string) => {
    if (myUserId && id === myUserId) {
      return;
    }
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const totalUsers = totalCount;

  const totalPages =
    totalUsers > 0 ? Math.max(1, Math.ceil(totalUsers / pageSize)) : 1;

  const showingFrom = totalUsers > 0 ? (currentPage - 1) * pageSize + 1 : 0;

  const showingTo =
    totalUsers > 0
      ? Math.min(currentPage * pageSize, totalUsers)
      : users.length;

  return (
    <div className="space-y-4">
      <AdminBreadcrumbs
        items={[
          { label: "Админ табло", href: "/admin" },
          { label: "Users Management" },
        ]}
      />

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-zinc-900">
              {t(lang, "common", "adminUsersTitle")}
            </h2>
            <InfoTooltip
              label="Users management info"
              title="Users Management"
              description="Управление на потребители: търсене, филтри, промяна на роля, деактивиране/активиране и export на резултатите."
            />
          </div>
          <p className="text-sm text-zinc-600">
            {t(lang, "common", "adminUsersSubtitle")}
          </p>
        </div>

        <div className="mb-6">
          {statsLoading && !stats && (
            <p className="text-sm text-zinc-600">
              {t(lang, "common", "adminUsersStatsLoading")}
            </p>
          )}

          {statsError && (
            <p className="text-sm text-red-600" role="alert">
              {statsError}
            </p>
          )}

          {stats && !statsError && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {t(lang, "common", "adminUsersStatsTotal")}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-zinc-900">
                      {stats.totalUsers}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2m18 0v-2a4 4 0 00-3-3.87M9 10a4 4 0 110-8 4 4 0 010 8zm6 0a4 4 0 10-.88-7.88"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {t(lang, "common", "adminUsersStatsActive")}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-[color:var(--primary)]">
                      {stats.activeUsers}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-50">
                    <svg
                      className="h-5 w-5 text-[color:var(--primary)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {t(lang, "common", "adminUsersStatsDeactivated")}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-orange-600">
                      {stats.deactivatedUsers}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                    <svg
                      className="h-5 w-5 text-orange-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 5.636L5.636 18.364M5.636 5.636L18.364 18.364"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {t(lang, "common", "adminUsersStatsAdmins")}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-purple-700">
                      {stats.adminUsers}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                    <svg
                      className="h-5 w-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 2l7 4v6c0 5-3.5 9.5-7 10-3.5-.5-7-5-7-10V6l7-4zm0 0v20"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <form
              className="md:col-span-1 flex items-center gap-3"
              onSubmit={handleSearchSubmit}
            >
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
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
                  placeholder={t(lang, "common", "adminUsersSearchPlaceholder")}
                  className="w-full rounded-lg border border-[color:var(--border)] bg-white py-2 pl-9 pr-3 text-sm text-[color:var(--foreground)] shadow-sm placeholder:text-zinc-400 focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
                style={{ backgroundColor: "var(--primary)" }}
              >
                {t(lang, "common", "adminUsersSearchButton")}
              </button>
            </form>

            <div>
              <ListboxSelect
                ariaLabel="Users status"
                value={statusFilter}
                onChange={(next) => {
                  setCurrentPage(1);
                  setStatusFilter(next);
                }}
                options={[
                  { value: "", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "deactivated", label: "Deactivated" },
                ]}
              />
            </div>

            <div>
              <ListboxSelect
                ariaLabel="Users role"
                value={roleFilter}
                onChange={(next) => {
                  setCurrentPage(1);
                  setRoleFilter(next);
                }}
                options={[
                  { value: "", label: "All Roles" },
                  { value: "user", label: "User" },
                  { value: "admin", label: "Admin" },
                  { value: "monitoring", label: "Monitoring" },
                  { value: "teacher", label: "Teacher" },
                  { value: "author", label: "Author" },
                ]}
              />
            </div>
          </div>
        </section>

        {loading && (
          <p className="text-sm text-zinc-600">
            {t(lang, "common", "adminUsersLoading")}
          </p>
        )}

        {!loading && error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && users.length === 0 && (
          <p className="text-sm text-zinc-600">
            {t(lang, "common", "adminUsersNoData")}
          </p>
        )}

        {!loading && !error && hasUsers && (
          <>
            {toggleError && (
              <p className="mb-3 text-sm text-red-600" role="alert">
                {toggleError}
              </p>
            )}
            {roleUpdateError && (
              <p className="mb-3 text-sm text-red-600" role="alert">
                {roleUpdateError}
              </p>
            )}
            {bulkActionError && (
              <div
                className="mb-3 rounded-md border px-4 py-3 text-sm"
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void exportCsv()}
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                  disabled={totalUsers <= 0}
                >
                  Export CSV
                </button>
                <InfoTooltip
                  label="Users table controls info"
                  title="Users table"
                  description="Използвай Rows per page за 10/20/50/100. Export CSV генерира файл от текущите филтри (server-side)."
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-zinc-700 md:text-sm">
                  Selected: {selectedUserIds.length}
                </span>
                <button
                  type="button"
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                  disabled={!hasAnySelected}
                  onClick={() => {
                    setBulkActionError(null);
                    setBulkDeleteOpen(true);
                  }}
                >
                  Delete selected
                </button>
                <button
                  type="button"
                  className="rounded-md border border-[color:var(--field-error-border)] bg-white px-3 py-2 text-xs font-semibold shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                  style={{ color: "var(--error)" }}
                  disabled={purgeTotalCount <= 0}
                  onClick={() => {
                    setBulkActionError(null);
                    setPurgeAllOpen(true);
                  }}
                >
                  Delete all ({purgeTotalCount})
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
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
                        disabled={selectableUsers.length === 0}
                      />
                    </th>
                    <th className="px-3 py-2 align-middle">
                      {t(lang, "common", "adminUsersColEmail")}
                    </th>
                    <th className="px-3 py-2 align-middle">
                      {t(lang, "common", "adminUsersColActive")}
                    </th>
                    <th className="px-3 py-2 align-middle">
                      {t(lang, "common", "adminUsersColCreated")}
                    </th>
                    <th className="px-3 py-2 align-middle">
                      {t(lang, "common", "adminUsersColRole")}
                    </th>
                    <th className="px-3 py-2 align-middle text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isTogglingThis = togglingId === user.id;
                    const isUpdatingRoleThis = roleUpdatingId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                      >
                        <td className="px-3 py-2 align-middle">
                          <StyledCheckbox
                            checked={selectedSet.has(user.id)}
                            onChange={() => toggleSelected(user.id)}
                            ariaLabel={`Select ${user.email}`}
                            disabled={!!myUserId && user.id === myUserId}
                          />
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <div className="flex items-center">
                            <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100">
                              <span className="text-xs font-semibold text-[color:var(--primary)]">
                                {getUserInitials(user.email)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-900">
                                {user.email}
                              </div>
                              <div className="text-[11px] text-zinc-500">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <button
                            type="button"
                            disabled={isTogglingThis}
                            onClick={() =>
                              void handleToggleActive(user.id, user.active)
                            }
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                              user.active
                                ? "border-[color:var(--primary)] bg-white text-[color:var(--primary)]"
                                : "border-zinc-200 bg-zinc-50 text-zinc-600"
                            } ${isTogglingThis ? "opacity-70" : ""}`}
                          >
                            {isTogglingThis
                              ? t(lang, "common", "adminUsersStatusUpdating")
                              : user.active
                                ? t(lang, "common", "adminUsersStatusActive")
                                : t(lang, "common", "adminUsersStatusInactive")}
                          </button>
                        </td>
                        <td className="px-3 py-2 align-middle text-zinc-700">
                          {formatDateTime(user.createdAt)}
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <ListboxSelect
                            ariaLabel={`Role for ${user.email}`}
                            value={user.role}
                            disabled={isUpdatingRoleThis}
                            onChange={(next) =>
                              void handleChangeRole(user.id, next as UserRole)
                            }
                            buttonClassName="flex w-full items-center justify-between gap-2 rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] disabled:opacity-70"
                            options={USER_ROLES.map((role) => ({
                              value: role,
                              label: role,
                            }))}
                          />
                        </td>
                        <td className="px-3 py-2 align-middle text-right text-sm">
                          <button
                            type="button"
                            className="font-medium text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              if (typeof window === "undefined") return;
                              // Placeholder for a future real user details modal.
                              window.alert(
                                `User details (demo only)\nEmail: ${user.email}\nRole: ${user.role}\nStatus: ${user.active ? "Active" : "Inactive"}`,
                              );
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalUsers > 0 && (
              <div className="mt-4 flex flex-col gap-3 border-t border-zinc-200 px-3 py-3 text-xs text-zinc-600 md:flex-row md:items-center md:justify-between md:text-sm">
                <p>
                  Showing <span className="font-semibold">{showingFrom}</span>-
                  <span className="font-semibold">{showingTo}</span> of{" "}
                  <span className="font-semibold">{totalUsers}</span> users
                </p>
                <Pagination
                  currentPage={currentPage}
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

            <ConfirmDialog
              open={bulkDeleteOpen}
              title="Изтриване на избраните потребители"
              description="Избраните потребители ще бъдат физически изтрити. Това действие е необратимо. Вашият акаунт няма да бъде изтрит."
              details={
                <div>
                  Брой избрани:{" "}
                  <span className="font-semibold">
                    {selectedUserIds.length}
                  </span>
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

                    const res = await fetch(
                      `${API_BASE_URL}/admin/users/bulk`,
                      {
                        method: "DELETE",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          ids: selectedUserIds.filter((id) => id !== myUserId),
                        }),
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

                    setBulkDeleteOpen(false);
                    setSelectedUserIds([]);
                    void loadUsers({
                      query: effectiveSearch,
                      page: currentPage,
                      pageSize,
                      status: statusFilter || undefined,
                      role: roleFilter || undefined,
                    });
                    void loadStats();
                    void loadPurgeCount();
                    if (deleted > 0) {
                      setPurgeTotalCount((p) => Math.max(0, p - deleted));
                    }
                  } catch {
                    setBulkActionError(
                      "Възникна грешка при bulk изтриването на потребители.",
                    );
                  } finally {
                    setBulkDeleteSubmitting(false);
                  }
                })();
              }}
            />

            <ConfirmDialog
              open={purgeAllOpen}
              title="Изтриване на всички потребители"
              description={`Ще изтриете абсолютно всички потребители (${purgeTotalCount}). Това действие е необратимо. Вашият акаунт няма да бъде изтрит.`}
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
                      `${API_BASE_URL}/admin/users/purge-all`,
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

                    await res.json();

                    setPurgeAllOpen(false);
                    setSelectedUserIds([]);
                    setUsers([]);
                    setTotalCount(0);
                    setPurgeTotalCount(0);
                    void loadStats();
                    void loadPurgeCount();
                  } catch {
                    setBulkActionError(
                      "Възникна грешка при изтриване на всички потребители.",
                    );
                  } finally {
                    setPurgeAllSubmitting(false);
                  }
                })();
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
