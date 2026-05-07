import twilio from "twilio";
import { prisma } from "./prisma";

let _client: ReturnType<typeof twilio> | null = null;

function client() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || sid === "placeholder" || token === "placeholder") {
    throw new Error(
      "Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN."
    );
  }
  if (!_client) _client = twilio(sid, token);
  return _client;
}

// Initiate an outbound call via Twilio. Creates the Call DB record before
// dialing so the webhook handler can join the recording back to it via the
// twilioCallSid.
export async function initiateCall(
  contactId: string,
  toNumber: string
): Promise<string> {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber || fromNumber === "placeholder") {
    throw new Error("TWILIO_PHONE_NUMBER is not configured.");
  }

  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

  // Pre-create the Call row so the webhook can find it before SID arrives.
  const call = await prisma.call.create({
    data: {
      contactId,
      fromNumber,
      toNumber,
    },
  });

  // TwiML URL: simple voice prompt that records the call and posts to webhook.
  const twimlUrl = `${baseUrl}/api/webhooks/twilio?action=twiml&callId=${call.id}`;
  const statusCallback = `${baseUrl}/api/webhooks/twilio?action=status&callId=${call.id}`;
  const recordingStatusCallback = `${baseUrl}/api/webhooks/twilio?action=recording&callId=${call.id}`;

  const created = await client().calls.create({
    to: toNumber,
    from: fromNumber,
    url: twimlUrl,
    record: true,
    recordingStatusCallback,
    recordingStatusCallbackEvent: ["completed"],
    statusCallback,
    statusCallbackEvent: ["completed"],
    statusCallbackMethod: "POST",
  });

  await prisma.call.update({
    where: { id: call.id },
    data: { twilioCallSid: created.sid },
  });

  return created.sid;
}

// Build minimal TwiML for the outbound call. Plays a brief greeting and then
// connects the caller to a conference / dial leg. For an MVP we just say a
// short prompt and let the recording capture the conversation.
export function buildTwiml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Brian">Connecting your call now.</Say>
  <Pause length="60"/>
</Response>`;
}
