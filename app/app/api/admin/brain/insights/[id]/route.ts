import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../../_guard";
import { extractFeedbackLearning } from "@/lib/claude";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const id = params.id;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.status === "string") data.status = body.status;
  if (typeof body.userFeedback === "string") {
    data.userFeedback = body.userFeedback;
    data.feedbackAt = new Date();
  }
  if (typeof body.wasActedOn === "boolean") {
    data.wasActedOn = body.wasActedOn;
    if (body.wasActedOn) data.actedOnAt = new Date();
  }
  if (typeof body.outcome === "string") data.outcome = body.outcome;

  const updated = await prisma.brainInsight.update({
    where: { id },
    data,
  });

  // If outcome was provided, extract a feedback learning right away.
  if (typeof body.outcome === "string" && body.outcome.trim().length > 0) {
    void (async () => {
      try {
        const learning = await extractFeedbackLearning(updated, body.outcome);
        if (learning) {
          await prisma.feedbackLoop.create({
            data: {
              insightId: id,
              action: updated.status,
              result: body.outcome,
              learningExtracted: learning,
            },
          });
          await prisma.brainPattern.upsert({
            where: { patternKey: `learning:${id}:applied` },
            create: {
              patternKey: `learning:${id}:applied`,
              value: 1,
              sampleSize: 1,
              confidence: 4,
              trend: "stable",
            },
            update: { value: 1, sampleSize: 1, confidence: 4 },
          });
        }
      } catch (err) {
        console.error("[brain] feedback learning extract failed:", err);
      }
    })();
  }

  return NextResponse.json({ insight: updated });
}
