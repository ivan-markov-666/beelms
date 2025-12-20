"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../../../../auth-token";

function apiUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";
  const normalizedBase = base.endsWith("/api")
    ? base
    : `${base.replace(/\/$/, "")}/api`;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export default function CheckoutSuccessPage(props: {
  params: { courseId: string } | Promise<{ courseId: string }>;
  searchParams?: { session_id?: string } | Promise<{ session_id?: string }>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const token = getAccessToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const resolvedParams = await props.params;
      const resolvedSearch = await props.searchParams;
      const sessionId = resolvedSearch?.session_id;

      if (!sessionId) {
        if (!cancelled) {
          setStatus("error");
          setError("Missing Stripe session id.");
        }
        return;
      }

      try {
        const verifyRes = await fetch(
          apiUrl(`/courses/${resolvedParams.courseId}/purchase/verify`),
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
          },
        );

        if (!verifyRes.ok && verifyRes.status !== 204) {
          if (!cancelled) {
            setStatus("error");
            setError("Payment verification failed.");
          }
          return;
        }

        const enrollRes = await fetch(
          apiUrl(`/courses/${resolvedParams.courseId}/enroll`),
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!enrollRes.ok && enrollRes.status !== 204) {
          if (!cancelled) {
            setStatus("error");
            setError("Enroll failed after payment.");
          }
          return;
        }

        if (!cancelled) {
          setStatus("success");
        }

        router.replace(`/courses/${resolvedParams.courseId}`);
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("Network error.");
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [props.params, props.searchParams, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Payment</h1>

      {status === "loading" && (
        <p className="text-sm text-zinc-600">Finalizing payment...</p>
      )}

      {status === "error" && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Something went wrong."}
        </div>
      )}

      <Link
        href="/my-courses"
        className="text-sm text-green-700 hover:text-green-800"
      >
        Go to My Courses →
      </Link>
    </main>
  );
}
