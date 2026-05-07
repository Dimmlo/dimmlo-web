// Standalone scraper. Runs locally with ts-node, not under Next.js.
// Usage: npx ts-node scripts/scrape.ts --category="plumber" --borough="Brooklyn"
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { scrapeCategory } from "../lib/outscraper";
import { scoreWebsite, closeBrowser } from "../lib/playwright-scorer";

const prisma = new PrismaClient();

function parseArgs(): { category: string; borough: string; limit: number } {
  const args = process.argv.slice(2);
  const map = new Map<string, string>();
  for (const a of args) {
    const m = a.match(/^--([^=]+)=(.+)$/);
    if (m) map.set(m[1], m[2]);
  }
  const category = map.get("category");
  const borough = map.get("borough");
  if (!category || !borough) {
    console.error(
      'Usage: npx ts-node scripts/scrape.ts --category="plumber" --borough="Brooklyn" [--limit=25]'
    );
    process.exit(1);
  }
  const limit = parseInt(map.get("limit") ?? "25", 10);
  return { category, borough, limit };
}

async function main() {
  const { category, borough, limit } = parseArgs();
  console.log(`[scrape] Sourcing ${category} in ${borough} (limit ${limit})...`);

  let prospects;
  try {
    prospects = await scrapeCategory(category, borough, limit);
  } catch (err) {
    console.error("[scrape] Outscraper failed:", err);
    process.exit(1);
  }
  console.log(`[scrape] Found ${prospects.length} prospects for ${category} in ${borough}`);

  const upsertedIds: string[] = [];
  for (const r of prospects) {
    if (!r.phone) continue;
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
          websiteUrl: r.websiteUrl,
          googleMapsUrl: r.googleMapsUrl,
        },
      });
      upsertedIds.push(c.id);
    } catch (e) {
      console.error("[scrape] upsert failed:", e);
    }
  }

  console.log(`[scrape] Upserted ${upsertedIds.length} contacts. Scoring...`);

  let scored = 0;
  let highScore = 0;
  let failed = 0;
  for (const id of upsertedIds) {
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
      console.log(`  ${c.businessName} → ${s.score ?? "FAILED"}`);
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

  await closeBrowser();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
