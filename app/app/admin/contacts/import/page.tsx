"use client";

import { useState } from "react";
import Link from "next/link";

export default function ImportPage() {
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    total: number;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setCsv(text);
  }

  async function submit() {
    setSubmitting(true);
    setErr(null);
    setResult(null);
    try {
      const r = await fetch("/api/admin/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const d = await r.json();
      if (r.ok) setResult(d);
      else setErr(d.error ?? "Import failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Import contacts</h1>
          <p className="text-sm text-gray-500">
            CSV with header row. Required columns: <code>businessName</code>,{" "}
            <code>category</code>. Optional: email, phone, firstName, lastName,
            borough, websiteUrl.
          </p>
        </div>
        <Link href="/admin/contacts" className="btn-ghost">
          Back
        </Link>
      </div>

      <div className="space-y-3">
        <input
          type="file"
          accept=".csv"
          onChange={onFile}
          className="block w-full text-sm"
        />
        <textarea
          className="input min-h-[200px] font-mono text-xs"
          placeholder="Or paste CSV here..."
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <button onClick={submit} disabled={submitting || !csv} className="btn-primary">
          {submitting ? "Importing..." : "Import"}
        </button>
      </div>

      {err && <p className="text-sm text-red-700">{err}</p>}
      {result && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-900">
          Imported {result.created} of {result.total} rows. Skipped{" "}
          {result.skipped}.
        </div>
      )}
    </div>
  );
}
