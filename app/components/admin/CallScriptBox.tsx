"use client";

import { useEffect, useState } from "react";

const CATEGORIES = [
  "Plumber",
  "Electrician",
  "Handyman",
  "Locksmith",
  "Painter",
  "Cleaning Service",
  "Cafe",
  "Personal Trainer",
  "Doctor",
  "Physiotherapist",
];

export default function CallScriptBox() {
  const [category, setCategory] = useState("Plumber");
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  async function load(force = false) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category });
      if (force) params.set("force", "1");
      const r = await fetch(`/api/admin/brain/call-script?${params.toString()}`);
      const d = await r.json();
      setScript(d.script ?? "");
      setGeneratedAt(d.generatedAt ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  function copy() {
    if (!script) return;
    navigator.clipboard.writeText(script).catch(() => {});
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Current call script
        </h3>
        <select
          className="input max-w-[180px] text-xs"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className="mt-3 text-sm text-gray-500">Generating...</p>
      ) : (
        <pre className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md bg-off-white p-3 text-xs leading-relaxed text-ink">
          {script || "No script generated yet."}
        </pre>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-gray-500">
          {generatedAt ? `Updated ${new Date(generatedAt).toLocaleString()}` : ""}
        </span>
        <div className="flex gap-2">
          <button onClick={copy} className="btn-ghost text-xs">
            Copy
          </button>
          <button onClick={() => void load(true)} className="btn-secondary text-xs py-1.5 px-3">
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
