"use client";

import { useEffect, useState } from "react";
import CampaignCard from "@/components/admin/CampaignCard";
import type { Campaign } from "@prisma/client";

type WithCounts = Campaign & {
  _count?: { campaignContacts: number; emails: number };
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<WithCounts[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [fromName, setFromName] = useState("Eddie Robb");
  const [targetCategory, setTargetCategory] = useState("");
  const [targetBorough, setTargetBorough] = useState("");
  const [prospectPool, setProspectPool] = useState("STALE_SITE");
  const [sendDays, setSendDays] = useState("1,2,3,4,5");
  const [sendWindowStart, setSendWindowStart] = useState(8);
  const [sendWindowEnd, setSendWindowEnd] = useState(18);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/campaigns");
      const d = await r.json();
      setCampaigns(d.campaigns ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    const r = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        fromName,
        targetCategory: targetCategory || null,
        targetBorough: targetBorough || null,
        prospectPool,
        sendDays,
        sendWindowStart,
        sendWindowEnd,
      }),
    });
    if (r.ok) {
      setShowCreate(false);
      setName("");
      await load();
    } else {
      alert("Failed to create");
    }
  }

  async function activate(id: string) {
    await fetch("/api/admin/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "activate" }),
    });
    await load();
  }
  async function pause(id: string) {
    await fetch("/api/admin/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "pause" }),
    });
    await load();
  }
  async function remove(id: string) {
    await fetch(`/api/admin/campaigns?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Campaigns</h1>
          <p className="text-sm text-gray-500">Create, activate, monitor.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm py-2 px-4">
          New campaign
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No campaigns yet. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onActivate={activate}
              onPause={pause}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-ink">New campaign</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs uppercase text-gray-500">Name</label>
                <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs uppercase text-gray-500">From name</label>
                <input className="input mt-1" value={fromName} onChange={(e) => setFromName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs uppercase text-gray-500">Pool</label>
                <select className="input mt-1" value={prospectPool} onChange={(e) => setProspectPool(e.target.value)}>
                  <option value="STALE_SITE">Stale site</option>
                  <option value="NO_WEBSITE">No website</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase text-gray-500">Target category (optional)</label>
                <input className="input mt-1" value={targetCategory} onChange={(e) => setTargetCategory(e.target.value)} />
              </div>
              <div>
                <label className="text-xs uppercase text-gray-500">Target borough (optional)</label>
                <input className="input mt-1" value={targetBorough} onChange={(e) => setTargetBorough(e.target.value)} />
              </div>
              <div>
                <label className="text-xs uppercase text-gray-500">Send days (1=Mon)</label>
                <input className="input mt-1" value={sendDays} onChange={(e) => setSendDays(e.target.value)} />
              </div>
              <div>
                <label className="text-xs uppercase text-gray-500">Window start (24h)</label>
                <input
                  type="number"
                  className="input mt-1"
                  value={sendWindowStart}
                  onChange={(e) => setSendWindowStart(parseInt(e.target.value) || 8)}
                />
              </div>
              <div>
                <label className="text-xs uppercase text-gray-500">Window end (24h)</label>
                <input
                  type="number"
                  className="input mt-1"
                  value={sendWindowEnd}
                  onChange={(e) => setSendWindowEnd(parseInt(e.target.value) || 18)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={create} className="btn-primary" disabled={!name}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
