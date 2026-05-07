"use client";

import { useEffect, useMemo, useState } from "react";
import type { BrainCycle, BrainInsight, BrainPattern } from "@prisma/client";
import BrainInsightCard from "@/components/admin/BrainInsightCard";
import PatternMap from "@/components/admin/PatternMap";
import ScraperDirective from "@/components/admin/ScraperDirective";
import CallScriptBox from "@/components/admin/CallScriptBox";

type FilterTab = "all" | "new" | "acting" | "dismissed" | "expired";

export default function BrainPage() {
  const [insights, setInsights] = useState<BrainInsight[]>([]);
  const [patterns, setPatterns] = useState<BrainPattern[]>([]);
  const [cycles, setCycles] = useState<BrainCycle[]>([]);
  const [lastCycle, setLastCycle] = useState<BrainCycle | null>(null);
  const [tab, setTab] = useState<FilterTab>("all");
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/brain");
      const d = await r.json();
      setInsights(d.insights ?? []);
      setPatterns(d.patterns ?? []);
      setCycles(d.cycles ?? []);
      setLastCycle(d.lastCycle ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function runNow() {
    setRunning(true);
    try {
      const r = await fetch("/api/admin/brain/run", { method: "POST" });
      const d = await r.json();
      if (r.ok) {
        alert(
          `Brain cycle complete in ${d.durationMs}ms.\n${d.summary ?? ""}`
        );
      } else {
        alert(d.error ?? "Cycle failed");
      }
      await load();
    } finally {
      setRunning(false);
    }
  }

  const filtered = useMemo(() => {
    const now = Date.now();
    return insights.filter((i) => {
      const isExpired = i.expiresAt && new Date(i.expiresAt).getTime() < now;
      switch (tab) {
        case "new":
          return i.status === "NEW" && !isExpired;
        case "acting":
          return i.status === "ACTED" && !isExpired;
        case "dismissed":
          return i.status === "DISMISSED" || i.status === "OVERRIDDEN";
        case "expired":
          return isExpired;
        case "all":
        default:
          return true;
      }
    });
  }, [insights, tab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-ink p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">The Brain</h1>
            <p className="mt-1 text-sm text-white/70">
              Always-learning intelligence layer.{" "}
              {lastCycle
                ? `Last cycle: ${new Date(lastCycle.createdAt).toLocaleString()} (${lastCycle.summary ?? "ok"})`
                : "No cycles yet."}
            </p>
          </div>
          <button
            onClick={runNow}
            disabled={running}
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark disabled:opacity-60"
          >
            {running ? "Running..." : "Run now"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* LEFT — Insights feed */}
        <div className="space-y-4 lg:col-span-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["new", "New"],
                ["acting", "Acting on"],
                ["dismissed", "Dismissed"],
                ["expired", "Expired"],
              ] as [FilterTab, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  tab === k
                    ? "bg-ink text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading && <p className="text-sm text-gray-500">Loading...</p>}
          {!loading && filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No insights yet. Run the Brain to generate some.
            </div>
          )}

          {filtered.map((i) => (
            <BrainInsightCard
              key={i.id}
              insight={i}
              onUpdated={(u) =>
                setInsights((prev) => prev.map((x) => (x.id === u.id ? u : x)))
              }
            />
          ))}

          {/* Activity log */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Brain activity log
            </h3>
            <table className="mt-3 w-full text-left text-xs">
              <thead className="text-gray-500">
                <tr>
                  <th className="py-1">When</th>
                  <th className="py-1">Trigger</th>
                  <th className="py-1">Insights</th>
                  <th className="py-1">Patterns</th>
                  <th className="py-1">Duration</th>
                </tr>
              </thead>
              <tbody>
                {cycles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-3 text-gray-500">
                      No cycles yet.
                    </td>
                  </tr>
                )}
                {cycles.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="py-1.5 text-gray-600">
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                    <td className="py-1.5 text-gray-700">{c.triggeredBy}</td>
                    <td className="py-1.5 text-gray-700">{c.insightsGenerated}</td>
                    <td className="py-1.5 text-gray-700">{c.patternsUpdated}</td>
                    <td className="py-1.5 text-gray-700">
                      {c.durationMs ? `${c.durationMs}ms` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT — Pattern map and tools */}
        <div className="space-y-4 lg:col-span-2">
          <ScraperDirective />
          <PatternMap patterns={patterns} />
          <CallScriptBox />
        </div>
      </div>
    </div>
  );
}
