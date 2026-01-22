"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";
import { ConfirmDialog } from "../_components/confirm-dialog";
import { InfoTooltip } from "../_components/info-tooltip";
import { Pagination } from "../../_components/pagination";

const API_BASE_URL = getApiBaseUrl();
const DEFAULT_BACKUP_PAGE_SIZE = 20;

type BackupItem = {
  id: string;
  filename: string;
  type: string;
  storage: string;
  sizeBytes: string;
  sha256: string;
  status: string;
  isEncrypted?: boolean;
  errorMessage: string | null;
  createdByEmail: string | null;
  createdAt: string;
  deletedByEmail: string | null;
  deletedReason: "manual" | "retention" | null;
  deletedAt: string | null;
};

type BackupJobStage =
  | "starting"
  | "preparing"
  | "running"
  | "hashing"
  | "saving"
  | "done"
  | "failed";

type BackupJobStatus = {
  id: string;
  type: "create" | "restore";
  stage: BackupJobStage;
  percent: number;
  message: string;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  backupId: string | null;
};

type UploadBackupResponse = {
  backup: BackupItem;
  preview: {
    originalFilename: string;
    detectedDbVersion: string | null;
    detectedPgDumpVersion: string | null;
    detectedDumpedOn: string | null;
  };
};

type RemoteBackupConfig = {
  enabled: boolean;
  provider: "s3";
  s3: {
    accessKeyId: string | null;
    hasSecretAccessKey: boolean;
    bucket: string | null;
    region: string | null;
    prefix: string | null;
  };
};

type BackupScheduleConfig = {
  enabled: boolean;
  timezone: string | null;
  timeOfDay: string | null;
  timesOfDay: string[];
  lastRunAt: string | null;
  hasEncryptionPassword?: boolean;
};

type BackupRetentionTimePeriod =
  | "1_minute"
  | "weekly"
  | "monthly"
  | "2_months"
  | "3_months"
  | "6_months"
  | "yearly"
  | "never";

const DEFAULT_RETENTION_TIME_PERIOD: BackupRetentionTimePeriod = "weekly";

type BackupRetentionConfig = {
  time: {
    enabled: boolean;
    period: BackupRetentionTimePeriod;
  };
  count: {
    enabled: boolean;
    keepLast: number;
  };
};

type SaveOutcome = {
  section: "schedule" | "retention" | "remote";
  ok: boolean;
  message: string;
};

const successBoxStyle = {
  backgroundColor: "var(--field-ok-bg, #f0fdf4)",
  borderColor: "var(--field-ok-border, #dcfce7)",
  color: "var(--foreground, #111827)",
};

const errorBoxStyle = {
  backgroundColor: "var(--field-error-bg, #fef2f2)",
  borderColor: "var(--field-error-border, #fee2e2)",
  color: "var(--error, #dc2626)",
};

function formatBytes(sizeBytes: string): string {
  const bytes = Number(sizeBytes);
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  const rounded = i === 0 ? String(Math.round(v)) : v.toFixed(2);
  return `${rounded} ${units[i]}`;
}

function formatDateTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString();
}

async function readJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function cloneConfig<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default function AdminBackupsPage() {
  const [items, setItems] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_BACKUP_PAGE_SIZE);

  const [job, setJob] = useState<BackupJobStatus | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadBackupResponse | null>(
    null,
  );

  const [newBackupEncryptionPassword, setNewBackupEncryptionPassword] =
    useState("");
  const [encryptionWarningOpen, setEncryptionWarningOpen] = useState(false);

  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<BackupItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [restoreTarget, setRestoreTarget] = useState<BackupItem | null>(null);
  const [restoreStep, setRestoreStep] = useState<0 | 1 | 2>(0);
  const [restoreSubmitting, setRestoreSubmitting] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restorePasswordDraft, setRestorePasswordDraft] = useState<string>("");

  const [downloadTarget, setDownloadTarget] = useState<BackupItem | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadSubmitting, setDownloadSubmitting] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadPasswordDraft, setDownloadPasswordDraft] =
    useState<string>("");

  const [remoteConfig, setRemoteConfig] = useState<RemoteBackupConfig | null>(
    null,
  );
  const [initialRemoteConfig, setInitialRemoteConfig] =
    useState<RemoteBackupConfig | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteSaving, setRemoteSaving] = useState(false);
  const [remoteTesting, setRemoteTesting] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remoteTestOk, setRemoteTestOk] = useState<boolean | null>(null);
  const [remoteSecretDraft, setRemoteSecretDraft] = useState<string>("");
  const [remoteAccessKeyDraft, setRemoteAccessKeyDraft] = useState<string>("");
  const [remoteToggleError, setRemoteToggleError] = useState<string | null>(
    null,
  );
  const [showDeleted, setShowDeleted] = useState(false);

  const [scheduleConfig, setScheduleConfig] =
    useState<BackupScheduleConfig | null>(null);
  const [initialScheduleConfig, setInitialScheduleConfig] =
    useState<BackupScheduleConfig | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleRunning, setScheduleRunning] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleHasEncryptionPassword, setScheduleHasEncryptionPassword] =
    useState(false);
  const [scheduleEncryptionDraft, setScheduleEncryptionDraft] = useState("");
  const [scheduleEncryptionClear, setScheduleEncryptionClear] = useState(false);
  const [timezoneDraft, setTimezoneDraft] = useState("");
  const [timezoneDropdownOpen, setTimezoneDropdownOpen] = useState(false);
  const timezoneCloseTimer = useRef<number | null>(null);
  const timezoneInputRef = useRef<HTMLInputElement | null>(null);

  const [retentionConfig, setRetentionConfig] =
    useState<BackupRetentionConfig | null>(null);
  const [initialRetentionConfig, setInitialRetentionConfig] =
    useState<BackupRetentionConfig | null>(null);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [retentionSaving, setRetentionSaving] = useState(false);
  const [retentionError, setRetentionError] = useState<string | null>(null);
  const [keepLastDraft, setKeepLastDraft] = useState("100");
  const [globalSaving, setGlobalSaving] = useState(false);
  const [globalReloading, setGlobalReloading] = useState(false);
  const [sectionMessages, setSectionMessages] = useState<
    Partial<Record<SaveOutcome["section"], SaveOutcome>>
  >({});

  const clearSectionMessage = useCallback((section: SaveOutcome["section"]) => {
    setSectionMessages((prev) => {
      if (!prev[section]) return prev;
      const next = { ...prev };
      delete next[section];
      return next;
    });
  }, []);

  const scheduleDirty = useMemo(() => {
    if (!scheduleConfig && !initialScheduleConfig) return false;
    if (!scheduleConfig || !initialScheduleConfig) return true;
    const sameConfig =
      JSON.stringify(scheduleConfig) === JSON.stringify(initialScheduleConfig);
    if (!sameConfig) return true;
    if (scheduleEncryptionDraft.trim().length > 0) return true;
    if (scheduleEncryptionClear) return true;
    return false;
  }, [
    initialScheduleConfig,
    scheduleConfig,
    scheduleEncryptionClear,
    scheduleEncryptionDraft,
  ]);

  const remoteDirty = useMemo(() => {
    if (!remoteConfig && !initialRemoteConfig) return false;
    if (!remoteConfig || !initialRemoteConfig) return true;
    const sameConfig =
      JSON.stringify(remoteConfig) === JSON.stringify(initialRemoteConfig);
    if (!sameConfig) return true;
    if (remoteSecretDraft.trim().length > 0) return true;
    return false;
  }, [initialRemoteConfig, remoteConfig, remoteSecretDraft]);

  const retentionDirty = useMemo(() => {
    if (!retentionConfig && !initialRetentionConfig) return false;
    if (!retentionConfig || !initialRetentionConfig) return true;
    const sameConfig =
      JSON.stringify(retentionConfig) ===
      JSON.stringify(initialRetentionConfig);
    if (!sameConfig) return true;
    const normalizedKeepLast = String(retentionConfig.count.keepLast ?? "");
    if (keepLastDraft.trim() !== normalizedKeepLast) return true;
    return false;
  }, [initialRetentionConfig, keepLastDraft, retentionConfig]);

  useEffect(() => {
    if (scheduleDirty) {
      clearSectionMessage("schedule");
    }
  }, [scheduleDirty, clearSectionMessage]);

  useEffect(() => {
    if (remoteDirty) {
      clearSectionMessage("remote");
    }
  }, [remoteDirty, clearSectionMessage]);

  useEffect(() => {
    if (retentionDirty) {
      clearSectionMessage("retention");
    }
  }, [retentionDirty, clearSectionMessage]);

  const hasActiveJob = useMemo(() => {
    return (
      job && !job.finishedAt && job.stage !== "done" && job.stage !== "failed"
    );
  }, [job]);

  const hasDirtyChanges = scheduleDirty || remoteDirty || retentionDirty;
  const saveButtonDisabled =
    globalSaving ||
    scheduleSaving ||
    remoteSaving ||
    retentionSaving ||
    !hasDirtyChanges;

  const visibleItems = useMemo(() => {
    if (showDeleted) {
      return items;
    }
    return items.filter((item) => item.status !== "deleted");
  }, [items, showDeleted]);

  const totalBackups = visibleItems.length;
  const totalPages =
    totalBackups > 0 ? Math.max(1, Math.ceil(totalBackups / pageSize)) : 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * pageSize;
  const pageEndIndex = pageStartIndex + pageSize;
  const pagedBackups = visibleItems.slice(pageStartIndex, pageEndIndex);
  const showingFrom = totalBackups === 0 ? 0 : pageStartIndex + 1;
  const showingTo = Math.min(pageEndIndex, totalBackups);

  const scheduleValidationError = useMemo(() => {
    if (!scheduleConfig) return null;

    const times = Array.isArray(scheduleConfig.timesOfDay)
      ? scheduleConfig.timesOfDay
      : [];
    const normalized = times
      .map((t) => (t ?? "").trim())
      .filter((t) => t.length > 0);

    const unique = new Set(normalized);
    if (unique.size !== normalized.length) {
      return "Не може да добавиш два backup-а в един и същ час и минута.";
    }

    if (scheduleConfig.enabled && normalized.length === 0) {
      return "Добави поне един час за automatic backups.";
    }

    return null;
  }, [scheduleConfig]);

  const timezoneOptions = useMemo(() => {
    try {
      if (
        typeof Intl !== "undefined" &&
        typeof Intl.supportedValuesOf === "function"
      ) {
        return Intl.supportedValuesOf("timeZone");
      }
    } catch {
      // ignore and fall back
    }
    return [
      "UTC",
      "Europe/Sofia",
      "Europe/Berlin",
      "Europe/London",
      "America/New_York",
      "America/Los_Angeles",
      "Asia/Tokyo",
      "Asia/Singapore",
      "Australia/Sydney",
    ];
  }, []);

  const filteredTimezones = useMemo(() => {
    const query = timezoneDraft.trim().toLowerCase();
    return query
      ? timezoneOptions.filter((tz) => tz.toLowerCase().includes(query))
      : timezoneOptions;
  }, [timezoneDraft, timezoneOptions]);

  const groupedTimezones = useMemo(() => {
    const continentLabels: Record<string, string> = {
      africa: "Africa",
      america: "Americas",
      antarctica: "Antarctica",
      asia: "Asia",
      atlantic: "Atlantic & Islands",
      australia: "Australia",
      europe: "Europe",
      indian: "Indian Ocean",
      pacific: "Pacific",
      etc: "Miscellaneous",
      utc: "UTC",
    };

    const groups = new Map<string, string[]>();
    for (const tz of filteredTimezones) {
      const raw = tz.split("/")[0]?.toLowerCase() ?? "other";
      const label =
        continentLabels[raw] ?? raw.charAt(0).toUpperCase() + raw.slice(1);
      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)?.push(tz);
    }
    return Array.from(groups.entries()).map(([group, items]) => ({
      group,
      items,
    }));
  }, [filteredTimezones]);

  useEffect(() => {
    setTimezoneDraft(scheduleConfig?.timezone ?? "");
  }, [scheduleConfig?.timezone]);

  useEffect(() => {
    return () => {
      if (timezoneCloseTimer.current) {
        window.clearTimeout(timezoneCloseTimer.current);
        timezoneCloseTimer.current = null;
      }
    };
  }, []);

  const load = useCallback(async () => {
    if (typeof window === "undefined") return;

    setLoading(true);
    setError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setError(
          "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
        );
        setLoading(false);
        return;
      }

      const url = new URL(`${API_BASE_URL}/admin/backups`);
      if (showDeleted) {
        url.searchParams.set("showDeleted", "1");
      }

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setError("Възникна грешка при зареждане на backups.");
        setLoading(false);
        return;
      }

      const data = (await res.json()) as BackupItem[];
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch {
      setError("Възникна грешка при зареждане на backups.");
      setLoading(false);
    }
  }, [showDeleted]);

  const loadRemote = useCallback(async () => {
    if (typeof window === "undefined") return;
    setRemoteLoading(true);
    setRemoteError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setRemoteError("Липсва достъп до Admin API.");
        setRemoteLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/backups/remote-config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setRemoteError(
          "Възникна грешка при зареждане на remote backup настройките.",
        );
        setRemoteLoading(false);
        return;
      }

      const data = (await res.json()) as RemoteBackupConfig;
      setRemoteConfig(data);
      setInitialRemoteConfig(cloneConfig(data));
      setRemoteLoading(false);
    } catch {
      setRemoteError(
        "Възникна грешка при зареждане на remote backup настройките.",
      );
      setRemoteLoading(false);
    }
  }, []);

  const loadRetention = useCallback(async () => {
    if (typeof window === "undefined") return;
    setRetentionLoading(true);
    setRetentionError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setRetentionError("Липсва достъп до Admin API.");
        setRetentionLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/backups/retention`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setRetentionError(
          "Възникна грешка при зареждане на retention настройките.",
        );
        setRetentionLoading(false);
        return;
      }

      const data = (await res.json()) as BackupRetentionConfig;
      setRetentionConfig(data);
      setKeepLastDraft(String(data?.count?.keepLast ?? 100));
      setInitialRetentionConfig(cloneConfig(data));
      setRetentionLoading(false);
    } catch {
      setRetentionError(
        "Възникна грешка при зареждане на retention настройките.",
      );
      setRetentionLoading(false);
    }
  }, []);

  const loadSchedule = useCallback(async () => {
    if (typeof window === "undefined") return;
    setScheduleLoading(true);
    setScheduleError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setScheduleError("Липсва достъп до Admin API.");
        setScheduleLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/backups/schedule`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await readJsonSafe<{ message?: string | string[] }>(res);
        const msg =
          typeof data?.message === "string"
            ? data.message
            : Array.isArray(data?.message)
              ? data?.message.join(", ")
              : `Schedule load failed (${res.status})`;
        setScheduleError(msg);
        setScheduleLoading(false);
        return;
      }

      const data = (await res.json()) as BackupScheduleConfig;
      setScheduleConfig({
        ...data,
        timesOfDay: Array.isArray(data.timesOfDay)
          ? data.timesOfDay
          : data.timeOfDay
            ? [data.timeOfDay]
            : [],
      });
      setInitialScheduleConfig(
        cloneConfig({
          ...data,
          timesOfDay: Array.isArray(data.timesOfDay)
            ? data.timesOfDay
            : data.timeOfDay
              ? [data.timeOfDay]
              : [],
        }),
      );
      setScheduleHasEncryptionPassword(data.hasEncryptionPassword === true);
      setScheduleEncryptionDraft("");
      setScheduleEncryptionClear(false);
      setScheduleLoading(false);
    } catch {
      setScheduleError("Schedule load failed (network/CORS)");
      setScheduleLoading(false);
    }
  }, []);

  const saveRemote = useCallback(async (): Promise<SaveOutcome | null> => {
    if (!remoteConfig || remoteSaving) return null;

    setRemoteSaving(true);
    setRemoteError(null);

    try {
      const token = getAccessToken();
      if (!token) throw new Error("missing-token");

      const payload: {
        enabled?: boolean;
        s3?: {
          accessKeyId?: string | null;
          secretAccessKey?: string | null;
          bucket?: string | null;
          region?: string | null;
          prefix?: string | null;
        };
      } = {
        enabled: remoteConfig.enabled,
        s3: {
          accessKeyId: remoteConfig.s3.accessKeyId,
          bucket: remoteConfig.s3.bucket,
          region: remoteConfig.s3.region,
          prefix: remoteConfig.s3.prefix,
        },
      };

      const secret = remoteSecretDraft.trim();
      if (secret.length > 0) {
        payload.s3 = { ...(payload.s3 ?? {}), secretAccessKey: secret };
      }

      const res = await fetch(`${API_BASE_URL}/admin/backups/remote-config`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await readJsonSafe<{ message?: string | string[] }>(res);
        const msg =
          typeof data?.message === "string"
            ? data.message
            : Array.isArray(data?.message)
              ? data?.message.join(", ")
              : "Възникна грешка при запис на настройките.";
        setRemoteError(msg);
        return {
          section: "remote",
          ok: false,
          message: msg,
        };
      }

      const next = (await res.json()) as RemoteBackupConfig;
      setRemoteConfig(next);
      setRemoteSecretDraft("");
      setInitialRemoteConfig(cloneConfig(next));
      return {
        section: "remote",
        ok: true,
        message: "Remote backup storage saved.",
      };
    } catch {
      return {
        section: "remote",
        ok: false,
        message: "Remote backup storage failed to save.",
      };
    } finally {
      setRemoteSaving(false);
    }
  }, [remoteConfig, remoteSaving, remoteSecretDraft]);

  const saveSchedule = useCallback(async (): Promise<SaveOutcome | null> => {
    if (!scheduleConfig || scheduleSaving) return null;

    if (scheduleValidationError) {
      return {
        section: "schedule",
        ok: false,
        message: scheduleValidationError,
      };
    }

    setScheduleSaving(true);

    try {
      const token = getAccessToken();
      if (!token) throw new Error("missing-token");

      const payload: {
        enabled?: boolean;
        timezone?: string | null;
        timeOfDay?: string | null;
        timesOfDay?: string[] | null;
        encryptionPassword?: string | null;
      } = (() => {
        const normalizedTimes = (scheduleConfig.timesOfDay ?? [])
          .map((t) => (t ?? "").trim())
          .filter((t) => t.length > 0);

        return {
          enabled: scheduleConfig.enabled,
          timezone: scheduleConfig.timezone,
          timeOfDay: normalizedTimes[0] ?? null,
          timesOfDay: normalizedTimes.length > 0 ? normalizedTimes : null,
        };
      })();

      const trimmedSchedulePassword = scheduleEncryptionDraft.trim();
      if (trimmedSchedulePassword.length > 0) {
        payload.encryptionPassword = trimmedSchedulePassword;
      } else if (scheduleEncryptionClear) {
        payload.encryptionPassword = null;
      }

      const res = await fetch(`${API_BASE_URL}/admin/backups/schedule`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await readJsonSafe<{ message?: string | string[] }>(res);
        const msg =
          typeof data?.message === "string"
            ? data.message
            : Array.isArray(data?.message)
              ? data?.message.join(", ")
              : "Възникна грешка при запис на schedule настройките.";
        return {
          section: "schedule",
          ok: false,
          message: msg,
        };
      }

      const next = (await res.json()) as BackupScheduleConfig;
      setScheduleConfig({
        ...next,
        timesOfDay: Array.isArray(next.timesOfDay)
          ? next.timesOfDay
          : next.timeOfDay
            ? [next.timeOfDay]
            : [],
      });
      setInitialScheduleConfig(
        cloneConfig({
          ...next,
          timesOfDay: Array.isArray(next.timesOfDay)
            ? next.timesOfDay
            : next.timeOfDay
              ? [next.timeOfDay]
              : [],
        }),
      );
      setScheduleHasEncryptionPassword(next.hasEncryptionPassword === true);
      setScheduleEncryptionDraft("");
      setScheduleEncryptionClear(false);
      setSectionMessages((prev) => ({
        ...prev,
        schedule: {
          section: "schedule",
          ok: true,
          message: "Automatic backup schedule saved.",
        },
      }));
      return {
        section: "schedule",
        ok: true,
        message: "Automatic backup schedule saved.",
      };
    } catch {
      return {
        section: "schedule",
        ok: false,
        message: "Schedule settings failed to save.",
      };
    } finally {
      setScheduleSaving(false);
    }
  }, [
    scheduleConfig,
    scheduleSaving,
    scheduleEncryptionDraft,
    scheduleEncryptionClear,
    scheduleValidationError,
  ]);

  const saveRetention = useCallback(async (): Promise<SaveOutcome | null> => {
    if (!retentionConfig || retentionSaving) return null;

    setRetentionSaving(true);
    setRetentionError(null);

    const parsedKeepLast = Number.parseInt(keepLastDraft.trim(), 10);
    if (retentionConfig.count.enabled) {
      if (!Number.isFinite(parsedKeepLast) || parsedKeepLast <= 0) {
        setRetentionError("Keep last трябва да е положително цяло число.");
        setRetentionSaving(false);
        return {
          section: "retention",
          ok: false,
          message: "Keep last трябва да е положително цяло число.",
        };
      }
    }

    try {
      const token = getAccessToken();
      if (!token) throw new Error("missing-token");

      const payload: {
        time?: {
          enabled?: boolean;
          period?: BackupRetentionTimePeriod | null;
        };
        count?: {
          enabled?: boolean;
          keepLast?: number | null;
        };
      } = {
        time: {
          enabled: retentionConfig.time.enabled,
          period: retentionConfig.time.period,
        },
        count: {
          enabled: retentionConfig.count.enabled,
          keepLast: retentionConfig.count.enabled
            ? parsedKeepLast
            : retentionConfig.count.keepLast,
        },
      };

      const res = await fetch(`${API_BASE_URL}/admin/backups/retention`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await readJsonSafe<{ message?: string | string[] }>(res);
        const msg =
          typeof data?.message === "string"
            ? data.message
            : Array.isArray(data?.message)
              ? data?.message.join(", ")
              : "Възникна грешка при запис на retention настройките.";
        return {
          section: "retention",
          ok: false,
          message: msg,
        };
      }

      const next = (await res.json()) as BackupRetentionConfig;
      setRetentionConfig(next);
      setKeepLastDraft(String(next?.count?.keepLast ?? 100));
      setInitialRetentionConfig(cloneConfig(next));
      setSectionMessages((prev) => ({
        ...prev,
        retention: {
          section: "retention",
          ok: true,
          message: "Retention policy saved.",
        },
      }));
      return {
        section: "retention",
        ok: true,
        message: "Retention policy saved.",
      };
    } catch {
      return {
        section: "retention",
        ok: false,
        message: "Retention settings failed to save.",
      };
    } finally {
      setRetentionSaving(false);
    }
  }, [keepLastDraft, retentionConfig, retentionSaving]);

  const handleReloadAll = useCallback(async () => {
    if (globalReloading) return;
    setGlobalReloading(true);
    try {
      await Promise.allSettled([
        load(),
        loadRemote(),
        loadSchedule(),
        loadRetention(),
      ]);
    } finally {
      setGlobalReloading(false);
    }
  }, [globalReloading, load, loadRemote, loadRetention, loadSchedule]);

  const handleSaveAll = useCallback(async () => {
    if (globalSaving || !hasDirtyChanges) return;
    setGlobalSaving(true);
    try {
      const tasks: Promise<SaveOutcome | null>[] = [];
      if (scheduleConfig && scheduleDirty) tasks.push(saveSchedule());
      if (remoteConfig && remoteDirty) tasks.push(saveRemote());
      if (retentionConfig && retentionDirty) tasks.push(saveRetention());

      if (tasks.length === 0) return;

      const results = (await Promise.all(tasks)).filter(
        (result): result is SaveOutcome => !!result,
      );

      setSectionMessages((prev) => {
        const next = { ...prev };
        for (const outcome of results) {
          next[outcome.section] = outcome;
        }
        return next;
      });

      await load();
    } finally {
      setGlobalSaving(false);
    }
  }, [
    globalSaving,
    hasDirtyChanges,
    load,
    remoteConfig,
    remoteDirty,
    retentionConfig,
    retentionDirty,
    saveRemote,
    saveRetention,
    saveSchedule,
    scheduleConfig,
    scheduleDirty,
  ]);

  const addScheduleTime = useCallback(() => {
    if (!scheduleConfig) return;
    const existing = Array.isArray(scheduleConfig.timesOfDay)
      ? scheduleConfig.timesOfDay
          .map((t) => (t ?? "").trim())
          .filter((t) => t.length > 0)
      : [];
    const used = new Set(existing);

    const toMinutes = (t: string) => {
      const [h, m] = t.split(":");
      return Number(h) * 60 + Number(m);
    };
    const fromMinutes = (min: number) => {
      const hh = String(Math.floor(min / 60)).padStart(2, "0");
      const mm = String(min % 60).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    const start =
      existing.length > 0 ? toMinutes(existing[existing.length - 1]!) : 180;
    let next = "03:00";
    for (let i = 0; i < 24 * 60; i += 1) {
      const cand = fromMinutes((start + i) % (24 * 60));
      if (!used.has(cand)) {
        next = cand;
        break;
      }
    }

    const updated = [...existing, next].sort();
    setScheduleConfig({
      ...scheduleConfig,
      timesOfDay: updated,
      timeOfDay: updated[0] ?? null,
    });
  }, [scheduleConfig]);

  const removeScheduleTime = useCallback(
    (index: number) => {
      if (!scheduleConfig) return;
      const existing = Array.isArray(scheduleConfig.timesOfDay)
        ? scheduleConfig.timesOfDay
        : [];
      const updated = existing.filter((_, i) => i !== index);
      setScheduleConfig({
        ...scheduleConfig,
        timesOfDay: updated,
        timeOfDay: updated[0] ?? null,
      });
    },
    [scheduleConfig],
  );

  const testRemote = useCallback(async () => {
    if (remoteTesting) return;
    setRemoteLoading(true);
    setRemoteError(null);

    try {
      const token = getAccessToken();
      if (!token) throw new Error("missing-token");

      const res = await fetch(
        `${API_BASE_URL}/admin/backups/remote-config/test`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const data = await readJsonSafe<{ message?: string | string[] }>(res);
        const msg =
          typeof data?.message === "string"
            ? data.message
            : Array.isArray(data?.message)
              ? data?.message.join(", ")
              : "Remote test failed";
        setRemoteError(msg);
        setRemoteTestOk(false);
        return;
      }

      setRemoteTestOk(true);
    } catch {
      setRemoteError("Remote test failed");
      setRemoteTestOk(false);
    } finally {
      setRemoteTesting(false);
    }
  }, [remoteTesting]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPollingJob = useCallback(
    (jobId: string) => {
      if (typeof window === "undefined") return;

      stopPolling();
      setJobError(null);

      const poll = async () => {
        try {
          const token = getAccessToken();
          if (!token) throw new Error("missing-token");

          const res = await fetch(
            `${API_BASE_URL}/admin/backups/jobs/${jobId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!res.ok) {
            throw new Error(`failed-${res.status}`);
          }

          const data = await readJsonSafe<BackupJobStatus>(res);
          if (!data) {
            throw new Error("invalid-response");
          }

          setJob(data);

          const finished =
            !!data.finishedAt ||
            data.stage === "done" ||
            data.stage === "failed";

          if (finished) {
            stopPolling();
            void load();
          }
        } catch {
          setJobError("Възникна грешка при проверка на прогреса.");
        }
      };

      void poll();
      pollTimerRef.current = window.setInterval(() => {
        void poll();
      }, 1200);
    },
    [load, stopPolling],
  );

  const runScheduleNow = useCallback(async () => {
    if (scheduleRunning || hasActiveJob) return;

    setScheduleRunning(true);
    setScheduleError(null);

    try {
      const token = getAccessToken();
      if (!token) throw new Error("missing-token");

      const res = await fetch(
        `${API_BASE_URL}/admin/backups/schedule/run-now`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const data = await readJsonSafe<{ message?: string | string[] }>(res);
        const msg =
          typeof data?.message === "string"
            ? data.message
            : Array.isArray(data?.message)
              ? data?.message.join(", ")
              : "Възникна грешка при пускане на schedule backup.";
        setScheduleError(msg);
        return;
      }

      const data = (await res.json()) as { jobId?: string };
      const jobId = (data.jobId ?? "").trim();
      if (!jobId) throw new Error("missing-job-id");

      startPollingJob(jobId);
    } catch {
      setScheduleError("Възникна грешка при пускане на schedule backup.");
    } finally {
      setScheduleRunning(false);
    }
  }, [hasActiveJob, scheduleRunning, startPollingJob]);

  const createBackup = useCallback(() => {
    if (createSubmitting || hasActiveJob) return;

    void (async () => {
      setCreateSubmitting(true);
      setJobError(null);
      try {
        const token = getAccessToken();
        if (!token) throw new Error("missing-token");

        const password = newBackupEncryptionPassword.trim();

        const res = await fetch(`${API_BASE_URL}/admin/backups`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            encryptionPassword: password.length > 0 ? password : null,
          }),
        });

        if (!res.ok) {
          throw new Error(`failed-${res.status}`);
        }

        const data = (await res.json()) as { jobId?: string };
        const jobId = (data.jobId ?? "").trim();
        if (!jobId) throw new Error("missing-job-id");

        startPollingJob(jobId);
        setNewBackupEncryptionPassword("");
        setEncryptionWarningOpen(false);
      } catch {
        setJobError("Възникна грешка при създаване на backup.");
      } finally {
        setCreateSubmitting(false);
      }
    })();
  }, [
    createSubmitting,
    hasActiveJob,
    newBackupEncryptionPassword,
    startPollingJob,
  ]);

  const handleCreateBackupClick = useCallback(() => {
    if (newBackupEncryptionPassword.trim().length > 0) {
      setEncryptionWarningOpen(true);
      return;
    }
    createBackup();
  }, [createBackup, newBackupEncryptionPassword]);

  const confirmEncryptionWarning = useCallback(() => {
    setEncryptionWarningOpen(false);
    createBackup();
  }, [createBackup]);

  const handleToggleRemoteSync = useCallback(() => {
    if (!remoteConfig) return;

    if (remoteConfig.enabled) {
      setRemoteConfig({ ...remoteConfig, enabled: false });
      setRemoteToggleError(null);
      return;
    }

    const missing: string[] = [];
    const s3 = remoteConfig.s3;

    if (!s3.accessKeyId || s3.accessKeyId.trim().length === 0) {
      missing.push("Access Key ID");
    }

    const hasSecretStored = s3.hasSecretAccessKey === true;
    if (!hasSecretStored && remoteSecretDraft.trim().length === 0) {
      missing.push("Secret Access Key");
    }

    if (!s3.bucket || s3.bucket.trim().length === 0) {
      missing.push("Bucket");
    }

    if (!s3.region || s3.region.trim().length === 0) {
      missing.push("Region");
    }

    if (missing.length > 0) {
      setRemoteToggleError(
        `Попълни задължителните полета (${missing.join(", ")}), за да активираш автоматичния sync.`,
      );
      return;
    }

    setRemoteToggleError(null);
    setRemoteConfig({ ...remoteConfig, enabled: true });
  }, [remoteConfig, remoteSecretDraft]);

  const uploadBackupFile = useCallback(
    async (file: File) => {
      if (uploadSubmitting || hasActiveJob) return;

      setUploadSubmitting(true);
      setUploadError(null);
      setUploadResult(null);

      try {
        const token = getAccessToken();
        if (!token) throw new Error("missing-token");

        const name = (file.name || "").trim();
        if (!name.toLowerCase().endsWith(".sql")) {
          setUploadError("Поддържат се само .sql файлове.");
          return;
        }

        const form = new FormData();
        form.append("file", file);

        const password = newBackupEncryptionPassword.trim();
        if (password.length > 0) {
          form.append("encryptionPassword", password);
        }

        const res = await fetch(`${API_BASE_URL}/admin/backups/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        });

        if (!res.ok) {
          const data = await readJsonSafe<{ message?: string | string[] }>(res);
          const msg =
            typeof data?.message === "string"
              ? data.message
              : Array.isArray(data?.message)
                ? data?.message.join(", ")
                : "Възникна грешка при качване на backup файла.";
          setUploadError(msg);
          return;
        }

        const payload = await readJsonSafe<UploadBackupResponse>(res);
        if (payload) {
          setUploadResult(payload);
        }
        await load();
        setNewBackupEncryptionPassword("");
      } catch {
        setUploadError("Възникна грешка при качване на backup файла.");
      } finally {
        setUploadSubmitting(false);
        if (uploadInputRef.current) {
          uploadInputRef.current.value = "";
        }
      }
    },
    [hasActiveJob, load, newBackupEncryptionPassword, uploadSubmitting],
  );

  const openUploadPicker = useCallback(() => {
    if (uploadSubmitting || hasActiveJob) return;
    uploadInputRef.current?.click();
  }, [hasActiveJob, uploadSubmitting]);

  const openDownload = useCallback((b: BackupItem) => {
    setDownloadTarget(b);
    setDownloadPasswordDraft("");
    setDownloadError(null);
    setDownloadOpen(true);
  }, []);

  const confirmDownload = useCallback(() => {
    if (!downloadTarget || downloadSubmitting) return;

    void (async () => {
      setDownloadSubmitting(true);
      setDownloadError(null);

      try {
        const token = getAccessToken();
        if (!token) throw new Error("missing-token");

        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
        };

        const password = downloadPasswordDraft.trim();
        if (password.length > 0) {
          headers["x-backup-password"] = password;
        }

        const res = await fetch(
          `${API_BASE_URL}/admin/backups/${downloadTarget.id}/download`,
          {
            headers,
          },
        );

        if (!res.ok) {
          const data = await readJsonSafe<{ message?: string | string[] }>(res);
          const msg =
            typeof data?.message === "string"
              ? data.message
              : Array.isArray(data?.message)
                ? data?.message.join(", ")
                : `Download failed (${res.status})`;
          setDownloadError(msg);
          return;
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadTarget.filename || "backup.sql";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        setDownloadOpen(false);
        setDownloadTarget(null);
        setDownloadPasswordDraft("");
      } catch {
        setDownloadError("Възникна грешка при изтегляне на backup файла.");
      } finally {
        setDownloadSubmitting(false);
      }
    })();
  }, [downloadPasswordDraft, downloadSubmitting, downloadTarget]);

  const openDelete = useCallback(
    (b: BackupItem) => {
      if (deleteSubmitting) return;
      setDeleteTarget(b);
      setDeleteError(null);
      setDeleteOpen(true);
    },
    [deleteSubmitting],
  );

  const confirmDelete = useCallback(() => {
    if (!deleteTarget || deleteSubmitting) return;

    void (async () => {
      setDeleteSubmitting(true);
      setDeleteError(null);
      try {
        const token = getAccessToken();
        if (!token) throw new Error("missing-token");

        const res = await fetch(
          `${API_BASE_URL}/admin/backups/${deleteTarget.id}`,
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

        setDeleteOpen(false);
        setDeleteTarget(null);
        setItems((prev) =>
          prev.map((item) =>
            item.id === deleteTarget.id ? { ...item, status: "deleted" } : item,
          ),
        );
        void load();
      } catch {
        setDeleteError("Възникна грешка при изтриване на backup.");
      } finally {
        setDeleteSubmitting(false);
      }
    })();
  }, [deleteTarget, deleteSubmitting, load]);

  const openRestore = useCallback(
    (b: BackupItem) => {
      if (restoreSubmitting || hasActiveJob) return;
      setRestoreTarget(b);
      setRestoreError(null);
      setRestorePasswordDraft("");
      setRestoreStep(1);
    },
    [restoreSubmitting, hasActiveJob],
  );

  const closeRestore = useCallback(() => {
    if (restoreSubmitting) return;
    setRestoreStep(0);
    setRestoreTarget(null);
    setRestoreError(null);
    setRestorePasswordDraft("");
  }, [restoreSubmitting]);

  const confirmRestore = useCallback(() => {
    if (!restoreTarget || restoreSubmitting || hasActiveJob) return;

    if (restoreStep === 1) {
      setRestoreStep(2);
      return;
    }

    void (async () => {
      setRestoreSubmitting(true);
      setRestoreError(null);
      try {
        const token = getAccessToken();
        if (!token) throw new Error("missing-token");

        const res = await fetch(
          `${API_BASE_URL}/admin/backups/${restoreTarget.id}/restore`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              encryptionPassword:
                restorePasswordDraft.trim().length > 0
                  ? restorePasswordDraft.trim()
                  : null,
            }),
          },
        );

        if (!res.ok) {
          throw new Error(`failed-${res.status}`);
        }

        const data = (await res.json()) as { jobId?: string };
        const jobId = (data.jobId ?? "").trim();
        if (!jobId) throw new Error("missing-job-id");

        setRestoreStep(0);
        setRestoreTarget(null);
        setRestorePasswordDraft("");
        startPollingJob(jobId);
      } catch {
        setRestoreError("Възникна грешка при restore.");
      } finally {
        setRestoreSubmitting(false);
      }
    })();
  }, [
    hasActiveJob,
    restorePasswordDraft,
    restoreStep,
    restoreSubmitting,
    restoreTarget,
    startPollingJob,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadRemote();
  }, [loadRemote]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    void loadRetention();
  }, [loadRetention]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return (
    <div className="p-6">
      {encryptionWarningOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
              Backup ще бъде криптиран
            </h2>
            <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-80">
              Попълнил си <strong>Encryption password</strong>. Това означава,
              че резервното копие ще бъде криптирано и ще може да бъде
              възстановено само с тази парола. Запиши я на сигурно място, защото
              не се съхранява никъде в системата и няма как да бъде
              възстановена.
            </p>
            <div className="mt-4 flex justify-end gap-2 text-sm">
              <button
                type="button"
                className="be-btn-ghost rounded-md border px-4 py-2 text-sm font-medium"
                onClick={() => setEncryptionWarningOpen(false)}
              >
                Отказ
              </button>
              <button
                type="button"
                className="be-btn-primary rounded-md border px-4 py-2 text-sm font-semibold"
                onClick={confirmEncryptionWarning}
              >
                Разбирам, създай backup
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--foreground)]">
            Backups
          </h1>
          <p className="mt-1 text-sm text-[color:var(--foreground)] opacity-80">
            Ръчно създаване и restore на PostgreSQL backup файлове.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={uploadInputRef}
            type="file"
            accept=".sql"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              void uploadBackupFile(f);
            }}
          />
          <div className="flex w-60 flex-col gap-1">
            <div className="flex items-center gap-1 text-xs font-medium text-[color:var(--foreground)] opacity-80">
              <span>Encryption password</span>
              <InfoTooltip
                label="Какво е encryption password"
                title="Encryption password"
                description={
                  <p>
                    Тази парола се използва само за текущото backup
                    качване/създаване. Не се съхранява в системата и ще е
                    необходима при restore и download.
                  </p>
                }
              />
            </div>
            <input
              type="password"
              className="rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-1.5 text-xs text-[color:var(--foreground)]"
              placeholder="Optional"
              value={newBackupEncryptionPassword}
              onChange={(e) => setNewBackupEncryptionPassword(e.target.value)}
              disabled={createSubmitting || uploadSubmitting || !!hasActiveJob}
            />
          </div>
          <button
            type="button"
            className="rounded-md border border-[color:var(--primary)] bg-[color:var(--primary)] px-3 py-1.5 text-xs font-medium text-[color:var(--on-primary)] disabled:cursor-not-allowed disabled:opacity-70"
            onClick={handleCreateBackupClick}
            disabled={createSubmitting || !!hasActiveJob}
          >
            {createSubmitting ? "..." : "Create backup"}
          </button>
          <button
            type="button"
            className="text-sm font-medium text-[color:var(--primary)] hover:opacity-90 hover:underline"
            onClick={() => void handleReloadAll()}
            disabled={globalReloading}
          >
            {globalReloading ? "..." : "Reload data"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                Automatic backups (Schedule)
              </p>
              <InfoTooltip
                label="Как работят автоматичните backups"
                title="Automatic backups"
                description={
                  <p>
                    Scheduler-ът ще създава backup всеки ден в зададения час и
                    timezone. Ако имате няколко инстанции, има защитен lock
                    срещу двойно изпълнение.
                  </p>
                }
              />
            </div>
            <p className="mt-0.5 text-xs text-[color:var(--foreground)] opacity-80">
              Настройки за автоматично създаване на backup веднъж дневно.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-70"
              onClick={() => void runScheduleNow()}
              disabled={scheduleRunning || !!hasActiveJob}
            >
              {scheduleRunning ? "..." : "Run now"}
            </button>
          </div>
        </div>

        {scheduleLoading ? (
          <p className="mt-3 text-sm text-[color:var(--foreground)] opacity-60">
            Loading schedule...
          </p>
        ) : null}

        {scheduleConfig ? (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between gap-2 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,var(--card))] px-3 py-2 text-sm text-[color:var(--foreground)]">
              <span className="flex items-center gap-1">
                Enable daily backups
                <InfoTooltip
                  label="Какво означава Enable daily backups"
                  title="Enable daily backups"
                  description="Когато е включено, scheduler-ът ще пуска автоматичен backup веднъж дневно в зададения час и timezone."
                />
              </span>
              <button
                type="button"
                className="relative inline-flex h-6 w-12 flex-shrink-0 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2"
                style={{
                  backgroundColor: scheduleConfig.enabled
                    ? "var(--primary)"
                    : "color-mix(in srgb, var(--foreground) 10%, var(--card))",
                  borderColor: scheduleConfig.enabled
                    ? "var(--primary)"
                    : "var(--border)",
                }}
                onClick={() =>
                  setScheduleConfig({
                    ...scheduleConfig,
                    enabled: !scheduleConfig.enabled,
                  })
                }
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-[color:var(--card)] shadow transition ${
                    scheduleConfig.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div />

            <label className="text-sm text-[color:var(--foreground)]">
              <div className="flex items-center gap-2 text-xs text-[color:var(--foreground)] opacity-80">
                Times of day (HH:MM)
                <InfoTooltip
                  label="Какво означава Time of day"
                  title="Time of day"
                  description="Часовете, в които scheduler-ът ще пуска backup (в избрания timezone)."
                />
              </div>
              <div className="mt-1 grid gap-2">
                {scheduleConfig.timesOfDay.map((t, idx) => (
                  <div key={`${idx}-${t}`} className="flex items-center gap-2">
                    <input
                      type="time"
                      className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)]"
                      value={t}
                      onChange={(e) => {
                        const value = e.target.value;
                        const updated = scheduleConfig.timesOfDay.map(
                          (item, i) => (i === idx ? value : item),
                        );
                        setScheduleConfig({
                          ...scheduleConfig,
                          timesOfDay: updated,
                          timeOfDay:
                            updated.find((x) => (x ?? "").trim().length > 0) ??
                            null,
                        });
                      }}
                    />
                    <button
                      type="button"
                      className="be-btn-ghost rounded-md border px-2 py-2 text-xs"
                      onClick={() => removeScheduleTime(idx)}
                      disabled={scheduleConfig.timesOfDay.length === 0}
                      aria-label="Remove time"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="be-btn-ghost rounded-md border px-3 py-2 text-xs font-medium"
                  onClick={addScheduleTime}
                >
                  Add time
                </button>

                {scheduleValidationError ? (
                  <div
                    className="rounded-md border px-3 py-2 text-xs"
                    role="alert"
                    style={{
                      backgroundColor: "var(--field-error-bg, #fef2f2)",
                      borderColor: "var(--field-error-border, #fee2e2)",
                      color: "var(--error, #dc2626)",
                    }}
                  >
                    {scheduleValidationError}
                  </div>
                ) : null}
              </div>
            </label>

            <label className="text-sm text-[color:var(--foreground)]">
              <div className="flex items-center gap-2 text-xs text-[color:var(--foreground)] opacity-80">
                Timezone
                <InfoTooltip
                  label="Какво означава Timezone"
                  title="Timezone"
                  description="IANA timezone, напр. Europe/Sofia."
                />
              </div>
              <div className="relative mt-1">
                <input
                  ref={timezoneInputRef}
                  className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder="Europe/Sofia"
                  value={timezoneDraft}
                  onFocus={() => setTimezoneDropdownOpen(true)}
                  onBlur={() => {
                    timezoneCloseTimer.current = window.setTimeout(() => {
                      setTimezoneDropdownOpen(false);
                      timezoneCloseTimer.current = null;
                    }, 120);
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTimezoneDraft(value);
                    setScheduleConfig({
                      ...scheduleConfig,
                      timezone: value.trim().length > 0 ? value : null,
                    });
                    setTimezoneDropdownOpen(true);
                  }}
                />
                {timezoneDropdownOpen && filteredTimezones.length > 0 ? (
                  <div className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-md border border-[color:var(--border)] bg-[color:var(--card)] shadow-xl">
                    {groupedTimezones.map(({ group, items }) => (
                      <div key={group}>
                        <div className="border-b border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_3%,var(--card))] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-70">
                          {group}
                        </div>
                        {items.map((tz) => (
                          <button
                            key={tz}
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-[color:var(--foreground)] hover:bg-[color:color-mix(in_srgb,var(--primary)_12%,var(--card))]"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setTimezoneDraft(tz);
                              setScheduleConfig({
                                ...scheduleConfig,
                                timezone: tz,
                              });
                              setTimezoneDropdownOpen(false);
                              timezoneInputRef.current?.blur();
                            }}
                          >
                            <span>{tz}</span>
                            {scheduleConfig.timezone === tz ? (
                              <span className="text-[10px] font-semibold uppercase text-[color:var(--primary)]">
                                Selected
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    ))}
                    {filteredTimezones.length === 0 ? (
                      <div className="px-3 py-2 text-center text-[11px] text-[color:var(--foreground)] opacity-70">
                        Няма съвпадения.
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </label>

            <div className="md:col-span-2 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,var(--card))] px-3 py-3 text-sm text-[color:var(--foreground)]">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-1 text-xs text-[color:var(--foreground)] opacity-80">
                    Encryption password for automatic backups
                    <InfoTooltip
                      label="Какво означава encryption password"
                      title="Encryption password"
                      description="Ако зададеш парола, ежедневните автоматични backups ще бъдат криптирани със същата парола. Запиши я на сигурно място."
                    />
                  </div>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)]"
                    placeholder={
                      scheduleHasEncryptionPassword
                        ? "Въведи нова парола, за да я смениш"
                        : "Optional"
                    }
                    value={scheduleEncryptionDraft}
                    onChange={(e) => {
                      if (scheduleEncryptionClear)
                        setScheduleEncryptionClear(false);
                      setScheduleEncryptionDraft(e.target.value);
                    }}
                  />
                  <p className="mt-1 text-xs text-[color:var(--foreground)] opacity-80">
                    {scheduleEncryptionClear
                      ? "Паролата ще бъде премахната при запазване."
                      : scheduleHasEncryptionPassword
                        ? "В момента има запазена парола."
                        : "Няма запазена парола."}
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  <button
                    type="button"
                    className="be-btn-ghost rounded-md border px-3 py-1 text-xs disabled:opacity-40"
                    disabled={
                      !scheduleHasEncryptionPassword && !scheduleEncryptionDraft
                    }
                    onClick={() => {
                      setScheduleEncryptionDraft("");
                      setScheduleEncryptionClear(true);
                      setScheduleHasEncryptionPassword(false);
                    }}
                  >
                    Изчисти паролата
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {scheduleError ? (
          <div
            className="mt-3 rounded-md border px-4 py-3 text-sm"
            role="alert"
            style={{
              backgroundColor: "var(--field-error-bg, #fef2f2)",
              borderColor: "var(--field-error-border, #fee2e2)",
              color: "var(--error, #dc2626)",
            }}
          >
            {scheduleError}
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                Retention policy
              </p>
              <InfoTooltip
                label="Как работи retention"
                title="Retention policy"
                description={
                  <p>
                    Автоматично изтриване на стари backups по възраст и/или по
                    лимит “keep last N”. Двата механизма могат да работят
                    едновременно.
                  </p>
                }
              />
            </div>
            <p className="mt-0.5 text-xs text-[color:var(--foreground)] opacity-80">
              Настройки за автоматично почистване на стари архиви.
            </p>
          </div>
        </div>

        {retentionLoading ? (
          <p className="mt-3 text-sm text-[color:var(--foreground)] opacity-60">
            Loading retention...
          </p>
        ) : null}

        {retentionConfig ? (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between gap-2 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,var(--card))] px-3 py-2 text-sm text-[color:var(--foreground)]">
              <span className="flex items-center gap-1">
                Enable time-based cleanup
                <InfoTooltip
                  label="Какво означава time-based cleanup"
                  title="Time-based cleanup"
                  description="Когато е включено, системата ще изтрива backups по-стари от избрания период."
                />
              </span>
              <button
                type="button"
                className="relative inline-flex h-6 w-12 flex-shrink-0 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2"
                style={{
                  backgroundColor: retentionConfig.time.enabled
                    ? "var(--primary)"
                    : "color-mix(in srgb, var(--foreground) 10%, var(--card))",
                  borderColor: retentionConfig.time.enabled
                    ? "var(--primary)"
                    : "var(--border)",
                }}
                onClick={() =>
                  setRetentionConfig((prev) => {
                    if (!prev) return prev;
                    const nextEnabled = !prev.time.enabled;
                    return {
                      ...prev,
                      time: {
                        ...prev.time,
                        enabled: nextEnabled,
                        period:
                          nextEnabled && prev.time.period === "never"
                            ? DEFAULT_RETENTION_TIME_PERIOD
                            : prev.time.period,
                      },
                    };
                  })
                }
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-[color:var(--card)] shadow transition ${
                    retentionConfig.time.enabled
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <label className="text-sm text-[color:var(--foreground)]">
              <div className="flex items-center gap-2 text-xs text-[color:var(--foreground)] opacity-80">
                Delete backups older than
                <InfoTooltip
                  label="Период за изтриване"
                  title="Time period"
                  description="Изтриване на backups по възраст. Пример: weekly означава по-стари от 7 дни."
                />
              </div>
              <select
                className="mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)]"
                value={retentionConfig.time.period}
                onChange={(e) => {
                  const nextPeriod = e.target
                    .value as BackupRetentionTimePeriod;
                  setRetentionConfig((prev) => {
                    if (!prev) return prev;
                    const nextEnabled =
                      nextPeriod !== "never" ? true : prev.time.enabled;
                    return {
                      ...prev,
                      time: {
                        ...prev.time,
                        period: nextPeriod,
                        enabled: nextPeriod === "never" ? false : nextEnabled,
                      },
                    };
                  });
                }}
              >
                <option value="1_minute">Every minute (test)</option>
                <option value="weekly">Every week</option>
                <option value="monthly">Every month</option>
                <option value="2_months">Every 2 months</option>
                <option value="3_months">Every 3 months</option>
                <option value="6_months">Every 6 months</option>
                <option value="yearly">Every year</option>
                <option value="never">Never</option>
              </select>
            </label>

            <div className="flex items-center justify-between gap-2 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,var(--card))] px-3 py-2 text-sm text-[color:var(--foreground)]">
              <span className="flex items-center gap-1">
                Enable keep-last-N
                <InfoTooltip
                  label="Какво означава keep last N"
                  title="Keep last N"
                  description="Когато е включено, системата ще пази най-новите N backups и ще изтрива по-старите (N+1-вия и нататък)."
                />
              </span>
              <button
                type="button"
                className="relative inline-flex h-6 w-12 flex-shrink-0 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2"
                style={{
                  backgroundColor: retentionConfig.count.enabled
                    ? "var(--primary)"
                    : "color-mix(in srgb, var(--foreground) 10%, var(--card))",
                  borderColor: retentionConfig.count.enabled
                    ? "var(--primary)"
                    : "var(--border)",
                }}
                onClick={() =>
                  setRetentionConfig({
                    ...retentionConfig,
                    count: {
                      ...retentionConfig.count,
                      enabled: !retentionConfig.count.enabled,
                    },
                  })
                }
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-[color:var(--card)] shadow transition ${
                    retentionConfig.count.enabled
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <label className="text-sm text-[color:var(--foreground)]">
              <div className="flex items-center gap-2 text-xs text-[color:var(--foreground)] opacity-80">
                Keep last N backups
                <InfoTooltip
                  label="Keep last"
                  title="Keep last N"
                  description="Пази най-новите N backups. Полето приема само положителни цели числа."
                />
              </div>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                className="mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)]"
                value={keepLastDraft}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.length > 0 && !/^\d+$/.test(v)) return;
                  setKeepLastDraft(v);
                  const parsed = Number.parseInt(v || "0", 10);
                  if (Number.isFinite(parsed) && parsed > 0) {
                    setRetentionConfig({
                      ...retentionConfig,
                      count: {
                        ...retentionConfig.count,
                        keepLast: parsed,
                      },
                    });
                  }
                }}
              />
            </label>
          </div>
        ) : null}

        {retentionError ? (
          <div
            className="mt-3 rounded-md border px-4 py-3 text-sm"
            role="alert"
            style={{
              backgroundColor: "var(--field-error-bg, #fef2f2)",
              borderColor: "var(--field-error-border, #fee2e2)",
              color: "var(--error, #dc2626)",
            }}
          >
            {retentionError}
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[color:var(--foreground)]">
              Remote backup storage (S3)
            </p>
            <p className="mt-0.5 text-xs text-[color:var(--foreground)] opacity-80">
              Автоматичен sync на backups към S3 при създаване.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-70"
              onClick={() => void testRemote()}
              disabled={remoteTesting || remoteLoading}
            >
              {remoteTesting ? "..." : "Test connection"}
            </button>
          </div>
        </div>

        {remoteLoading ? (
          <p className="mt-3 text-sm text-[color:var(--foreground)] opacity-60">
            Loading remote settings...
          </p>
        ) : null}

        {remoteConfig ? (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,var(--card))] px-3 py-2 text-sm text-[color:var(--foreground)]">
              <span className="flex items-center gap-1">
                Enable automatic sync
                <InfoTooltip
                  label="Какво означава Enable automatic sync"
                  title="Enable automatic sync"
                  description="При включване всеки нов локален backup ще бъде качен и в конфигурирания S3 bucket (изисква попълнени достъпни ключове)."
                />
              </span>
              <button
                type="button"
                className="relative inline-flex h-6 w-12 flex-shrink-0 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2"
                style={{
                  backgroundColor: remoteConfig.enabled
                    ? "var(--primary)"
                    : "color-mix(in srgb, var(--foreground) 10%, var(--card))",
                  borderColor: remoteConfig.enabled
                    ? "var(--primary)"
                    : "var(--border)",
                }}
                onClick={handleToggleRemoteSync}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-[color:var(--card)] shadow transition ${
                    remoteConfig.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div />

            <label className="text-sm text-[color:var(--foreground)]">
              <div className="flex items-center gap-1 text-xs text-[color:var(--foreground)] opacity-80">
                Access Key ID{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
                <InfoTooltip
                  label="Какво означава Access Key ID"
                  title="Access Key ID"
                  description="Публичната част от AWS IAM ключа, който има права да записва в избрания bucket."
                />
              </div>
              <input
                className="mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)]"
                placeholder={remoteConfig.s3.accessKeyId ? "(saved)" : ""}
                value={remoteAccessKeyDraft}
                onChange={(e) => {
                  if (remoteToggleError) setRemoteToggleError(null);
                  setRemoteAccessKeyDraft(e.target.value);
                  setRemoteConfig({
                    ...remoteConfig,
                    s3: { ...remoteConfig.s3, accessKeyId: e.target.value },
                  });
                }}
              />
            </label>

            <label className="text-sm text-[color:var(--foreground)]">
              <div className="flex items-center gap-1 text-xs text-[color:var(--foreground)] opacity-80">
                <span>
                  Secret Access Key{" "}
                  {remoteConfig.s3.hasSecretAccessKey ? "(saved)" : ""}
                </span>
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
                <InfoTooltip
                  label="Какво означава Secret Access Key"
                  title="Secret Access Key"
                  description="Тайната част от AWS IAM ключа. Използва се само за подписване на заявки и се съхранява криптирано. Попълнете отново, ако искате да я смените."
                />
              </div>
              <input
                type="password"
                placeholder={
                  remoteConfig.s3.hasSecretAccessKey ? "••••••••" : ""
                }
                className="mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)]"
                value={remoteSecretDraft}
                onChange={(e) => {
                  if (remoteToggleError) setRemoteToggleError(null);
                  setRemoteSecretDraft(e.target.value);
                }}
              />
            </label>

            <label className="text-sm text-[color:var(--foreground)]">
              <div className="flex items-center gap-1 text-xs text-[color:var(--foreground)] opacity-80">
                Bucket{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
                <InfoTooltip
                  label="Какво означава Bucket"
                  title="Bucket"
                  description="Името на S3 bucket-а, в който ще се качват архивите (напр. company-backups)."
                />
              </div>
              <input
                className="mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)]"
                value={remoteConfig.s3.bucket ?? ""}
                onChange={(e) => {
                  if (remoteToggleError) setRemoteToggleError(null);
                  setRemoteConfig({
                    ...remoteConfig,
                    s3: { ...remoteConfig.s3, bucket: e.target.value },
                  });
                }}
              />
            </label>

            <label className="text-sm text-[color:var(--foreground)]">
              <div className="flex items-center gap-1 text-xs text-[color:var(--foreground)] opacity-80">
                Region{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
                <InfoTooltip
                  label="Какво означава Region"
                  title="Region"
                  description="AWS регионът на bucket-а (напр. eu-central-1). Трябва да съвпада с реалния регион."
                />
              </div>
              <input
                className="mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)]"
                value={remoteConfig.s3.region ?? ""}
                onChange={(e) => {
                  if (remoteToggleError) setRemoteToggleError(null);
                  setRemoteConfig({
                    ...remoteConfig,
                    s3: { ...remoteConfig.s3, region: e.target.value },
                  });
                }}
              />
            </label>

            <label className="text-sm text-[color:var(--foreground)] md:col-span-2">
              <div className="flex items-center gap-1 text-xs text-[color:var(--foreground)] opacity-80">
                Prefix (folder)
                <InfoTooltip
                  label="Какво означава Prefix"
                  title="Prefix (folder)"
                  description="По избор: под-папка вътре в bucket-а, в която да се качват файловете (напр. prod/db-backups). Ако е празно, файловете са в root."
                />
              </div>
              <input
                className="mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)]"
                value={remoteConfig.s3.prefix ?? ""}
                onChange={(e) =>
                  setRemoteConfig({
                    ...remoteConfig,
                    s3: { ...remoteConfig.s3, prefix: e.target.value },
                  })
                }
              />
            </label>
            {remoteToggleError ? (
              <div className="md:col-span-2 rounded-md border border-[color:var(--error)] bg-[color:color-mix(in srgb, var(--error) 12%, var(--card))] px-3 py-2 text-xs text-[color:var(--error)]">
                {remoteToggleError}
              </div>
            ) : null}
          </div>
        ) : null}

        {remoteTestOk === true ? (
          <div
            className="mt-3 rounded-md border px-4 py-3 text-sm"
            style={{
              backgroundColor: "var(--field-ok-bg)",
              borderColor: "var(--field-ok-border)",
              color: "var(--foreground)",
            }}
          >
            Connection OK.
          </div>
        ) : null}

        {remoteTestOk === false ? (
          <div
            className="mt-3 rounded-md border px-4 py-3 text-sm"
            style={{
              backgroundColor: "var(--field-error-bg, #fef2f2)",
              borderColor: "var(--field-error-border, #fee2e2)",
              color: "var(--error, #dc2626)",
            }}
          >
            Connection failed.
          </div>
        ) : null}

        {remoteError ? (
          <div
            className="mt-3 rounded-md border px-4 py-3 text-sm"
            role="alert"
            style={{
              backgroundColor: "var(--field-error-bg, #fef2f2)",
              borderColor: "var(--field-error-border, #fee2e2)",
              color: "var(--error, #dc2626)",
            }}
          >
            {remoteError}
          </div>
        ) : null}
      </div>

      <div
        className="mt-4 rounded-md border border-dashed border-[color:var(--border)] bg-[color:var(--card)] px-4 py-4"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const f = e.dataTransfer.files?.[0];
          if (!f) return;
          void uploadBackupFile(f);
        }}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
              Upload backup (.sql)
              <InfoTooltip
                label="Как работи upload"
                title="Upload backup (.sql)"
                description="Може да качите .sql файл чрез drag & drop върху панела или чрез бутона “Choose file”. Файлът ще бъде хеширан, криптиран (ако сте задали парола) и добавен към списъка."
              />
            </div>
            <p className="mt-0.5 text-xs text-[color:var(--foreground)] opacity-80">
              Drag & drop SQL файл тук или използвайте бутона “Upload backup”.
            </p>
          </div>
          <button
            type="button"
            className="be-btn-ghost rounded-md border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-70"
            onClick={openUploadPicker}
            disabled={uploadSubmitting || !!hasActiveJob}
          >
            Choose file
          </button>
        </div>

        {uploadError ? (
          <div
            className="mt-3 rounded-md border px-4 py-3 text-sm"
            role="alert"
            style={{
              backgroundColor: "var(--field-error-bg, #fef2f2)",
              borderColor: "var(--field-error-border, #fee2e2)",
              color: "var(--error, #dc2626)",
            }}
          >
            {uploadError}
          </div>
        ) : null}

        {uploadResult ? (
          <div
            className="mt-3 rounded-md border px-4 py-3"
            style={{
              backgroundColor: "var(--field-ok-bg, #f0fdf4)",
              borderColor: "var(--field-ok-border, #dcfce7)",
              color: "var(--foreground, #111827)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Upload successful</p>
                <p className="mt-0.5 text-xs">
                  {uploadResult.preview.originalFilename}
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-[color:var(--primary)] hover:opacity-90"
                onClick={() => setUploadResult(null)}
              >
                Dismiss
              </button>
            </div>

            <div className="mt-2 grid gap-1 text-xs">
              <div>
                Stored as:{" "}
                <span className="font-semibold">
                  {uploadResult.backup.filename}
                </span>
              </div>

              <div>
                Size:{" "}
                <span className="font-semibold">
                  {formatBytes(uploadResult.backup.sizeBytes)}
                </span>
              </div>

              <div className="break-all">
                SHA256:{" "}
                <span className="font-semibold">
                  {uploadResult.backup.sha256}
                </span>
              </div>
              {uploadResult.preview.detectedDbVersion ? (
                <div>
                  DB:{" "}
                  <span className="font-semibold">
                    {uploadResult.preview.detectedDbVersion}
                  </span>
                </div>
              ) : null}
              {uploadResult.preview.detectedPgDumpVersion ? (
                <div>
                  pg_dump:{" "}
                  <span className="font-semibold">
                    {uploadResult.preview.detectedPgDumpVersion}
                  </span>
                </div>
              ) : null}
              {uploadResult.preview.detectedDumpedOn ? (
                <div>
                  Dumped on:{" "}
                  <span className="font-semibold">
                    {uploadResult.preview.detectedDumpedOn}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {(job || jobError) && (
        <div className="mt-4 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                {job?.type === "restore" ? "Restore" : "Backup"} job
              </p>
              <p className="mt-0.5 text-xs text-[color:var(--foreground)] opacity-80">
                {job?.message || ""}
                {job?.error ? ` (${job.error})` : ""}
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-[color:var(--foreground)] opacity-80 hover:text-[color:var(--foreground)]"
              onClick={() => {
                if (hasActiveJob) return;
                setJob(null);
                setJobError(null);
              }}
            >
              Dismiss
            </button>
          </div>

          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded bg-[color:var(--border)]">
              <div
                className="h-full bg-[color:var(--primary)] transition-all"
                style={{
                  width: `${Math.max(0, Math.min(100, job?.percent ?? 0))}%`,
                }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-[color:var(--foreground)] opacity-80">
              <span>{job?.stage ?? ""}</span>
              <span>{`${job?.percent ?? 0}%`}</span>
            </div>
          </div>

          {jobError ? (
            <div
              className="mt-3 rounded-md border px-4 py-3 text-sm"
              role="alert"
              style={{
                backgroundColor: "var(--field-error-bg)",
                borderColor: "var(--field-error-border)",
                color: "var(--error)",
              }}
            >
              {jobError}
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-6 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-[color:var(--foreground)]">
              Запази настройките
            </p>
            <p className="text-xs text-[color:var(--foreground)] opacity-80">
              Съхранява автоматичните backups, retention и remote sync
              конфигурациите.
            </p>
          </div>

          {(["schedule", "retention", "remote"] as const).map((section) => {
            const outcome = sectionMessages[section];
            if (!outcome) return null;
            const labelMap: Record<typeof section, string> = {
              schedule: "Automatic backups",
              retention: "Retention policy",
              remote: "Remote storage",
            };
            return (
              <div
                key={section}
                className="rounded-md border px-4 py-3 text-sm"
                style={outcome.ok ? successBoxStyle : errorBoxStyle}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-80">
                  {labelMap[section]}
                </p>
                <p className="mt-1 text-sm">{outcome.message}</p>
              </div>
            );
          })}

          <button
            type="button"
            className="w-full rounded-md border border-[color:var(--primary)] bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-[color:var(--on-primary)] disabled:cursor-not-allowed disabled:opacity-70"
            onClick={() => void handleSaveAll()}
            disabled={saveButtonDisabled}
          >
            {globalSaving ? "..." : "Save settings"}
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-[color:var(--border)] pt-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[color:var(--foreground)]">
            Backups
          </p>
          <p className="text-xs text-[color:var(--foreground)] opacity-80">
            Последните създадени и качени архиви.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[color:var(--foreground)] opacity-80">
          <span>Показвай изтритите backup-и</span>
          <button
            type="button"
            className="relative inline-flex h-5 w-10 flex-shrink-0 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2"
            style={{
              backgroundColor: showDeleted
                ? "var(--primary)"
                : "color-mix(in srgb, var(--foreground) 10%, var(--card))",
              borderColor: showDeleted ? "var(--primary)" : "var(--border)",
            }}
            onClick={() => setShowDeleted((prev) => !prev)}
            aria-pressed={showDeleted}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-[color:var(--card)] shadow transition ${
                showDeleted ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {!loading && error && (
        <div
          className="mt-4 rounded-md border px-4 py-3 text-sm"
          role="alert"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--error) 14%, var(--card))",
            borderColor: "var(--border)",
            color: "var(--error)",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && visibleItems.length === 0 && (
        <p className="mt-4 text-sm text-[color:var(--foreground)] opacity-80">
          No backups found.
        </p>
      )}

      {!loading && !error && visibleItems.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[color:var(--border)] text-xs uppercase tracking-wide text-[color:var(--foreground)] opacity-80">
              <tr>
                <th className="px-2 py-2">Filename</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Size</th>
                <th className="px-2 py-2">Created</th>
                <th className="px-2 py-2">By</th>
                <th className="px-2 py-2">Deletion</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {pagedBackups.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-[color:color-mix(in srgb, var(--foreground) 3%, var(--card))]"
                >
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-[color:var(--foreground)]">
                        {b.filename}
                      </div>
                      {b.isEncrypted ? (
                        <span className="rounded border border-[color:var(--border)] bg-[color:color-mix(in srgb, var(--attention) 14%, var(--card))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--attention)]">
                          Encrypted
                        </span>
                      ) : null}
                    </div>
                    {b.errorMessage ? (
                      <div className="mt-0.5 text-xs text-[color:var(--error)]">
                        {b.errorMessage}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-2 py-2 text-[color:var(--foreground)] opacity-80">
                    {b.type}
                  </td>
                  <td className="px-2 py-2 text-[color:var(--foreground)] opacity-80">
                    {b.status}
                  </td>
                  <td className="px-2 py-2 text-[color:var(--foreground)] opacity-80">
                    {formatBytes(b.sizeBytes)}
                  </td>
                  <td className="px-2 py-2 text-[color:var(--foreground)] opacity-80">
                    {formatDateTime(b.createdAt)}
                  </td>
                  <td className="px-2 py-2 text-[color:var(--foreground)] opacity-80">
                    {b.createdByEmail ?? "-"}
                  </td>
                  <td className="px-2 py-2 text-[color:var(--foreground)] opacity-80">
                    {b.status === "deleted" ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-[color:var(--foreground)]">
                          {b.deletedReason === "retention"
                            ? "Auto (retention)"
                            : (b.deletedByEmail ?? "Manual")}
                        </span>
                        {b.deletedAt ? (
                          <span className="text-xs text-[color:var(--foreground)] opacity-60">
                            {formatDateTime(b.deletedAt)}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-3">
                      {b.status === "deleted" ? (
                        <button
                          type="button"
                          className="cursor-not-allowed rounded border border-[color:var(--border)] bg-[color:color-mix(in srgb, var(--foreground) 4%, var(--card))] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-70"
                          disabled
                        >
                          Deleted
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="text-xs font-medium text-[color:var(--primary)] hover:opacity-90"
                            onClick={() => openDownload(b)}
                            disabled={!!hasActiveJob}
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            className="text-xs font-medium text-[color:var(--attention)] hover:opacity-90 disabled:opacity-50"
                            onClick={() => openRestore(b)}
                            disabled={!!hasActiveJob || b.status !== "ready"}
                          >
                            {b.type === "uploaded" ? "Apply" : "Restore"}
                          </button>
                          <button
                            type="button"
                            className="text-xs font-medium text-[color:var(--error)] hover:opacity-90"
                            onClick={() => openDelete(b)}
                            disabled={deleteSubmitting || !!hasActiveJob}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex flex-col gap-3 border-t border-[color:var(--border)] px-3 py-3 text-xs text-[color:var(--foreground)] opacity-80 md:flex-row md:items-center md:justify-between md:text-sm">
            <p>
              Showing <span className="font-semibold">{showingFrom}</span>-
              <span className="font-semibold">{showingTo}</span> of{" "}
              <span className="font-semibold">{totalBackups}</span> backups
            </p>
            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              pageSize={pageSize}
              onPageSizeChange={(next) => {
                setCurrentPage(1);
                setPageSize(next);
              }}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete backup"
        description="Файлът ще бъде премахнат от диска и backup записът ще бъде маркиран като deleted. Това действие е необратимо."
        details={
          <div>
            Backup:{" "}
            <span className="font-semibold">{deleteTarget?.filename}</span>
          </div>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        submitting={deleteSubmitting}
        error={deleteError}
        onCancel={() => {
          if (deleteSubmitting) return;
          setDeleteOpen(false);
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={restoreStep === 1}
        title={
          restoreTarget?.type === "uploaded" ? "Apply backup" : "Restore backup"
        }
        description={
          restoreTarget?.type === "uploaded"
            ? "Ще приложите качения backup и ще презапишете текущата база данни. Препоръчително е да го правите само в контролирана среда."
            : "Ще презапишете текущата база данни с избрания backup. Препоръчително е да направите restore само в контролирана среда."
        }
        details={
          <div>
            Backup:{" "}
            <span className="font-semibold">{restoreTarget?.filename}</span>
          </div>
        }
        confirmLabel="Continue"
        cancelLabel="Cancel"
        danger
        submitting={restoreSubmitting}
        error={restoreError}
        onCancel={closeRestore}
        onConfirm={confirmRestore}
      />

      <ConfirmDialog
        open={restoreStep === 2}
        title={
          restoreTarget?.type === "uploaded"
            ? "Confirm apply"
            : "Confirm restore"
        }
        description={
          restoreTarget?.type === "uploaded"
            ? "Последно потвърждение: apply е необратимо и ще замени данните в базата. Системата ще направи pre-restore backup, но пак има риск."
            : "Последно потвърждение: restore е необратим и ще замени данните в базата. Системата ще направи pre-restore backup, но пак има риск."
        }
        details={
          <div>
            Backup:{" "}
            <span className="font-semibold">{restoreTarget?.filename}</span>
            <div className="mt-3">
              <div className="text-xs text-[color:var(--foreground)] opacity-80">
                Encryption password (optional; required for encrypted backups)
              </div>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)]"
                value={restorePasswordDraft}
                onChange={(e) => setRestorePasswordDraft(e.target.value)}
              />
            </div>
          </div>
        }
        confirmLabel={restoreTarget?.type === "uploaded" ? "Apply" : "Restore"}
        cancelLabel="Cancel"
        danger
        submitting={restoreSubmitting}
        error={restoreError}
        onCancel={closeRestore}
        onConfirm={confirmRestore}
      />

      <ConfirmDialog
        open={downloadOpen}
        title="Download backup"
        description="Ако backup-ът е криптиран, трябва да въведете паролата."
        details={
          <div>
            Backup:{" "}
            <span className="font-semibold">{downloadTarget?.filename}</span>
            <div className="mt-3">
              <div className="text-xs text-[color:var(--foreground)] opacity-80">
                Encryption password
              </div>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)]"
                value={downloadPasswordDraft}
                onChange={(e) => setDownloadPasswordDraft(e.target.value)}
              />
            </div>
          </div>
        }
        confirmLabel="Download"
        cancelLabel="Cancel"
        submitting={downloadSubmitting}
        error={downloadError}
        onCancel={() => {
          if (downloadSubmitting) return;
          setDownloadOpen(false);
          setDownloadTarget(null);
          setDownloadError(null);
          setDownloadPasswordDraft("");
        }}
        onConfirm={confirmDownload}
      />
    </div>
  );
}
