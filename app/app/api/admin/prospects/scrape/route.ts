import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../_guard";
import { scrapeCategory } from "@/lib/outscraper";
import { scoreWebsite, closeBrowser } from "@/lib/playwright-scorer";

export const runtime = "nodejs";
export const maxDuration = 300;

// Background worker — runs the scrape and scoring without blocking the
// API response. Errors are logged to the contact's scrapeNotes.
async function runScrape(category: string, borough: string, limit: number) {
  try {
    const results = await scrapeCategory(category, borough, limit);
    console.log(`[scrape] Found ${results.length} prospects for ${category} in ${borough}`);

    const upserted: string[] = [];
    for (const r of results) {
      try {
        const c = await prisma.contact.upsert({
          where: { phone: r.phone },
          create: {
            businessName: r.businessName,
            category,
            borough,
            phone: r.phone,
            websiteUrl: r.websiteUrl,
            googleMapsUrl: r.googleMapsUrl,
          },
          update: {
            businessName: r.businessName,
            category,
            borough,
            websiteUrl: r.websiteUrl,
            googleMapsUrl: r.googleMapsUrl,
          },
        });
        upserted.push(c.id);
      } catch (e) {
        console.error("[scrape] upsert failed:", e);
      }
    }

    let scored = 0;
    let highScore = 0;
    let failed = 0;
    for (const id of upserted) {
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
        scored++;
        if (s.score !== null && s.score >= 7) highScore++;
        if (s.score === null) failed++;
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
        failed++;
      }
    }

    console.log(
      `[scrape] Scored ${scored} sites. ${highScore} prospects with score 7+. ${failed} failed.`
    );
  } catch (err) {
    console.error("[scrape] fatal:", err);
  } finally {
    await closeBrowser();
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const category = body?.category as string | undefined;
  const borough = body?.borough as string | undefined;
  const limit = (body?.limit as number | undefined) ?? 25;

  if (!category || !borough) {
    return NextResponse.json(
      { error: "category and borough are required" },
      { status: 400 }
    );
  }

  // Fire-and-forget — runs in the background.
  void runScrape(category, borough, limit);
  return NextResponse.json({
    jobId: `scrape-${Date.now()}`,
    message: "Scrape started",
  });
}
