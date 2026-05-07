import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_guard";
import { generateDailyBriefing } from "@/lib/claude";

export const runtime = "nodejs";

export async function POST() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [campaigns, calls, leads] = await Promise.all([
    prisma.campaign.findMany({
      select: {
        name: true,
        totalSent: true,
        totalOpened: true,
        totalClicked: true,
        totalReplied: true,
        totalConverted: true,
      },
    }),
    prisma.call.findMany({
      where: { createdAt: { gte: since } },
      include: { contact: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inboundLead.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const data = {
    windowDays: 7,
    campaignStats: campaigns.map((c) => ({
      campaignName: c.name,
      sent: c.totalSent,
      opened: c.totalOpened,
      clicked: c.totalClicked,
      replied: c.totalReplied,
      converted: c.totalConverted,
    })),
    callOutcomes: calls.map((c) => ({
      businessName: c.contact.businessName,
      category: c.contact.category,
      outcome: c.outcome,
      aiScore: c.aiScore,
      objections: c.aiObjections,
    })),
    inboundLeads: leads.map((l) => ({
      businessName: l.businessName,
      source: l.source,
      createdAt: l.createdAt,
    })),
  };

  try {
    const markdown = await generateDailyBriefing(data);
    return NextResponse.json({ markdown, generatedAt: new Date().toISOString() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: msg, hint: "Make sure ANTHROPIC_API_KEY is set in .env.local." },
      { status: 500 }
    );
  }
}
