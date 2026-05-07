"use client";

import { useEffect, useState } from "react";
import type { SendingDomain } from "@prisma/client";
import DomainHealth from "@/components/admin/DomainHealth";

export default function DomainsPage() {
  const [domains, setDomains] = useState<SendingDomain[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [domain, setDomain] = useState("");
  const [fromEmail, setFromEmail] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/domains");
      const d = await r.json();
      setDomains(d.domains ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function add() {
    const r = await fetch("/api/admin/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, fromEmail }),
    });
    if (r.ok) {
      setShowAdd(false);
      setDomain("");
      setFromEmail("");
      await load();
    } else {
      alert("Failed to add domain");
    }
  }

  async function togglePause(d: SendingDomain) {
    await fetch("/api/admin/domains", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: d.id, isPaused: !d.isPaused }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Domains</h1>
          <p className="text-sm text-gray-500">Sending health and warmup state.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm py-2 px-4">
          Add domain
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-off-white text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2">Domain</th>
              <th className="px-4 py-2">From</th>
              <th className="px-4 py-2">Day</th>
              <th className="px-4 py-2">Limit</th>
              <th className="px-4 py-2">Today</th>
              <th className="px-4 py-2">Lifetime</th>
              <th className="px-4 py-2">Health</th>
              <th className="px-4 py-2">State</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {domains.map((d) => {
              const bounceRate = d.totalSent > 0 ? d.bounceCount / d.totalSent : 0;
              return (
                <tr key={d.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium text-ink">{d.domain}</td>
                  <td className="px-4 py-2 text-gray-700">{d.fromEmail}</td>
                  <td className="px-4 py-2 text-gray-700">{d.warmupDay}</td>
                  <td className="px-4 py-2 text-gray-700">{d.dailyLimit}</td>
                  <td className="px-4 py-2 text-gray-700">{d.sendsToday}</td>
                  <td className="px-4 py-2 text-gray-700">
                    {d.totalSent} ({(bounceRate * 100).toFixed(2)}% bounce)
                  </td>
                  <td className="px-4 py-2">
                    <DomainHealth status={d.healthStatus} />
                  </td>
                  <td className="px-4 py-2">
                    <span className={d.isPaused ? "badge-amber" : "badge-green"}>
                      {d.isPaused ? "paused" : "active"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => togglePause(d)} className="text-xs text-teal hover:underline">
                      {d.isPaused ? "Resume" : "Pause"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-ink">Add domain</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs uppercase text-gray-500">Domain</label>
                <input
                  className="input mt-1"
                  placeholder="6dimmlo.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs uppercase text-gray-500">From email</label>
                <input
                  className="input mt-1"
                  placeholder="eddie@6dimmlo.com"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={add} className="btn-primary" disabled={!domain || !fromEmail}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
