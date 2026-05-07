import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_guard";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q");

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { businessName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  if (!body?.businessName || !body?.category) {
    return NextResponse.json(
      { error: "businessName and category required" },
      { status: 400 }
    );
  }
  const created = await prisma.contact.create({
    data: {
      businessName: body.businessName,
      category: body.category,
      borough: body.borough ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      firstName: body.firstName ?? null,
      lastName: body.lastName ?? null,
      websiteUrl: body.websiteUrl ?? null,
    },
  });
  return NextResponse.json({ contact: created });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { id, ...rest } = body;
  const updated = await prisma.contact.update({ where: { id }, data: rest });
  return NextResponse.json({ contact: updated });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
