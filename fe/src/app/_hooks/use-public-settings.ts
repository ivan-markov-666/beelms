"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPublicSettings,
  type PublicSettings,
} from "../_data/public-settings";

type UsePublicSettingsResult = {
  settings: PublicSettings | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function usePublicSettings(): UsePublicSettingsResult {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getPublicSettings();
        if (!active) return;
        setSettings(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setSettings(null);
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to load public settings"),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [refreshIndex]);

  const refetch = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  return { settings, loading, error, refetch };
}
