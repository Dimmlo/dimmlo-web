"use client";

import { useState } from "react";

export default function IntelligenceBriefing() {
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setErr(null);
    try {
      const resp = await fetch("/api/admin/intelligence", { method: "POST" });
      const data = await resp.json();
      if (!resp.ok) {
        setErr(data.error ?? "Failed to generate briefing");
      } else {
        setMarkdown(data.markdown);
        setGeneratedAt(data.generatedAt);
      }
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">AI Daily Briefing</h2>
          <p className="text-sm text-gray-500">
            Last 7 days of campaign stats, calls, and inbound leads.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="btn-primary text-sm py-2 px-4"
        >
          {loading ? "Generating..." : "Generate today's briefing"}
        </button>
      </div>

      {err && <p className="mt-4 text-sm text-red-700">{err}</p>}

      {markdown && (
        <div className="mt-6 whitespace-pre-wrap rounded-lg bg-off-white p-4 text-sm leading-relaxed text-ink">
          {markdown}
        </div>
      )}

      {generatedAt && (
        <p className="mt-3 text-xs text-gray-500">
          Generated {new Date(generatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
