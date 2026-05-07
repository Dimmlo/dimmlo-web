import StatsBar from "@/components/admin/StatsBar";
import IntelligenceBriefing from "@/components/admin/IntelligenceBriefing";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function loadStats() {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  try {
    const [scored, sent, replied, calls] = await Promise.all([
      prisma.contact.count({
        where: { scrapeLastRun: { gte: since } },
      }),
      prisma.emailSend.count({ where: { createdAt: { gte: since } } }),
      prisma.campaignContact.count({
        where: { repliedAt: { gte: since } },
      }),
      prisma.call.count({ where: { createdAt: { gte: since } } }),
    ]);

    const replyRate = sent > 0 ? `${((replied / sent) * 100).toFixed(1)}%` : "0%";
    return { scored, sent, replyRate, calls, dbOk: true as const };
  } catch {
    return { scored: 0, sent: 0, replyRate: "0%", calls: 0, dbOk: false as const };
  }
}

async function loadActivity() {
  try {
    const [events, calls] = await Promise.all([
      prisma.emailEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.call.findMany({
        orderBy: { createdAt: "desc" },
        include: { contact: true },
        take: 10,
      }),
    ]);

    type Item = { type: string; label: string; sub: string; createdAt: Date };
    const items: Item[] = [];
    for (const e of events) {
      items.push({
        type: e.eventType,
        label: e.eventType,
        sub: e.bucket ? `${e.bucket} step ${e.stepOrder ?? 0}` : "",
        createdAt: e.createdAt,
      });
    }
    for (const c of calls) {
      items.push({
        type: "call",
        label: `Call · ${c.contact.businessName}`,
        sub: c.outcome ?? "in progress",
        createdAt: c.createdAt,
      });
    }
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items.slice(0, 20);
  } catch {
    return [];
  }
}

export default async function AdminHome() {
  const stats = await loadStats();
  const activity = await loadActivity();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-gray-500">Last 7 days</p>
      </div>

      {!stats.dbOk && (
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-900">
          Database isn't reachable. Set <code>DATABASE_URL</code> in
          <code> .env.local</code> and run <code>npx prisma db push</code>.
        </div>
      )}

      <StatsBar
        stats={[
          { label: "Prospects scored", value: stats.scored },
          { label: "Emails sent", value: stats.sent },
          { label: "Reply rate", value: stats.replyRate },
          { label: "Calls made", value: stats.calls },
        ]}
      />

      <IntelligenceBriefing />

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">Recent activity</h2>
        <div className="mt-4 divide-y divide-gray-100">
          {activity.length === 0 && (
            <p className="py-4 text-sm text-gray-500">No activity yet.</p>
          )}
          {activity.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="font-medium text-ink">{a.label}</div>
                <div className="text-xs text-gray-500">{a.sub}</div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(a.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
