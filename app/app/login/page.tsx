"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/admin";

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const resp = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setErr(data.error ?? "Login failed");
      } else {
        router.push(from);
        router.refresh();
      }
    } catch {
      setErr("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-off-white px-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-ink">Dimmlo admin</h1>
        <p className="mt-1 text-sm text-gray-500">Enter your password to continue.</p>
        <input
          type="password"
          className="input mt-6"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {err && <p className="mt-3 text-sm text-red-700">{err}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary mt-6 w-full"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
        <p className="mt-4 text-xs text-gray-400">
          (Default password is <code>admin</code> if <code>ADMIN_PASSWORD</code> is unset.)
        </p>
      </form>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
