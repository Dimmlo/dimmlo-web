import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTwiml } from "@/lib/twilio";
import { transcribeRecording } from "@/lib/whisper";
import { scoreCallTranscript } from "@/lib/claude";
import { updateCallPatterns } from "@/lib/brain-triggers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Twilio sends form-encoded bodies. We accept all POST/GET on this endpoint
// and dispatch on the `action` query param: twiml | status | recording.
async function handle(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");
  const callId = req.nextUrl.searchParams.get("callId");

  if (action === "twiml") {
    return new NextResponse(buildTwiml(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  // For status / recording, parse the form body.
  const ct = req.headers.get("content-type") ?? "";
  let params: URLSearchParams;
  if (ct.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    params = new URLSearchParams(text);
  } else {
    params = req.nextUrl.searchParams;
  }

  if (!callId) {
    return NextResponse.json({ error: "callId required" }, { status: 400 });
  }

  if (action === "status") {
    const callStatus = params.get("CallStatus");
    const duration = params.get("CallDuration");
    if (callStatus === "completed") {
      await prisma.call.update({
        where: { id: callId },
        data: {
          duration: duration ? parseInt(duration, 10) : null,
        },
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "recording") {
    const recordingUrl = params.get("RecordingUrl");
    if (!recordingUrl) {
      return NextResponse.json({ error: "no recording url" }, { status: 400 });
    }
    await prisma.call.update({
      where: { id: callId },
      data: { recordingUrl },
    });

    // Fire-and-forget transcription + AI scoring.
    void (async () => {
      try {
        const transcript = await transcribeRecording(recordingUrl);
        const call = await prisma.call.findUnique({
          where: { id: callId },
          include: { contact: true },
        });
        if (!call) return;
        await prisma.call.update({
          where: { id: callId },
          data: { transcript },
        });
        try {
          const score = await scoreCallTranscript(transcript, call.contact);
          const [updatedCall] = await prisma.$transaction([
            prisma.call.update({
              where: { id: callId },
              data: {
                aiScore: score.interestLevel,
                aiObjections: score.objections,
                aiNextAction: score.recommendedNextAction,
                aiFollowUpDraft: score.followUpDraft,
              },
            }),
            prisma.contact.update({
              where: { id: call.contactId },
              data: {
                callTranscript: transcript,
                callScore: score.interestLevel,
                callObjections: score.objections,
              },
            }),
          ]);
          // Trigger Brain pattern updates with the freshly scored call.
          await updateCallPatterns({ ...updatedCall, contact: call.contact });
        } catch (err) {
          console.error("[twilio webhook] scoring failed:", err);
        }
      } catch (err) {
        console.error("[twilio webhook] transcription failed:", err);
      }
    })();

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  return handle(req);
}
export async function GET(req: NextRequest) {
  return handle(req);
}
