"use client";

import { useState } from "react";
import type { BrainInsight, InsightType, InsightStatus } from "@prisma/client";

const TYPE_COLORS: Record<InsightType, string> = {
  CATEGORY_PERFORMANCE: "border-l-blue-500",
  BOROUGH_PERFORMANCE: "border-l-indigo-500",
  EMAIL_VARIANT: "border-l-purple-500",
  CALL_PATTERN: "border-l-rose-500",
  SCRAPER_DIRECTION: "border-l-teal-500",
  TIMING_PATTERN: "border-l-amber-500",
  PROSPECT_QUALITY: "border-l-emerald-500",
  CONTENT_SUGGESTION: "border-l-fuchsia-500",
  DOMAIN_HEALTH: "border-l-orange-500",
  PIPELINE_GAP: "border-l-red-500",
};

function confidenceBadge(c: number) {
  if (c >= 8) return "bg-green-100 text-green-800";
  if (c >= 5) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

function timeRemaining(expiresAt: Date | null): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const hrs = Math.round(ms / (60 * 60 * 1000));
  if (hrs < 24) return `${hrs}h left`;
  return `${Math.round(hrs / 24)}d left`;
}

export default function BrainInsightCard({
  insight,
  onUpdated,
}: {
  insight: BrainInsight;
  onUpdated: (i: BrainInsight) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [outcome, setOutcome] = useState(insight.outcome ?? "");
  const [feedback, setFeedback] = useState(insight.userFeedback ?? "");
  const [showOutcome, setShowOutcome] = useState(insight.status === "ACTED");
  const [showFeedback, setShowFeedback] = useState(false);
  const [saving, setSaving] = useState(false);

  async function update(payload: Record<string, unknown>) {
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/brain/insights/${insight.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (r.ok && d.insight) onUpdated(d.insight);
    } finally {
      setSaving(false);
    }
  }

  const remaining = timeRemaining(insight.expiresAt);

  return (
    <div
      className={`rounded-xl border border-gray-200 border-l-4 ${
        TYPE_COLORS[insight.type]
      } bg-white p-5`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${confidenceBadge(insight.confidence)}`}>
            {insight.confidence}/10
          </span>
          <span className="badge-grey">{insight.type.replaceAll("_", " ")}</span>
          {remaining && (
            <span className={`badge ${remaining === "expired" ? "badge-red" : "badge-amber"}`}>
              {remaining}
            </span>
          )}
        </div>
        <span className="badge-grey">{insight.status}</span>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-ink">{insight.title}</h3>
      <p className="mt-1 text-sm text-gray-700">{insight.summary}</p>

      <button
        onClick={() => setShowDetail((v) => !v)}
        className="mt-3 text-xs text-teal hover:underline"
      >
        {showDetail ? "Hide reasoning" : "See reasoning"}
      </button>
      {showDetail && (
        <pre className="mt-2 whitespace-pre-wrap rounded-md bg-off-white p-3 text-xs leading-relaxed text-ink">
          {insight.detail}
        </pre>
      )}

      <div className="mt-4 rounded-lg bg-teal p-3 text-sm font-medium text-white">
        {insight.recommendation}
      </div>

      {insight.status !== "ACTED" &&
        insight.status !== "DISMISSED" &&
        insight.status !== "OVERRIDDEN" && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => {
                void update({ status: "ACTED", wasActedOn: true });
                setShowOutcome(true);
              }}
              disabled={saving}
              className="btn-primary text-xs py-1.5 px-3"
            >
              Act on this
            </button>
            <button
              onClick={() => update({ status: "DISMISSED" })}
              disabled={saving}
              className="btn-ghost text-xs"
            >
              Dismiss
            </button>
            <button
              onClick={() => setShowFeedback((v) => !v)}
              disabled={saving}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Override
            </button>
          </div>
        )}

      {showOutcome && (
        <div className="mt-4 rounded-lg bg-off-white p-3">
          <label className="text-xs uppercase text-gray-500">
            What happened? Tell the Brain.
          </label>
          <textarea
            className="input mt-2 min-h-[80px]"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() =>
                update({ outcome, status: "ACTED", wasActedOn: true })
              }
              disabled={saving || outcome.trim().length === 0}
              className="btn-primary text-xs py-1.5 px-3"
            >
              {saving ? "Saving..." : "Save outcome"}
            </button>
          </div>
        </div>
      )}

      {showFeedback && (
        <div className="mt-4 rounded-lg bg-off-white p-3">
          <label className="text-xs uppercase text-gray-500">
            Tell the Brain why you disagree
          </label>
          <textarea
            className="input mt-2 min-h-[80px]"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() =>
                update({
                  status: "OVERRIDDEN",
                  userFeedback: feedback,
                })
              }
              disabled={saving || feedback.trim().length === 0}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              {saving ? "Saving..." : "Submit override"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
