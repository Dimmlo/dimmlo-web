import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_guard";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { campaignContacts: true, emails: true } },
    },
  });
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const created = await prisma.campaign.create({
    data: {
      name: body.name,
      fromName: body.fromName ?? "Eddie Robb",
      replyTo: body.replyTo ?? null,
      prospectPool: body.prospectPool ?? "STALE_SITE",
      targetCategory: body.targetCategory ?? null,
      targetBorough: body.targetBorough ?? null,
      sendDays: body.sendDays ?? "1,2,3,4,5",
      sendWindowStart: body.sendWindowStart ?? 8,
      sendWindowEnd: body.sendWindowEnd ?? 18,
    },
  });
  return NextResponse.json({ campaign: created });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { id, action, ...rest } = body;

  // Activate: move all pending CampaignContacts to cold bucket and queue first send.
  if (action === "activate") {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { emails: true },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    const firstColdEmail = campaign.emails.find(
      (e) => e.bucket === "cold" && e.stepOrder === 0
    );
    const now = new Date();
    await prisma.$transaction([
      prisma.campaign.update({ where: { id }, data: { status: "ACTIVE" } }),
      prisma.campaignContact.updateMany({
        where: { campaignId: id, currentBucket: "pending" },
        data: {
          currentBucket: "cold",
          currentStepInBucket: 0,
          nextEmailDueAt: firstColdEmail
            ? new Date(now.getTime() + firstColdEmail.delayDays * 24 * 60 * 60 * 1000)
            : now,
        },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "pause") {
    await prisma.campaign.update({ where: { id }, data: { status: "PAUSED" } });
    return NextResponse.json({ ok: true });
  }

  const updated = await prisma.campaign.update({ where: { id }, data: rest });
  return NextResponse.json({ campaign: updated });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.$transaction([
    prisma.campaignEmail.deleteMany({ where: { campaignId: id } }),
    prisma.campaignContact.deleteMany({ where: { campaignId: id } }),
    prisma.campaign.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
