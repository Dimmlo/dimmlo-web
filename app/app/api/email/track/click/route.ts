import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const es = req.nextUrl.searchParams.get("es");
  const cc = req.nextUrl.searchParams.get("cc");
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Validate it's an http(s) URL before redirecting to avoid open-redirect to
  // weird schemes like javascript:.
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (es) {
    try {
      await prisma.$transaction(async (tx) => {
        const send = await tx.emailSend.findUnique({ where: { id: es } });
        if (!send) return;
        if (!send.clicked) {
          await tx.emailSend.update({
            where: { id: es },
            data: { clicked: true, clickedAt: new Date() },
          });
        }
        await tx.emailEvent.create({
          data: {
            emailSendId: es,
            eventType: "clicked",
            metadata: { campaignContactId: cc ?? null, url },
          },
        });
      });
    } catch {
      // swallow — keep redirect path resilient
    }
  }

  return NextResponse.redirect(url, { status: 302 });
}
