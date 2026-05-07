import { NextResponse } from "next/server";
import { requireAdmin } from "../../_guard";
import { runBrainCycle } from "@/lib/brain";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const result = await runBrainCycle("manual");
  return NextResponse.json(result);
}
