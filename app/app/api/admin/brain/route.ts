import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_guard";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const [insights, lastCycle, patterns, cycles] = await Promise.all([
    prisma.brainInsight.findMany({
      where: { status: { in: ["NEW", "SEEN", "ACTED"] } },
      orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
    prisma.brainCycle.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.brainPattern.findMany({
      orderBy: [{ confidence: "desc" }, { updatedAt: "desc" }],
      take: 200,
    }),
    prisma.brainCycle.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({ insights, lastCycle, patterns, cycles });
}
