"use client";

import type { Campaign } from "@prisma/client";

type Props = {
  campaign: Campaign & { _count?: { campaignContacts: number; emails: number } };
  onActivate: (id: string) => void;
  onPause: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function CampaignCard({ campaign, onActivate, onPause, onDelete }: Props) {
  const c = campaign;
  const statusBadge =
    c.status === "ACTIVE"
      ? "badge-green"
      : c.status === "PAUSED"
      ? "badge-amber"
      : c.status === "COMPLETED"
      ? "badge-grey"
      : "badge-grey";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">{c.name}</h3>
          <p className="mt-1 text-xs text-gray-500">
            {c.targetCategory ?? "All categories"} ·{" "}
            {c.targetBorough ?? "All boroughs"} · pool {c.prospectPool}
          </p>
        </div>
        <span className={statusBadge}>{c.status}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
        <Stat label="Sent" value={c.totalSent} />
        <Stat label="Opened" value={c.totalOpened} />
        <Stat label="Clicked" value={c.totalClicked} />
        <Stat label="Replied" value={c.totalReplied} />
        <Stat label="Converted" value={c.totalConverted} />
        <Stat label="Bounced" value={c.totalBounced} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {c.status !== "ACTIVE" ? (
          <button
            onClick={() => onActivate(c.id)}
            className="btn-primary text-xs py-1.5 px-3"
          >
            Activate
          </button>
        ) : (
          <button
            onClick={() => onPause(c.id)}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Pause
          </button>
        )}
        <button
          onClick={() => {
            if (confirm("Delete this campaign? This is permanent.")) onDelete(c.id);
          }}
          className="btn-ghost text-xs"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-base font-semibold text-ink">{value}</div>
    </div>
  );
}
