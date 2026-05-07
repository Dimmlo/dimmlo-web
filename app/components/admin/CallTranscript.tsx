"use client";

import { useState } from "react";
import type { Call, Contact } from "@prisma/client";

type CallWithContact = Call & { contact: Contact };

export default function CallTranscript({
  call,
  onClose,
  onUpdated,
}: {
  call: CallWithContact;
  onClose: () => void;
  onUpdated: (c: Call) => void;
}) {
  const [followUp, setFollowUp] = useState(call.aiFollowUpDraft ?? "");
  const [outcome, setOutcome] = useState<string>(call.outcome ?? "");
  const [notes, setNotes] = useState(call.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const resp = await fetch("/api/admin/calls", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: call.id,
          aiFollowUpDraft: followUp,
          outcome: outcome || null,
          notes,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.call) onUpdated(data.call);
    } finally {
      setSaving(false);
    }
  }

  const scoreColor =
    call.aiScore === null || call.aiScore === undefined
      ? "text-gray-500"
      : call.aiScore >= 7
      ? "text-green-700"
      : call.aiScore >= 4
      ? "text-amber-700"
      : "text-red-700";

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl sm:max-w-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">
              {call.contact.businessName}
            </h2>
            <p className="text-sm text-gray-500">
              {call.contact.category} · {call.contact.borough ?? "—"}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost">
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-500">Duration</div>
            <div>{call.duration ? `${call.duration}s` : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">AI score</div>
            <div className={`font-semibold ${scoreColor}`}>
              {call.aiScore ?? "—"}/10
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-ink">Transcript</h3>
          <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md bg-off-white p-3 text-xs leading-relaxed text-ink">
            {call.transcript ?? "No transcript yet."}
          </pre>
        </div>

        {call.aiObjections && call.aiObjections.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-ink">AI objections</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {call.aiObjections.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}

        {call.aiNextAction && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-ink">Recommended next action</h3>
            <p className="mt-2 text-sm text-gray-700">{call.aiNextAction}</p>
          </div>
        )}

        <div className="mt-6">
          <label className="text-sm font-semibold text-ink">Follow-up draft</label>
          <textarea
            className="input mt-2 min-h-[120px]"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
          />
        </div>

        <div className="mt-6">
          <label className="text-sm font-semibold text-ink">Outcome</label>
          <select
            className="input mt-2"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          >
            <option value="">—</option>
            <option value="NO_ANSWER">No answer</option>
            <option value="NOT_INTERESTED">Not interested</option>
            <option value="INTERESTED">Interested</option>
            <option value="BOOKED">Booked</option>
          </select>
        </div>

        <div className="mt-6">
          <label className="text-sm font-semibold text-ink">Notes</label>
          <textarea
            className="input mt-2 min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
