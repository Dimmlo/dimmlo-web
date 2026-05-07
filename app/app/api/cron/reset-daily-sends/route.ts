import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDailyLimit } from "@/lib/warmup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: NextRequest) {
  const secret =
    req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;
  if (!expected || expected === "placeholder") {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  if (secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const domains = await prisma.sendingDomain.findMany();
  const updates: { id: string; pausedNow: boolean }[] = [];

  for (const d of domains) {
    // Snapshot yesterday's stats before we reset the counter.
    const snapshotDate = new Date(today);
    snapshotDate.setUTCDate(snapshotDate.getUTCDate() - 1);

    await prisma.domainDailyStats.upsert({
      where: {
        sendingDomainId_date: { sendingDomainId: d.id, date: snapshotDate },
      },
      create: {
        sendingDomainId: d.id,
        date: snapshotDate,
        sends: d.sendsToday,
        bounces: 0,
        spam: 0,
        dailyLimit: d.dailyLimit,
      },
      update: {
        sends: d.sendsToday,
        dailyLimit: d.dailyLimit,
      },
    });

    // Auto-pause based on lifetime bounce/spam thresholds.
    let pause = d.isPaused;
    let healthStatus = d.healthStatus;
    if (d.totalSent > 0) {
      const bounceRate = d.bounceCount / d.totalSent;
      const spamRate = d.spamCount / d.totalSent;
      if (bounceRate > 0.05 || spamRate > 0.003) {
        pause = true;
        healthStatus = "red";
      } else if (bounceRate > 0.02 || spamRate > 0.001) {
        healthStatus = "amber";
      } else {
        healthStatus = "green";
      }
    }

    const newWarmupDay = d.warmupDay + 1;
    const newDailyLimit = getDailyLimit(newWarmupDay);

    await prisma.sendingDomain.update({
      where: { id: d.id },
      data: {
        sendsToday: 0,
        warmupDay: newWarmupDay,
        dailyLimit: newDailyLimit,
        isPaused: pause,
        healthStatus,
      },
    });

    updates.push({ id: d.id, pausedNow: pause && !d.isPaused });
  }

  return NextResponse.json({
    reset: domains.length,
    autoPaused: updates.filter((u) => u.pausedNow).length,
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
