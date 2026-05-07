import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../_guard";
import { initiateCall } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const contactId = body?.contactId as string | undefined;
  if (!contactId) {
    return NextResponse.json({ error: "contactId required" }, { status: 400 });
  }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact?.phone) {
    return NextResponse.json(
      { error: "Contact has no phone number" },
      { status: 400 }
    );
  }

  try {
    const sid = await initiateCall(contactId, contact.phone);
    return NextResponse.json({ ok: true, twilioCallSid: sid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
