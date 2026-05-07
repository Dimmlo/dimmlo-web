"use client";

import { useEffect, useMemo, useState } from "react";
import type { Contact } from "@prisma/client";

export default function ProspectTable({ refreshKey }: { refreshKey: number }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [category, setCategory] = useState("");
  const [borough, setBorough] = useState("");
  const [minScore, setMinScore] = useState("0");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (borough) params.set("borough", borough);
    if (minScore && minScore !== "0") params.set("minScore", minScore);
    if (status) params.set("status", status);
    try {
      const resp = await fetch(`/api/admin/prospects?${params}`);
      const data = await resp.json();
      setContacts(data.contacts ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, category, borough, minScore, status]);

  const categories = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.category).filter(Boolean))),
    [contacts]
  );
  const boroughs = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.borough ?? "").filter(Boolean))),
    [contacts]
  );

  async function scorePending() {
    const ids = contacts
      .filter((c) => c.scrapeStatus === "PENDING")
      .map((c) => c.id);
    if (ids.length === 0) return;
    await fetch("/api/admin/prospects/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactIds: ids }),
    });
    alert(`Scoring ${ids.length} contacts in the background.`);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
        <select
          className="input max-w-[180px]"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="input max-w-[180px]"
          value={borough}
          onChange={(e) => setBorough(e.target.value)}
        >
          <option value="">All boroughs</option>
          {boroughs.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Min score</label>
          <input
            type="range"
            min={0}
            max={10}
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
          />
          <span className="text-xs text-gray-700">{minScore}</span>
        </div>
        <div className="ml-auto flex gap-2">
          {(["ALL", "PENDING", "VISITED", "FAILED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                status === s
                  ? "bg-ink text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
          <button onClick={scorePending} className="btn-secondary text-xs py-1.5 px-3">
            Score pending
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-off-white text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2">Business</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Borough</th>
              <th className="px-4 py-2">Website</th>
              <th className="px-4 py-2">Score</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && contacts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  No prospects yet. Run a scrape to get started.
                </td>
              </tr>
            )}
            {contacts.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium text-ink">
                  {c.businessName}
                </td>
                <td className="px-4 py-2 text-gray-700">{c.category}</td>
                <td className="px-4 py-2 text-gray-700">{c.borough ?? "—"}</td>
                <td className="px-4 py-2">
                  {c.websiteUrl ? (
                    <a
                      className="text-teal hover:underline"
                      href={c.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      visit
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2 font-semibold text-ink">
                  {c.websiteAgeScore ?? "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      c.scrapeStatus === "VISITED"
                        ? "badge-green"
                        : c.scrapeStatus === "FAILED"
                        ? "badge-red"
                        : "badge-grey"
                    }
                  >
                    {c.scrapeStatus}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-700">{c.phone ?? "—"}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={async () => {
                      await fetch("/api/admin/calls/initiate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ contactId: c.id }),
                      });
                      alert("Call initiated (or attempted).");
                    }}
                    className="text-xs text-teal hover:underline"
                  >
                    Call
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
