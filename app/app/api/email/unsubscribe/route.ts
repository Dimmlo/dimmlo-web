import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/email/unsubscribe?email=...
// Records the unsubscribe and returns a tiny HTML confirmation page.
export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return new NextResponse("Missing email parameter.", { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.globalUnsubscribe.upsert({
        where: { email },
        update: {},
        create: { email },
      });

      // Mark any matching contact's campaignContacts as unsubscribed.
      const contact = await tx.contact.findUnique({ where: { email } });
      if (contact) {
        await tx.campaignContact.updateMany({
          where: { contactId: contact.id, status: "active" },
          data: { status: "unsubscribed", unsubscribedAt: new Date() },
        });
        await tx.contact.update({
          where: { id: contact.id },
          data: { globalDoNotContact: true, status: "unsubscribed" },
        });
      }
    });
  } catch {
    // Continue rendering the confirmation even if the DB write failed.
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Unsubscribed</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:80px auto;padding:24px;color:#1F2124;text-align:center}</style>
</head><body>
<h1>You're unsubscribed.</h1>
<p>You won't receive any more emails from us. If this was a mistake, just reply to a previous message.</p>
</body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
