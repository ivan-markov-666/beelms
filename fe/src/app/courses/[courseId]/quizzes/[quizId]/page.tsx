"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "../../../../auth-token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
};

type QuizDetail = {
  id: string;
  title: string;
  passingScore: number | null;
  questions: QuizQuestion[];
};

type QuizSubmitResult = {
  score: number;
  maxScore: number;
  passed: boolean;
};

export default function CourseQuizPage() {
  const params = useParams<{ courseId: string; quizId: string }>();
  const courseId = params?.courseId;
  const quizId = params?.quizId;

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);

  const requiredScoreText = useMemo(() => {
    if (!quiz) return null;
    if (quiz.passingScore === null) return null;
    return `Passing score: ${quiz.passingScore}`;
  }, [quiz]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!courseId || !quizId) return;

    let cancelled = false;

    const token = getAccessToken();
    if (!token) {
      window.setTimeout(() => {
        if (!cancelled) {
          setLoading(false);
          setError("Трябва да си логнат, за да отвориш този quiz.");
        }
      }, 0);
      return () => {
        cancelled = true;
      };
    }

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/courses/${encodeURIComponent(
            courseId,
          )}/quizzes/${encodeURIComponent(quizId)}`,
          {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (cancelled) return;

        if (res.status === 401) {
          setError("Трябва да си логнат, за да отвориш този quiz.");
          setLoading(false);
          return;
        }

        if (res.status === 403) {
          setError(
            "Нямаш достъп до този quiz. Отключи/запиши се в курса от страницата на курса.",
          );
          setLoading(false);
          return;
        }

        if (res.status === 404) {
          setError("Quiz-ът не е намерен.");
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError("Неуспешно зареждане на quiz.");
          setLoading(false);
          return;
        }

        const data = (await res.json()) as QuizDetail;
        setQuiz(data);
        setAnswers({});
        setResult(null);
        setSubmitError(null);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Неуспешно зареждане на quiz.");
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [courseId, quizId]);

  const submit = async () => {
    if (typeof window === "undefined") return;
    if (!courseId || !quizId || !quiz) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setSubmitError("Трябва да си логнат.");
        setSubmitting(false);
        return;
      }

      const missing = quiz.questions.filter((q) => answers[q.id] === undefined);
      if (missing.length) {
        setSubmitError("Моля, отговори на всички въпроси преди submit.");
        setSubmitting(false);
        return;
      }

      const payload = {
        answers: quiz.questions.map((q) => ({
          questionId: q.id,
          optionIndex: answers[q.id],
        })),
      };

      const res = await fetch(
        `${API_BASE_URL}/api/courses/${encodeURIComponent(
          courseId,
        )}/quizzes/${encodeURIComponent(quizId)}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (res.status === 401) {
        setSubmitError("Трябва да си логнат.");
        setSubmitting(false);
        return;
      }

      if (res.status === 403) {
        setSubmitError("Трябва да се запишеш/отключиш курса.");
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        setSubmitError("Неуспешно submit-ване.");
        setSubmitting(false);
        return;
      }

      const json = (await res.json()) as QuizSubmitResult;
      setResult(json);
      setSubmitting(false);
    } catch {
      setSubmitError("Неуспешно submit-ване.");
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm text-zinc-500">
          <Link
            href={
              courseId ? `/courses/${encodeURIComponent(courseId)}` : "/courses"
            }
            className="hover:underline"
          >
            ← Назад към курса
          </Link>
        </p>

        {loading && <p className="text-sm text-gray-600">Loading...</p>}

        {!loading && error && (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && quiz && (
          <>
            <h1 className="text-4xl font-bold text-zinc-900">{quiz.title}</h1>
            {requiredScoreText && (
              <p className="text-sm text-zinc-600">{requiredScoreText}</p>
            )}
          </>
        )}
      </header>

      {!loading && !error && quiz && (
        <>
          {result && (
            <section
              className={`rounded-lg border p-5 shadow-sm ${
                result.passed
                  ? "border-green-200 bg-green-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <h2 className="text-lg font-semibold text-gray-900">Result</h2>
              <p className="mt-2 text-sm text-gray-800">
                Score: {result.score}/{result.maxScore}
              </p>
              <p
                className={`mt-1 text-sm font-semibold ${
                  result.passed ? "text-green-800" : "text-amber-800"
                }`}
              >
                {result.passed ? "Passed" : "Not passed"}
              </p>
            </section>
          )}

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Questions</h2>

            <ol className="mt-4 space-y-4">
              {quiz.questions.map((q, idx) => (
                <li
                  key={q.id}
                  className="rounded-md border border-gray-200 p-4"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {idx + 1}. {q.text}
                  </p>

                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, optionIndex) => {
                      const checked = answers[q.id] === optionIndex;
                      return (
                        <label
                          key={`${q.id}-${optionIndex}`}
                          className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                            checked
                              ? "border-green-300 bg-green-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={checked}
                            onChange={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                [q.id]: optionIndex,
                              }))
                            }
                            className="mt-1"
                          />
                          <span className="text-gray-800">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ol>

            {submitError && (
              <div
                className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {submitError}
              </div>
            )}

            <div className="mt-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submit()}
                className="inline-flex items-center rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
