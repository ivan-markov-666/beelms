"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
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

export default function AdminUsersPage() {
  const lang = useCurrentLang();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadUsers = async (query?: string) => {
    if (typeof window === "undefined") return;

    setLoading(true);
    setError(null);
    setToggleError(null);

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

      const url =
        params.toString().length > 0
          ? `${API_BASE_URL}/admin/users?${params.toString()}`
          : `${API_BASE_URL}/admin/users`;

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
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadUsers(search);
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

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="mb-1 text-xl font-semibold text-zinc-900">
            {t(lang, "common", "adminUsersTitle")}
          </h2>
          <p className="text-sm text-zinc-600">
            {t(lang, "common", "adminUsersSubtitle")}
          </p>
        </div>
        <form
          className="flex w-full max-w-xs items-center gap-2"
          onSubmit={handleSearchSubmit}
        >
          <input
            type="search"
            placeholder={t(lang, "common", "adminUsersSearchPlaceholder")}
            className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {t(lang, "common", "adminUsersSearchButton")}
          </button>
        </form>
      </div>

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
                    {t(lang, "common", "adminUsersColRole")}
                  </th>
                  <th className="px-3 py-2 align-middle">
                    {t(lang, "common", "adminUsersColActive")}
                  </th>
                  <th className="px-3 py-2 align-middle">
                    {t(lang, "common", "adminUsersColCreated")}
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
                      <td className="px-3 py-2 align-middle text-zinc-900">
                        {user.email}
                      </td>
                      <td className="px-3 py-2 align-middle text-zinc-700">
                        {user.role}
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
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
