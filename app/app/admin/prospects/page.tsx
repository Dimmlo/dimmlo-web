"use client";

import { useState } from "react";
import ProspectTable from "@/components/admin/ProspectTable";

const NYC_BOROUGHS = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
];

export default function ProspectsPage() {
  const [showScrape, setShowScrape] = useState(false);
  const [category, setCategory] = useState("Plumber");
  const [borough, setBorough] = useState("Brooklyn");
  const [limit, setLimit] = useState(25);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function startScrape() {
    setSubmitting(true);
    try {
      const resp = await fetch("/api/admin/prospects/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, borough, limit }),
      });
      const data = await resp.json();
      if (resp.ok) {
        alert(data.message ?? "Scrape started");
        setShowScrape(false);
        setRefreshKey((k) => k + 1);
      } else {
        alert(data.error ?? "Scrape failed to start");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Prospects</h1>
          <p className="text-sm text-gray-500">
            Scrape Google Maps and score websites for staleness.
          </p>
        </div>
        <button onClick={() => setShowScrape(true)} className="btn-primary text-sm py-2 px-4">
          Run Scrape
        </button>
      </div>

      <ProspectTable refreshKey={refreshKey} />

      {showScrape && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-ink">Run Scrape</h2>
            <p className="mt-1 text-xs text-gray-500">
              Pulls from Outscraper, then scores each site with Playwright.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs uppercase text-gray-500">Category</label>
                <input
                  className="input mt-1"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs uppercase text-gray-500">Borough</label>
                <select
                  className="input mt-1"
                  value={borough}
                  onChange={(e) => setBorough(e.target.value)}
                >
                  {NYC_BOROUGHS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase text-gray-500">Limit</label>
                <input
                  type="number"
                  className="input mt-1"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 25)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowScrape(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={startScrape} disabled={submitting} className="btn-primary">
                {submitting ? "Starting..." : "Start"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
