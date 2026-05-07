"use client";

import type { BrainPattern } from "@prisma/client";

function trendArrow(t: string) {
  if (t === "up") return "↑";
  if (t === "down") return "↓";
  return "→";
}

function Bar({ value, max }: { value: number; max: number }) {
  const w = max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-gray-100">
      <div
        className="h-2 rounded-full bg-teal"
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

export default function PatternMap({ patterns }: { patterns: BrainPattern[] }) {
  const byCategory = patterns
    .filter((p) => /^category:[^:]+:reply_rate$/.test(p.patternKey))
    .map((p) => ({
      label: p.patternKey.split(":")[1],
      value: p.value,
      confidence: p.confidence,
      trend: p.trend,
      sampleSize: p.sampleSize,
    }))
    .sort((a, b) => b.value - a.value);

  const byBorough = patterns
    .filter((p) => /^borough:[^:]+:open_rate$/.test(p.patternKey))
    .map((p) => ({
      label: p.patternKey.split(":")[1],
      value: p.value,
      confidence: p.confidence,
      trend: p.trend,
      sampleSize: p.sampleSize,
    }))
    .sort((a, b) => b.value - a.value);

  const objections = patterns
    .filter((p) => /^call_objection:[^:]+:frequency_14d$/.test(p.patternKey))
    .map((p) => ({
      label: p.patternKey.split(":")[1].replaceAll("_", " "),
      value: p.value,
      trend: p.trend,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Best subject and best send-time.
  const subjects = patterns
    .filter((p) => p.patternKey.startsWith("subject:"))
    .sort((a, b) => b.value - a.value);
  const sendTimes = patterns
    .filter((p) => p.patternKey.startsWith("send_time:"))
    .sort((a, b) => b.value - a.value);
  const bestSubject = subjects[0];
  const bestTime = sendTimes[0];

  const maxCat = byCategory[0]?.value ?? 0;
  const maxBor = byBorough[0]?.value ?? 0;

  return (
    <div className="space-y-4">
      <Section title="Category performance (reply rate)">
        {byCategory.length === 0 && (
          <p className="text-sm text-gray-500">Not enough data yet.</p>
        )}
        {byCategory.map((c) => (
          <div key={c.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-ink">{c.label}</span>
              <span className="text-gray-500">
                {(c.value * 100).toFixed(1)}%{" "}
                <span className="ml-1">{trendArrow(c.trend)}</span>{" "}
                <span className="ml-1 text-[10px]">n={c.sampleSize}</span>
              </span>
            </div>
            <div className="mt-1" style={{ opacity: c.confidence / 10 }}>
              <Bar value={c.value} max={maxCat} />
            </div>
          </div>
        ))}
      </Section>

      <Section title="Borough performance (open rate)">
        {byBorough.length === 0 && (
          <p className="text-sm text-gray-500">Not enough data yet.</p>
        )}
        {byBorough.map((b) => (
          <div key={b.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-ink">{b.label}</span>
              <span className="text-gray-500">
                {(b.value * 100).toFixed(1)}%{" "}
                <span className="ml-1">{trendArrow(b.trend)}</span>{" "}
                <span className="ml-1 text-[10px]">n={b.sampleSize}</span>
              </span>
            </div>
            <div className="mt-1" style={{ opacity: b.confidence / 10 }}>
              <Bar value={b.value} max={maxBor} />
            </div>
          </div>
        ))}
      </Section>

      <Section title="Email performance">
        <div className="text-xs">
          <div className="text-gray-500">Best subject (open rate)</div>
          <div className="font-medium text-ink">
            {bestSubject
              ? `${bestSubject.patternKey.replace(/^subject:/, "").replace(/:open_rate$/, "")} → ${(bestSubject.value * 100).toFixed(1)}%`
              : "—"}
          </div>
        </div>
        <div className="mt-3 text-xs">
          <div className="text-gray-500">Best send time (open rate)</div>
          <div className="font-medium text-ink">
            {bestTime
              ? `${bestTime.patternKey.replace(/^send_time:/, "").replace(/:open_rate$/, "")} → ${(bestTime.value * 100).toFixed(1)}%`
              : "—"}
          </div>
        </div>
      </Section>

      <Section title="Top call objections (last 14d)">
        {objections.length === 0 && (
          <p className="text-sm text-gray-500">No objections logged yet.</p>
        )}
        {objections.map((o) => (
          <div key={o.label} className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink">{o.label}</span>
            <span className="text-gray-700">
              {Math.round(o.value)} {trendArrow(o.trend)}
            </span>
          </div>
        ))}
      </Section>
    </div>
  );
}
