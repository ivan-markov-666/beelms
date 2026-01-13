"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";
import { AdminBreadcrumbs } from "../_components/admin-breadcrumbs";
import { InfoTooltip } from "../_components/info-tooltip";
import { ListboxSelect } from "../../_components/listbox-select";

const API_BASE_URL = getApiBaseUrl();

type HeaderMenuItem = {
  id: string;
  label?: string | null;
  labelByLang?: Record<string, string | null> | null;
  href: string;
  enabled?: boolean;
  clickable?: boolean;
  newTab?: boolean;
  children?: HeaderMenuItem[] | null;
};

type AdminSettingsDto = {
  branding?: {
    headerMenu?: {
      enabled?: boolean;
      items?: HeaderMenuItem[] | null;
    } | null;
  };
  languages?: {
    supported?: string[];
    default?: string;
  };
};

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

function createId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

function sanitizeLabelByLang(
  value: Record<string, string | null> | null | undefined,
  supportedLangs: string[],
): Record<string, string | null> | null {
  const obj = value ?? null;
  if (!obj || typeof obj !== "object") return null;
  const out: Record<string, string | null> = {};

  for (const code of supportedLangs) {
    const key = (code ?? "").trim().toLowerCase();
    if (!key) continue;
    const raw = obj[key];
    if (typeof raw === "undefined") continue;
    const v = typeof raw === "string" ? raw.trim() : "";
    out[key] = v ? v : null;
  }

  return Object.keys(out).length > 0 ? out : null;
}

function sanitizeItems(
  items: HeaderMenuItem[],
  supportedLangs: string[],
): HeaderMenuItem[] {
  const sanitizeNode = (
    node: HeaderMenuItem,
    depth: number,
  ): HeaderMenuItem | null => {
    const id = (node.id ?? "").trim();
    const href = (node.href ?? "").trim();
    if (!id || !href) return null;

    const label = typeof node.label === "string" ? node.label.trim() : "";
    const enabled = node.enabled !== false;
    const clickable = node.clickable !== false;
    const newTab = node.newTab === true;
    const labelByLang = sanitizeLabelByLang(node.labelByLang, supportedLangs);

    const allowChildren = depth < 4;
    const children =
      allowChildren && Array.isArray(node.children)
        ? node.children
            .map((c) => sanitizeNode(c, depth + 1))
            .filter((c): c is HeaderMenuItem => Boolean(c))
            .slice(0, 50)
        : [];

    return {
      id,
      href,
      label: label || null,
      labelByLang,
      enabled,
      ...(clickable === false ? { clickable: false } : {}),
      ...(newTab ? { newTab: true } : {}),
      children: children.length > 0 ? children : null,
    } satisfies HeaderMenuItem;
  };

  return items
    .map((i) => sanitizeNode(i, 0))
    .filter((i): i is HeaderMenuItem => Boolean(i));
}

export default function AdminNavigationPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [supportedLangs, setSupportedLangs] = useState<string[]>(["bg"]);
  const [defaultLang, setDefaultLang] = useState<string>("bg");

  const [menuEnabled, setMenuEnabled] = useState<boolean>(false);
  const [items, setItems] = useState<HeaderMenuItem[]>([]);
  const [editingLang, setEditingLang] = useState<string>("__global");

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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (!res.ok) {
          if (!cancelled) setError("Неуспешно зареждане на settings.");
          return;
        }

        const data = (await res.json()) as AdminSettingsDto;
        if (cancelled) return;

        const langs = Array.isArray(data.languages?.supported)
          ? data.languages?.supported
              .map((l) => (l ?? "").trim().toLowerCase())
              .filter(Boolean)
          : ["bg"];

        setSupportedLangs(langs.length > 0 ? langs : ["bg"]);
        setDefaultLang(
          (data.languages?.default ?? "").trim().toLowerCase() || "bg",
        );

        const enabled = data.branding?.headerMenu?.enabled === true;
        const rawItems = Array.isArray(data.branding?.headerMenu?.items)
          ? (data.branding?.headerMenu?.items as HeaderMenuItem[])
          : [];

        setMenuEnabled(enabled);
        setItems(rawItems);
      } catch {
        if (!cancelled) setError("Възникна грешка при връзката със сървъра.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const effectiveSupportedLangs = useMemo(() => {
    const out = supportedLangs
      .map((l) => (l ?? "").trim().toLowerCase())
      .filter(Boolean);
    return out.length > 0 ? out : ["bg"];
  }, [supportedLangs]);

  const onAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: createId("item"),
        label: "",
        labelByLang: null,
        href: "/",
        enabled: true,
        clickable: true,
        newTab: false,
        children: null,
      },
    ]);
  };

  const updateNodeInTree = (
    nodes: HeaderMenuItem[],
    path: string[],
    updater: (n: HeaderMenuItem) => HeaderMenuItem,
  ): HeaderMenuItem[] => {
    if (path.length < 1) return nodes;
    const [head, ...rest] = path;
    return nodes.map((n) => {
      if (n.id !== head) return n;
      if (rest.length < 1) return updater(n);
      const children = Array.isArray(n.children) ? n.children : [];
      const nextChildren = updateNodeInTree(children, rest, updater);
      return {
        ...n,
        children: nextChildren.length > 0 ? nextChildren : null,
      };
    });
  };

  const removeNodeInTree = (
    nodes: HeaderMenuItem[],
    path: string[],
  ): HeaderMenuItem[] => {
    if (path.length < 1) return nodes;
    if (path.length === 1) {
      return nodes.filter((n) => n.id !== path[0]);
    }
    const [head, ...rest] = path;
    return nodes.map((n) => {
      if (n.id !== head) return n;
      const children = Array.isArray(n.children) ? n.children : [];
      const nextChildren = removeNodeInTree(children, rest);
      return {
        ...n,
        children: nextChildren.length > 0 ? nextChildren : null,
      };
    });
  };

  const reorderById = <T extends { id: string }>(
    arr: T[],
    id: string,
    dir: -1 | 1,
  ): T[] => {
    const idx = arr.findIndex((x) => x.id === id);
    if (idx < 0) return arr;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= arr.length) return arr;
    const copy = [...arr];
    const tmp = copy[idx];
    copy[idx] = copy[nextIdx];
    copy[nextIdx] = tmp;
    return copy;
  };

  const onAddChild = (parentPath: string[], depth: number) => {
    if (depth >= 4) return;
    const child: HeaderMenuItem = {
      id: createId("child"),
      label: "",
      labelByLang: null,
      href: "/",
      enabled: true,
      clickable: true,
      newTab: false,
      children: null,
    };

    setItems((prev) =>
      updateNodeInTree(prev, parentPath, (p) => {
        const children = Array.isArray(p.children) ? [...p.children] : [];
        children.push(child);
        return { ...p, children };
      }),
    );
  };

  const onRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const onRemoveNode = (path: string[]) => {
    setItems((prev) => removeNodeInTree(prev, path));
  };

  const moveNode = (parentPath: string[], id: string, dir: -1 | 1) => {
    if (parentPath.length < 1) {
      setItems((prev) => reorderById(prev, id, dir));
      return;
    }

    setItems((prev) =>
      updateNodeInTree(prev, parentPath, (p) => {
        const children = Array.isArray(p.children) ? p.children : [];
        const nextChildren = reorderById(children, id, dir);
        return {
          ...p,
          children: nextChildren.length > 0 ? nextChildren : null,
        };
      }),
    );
  };

  const updateNode = (path: string[], patch: Partial<HeaderMenuItem>) => {
    setItems((prev) =>
      updateNodeInTree(prev, path, (n) => ({
        ...n,
        ...patch,
      })),
    );
  };

  const getLocalizedLabel = (
    label: string | null | undefined,
    labelByLang: Record<string, string | null> | null | undefined,
  ): string => {
    if (editingLang === "__global") {
      return (label ?? "").trim();
    }
    const v = labelByLang?.[editingLang];
    return (typeof v === "string" ? v : "").trim();
  };

  const setLocalizedLabel = (
    current: {
      label: string | null | undefined;
      labelByLang: Record<string, string | null> | null | undefined;
    },
    next: string,
  ): {
    label: string | null;
    labelByLang: Record<string, string | null> | null;
  } => {
    const trimmed = (next ?? "").trim();

    if (editingLang === "__global") {
      return {
        label: trimmed || null,
        labelByLang: current.labelByLang ?? null,
      };
    }

    const byLang: Record<string, string | null> = {
      ...(current.labelByLang ?? {}),
    };
    byLang[editingLang] = trimmed || null;

    const sanitized = sanitizeLabelByLang(byLang, effectiveSupportedLangs);

    return {
      label: current.label ?? null,
      labelByLang: sanitized,
    };
  };

  const onSave = async () => {
    setError(null);
    setSuccess(null);

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const sanitized = sanitizeItems(items, effectiveSupportedLangs);

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branding: {
            headerMenu: {
              enabled: menuEnabled,
              items: sanitized,
            },
          },
        }),
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setError("Неуспешно запазване.");
        return;
      }

      const updated = (await res.json()) as AdminSettingsDto;
      const enabled = updated.branding?.headerMenu?.enabled === true;
      const updatedItems = Array.isArray(updated.branding?.headerMenu?.items)
        ? (updated.branding?.headerMenu?.items as HeaderMenuItem[])
        : [];

      setMenuEnabled(enabled);
      setItems(updatedItems);
      setSuccess("Запазено.");
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <main className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">Зареждане...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <AdminBreadcrumbs
          items={[
            { label: "Админ табло", href: "/admin" },
            { label: "Navigation" },
          ]}
        />
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold text-zinc-900">Navigation</h1>
          <InfoTooltip
            label="Navigation info"
            title="Navigation"
            description="Настройваш главното header меню (поддържа до 5 нива), с локализирани етикети и контрол дали е активно."
          />
        </div>
        <p className="text-sm text-zinc-600">
          Configure the header menu (including submenus).
        </p>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Header Menu
              </h2>
              <InfoTooltip
                label="Header menu info"
                title="Header menu"
                description="Активирай персонализирано меню с йерархични елементи, custom href, new tab, clickable флагове и локализации."
              />
            </div>
            <p className="text-sm text-gray-600">
              When enabled, the header will use this menu instead of the default
              links.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-700">Enabled</span>
            <ToggleSwitch
              checked={menuEnabled}
              disabled={saving}
              label="Header menu enabled"
              onChange={(next) => setMenuEnabled(next)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Edit language
            </label>
            <div className="mt-2">
              <ListboxSelect
                ariaLabel="Edit language"
                value={editingLang}
                disabled={saving}
                onChange={(next) => setEditingLang(next)}
                buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-60"
                options={[
                  { value: "__global", label: "Global" },
                  ...effectiveSupportedLangs.map((l) => ({
                    value: l,
                    label: l,
                  })),
                ]}
              />
            </div>
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Default lang: <span className="font-semibold">{defaultLang}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAddItem}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-70"
          >
            + Add item
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-70"
          >
            {saving ? "Запазване..." : "Запази"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-600">Няма добавени елементи.</p>
        ) : null}

        {(() => {
          const renderEditorNode = (
            node: HeaderMenuItem,
            idx: number,
            siblingsCount: number,
            parentPath: string[],
            depth: number,
          ) => {
            const path = [...parentPath, node.id];
            const localized = getLocalizedLabel(
              node.label ?? null,
              node.labelByLang,
            );
            const children = Array.isArray(node.children) ? node.children : [];
            const canAddChild = depth < 4;

            return (
              <div
                key={node.id}
                className={
                  depth === 0
                    ? "rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3"
                    : "rounded-md border border-gray-200 bg-white p-3 shadow-sm space-y-2"
                }
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    {depth === 0 ? (
                      <div className="text-sm font-semibold text-gray-900">
                        Item {idx + 1}
                      </div>
                    ) : null}
                    <div className="text-xs text-gray-500">id: {node.id}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveNode(parentPath, node.id, -1)}
                      disabled={saving || idx === 0}
                      className="rounded-md border border-gray-200 bg-white px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveNode(parentPath, node.id, 1)}
                      disabled={saving || idx === siblingsCount - 1}
                      className="rounded-md border border-gray-200 bg-white px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      ↓
                    </button>
                    {canAddChild ? (
                      <button
                        type="button"
                        onClick={() => onAddChild(path, depth)}
                        disabled={saving}
                        className="rounded-md border border-gray-200 bg-white px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-70"
                      >
                        + Subitem
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        parentPath.length < 1
                          ? onRemoveItem(node.id)
                          : onRemoveNode(path)
                      }
                      disabled={saving}
                      className="rounded-md border border-red-200 bg-white px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-70"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Label
                    </label>
                    <input
                      value={localized}
                      onChange={(e) => {
                        const next = setLocalizedLabel(
                          {
                            label: node.label ?? null,
                            labelByLang: node.labelByLang ?? null,
                          },
                          e.target.value,
                        );
                        updateNode(path, next);
                      }}
                      disabled={saving}
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder={depth === 0 ? "Menu item" : "Subitem"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Href
                    </label>
                    <input
                      value={node.href ?? ""}
                      onChange={(e) =>
                        updateNode(path, { href: e.target.value })
                      }
                      disabled={saving}
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="/p/my-page or https://..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-700">Enabled</span>
                  <ToggleSwitch
                    checked={node.enabled !== false}
                    disabled={saving}
                    label="Enabled"
                    onChange={(next) => updateNode(path, { enabled: next })}
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={node.clickable !== false}
                    onChange={(e) =>
                      updateNode(path, { clickable: e.target.checked })
                    }
                    disabled={saving}
                  />
                  Clickable link
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={node.newTab === true}
                    onChange={(e) =>
                      updateNode(path, { newTab: e.target.checked })
                    }
                    disabled={saving}
                  />
                  Open in new tab
                </label>

                {children.length > 0 ? (
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-3 space-y-3">
                    <div className="text-sm font-semibold text-gray-900">
                      Submenu
                    </div>
                    <div className="space-y-3">
                      {children.map((c, cidx) =>
                        renderEditorNode(
                          c,
                          cidx,
                          children.length,
                          path,
                          depth + 1,
                        ),
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          };

          return items.map((item, idx) =>
            renderEditorNode(item, idx, items.length, [], 0),
          );
        })()}
      </div>
    </div>
  );
}
