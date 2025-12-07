"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

const PAGE_SIZE = 20;

type AdminUser = {
  id: string;
  email: string;
  role: string;
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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [effectiveSearch, setEffectiveSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminUsersStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [didInitFromQuery, setDidInitFromQuery] = useState(false);

  useEffect(() => {
    if (didInitFromQuery) return;

    const statusParam = (searchParams.get("status") ?? "").toLowerCase();
    const roleParam = (searchParams.get("role") ?? "").toLowerCase();

    if (statusParam === "active" || statusParam === "deactivated") {
      setStatusFilter(statusParam);
    }

    if (roleParam === "user" || roleParam === "admin") {
      setRoleFilter(roleParam);
    }

    setDidInitFromQuery(true);
  }, [searchParams, didInitFromQuery]);

  const loadUsers = useCallback(
    async (options?: {
      query?: string;
      page?: number;
      status?: string;
      role?: string;
    }) => {
      if (typeof window === "undefined") return;

      setLoading(true);
      setError(null);
      setToggleError(null);

      const query = options?.query;
      const page = options?.page && options.page > 0 ? options.page : 1;
      const status = options?.status;
      const role = options?.role;

      try {
        const token = window.localStorage.getItem("qa4free_access_token");
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
        params.set("pageSize", String(PAGE_SIZE));

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

        const data = (await res.json()) as AdminUser[];
        setUsers(data ?? []);
        setLoading(false);
      } catch {
        setError(t(lang, "common", "adminUsersError"));
        setLoading(false);
      }
    },
    [lang],
  );

  const loadStats = useCallback(async () => {
    if (typeof window === "undefined") return;

    setStatsLoading(true);
    setStatsError(null);

    try {
      const token = window.localStorage.getItem("qa4free_access_token");
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
      status: statusFilter || undefined,
      role: roleFilter || undefined,
    });
  }, [loadUsers, effectiveSearch, currentPage, statusFilter, roleFilter]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = search.trim();
    setCurrentPage(1);
    setEffectiveSearch(trimmed);
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
      const token = window.localStorage.getItem("qa4free_access_token");
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

  const isSearching = effectiveSearch.trim().length > 0;

  const totalUsers =
    !isSearching && stats && typeof stats.totalUsers === "number"
      ? stats.totalUsers
      : users.length;

  const totalPages =
    !isSearching && totalUsers > 0
      ? Math.max(1, Math.ceil(totalUsers / PAGE_SIZE))
      : 1;

  const showingFrom =
    !isSearching && totalUsers > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0;

  const showingTo =
    !isSearching && totalUsers > 0
      ? Math.min(currentPage * PAGE_SIZE, totalUsers)
      : users.length;

  const paginationItems: Array<number | "ellipsis"> = [];

  if (!isSearching && totalPages > 1) {
    if (totalPages <= 7) {
      for (let page = 1; page <= totalPages; page += 1) {
        paginationItems.push(page);
      }
    } else {
      const firstPage = 1;
      const lastPage = totalPages;

      paginationItems.push(firstPage);

      const startPage = Math.max(currentPage - 1, firstPage + 1);
      const endPage = Math.min(currentPage + 1, lastPage - 1);

      if (startPage > firstPage + 1) {
        paginationItems.push("ellipsis");
      }

      for (let page = startPage; page <= endPage; page += 1) {
        paginationItems.push(page);
      }

      if (endPage < lastPage - 1) {
        paginationItems.push("ellipsis");
      }

      if (lastPage > firstPage) {
        paginationItems.push(lastPage);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center text-xs text-zinc-500">
        <Link href="/admin" className="hover:text-green-600">
          Admin
        </Link>
        <svg
          className="mx-2 h-3.5 w-3.5 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="text-zinc-900">Users Management</span>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-zinc-900">
            {t(lang, "common", "adminUsersTitle")}
          </h2>
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
                  <p className="mt-1 text-2xl font-semibold text-green-700">
                    {stats.activeUsers}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <svg
                    className="h-5 w-5 text-green-600"
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

        <section className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
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
                placeholder={t(
                  lang,
                  "common",
                  "adminUsersSearchPlaceholder",
                )}
                className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
            >
              {t(lang, "common", "adminUsersSearchButton")}
            </button>
          </form>

          <div>
            <select
              value={statusFilter}
              onChange={(event) => {
                setCurrentPage(1);
                setStatusFilter(event.target.value);
              }}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">
                All Status
              </option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(event) => {
                setCurrentPage(1);
                setRoleFilter(event.target.value);
              }}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
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
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
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

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                    >
                      <td className="px-3 py-2 align-middle">
                        <div className="flex items-center">
                          <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                            <span className="text-xs font-semibold text-green-700">
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
                              ? "border-green-200 bg-green-50 text-green-700"
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
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${{
                            admin:
                              "border-purple-200 bg-purple-50 text-purple-700",
                            user: "border-blue-200 bg-blue-50 text-blue-700",
                          }[user.role] ?? "border-zinc-200 bg-zinc-50 text-zinc-700"}`}
                        >
                          {user.role}
                        </span>
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
          {!isSearching && totalUsers > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-zinc-200 px-3 py-3 text-xs text-zinc-600 md:text-sm">
              <p>
                Showing{" "}
                <span className="font-semibold">{showingFrom}</span>
                -
                <span className="font-semibold">{showingTo}</span> of{" "}
                <span className="font-semibold">{totalUsers}</span> users
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(page - 1, 1))
                  }
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {paginationItems.map((item, index) => {
                  if (item === "ellipsis") {
                    return (
                      <button
                        key={`ellipsis-${index}`}
                        type="button"
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 md:text-sm"
                        disabled
                      >
                        ...
                      </button>
                    );
                  }

                  const pageNumber = item;
                  const isActivePage = pageNumber === currentPage;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={
                        isActivePage
                          ? "rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white md:text-sm"
                          : "rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 md:text-sm"
                      }
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(page + 1, totalPages),
                  )
                  }
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                  disabled={currentPage >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
