import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1x1 transparent GIF.
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  const es = req.nextUrl.searchParams.get("es");
  const cc = req.nextUrl.searchParams.get("cc");

  if (es) {
    try {
      await prisma.$transaction(async (tx) => {
        const send = await tx.emailSend.findUnique({ where: { id: es } });
        if (!send) return;
        if (!send.opened) {
          await tx.emailSend.update({
            where: { id: es },
            data: { opened: true, openedAt: new Date() },
          });
        }
        await tx.emailEvent.create({
          data: {
            emailSendId: es,
            eventType: "opened",
            metadata: { campaignContactId: cc ?? null },
          },
        });
      });
    } catch {
      // swallow — never break the pixel render path
    }
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}
