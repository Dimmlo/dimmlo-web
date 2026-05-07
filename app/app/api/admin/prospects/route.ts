import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_guard";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category");
  const borough = searchParams.get("borough");
  const minScore = searchParams.get("minScore");
  const status = searchParams.get("status"); // PENDING|VISITED|FAILED|ALL

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (borough) where.borough = borough;
  if (minScore) where.websiteAgeScore = { gte: parseInt(minScore, 10) };
  if (status && status !== "ALL") where.scrapeStatus = status;

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: [{ websiteAgeScore: "desc" }, { createdAt: "desc" }],
    take: 500,
  });

  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  if (!body || !body.businessName || !body.category) {
    return NextResponse.json(
      { error: "businessName and category are required" },
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
      googleMapsUrl: body.googleMapsUrl ?? null,
      instagramUrl: body.instagramUrl ?? null,
      prospectPool: body.prospectPool ?? "STALE_SITE",
    },
  });

  return NextResponse.json({ contact: created });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
