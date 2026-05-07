import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_guard";
import { getDailyLimit } from "@/lib/warmup";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const domains = await prisma.sendingDomain.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ domains });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  if (!body?.domain || !body?.fromEmail) {
    return NextResponse.json(
      { error: "domain and fromEmail required" },
      { status: 400 }
    );
  }
  const created = await prisma.sendingDomain.create({
    data: {
      domain: body.domain,
      fromEmail: body.fromEmail,
      warmupDay: body.warmupDay ?? 1,
      dailyLimit: body.dailyLimit ?? getDailyLimit(body.warmupDay ?? 1),
    },
  });
  return NextResponse.json({ domain: created });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { id, ...rest } = body;
  const updated = await prisma.sendingDomain.update({ where: { id }, data: rest });
  return NextResponse.json({ domain: updated });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.sendingDomain.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
