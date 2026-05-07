import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../_guard";
import { generateCallScript } from "@/lib/claude";

const CACHE_HOURS = 24;

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const category = req.nextUrl.searchParams.get("category");
  const force = req.nextUrl.searchParams.get("force") === "1";
  if (!category) {
    return NextResponse.json({ error: "category required" }, { status: 400 });
  }

  const cacheKey = `brain:call_script:${category}`;
  const cached = await prisma.setting.findUnique({ where: { key: cacheKey } });

  if (!force && cached) {
    try {
      const parsed = JSON.parse(cached.value) as {
        script: string;
        generatedAt: string;
      };
      const age = Date.now() - new Date(parsed.generatedAt).getTime();
      if (age < CACHE_HOURS * 60 * 60 * 1000) {
        return NextResponse.json(parsed);
      }
    } catch {
      // ignore stale cache
    }
  }

  // Pull top objections for this category from the last 14 days.
  const since14 = new Date();
  since14.setDate(since14.getDate() - 14);
  const calls = await prisma.call.findMany({
    where: {
      contact: { category },
      createdAt: { gte: since14 },
    },
  });
  const counts: Record<string, number> = {};
  for (const c of calls) {
    for (const obj of c.aiObjections ?? []) {
      counts[obj] = (counts[obj] ?? 0) + 1;
    }
  }
  const topObjections = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  const patterns = await prisma.brainPattern.findMany({
    where: { patternKey: { contains: category.toLowerCase() } },
  });

  let script = "";
  try {
    script = await generateCallScript(category, topObjections, patterns);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate" },
      { status: 500 }
    );
  }

  const generatedAt = new Date().toISOString();
  await prisma.setting.upsert({
    where: { key: cacheKey },
    create: { key: cacheKey, value: JSON.stringify({ script, generatedAt }) },
    update: { value: JSON.stringify({ script, generatedAt }) },
  });

  return NextResponse.json({ script, generatedAt });
}
