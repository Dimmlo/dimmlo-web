"use client";

import { useEffect, useState } from "react";
import type { Call, Contact } from "@prisma/client";
import CallTranscript from "@/components/admin/CallTranscript";

type CallWithContact = Call & { contact: Contact };

export default function CallsPage() {
  const [calls, setCalls] = useState<CallWithContact[]>([]);
  const [outcome, setOutcome] = useState("");
  const [category, setCategory] = useState("");
  const [active, setActive] = useState<CallWithContact | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInitiate, setShowInitiate] = useState(false);
  const [contactId, setContactId] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (outcome) params.set("outcome", outcome);
    if (category) params.set("category", category);
    try {
      const r = await fetch(`/api/admin/calls?${params}`);
      const d = await r.json();
      setCalls(d.calls ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome, category]);

  async function initiate() {
    if (!contactId) return;
    const r = await fetch("/api/admin/calls/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId }),
    });
    const d = await r.json();
    if (r.ok) {
      alert("Call initiated.");
      setShowInitiate(false);
      setContactId("");
      await load();
    } else {
      alert(d.error ?? "Failed to start call");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Calls</h1>
          <p className="text-sm text-gray-500">
            Cold call log with AI scoring.
          </p>
        </div>
        <button onClick={() => setShowInitiate(true)} className="btn-primary text-sm py-2 px-4">
          Initiate call
        </button>
      </div>

      <div className="flex gap-3">
        <select className="input max-w-[180px]" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
          <option value="">All outcomes</option>
          <option value="NO_ANSWER">No answer</option>
          <option value="NOT_INTERESTED">Not interested</option>
          <option value="INTERESTED">Interested</option>
          <option value="BOOKED">Booked</option>
        </select>
        <input
          className="input max-w-[180px]"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-off-white text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2">Business</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Duration</th>
              <th className="px-4 py-2">Outcome</th>
              <th className="px-4 py-2">AI</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && calls.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No calls yet.
                </td>
              </tr>
            )}
            {calls.map((c) => (
              <tr
                key={c.id}
                onClick={() => setActive(c)}
                className="cursor-pointer border-t border-gray-100 hover:bg-off-white"
              >
                <td className="px-4 py-2 font-medium text-ink">
                  {c.contact.businessName}
                </td>
                <td className="px-4 py-2 text-gray-700">{c.contact.category}</td>
                <td className="px-4 py-2 text-gray-700">
                  {new Date(c.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-gray-700">
                  {c.duration ? `${c.duration}s` : "—"}
                </td>
                <td className="px-4 py-2">
                  <span className="badge-grey">{c.outcome ?? "—"}</span>
                </td>
                <td className="px-4 py-2 font-semibold">{c.aiScore ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {active && (
        <CallTranscript
          call={active}
          onClose={() => setActive(null)}
          onUpdated={(updated) => {
            setActive({ ...active, ...updated });
            void load();
          }}
        />
      )}

      {showInitiate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-ink">Initiate call</h2>
            <p className="mt-1 text-xs text-gray-500">
              Paste a contact id (cuid). The call will go to the contact's phone.
            </p>
            <input
              className="input mt-3"
              placeholder="contact id"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            />
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowInitiate(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={initiate} className="btn-primary">
                Start call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
