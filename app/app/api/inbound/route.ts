import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    businessName?: string;
    message?: string;
    source?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, phone, businessName, message, source } = body;

  // Validation: name or businessName required, phone or email required.
  if (!name && !businessName) {
    return NextResponse.json(
      { error: "Please provide your name or your business name." },
      { status: 400 }
    );
  }
  if (!phone && !email) {
    return NextResponse.json(
      { error: "Please provide a phone number or email." },
      { status: 400 }
    );
  }

  // Try to match an existing contact by phone or email.
  let contactId: string | null = null;
  if (phone) {
    const existing = await prisma.contact.findUnique({ where: { phone } });
    if (existing) contactId = existing.id;
  }
  if (!contactId && email) {
    const existing = await prisma.contact.findUnique({ where: { email } });
    if (existing) contactId = existing.id;
  }

  // Find the landing page by slug if source matches a known slug.
  let landingPageId: string | null = null;
  if (source) {
    const lp = await prisma.landingPage.findUnique({ where: { slug: source } });
    if (lp) {
      landingPageId = lp.id;
      await prisma.landingPage.update({
        where: { id: lp.id },
        data: { conversionCount: { increment: 1 } },
      });
    }
  }

  await prisma.inboundLead.create({
    data: {
      name: name ?? null,
      email: email ?? null,
      phone: phone ?? null,
      businessName: businessName ?? null,
      message: message ?? null,
      source: source ?? null,
      contactId,
      landingPageId,
    },
  });

  return NextResponse.json({
    success: true,
    message: "We'll be in touch shortly.",
  });
}
