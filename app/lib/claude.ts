import Anthropic from "@anthropic-ai/sdk";
import type { BrainInsight, BrainPattern, Contact, InsightType } from "@prisma/client";

// Centralised Anthropic client. We construct the client lazily so the app
// can boot without a real ANTHROPIC_API_KEY — calls themselves will throw
// a useful error when the key is missing or a placeholder.
function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "placeholder") {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Set a real key in .env.local."
    );
  }
  return new Anthropic({ apiKey: key });
}

const MODEL = "claude-sonnet-4-6";

export type CallScore = {
  interestLevel: number;
  objections: string[];
  recommendedNextAction: string;
  followUpDraft: string;
  summary: string;
};

export type BriefingData = {
  campaignStats: {
    campaignName: string;
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    converted: number;
  }[];
  callOutcomes: {
    businessName: string;
    category: string;
    outcome: string | null;
    aiScore: number | null;
    objections: string[];
  }[];
  inboundLeads: {
    businessName: string | null;
    source: string | null;
    createdAt: Date;
  }[];
  windowDays: number;
};

// Personalise a 1-2 sentence opening line for a cold email.
export async function personaliseOpener(contact: Contact): Promise<string> {
  const client = getClient();

  const system = `You are Eddie Robb, a straight-talking Scot based in Brooklyn who helps small businesses get a proper online presence. Write a 1-2 sentence opening line for a cold email to ${contact.businessName}, a ${contact.category} in ${contact.borough ?? "their area"}. Reference something specific and real about their situation — their website looks like it hasn't been updated in years, or their Google listing has outdated info. Do not be sycophantic. Do not use corporate language. Sound like a real person who noticed something. Never start with "I". Never use the word "genuinely". Keep it under 40 words.`;

  const userPrompt = JSON.stringify(
    {
      businessName: contact.businessName,
      category: contact.category,
      borough: contact.borough,
      websiteUrl: contact.websiteUrl,
      websiteAgeScore: contact.websiteAgeScore,
      websiteLastModified: contact.websiteLastModified,
      scrapeNotes: contact.scrapeNotes,
    },
    null,
    2
  );

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = resp.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text block");
  }
  return block.text.trim();
}

// Score a call transcript and return a structured action plan.
export async function scoreCallTranscript(
  transcript: string,
  contact: Contact
): Promise<CallScore> {
  const client = getClient();

  const system = `You are a sales coach analysing a cold call transcript. Return ONLY valid JSON, no preamble, no code fences, with these exact keys:
{
  "interestLevel": number (1-10, higher = more interested),
  "objections": string[] (specific objections raised, empty array if none),
  "recommendedNextAction": string (one sentence — what should Eddie do next),
  "followUpDraft": string (a short follow-up email or text Eddie can send, 2-4 sentences),
  "summary": string (2-3 sentence factual summary of the call)
}`;

  const userPrompt = `Contact: ${contact.businessName}, a ${contact.category} in ${contact.borough ?? "unknown area"}.

Transcript:
${transcript}

Return only the JSON object.`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = resp.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text block");
  }

  // Strip code fences if the model added them despite instructions.
  let raw = block.text.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  }

  const parsed = JSON.parse(raw) as CallScore;
  return parsed;
}

// Generate a plain-English markdown daily briefing.
export async function generateDailyBriefing(data: BriefingData): Promise<string> {
  const client = getClient();

  const system = `You are an analyst writing a weekly briefing for Eddie Robb, who is selling website maintenance to small US businesses. Write in plain English, no fluff, no corporate jargon. Output Markdown with these sections in order:

## What worked this week
## What didn't work
## Top 3 actions for next week
## Patterns worth noting

Be specific. Reference actual campaign names, business categories, or call outcomes from the data. If a section has nothing to say, say so honestly rather than padding.`;

  const userPrompt = `Data window: last ${data.windowDays} days.

Campaign stats:
${JSON.stringify(data.campaignStats, null, 2)}

Call outcomes:
${JSON.stringify(data.callOutcomes, null, 2)}

Inbound leads:
${JSON.stringify(data.inboundLeads, null, 2)}`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = resp.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text block");
  }
  return block.text.trim();
}

// ─── BRAIN-SPECIFIC FUNCTIONS ─────────────────────────────────────────────

export type BrainInsightDraft = {
  type: InsightType;
  title: string;
  summary: string;
  detail: string;
  recommendation: string;
  confidence: number;
  dataPoints: Record<string, unknown>;
  expiresAt: string | null;
};

export type ScraperDirective = {
  recommendedCategory: string;
  recommendedBorough: string;
  reasoning: string;
  confidence: number;
};

const BRAIN_SYSTEM_PROMPT = `You are the Dimmlo GTM Brain. You analyse outreach performance data for Eddie Robb, a serial entrepreneur running GTM for Dimmlo — a service that helps US small businesses keep their online presence current via text message updates.

Eddie is running cold email outreach and cold calls to small businesses in New York City, targeting businesses with stale websites. His categories include plumbers, electricians, handymen, cleaners, locksmiths, painters, cafes, personal trainers, and independent healthcare practitioners.

Your job is to identify the most actionable insights from the data provided. You think like a sharp, experienced GTM operator — not a data analyst. You care about what to DO next, not just what happened.

Rules:
- Only generate insights where confidence >= 6
- Every insight must have a specific, actionable recommendation
- Prioritise insights that could change what Eddie does TODAY
- Flag anything time-sensitive with an expiresAt (ISO date, 48-72 hours)
- Be direct. No hedging. No corporate language.
- If the data shows something surprising, say so plainly.
- Maximum 8 insights per cycle. Quality over quantity.
- Return ONLY valid JSON. No preamble. No markdown wrapper.
- Each insight's "type" must be one of: CATEGORY_PERFORMANCE, BOROUGH_PERFORMANCE, EMAIL_VARIANT, CALL_PATTERN, SCRAPER_DIRECTION, TIMING_PATTERN, PROSPECT_QUALITY, CONTENT_SUGGESTION, DOMAIN_HEALTH, PIPELINE_GAP

Return a JSON array of insights in this shape:
[
  {
    "type": "CATEGORY_PERFORMANCE",
    "title": "max 8 words",
    "summary": "max 2 sentences, plain English",
    "detail": "full reasoning, markdown ok",
    "recommendation": "specific action, max 3 sentences",
    "confidence": 1-10,
    "dataPoints": { "key": "value" },
    "expiresAt": "ISO date or null"
  }
]`;

// Generate insights from current patterns + raw data.
export async function generateBrainInsights(
  patterns: BrainPattern[],
  rawData: Record<string, unknown>
): Promise<BrainInsightDraft[]> {
  const client = getClient();

  const userPayload = {
    patterns: patterns.map((p) => ({
      key: p.patternKey,
      value: p.value,
      sampleSize: p.sampleSize,
      confidence: p.confidence,
      trend: p.trend,
      previousValue: p.previousValue,
    })),
    rawData,
  };

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: BRAIN_SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify(userPayload, null, 2) }],
  });

  const block = resp.content[0];
  if (!block || block.type !== "text") return [];
  let raw = block.text.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as BrainInsightDraft[];
    if (parsed && Array.isArray(parsed.insights)) return parsed.insights as BrainInsightDraft[];
    return [];
  } catch {
    return [];
  }
}

// Extract one concrete learning from a closed-loop outcome.
export async function extractFeedbackLearning(
  insight: BrainInsight,
  outcome: string
): Promise<string> {
  const client = getClient();

  const system = `You're extracting a single concrete learning from a closed feedback loop in a GTM system. Given an insight recommendation and what actually happened when Eddie acted on it (or overrode it), return ONE specific learning that should influence future recommendations. Be specific. Max 2 sentences. No preamble. Just the learning.`;

  const userPrompt = `Insight type: ${insight.type}
Title: ${insight.title}
Recommendation: ${insight.recommendation}
Eddie's status on this: ${insight.status}
Eddie's feedback: ${insight.userFeedback ?? "(none)"}
What happened: ${outcome}

Return one concrete learning, max 2 sentences.`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = resp.content[0];
  if (!block || block.type !== "text") return "";
  return block.text.trim();
}

// Recommend the next scraper target.
export async function generateScraperDirective(
  patterns: BrainPattern[]
): Promise<ScraperDirective> {
  const client = getClient();

  const system = `You are advising Eddie on where to point his Google Maps scraper next, based on which categories and boroughs are converting best. Eddie operates in New York City. Categories include: Plumber, Electrician, Handyman, Cleaning Service, Locksmith, Painter, Cafe, Personal Trainer, Doctor, Physiotherapist. Boroughs: Manhattan, Brooklyn, Queens, Bronx, Staten Island.

Return ONLY valid JSON, no preamble:
{
  "recommendedCategory": string,
  "recommendedBorough": string,
  "reasoning": string,
  "confidence": number
}`;

  const userPayload = {
    patterns: patterns.map((p) => ({
      key: p.patternKey,
      value: p.value,
      confidence: p.confidence,
      trend: p.trend,
    })),
  };

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    system,
    messages: [{ role: "user", content: JSON.stringify(userPayload, null, 2) }],
  });

  const block = resp.content[0];
  if (!block || block.type !== "text") {
    return {
      recommendedCategory: "Plumber",
      recommendedBorough: "Brooklyn",
      reasoning: "Default — no Brain data available yet.",
      confidence: 3,
    };
  }
  let raw = block.text.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  }
  try {
    return JSON.parse(raw) as ScraperDirective;
  } catch {
    return {
      recommendedCategory: "Plumber",
      recommendedBorough: "Brooklyn",
      reasoning: "Could not parse Brain output. Defaulting.",
      confidence: 3,
    };
  }
}

// Generate a current call script for a specific category.
export async function generateCallScript(
  category: string,
  topObjections: string[],
  patterns: BrainPattern[]
): Promise<string> {
  const client = getClient();

  const system = `You are writing a cold call script for Eddie Robb, a Scottish founder selling website maintenance to small US businesses (Dimmlo).

The script should be:
- Concise. A real cold call lasts 90 seconds.
- Direct. No corporate jargon. No "I hope you're having a great day."
- Built around the most frequent objections Eddie hears in this category.
- Markdown formatted with sections: Opening, Discovery, Pitch, Objection Handling, Close.
- Specific to the category provided.

Return only the script in markdown. No preamble.`;

  const userPayload = {
    category,
    topObjections,
    relevantPatterns: patterns
      .filter((p) => p.patternKey.toLowerCase().includes(category.toLowerCase()))
      .map((p) => ({
        key: p.patternKey,
        value: p.value,
        confidence: p.confidence,
      })),
  };

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system,
    messages: [{ role: "user", content: JSON.stringify(userPayload, null, 2) }],
  });

  const block = resp.content[0];
  if (!block || block.type !== "text") return "(Script generation failed.)";
  return block.text.trim();
}
