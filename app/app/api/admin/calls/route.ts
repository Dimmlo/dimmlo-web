import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_guard";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { searchParams } = req.nextUrl;
  const outcome = searchParams.get("outcome");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (outcome) where.outcome = outcome;
  if (category) where.contact = { category };

  const calls = await prisma.call.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { contact: true },
    take: 200,
  });
  return NextResponse.json({ calls });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { id, ...rest } = body;
  const updated = await prisma.call.update({ where: { id }, data: rest });
  return NextResponse.json({ call: updated });
}
