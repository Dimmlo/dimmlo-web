import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../_guard";
import { generateScraperDirective } from "@/lib/claude";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const patterns = await prisma.brainPattern.findMany({
    where: {
      OR: [
        { patternKey: { startsWith: "category:" } },
        { patternKey: { startsWith: "borough:" } },
      ],
    },
  });

  try {
    const directive = await generateScraperDirective(patterns);
    return NextResponse.json(directive);
  } catch (err) {
    return NextResponse.json(
      {
        recommendedCategory: "Plumber",
        recommendedBorough: "Brooklyn",
        reasoning:
          "Brain unavailable (set ANTHROPIC_API_KEY). Default: high-converting baseline.",
        confidence: 3,
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 200 }
    );
  }
}
