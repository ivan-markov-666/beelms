"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../../../../../auth-token";
import { buildApiUrl } from "../../../../../api-url";

export default function MyposCheckoutSuccessPage(props: {
  params: { courseId: string } | Promise<{ courseId: string }>;
  searchParams?: { checkout_id?: string } | Promise<{ checkout_id?: string }>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      });

    const waitForPurchase = async (args: {
      token: string;
      courseId: string;
      maxAttempts: number;
    }): Promise<boolean> => {
      for (let attempt = 1; attempt <= args.maxAttempts; attempt++) {
        if (cancelled) {
          return false;
        }

        try {
          const res = await fetch(
            buildApiUrl(`/payments/courses/${args.courseId}/purchase/status`),
            {
              headers: {
                Authorization: `Bearer ${args.token}`,
              },
            },
          );

          if (res.ok) {
            const data = (await res.json()) as { purchased?: boolean };
            if (data.purchased) {
              return true;
            }
          }
        } catch {}

        await sleep(Math.min(800 * attempt, 3000));
      }

      return false;
    };

    const run = async () => {
      const token = getAccessToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const resolvedParams = await props.params;
      if (!cancelled) {
        setCourseId(resolvedParams.courseId);
      }

      const resolvedSearch = await props.searchParams;
      const checkoutId = resolvedSearch?.checkout_id;

      if (!checkoutId) {
        if (!cancelled) {
          setStatus("error");
          setError("Missing myPOS checkout id.");
        }
        return;
      }

      try {
        if (!cancelled) {
          setStatus("loading");
          setError(null);
        }

        const purchased = await waitForPurchase({
          token,
          courseId: resolvedParams.courseId,
          maxAttempts: 12,
        });

        if (!purchased) {
          if (!cancelled) {
            setStatus("error");
            setError(
              "Payment is still processing. Please refresh this page in a moment.",
            );
          }
          return;
        }

        const enrollRes = await fetch(
          buildApiUrl(`/courses/${resolvedParams.courseId}/enroll`),
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

      {status === "success" && (
        <div className="space-y-4">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Плащането е успешно. Курсът е отключен и записването е завършено.
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {courseId && (
              <Link
                href={`/courses/${courseId}`}
                className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
              >
                Go to course
              </Link>
            )}

            <Link
              href="/my-courses"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
            >
              Go to My Courses
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error ?? "Something went wrong."}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {courseId && (
              <Link
                href={`/courses/${courseId}`}
                className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
              >
                Back to course (retry)
              </Link>
            )}

            <Link
              href="/courses"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
            >
              Back to courses
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
