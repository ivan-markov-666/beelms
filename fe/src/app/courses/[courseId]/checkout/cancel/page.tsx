"use client";

import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Payment cancelled</h1>
      <p className="text-sm text-zinc-600">Плащането беше прекъснато.</p>
      <Link
        href="/courses"
        className="text-sm text-green-700 hover:text-green-800"
      >
        Back to courses →
      </Link>
    </main>
  );
}
