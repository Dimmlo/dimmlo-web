import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../_guard";
import { scoreWebsite, closeBrowser } from "@/lib/playwright-scorer";

export const runtime = "nodejs";
export const maxDuration = 300;

async function runScore(ids: string[]) {
  try {
    for (const id of ids) {
      const c = await prisma.contact.findUnique({ where: { id } });
      if (!c?.websiteUrl) continue;
      try {
        const s = await scoreWebsite(c.websiteUrl);
        await prisma.contact.update({
          where: { id: c.id },
          data: {
            websiteAgeScore: s.score,
            websiteLastModified: s.lastModified,
            scrapeStatus: s.score === null ? "FAILED" : "VISITED",
            scrapeLastRun: new Date(),
            scrapeNotes: s.notes.join(" | "),
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await prisma.contact.update({
          where: { id: c.id },
          data: {
            scrapeStatus: "FAILED",
            scrapeLastRun: new Date(),
            scrapeNotes: `scoring failed: ${msg}`,
          },
        });
      }
    }
  } finally {
    await closeBrowser();
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const ids = (body?.contactIds as string[] | undefined) ?? [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "contactIds required" }, { status: 400 });
  }

  void runScore(ids);
  return NextResponse.json({
    jobId: `score-${Date.now()}`,
    message: `Scoring ${ids.length} contacts`,
  });
}
