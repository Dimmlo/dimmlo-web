"use client";

import { useEffect, useState } from "react";

export default function ScraperDirective() {
  const [data, setData] = useState<{
    recommendedCategory: string;
    recommendedBorough: string;
    reasoning: string;
    confidence: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/brain/scraper-directive");
      const d = await r.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function pointHere() {
    if (!data) return;
    const params = new URLSearchParams({
      category: data.recommendedCategory,
      borough: data.recommendedBorough,
    });
    window.location.href = `/admin/prospects?${params.toString()}`;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Where to look next
      </h3>
      {loading && <p className="mt-3 text-sm text-gray-500">Thinking...</p>}
      {!loading && data && (
        <div className="mt-3">
          <div className="text-xl font-semibold text-ink">
            {data.recommendedCategory} · {data.recommendedBorough}
          </div>
          <p className="mt-2 text-sm text-gray-600">{data.reasoning}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Confidence {data.confidence}/10
            </span>
            <button onClick={pointHere} className="btn-primary text-xs py-1.5 px-3">
              Point scraper here
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
