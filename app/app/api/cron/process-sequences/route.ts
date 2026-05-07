import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextDomain } from "@/lib/domain-rotation";
import { buildEmailHtml, htmlToText } from "@/lib/email-builder";
import { sendEmail } from "@/lib/resend";
import { updateEmailPatterns } from "@/lib/brain-triggers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Cron worker: processes due CampaignContacts, sending one email per
// available SendingDomain per invocation.
async function handle(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;
  if (!expected || expected === "placeholder") {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  if (secret !== expected) return unauthorized();

  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const now = new Date();

  // Find candidates: active CampaignContacts with nextEmailDueAt <= now and
  // a non-empty contact email. Order by oldest due first.
  const candidates = await prisma.campaignContact.findMany({
    where: {
      status: "active",
      nextEmailDueAt: { lte: now },
      hasReplied: false,
      hasConverted: false,
      contact: { email: { not: null }, globalDoNotContact: false },
      campaign: { status: "ACTIVE" },
    },
    include: {
      campaign: { include: { emails: true } },
      contact: true,
    },
    orderBy: { nextEmailDueAt: "asc" },
    take: 100,
  });

  const usedDomainIds = new Set<string>();
  const sent: { campaignContactId: string; ok: boolean; error?: string }[] = [];

  for (const cc of candidates) {
    const domain = await getNextDomain(Array.from(usedDomainIds));
    if (!domain) break;

    const contact = cc.contact;
    if (!contact.email) continue;

    // Pick the email template for the current bucket + step + variant.
    const tpl = cc.campaign.emails.find(
      (e) =>
        e.bucket === cc.currentBucket &&
        e.stepOrder === cc.currentStepInBucket &&
        e.variant === cc.variant
    );
    if (!tpl) {
      // No template — mark as completed so we don't keep trying.
      await prisma.campaignContact.update({
        where: { id: cc.id },
        data: { status: "completed", nextEmailDueAt: null },
      });
      continue;
    }

    // Pre-create EmailSend so tracking links can reference its id.
    const emailSend = await prisma.emailSend.create({
      data: {
        campaignContactId: cc.id,
        contactId: contact.id,
        domainId: domain.id,
        subject: tpl.subject,
      },
    });

    const html = await buildEmailHtml({
      bodyHtml: tpl.bodyHtml,
      contact,
      emailSendId: emailSend.id,
      campaignContactId: cc.id,
      baseUrl,
    });
    const text = tpl.bodyText ?? htmlToText(tpl.bodyHtml);

    const result = await sendEmail({
      from: `${cc.campaign.fromName} <${domain.fromEmail}>`,
      to: contact.email,
      replyTo: cc.campaign.replyTo ?? domain.fromEmail,
      subject: tpl.subject,
      html,
      text,
      tags: [
        { name: "campaign", value: cc.campaignId },
        { name: "bucket", value: cc.currentBucket },
        { name: "step", value: String(cc.currentStepInBucket) },
      ],
    });

    if (result.ok) {
      // Schedule next step: pick next email in same bucket if exists, else stop.
      const nextStep = cc.currentStepInBucket + 1;
      const nextTpl = cc.campaign.emails.find(
        (e) =>
          e.bucket === cc.currentBucket &&
          e.stepOrder === nextStep &&
          e.variant === cc.variant
      );

      const nextDue = nextTpl
        ? new Date(now.getTime() + nextTpl.delayDays * 24 * 60 * 60 * 1000)
        : null;

      await prisma.$transaction([
        prisma.emailSend.update({
          where: { id: emailSend.id },
          data: { resendEmailId: result.id ?? null },
        }),
        prisma.emailEvent.create({
          data: {
            emailSendId: emailSend.id,
            eventType: "sent",
            bucket: cc.currentBucket,
            stepOrder: cc.currentStepInBucket,
          },
        }),
        prisma.campaignContact.update({
          where: { id: cc.id },
          data: {
            lastEmailSentAt: now,
            nextEmailDueAt: nextDue,
            currentStepInBucket: nextStep,
            status: nextTpl ? "active" : "completed",
          },
        }),
        prisma.campaign.update({
          where: { id: cc.campaignId },
          data: { totalSent: { increment: 1 } },
        }),
        prisma.sendingDomain.update({
          where: { id: domain.id },
          data: {
            sendsToday: { increment: 1 },
            totalSent: { increment: 1 },
          },
        }),
      ]);

      usedDomainIds.add(domain.id);
      sent.push({ campaignContactId: cc.id, ok: true });
    } else {
      await prisma.emailEvent.create({
        data: {
          emailSendId: emailSend.id,
          eventType: "send_failed",
          bucket: cc.currentBucket,
          stepOrder: cc.currentStepInBucket,
          metadata: { error: result.error ?? "unknown" },
        },
      });
      sent.push({ campaignContactId: cc.id, ok: false, error: result.error });
    }
  }

  // Bump Brain email patterns once per cron run, off the success count.
  if (sent.filter((s) => s.ok).length > 0) {
    const recentEvents = await prisma.emailEvent.findMany({
      where: {
        eventType: "sent",
        createdAt: { gte: new Date(now.getTime() - 60 * 1000) },
      },
    });
    try {
      await updateEmailPatterns(recentEvents);
    } catch (err) {
      console.error("[cron] updateEmailPatterns failed:", err);
    }
  }

  return NextResponse.json({ processed: sent.length, results: sent });
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
