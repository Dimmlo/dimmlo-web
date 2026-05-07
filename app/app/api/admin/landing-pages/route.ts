import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_guard";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const pages = await prisma.landingPage.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ landingPages: pages });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  if (!body?.category || !body?.slug || !body?.heroHeadline || !body?.subheadline) {
    return NextResponse.json(
      { error: "category, slug, heroHeadline, subheadline are required" },
      { status: 400 }
    );
  }

  const created = await prisma.landingPage.create({
    data: {
      category: body.category,
      slug: body.slug,
      heroHeadline: body.heroHeadline,
      subheadline: body.subheadline,
      painPoints: body.painPoints ?? [],
      ctaText: body.ctaText ?? "Text us to get started",
      ctaPhone: body.ctaPhone ?? "+1-000-000-0000",
      isPublished: body.isPublished ?? false,
    },
  });
  return NextResponse.json({ landingPage: created });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { id, ...rest } = body;
  const updated = await prisma.landingPage.update({ where: { id }, data: rest });
  return NextResponse.json({ landingPage: updated });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.landingPage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
