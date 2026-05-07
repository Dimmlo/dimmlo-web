// Lightweight pattern updates triggered by domain events. These do not
// run a full Brain cycle — they only nudge a few BrainPattern values so
// the next full cycle has fresh data. The 10th call in a category triggers
// a full cycle automatically.
import { prisma } from "./prisma";
import { runBrainCycle } from "./brain";
import type { Call, Contact, EmailEvent } from "@prisma/client";

function confidenceFromSampleSize(n: number): number {
  if (n < 10) return 3;
  if (n < 50) return 6;
  if (n < 200) return 8;
  return 10;
}

async function bumpPattern(patternKey: string, value: number, sampleSize: number) {
  const existing = await prisma.brainPattern.findUnique({
    where: { patternKey },
  });
  if (existing) {
    await prisma.brainPattern.update({
      where: { patternKey },
      data: {
        previousValue: existing.value,
        value,
        sampleSize,
        confidence: confidenceFromSampleSize(sampleSize),
      },
    });
    return;
  }
  await prisma.brainPattern.create({
    data: {
      patternKey,
      value,
      sampleSize,
      confidence: confidenceFromSampleSize(sampleSize),
      trend: "stable",
    },
  });
}

// Update call-related patterns after a call completes (transcript scored).
export async function updateCallPatterns(call: Call & { contact?: Contact | null }) {
  const contact = call.contact ?? (await prisma.contact.findUnique({ where: { id: call.contactId } }));
  if (!contact) return;

  // Update call_outcome distribution as a single rolling number per category.
  const allCallsInCategory = await prisma.call.count({
    where: { contact: { category: contact.category } },
  });
  const interestedCount = await prisma.call.count({
    where: {
      contact: { category: contact.category },
      outcome: { in: ["INTERESTED", "BOOKED"] },
    },
  });
  const rate = allCallsInCategory > 0 ? interestedCount / allCallsInCategory : 0;
  await bumpPattern(
    `category:${contact.category}:call_interest_rate`,
    rate,
    allCallsInCategory
  );

  // Update objection frequency.
  for (const obj of call.aiObjections ?? []) {
    const key = obj.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").slice(0, 60);
    if (!key) continue;
    const since14 = new Date();
    since14.setDate(since14.getDate() - 14);
    const count = await prisma.call.count({
      where: {
        createdAt: { gte: since14 },
        aiObjections: { has: obj },
      },
    });
    await bumpPattern(`call_objection:${key}:frequency_14d`, count, count);
  }

  // Trigger a full cycle every 10th call in a category.
  if (allCallsInCategory > 0 && allCallsInCategory % 10 === 0) {
    void runBrainCycle(`event:call_completed:${contact.category}`).catch((err) =>
      console.error("[brain-triggers] cycle failed:", err)
    );
  }
}

// Update email-side patterns after email events accumulate.
export async function updateEmailPatterns(events: EmailEvent[]) {
  if (events.length === 0) return;

  // Just bump the running overall sent counter so the cycle has fresh signal
  // — full per-category recalculation happens during the cron cycle.
  const sentCount = events.filter((e) => e.eventType === "sent").length;
  if (sentCount === 0) return;

  const existing = await prisma.brainPattern.findUnique({
    where: { patternKey: "global:emails_sent_total" },
  });
  const newValue = (existing?.value ?? 0) + sentCount;
  await bumpPattern(
    "global:emails_sent_total",
    newValue,
    Math.max(1, Math.round(newValue))
  );
}
