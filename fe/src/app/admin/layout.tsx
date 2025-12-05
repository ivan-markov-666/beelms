"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type AdminStatus = "loading" | "forbidden" | "ready";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<AdminStatus>("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      try {
        const token = window.localStorage.getItem("qa4free_access_token");
        if (!token) {
          router.replace("/auth/login");
          return;
        }

        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 404) {
            try {
              window.localStorage.removeItem("qa4free_access_token");
            } catch {
            }
            router.replace("/auth/login");
            return;
          }

          if (!cancelled) {
            setStatus("forbidden");
          }
          return;
        }

        const data = (await res.json()) as { role?: string };

        if (cancelled) {
          return;
        }

        if (data.role !== "admin") {
          setStatus("forbidden");
          return;
        }

        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("forbidden");
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <main className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">Зареждане на Admin зоната...</p>
        </main>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <main className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-zinc-900">
            Нямате достъп до Admin зоната
          </h1>
          <p className="text-sm text-zinc-700">
            Този раздел е достъпен само за администратори.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <main className="mx-auto max-w-7xl px-4">{children}</main>
    </div>
  );
}
