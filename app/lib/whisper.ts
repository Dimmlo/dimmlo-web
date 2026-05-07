import OpenAI from "openai";

let _client: OpenAI | null = null;

function client(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "placeholder") {
    throw new Error(
      "OPENAI_API_KEY is not configured. Set a real key in .env.local."
    );
  }
  if (!_client) _client = new OpenAI({ apiKey: key });
  return _client;
}

// Download a Twilio recording (which is hosted at api.twilio.com behind basic
// auth) and transcribe it via OpenAI Whisper. Returns the raw transcript text.
export async function transcribeRecording(recordingUrl: string): Promise<string> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio credentials missing for download");

  // Twilio recording URLs need .mp3 suffix and basic auth to fetch.
  const url = recordingUrl.endsWith(".mp3") ? recordingUrl : `${recordingUrl}.mp3`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const resp = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!resp.ok) {
    throw new Error(`Failed to download recording: ${resp.status} ${resp.statusText}`);
  }
  const arrayBuf = await resp.arrayBuffer();
  const blob = new Blob([arrayBuf], { type: "audio/mpeg" });
  // OpenAI SDK accepts a File-like object; construct one from the blob.
  const file = new File([blob], "recording.mp3", { type: "audio/mpeg" });

  const transcription = await client().audio.transcriptions.create({
    file,
    model: "whisper-1",
  });

  return transcription.text;
}
