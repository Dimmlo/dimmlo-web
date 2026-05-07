import { Resend } from "resend";

let _client: Resend | null = null;

function client(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "placeholder") {
    throw new Error(
      "RESEND_API_KEY is not configured. Set a real key in .env.local."
    );
  }
  if (!_client) _client = new Resend(key);
  return _client;
}

export type SendArgs = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
};

export type SendResult = {
  ok: boolean;
  id?: string;
  error?: string;
};

// Thin wrapper around Resend. Returns ok=false rather than throwing so the
// cron loop can record a send_failed event and continue.
export async function sendEmail(args: SendArgs): Promise<SendResult> {
  try {
    const resp = await client().emails.send({
      from: args.from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo,
      tags: args.tags,
    });
    if (resp.error) {
      return { ok: false, error: resp.error.message };
    }
    return { ok: true, id: resp.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return { ok: false, error: msg };
  }
}
