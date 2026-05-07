// The Brain — always-learning intelligence layer.
// Reads scrape, email, call, and inbound signals; updates patterns; and
// generates actionable insights via Claude. Designed to run on a schedule
// AND on demand. Every recommendation is traceable to the data that
// generated it (stored in BrainInsight.dataPoints).
import { prisma } from "./prisma";
import {
  generateBrainInsights,
  extractFeedbackLearning,
  type BrainInsightDraft,
} from "./claude";
import type {
  BrainPattern,
  BrainInsight,
  Prisma,
} from "@prisma/client";

// ─── HELPERS ──────────────────────────────────────────────────────────────

function confidenceFromSampleSize(n: number): number {
  if (n < 10) return 3;
  if (n < 50) return 6;
  if (n < 200) return 8;
  return 10;
}

function trendFor(prev: number | null | undefined, current: number): string {
  if (prev === null || prev === undefined) return "stable";
  const delta = current - prev;
  if (Math.abs(delta) < 0.001) return "stable";
  // A 5% relative move counts as a trend; otherwise stable.
  if (prev !== 0 && Math.abs(delta / Math.max(Math.abs(prev), 1e-6)) < 0.05)
    return "stable";
  return delta > 0 ? "up" : "down";
}

// Upsert a single pattern, computing trend vs previous value.
async function upsertPattern(
  patternKey: string,
  value: number,
  sampleSize: number
): Promise<{ created: boolean; updated: boolean }> {
  const existing = await prisma.brainPattern.findUnique({
    where: { patternKey },
  });
  const confidence = confidenceFromSampleSize(sampleSize);
  if (existing) {
    const trend = trendFor(existing.value, value);
    await prisma.brainPattern.update({
      where: { patternKey },
      data: {
        previousValue: existing.value,
        value,
        sampleSize,
        confidence,
        trend,
      },
    });
    return { created: false, updated: true };
  }
  await prisma.brainPattern.create({
    data: {
      patternKey,
      value,
      sampleSize,
      confidence,
      trend: "stable",
    },
  });
  return { created: true, updated: false };
}

// Group an array by a key extractor, producing { key: items[] } map.
function groupBy<T>(arr: T[], key: (t: T) => string | null | undefined): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of arr) {
    const k = key(item);
    if (!k) continue;
    if (!out[k]) out[k] = [];
    out[k].push(item);
  }
  return out;
}

function safeRate(num: number, den: number): number {
  if (den <= 0) return 0;
  return num / den;
}

// ─── STEP 1 — DATA COLLECTION ─────────────────────────────────────────────

async function collectData() {
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since14 = new Date();
  since14.setDate(since14.getDate() - 14);
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);

  const [
    emailSends,
    emailEvents,
    campaignContacts,
    calls,
    contacts,
    inboundLeads,
    domains,
  ] = await Promise.all([
    prisma.emailSend.findMany({
      where: { createdAt: { gte: since30 } },
      include: {
        contact: true,
        emailEvents: true,
      },
    }),
    prisma.emailEvent.findMany({
      where: { createdAt: { gte: since30 } },
      include: { emailSend: { include: { contact: true } } },
    }),
    prisma.campaignContact.findMany({
      where: {
        OR: [
          { lastEmailSentAt: { gte: since30 } },
          { repliedAt: { gte: since30 } },
          { convertedAt: { gte: since30 } },
        ],
      },
      include: { contact: true },
    }),
    prisma.call.findMany({
      include: { contact: true },
    }),
    prisma.contact.findMany(),
    prisma.inboundLead.findMany({
      where: { createdAt: { gte: since30 } },
    }),
    prisma.sendingDomain.findMany(),
  ]);

  return {
    emailSends,
    emailEvents,
    campaignContacts,
    calls,
    contacts,
    inboundLeads,
    domains,
    since30,
    since14,
    since7,
  };
}

type CollectedData = Awaited<ReturnType<typeof collectData>>;

// ─── STEP 2 — PATTERN EXTRACTION ──────────────────────────────────────────

async function extractPatterns(d: CollectedData): Promise<{
  patternsUpdated: number;
  rawData: Record<string, unknown>;
}> {
  let updated = 0;

  // ── Email open / click / reply rates by category ──
  const sendsByCategory = groupBy(d.emailSends, (s) => s.contact?.category);
  for (const [category, sends] of Object.entries(sendsByCategory)) {
    const opens = sends.filter((s) => s.opened).length;
    const clicks = sends.filter((s) => s.clicked).length;
    const openRate = safeRate(opens, sends.length);
    const clickRate = safeRate(clicks, sends.length);
    await upsertPattern(`category:${category}:open_rate`, openRate, sends.length);
    await upsertPattern(`category:${category}:click_rate`, clickRate, sends.length);
    updated += 2;
  }

  // ── Open rate by borough ──
  const sendsByBorough = groupBy(d.emailSends, (s) => s.contact?.borough ?? null);
  for (const [borough, sends] of Object.entries(sendsByBorough)) {
    const opens = sends.filter((s) => s.opened).length;
    const openRate = safeRate(opens, sends.length);
    await upsertPattern(`borough:${borough}:open_rate`, openRate, sends.length);
    updated++;
  }

  // ── Reply rate by category (from CampaignContact) ──
  const ccByCategory = groupBy(d.campaignContacts, (cc) => cc.contact?.category);
  for (const [category, ccs] of Object.entries(ccByCategory)) {
    const replies = ccs.filter((c) => c.hasReplied).length;
    const conversions = ccs.filter((c) => c.hasConverted).length;
    const replyRate = safeRate(replies, ccs.length);
    const convRate = safeRate(conversions, ccs.length);
    await upsertPattern(`category:${category}:reply_rate`, replyRate, ccs.length);
    await upsertPattern(`category:${category}:conversion_rate`, convRate, ccs.length);
    updated += 2;
  }

  // ── Reply rate by borough ──
  const ccByBorough = groupBy(d.campaignContacts, (cc) => cc.contact?.borough ?? null);
  for (const [borough, ccs] of Object.entries(ccByBorough)) {
    const replies = ccs.filter((c) => c.hasReplied).length;
    const replyRate = safeRate(replies, ccs.length);
    await upsertPattern(`borough:${borough}:reply_rate`, replyRate, ccs.length);
    updated++;
  }

  // ── Send time patterns: day of week + hour, open rates ──
  const byDayHour: Record<string, { sends: number; opens: number }> = {};
  for (const s of d.emailSends) {
    const date = s.createdAt;
    const day = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
      date.getDay()
    ];
    const hour = date.getHours();
    const key = `${day}_${hour}`;
    if (!byDayHour[key]) byDayHour[key] = { sends: 0, opens: 0 };
    byDayHour[key].sends++;
    if (s.opened) byDayHour[key].opens++;
  }
  for (const [key, { sends, opens }] of Object.entries(byDayHour)) {
    if (sends < 3) continue;
    const rate = safeRate(opens, sends);
    await upsertPattern(`send_time:${key}:open_rate`, rate, sends);
    updated++;
  }

  // ── Subject line variants — group by literal subject string ──
  const subjectGroups: Record<string, { sends: number; opens: number }> = {};
  for (const s of d.emailSends) {
    const subj = (s.subject ?? "").trim();
    if (!subj) continue;
    if (!subjectGroups[subj]) subjectGroups[subj] = { sends: 0, opens: 0 };
    subjectGroups[subj].sends++;
    if (s.opened) subjectGroups[subj].opens++;
  }
  // Keep top 10 subjects by sample size to avoid pattern bloat.
  const topSubjects = Object.entries(subjectGroups)
    .sort((a, b) => b[1].sends - a[1].sends)
    .slice(0, 10);
  for (const [subj, { sends, opens }] of topSubjects) {
    const rate = safeRate(opens, sends);
    // Hash-ish key: first 60 chars, lowercased, non-alnum stripped.
    const key = subj.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 60);
    await upsertPattern(`subject:${key}:open_rate`, rate, sends);
    updated++;
  }

  // ── Call outcomes by category ──
  const callsByCategory = groupBy(d.calls, (c) => c.contact?.category);
  const objectionCounts: Record<string, number> = {};
  const objectionCounts14: Record<string, number> = {};
  const objectionCountsPrev14: Record<string, number> = {};
  for (const [category, calls] of Object.entries(callsByCategory)) {
    const interested = calls.filter(
      (c) => c.outcome === "INTERESTED" || c.outcome === "BOOKED"
    ).length;
    const booked = calls.filter((c) => c.outcome === "BOOKED").length;
    const avgScore =
      calls.reduce((s, c) => s + (c.aiScore ?? 0), 0) /
      Math.max(1, calls.filter((c) => c.aiScore !== null).length);
    await upsertPattern(`category:${category}:call_interest_rate`, safeRate(interested, calls.length), calls.length);
    await upsertPattern(`category:${category}:call_booked_rate`, safeRate(booked, calls.length), calls.length);
    if (!Number.isNaN(avgScore)) {
      await upsertPattern(`category:${category}:avg_call_score`, avgScore, calls.length);
    }
    updated += 3;

    // Aggregate objections.
    for (const c of calls) {
      for (const obj of c.aiObjections ?? []) {
        const key = obj.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").slice(0, 60);
        if (!key) continue;
        objectionCounts[key] = (objectionCounts[key] ?? 0) + 1;
        const isRecent = c.createdAt >= d.since14;
        const isPrior =
          c.createdAt < d.since14 &&
          c.createdAt >= new Date(d.since14.getTime() - 14 * 24 * 60 * 60 * 1000);
        if (isRecent) objectionCounts14[key] = (objectionCounts14[key] ?? 0) + 1;
        if (isPrior) objectionCountsPrev14[key] = (objectionCountsPrev14[key] ?? 0) + 1;
      }
    }
  }

  // ── Objection frequency patterns ──
  for (const [obj, count] of Object.entries(objectionCounts14)) {
    await upsertPattern(`call_objection:${obj}:frequency_14d`, count, count);
    updated++;
  }

  // ── Inbound lead patterns by source ──
  const leadsBySource = groupBy(d.inboundLeads, (l) => l.source);
  for (const [source, leads] of Object.entries(leadsBySource)) {
    await upsertPattern(`landing_page:${source}:leads_30d`, leads.length, leads.length);
    updated++;
  }

  // ── Build raw data summary for Claude (capped to keep token usage sane) ──
  const pendingByCategory = groupBy(
    d.contacts.filter((c) => c.scrapeStatus === "PENDING"),
    (c) => c.category
  );
  const visitedHighScore = d.contacts.filter(
    (c) => c.scrapeStatus === "VISITED" && (c.websiteAgeScore ?? 0) >= 7
  );

  const rawData: Record<string, unknown> = {
    summary: {
      totalEmailSendsLast30: d.emailSends.length,
      totalCalls: d.calls.length,
      totalContacts: d.contacts.length,
      totalInboundLast30: d.inboundLeads.length,
      activeDomains: d.domains.filter((x) => !x.isPaused).length,
      pausedDomains: d.domains.filter((x) => x.isPaused).length,
    },
    pendingProspectsByCategory: Object.fromEntries(
      Object.entries(pendingByCategory).map(([k, v]) => [k, v.length])
    ),
    visitedHighScoreCount: visitedHighScore.length,
    callOutcomeDistribution: Object.fromEntries(
      Object.entries(callsByCategory).map(([cat, cs]) => [
        cat,
        {
          NO_ANSWER: cs.filter((c) => c.outcome === "NO_ANSWER").length,
          NOT_INTERESTED: cs.filter((c) => c.outcome === "NOT_INTERESTED").length,
          INTERESTED: cs.filter((c) => c.outcome === "INTERESTED").length,
          BOOKED: cs.filter((c) => c.outcome === "BOOKED").length,
        },
      ])
    ),
    topObjections14d: Object.entries(objectionCounts14)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    objectionTrends: Object.entries(objectionCounts14).map(([k, v]) => ({
      objection: k,
      thisPeriod: v,
      prevPeriod: objectionCountsPrev14[k] ?? 0,
    })),
    domainHealth: d.domains.map((dom) => ({
      domain: dom.domain,
      sendsToday: dom.sendsToday,
      dailyLimit: dom.dailyLimit,
      utilisation: dom.dailyLimit > 0 ? dom.sendsToday / dom.dailyLimit : 0,
      bounceRate: dom.totalSent > 0 ? dom.bounceCount / dom.totalSent : 0,
      healthStatus: dom.healthStatus,
      isPaused: dom.isPaused,
    })),
  };

  return { patternsUpdated: updated, rawData };
}

// ─── STEP 3 — INSIGHT GENERATION ──────────────────────────────────────────

async function generateAndStoreInsights(
  patterns: BrainPattern[],
  rawData: Record<string, unknown>
): Promise<number> {
  let drafts: BrainInsightDraft[] = [];
  try {
    drafts = await generateBrainInsights(patterns, rawData);
  } catch (err) {
    console.error("[brain] Claude call failed:", err);
    return 0;
  }

  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const recent = await prisma.brainInsight.findMany({
    where: { createdAt: { gte: since7 } },
    select: { type: true, title: true },
  });

  // Skip duplicates: same type and similar title (case-insensitive contains).
  function isDuplicate(d: BrainInsightDraft): boolean {
    const t = d.title.toLowerCase().slice(0, 30);
    return recent.some(
      (r) => r.type === d.type && r.title.toLowerCase().slice(0, 30) === t
    );
  }

  let created = 0;
  for (const d of drafts) {
    if (d.confidence < 6) continue;
    if (isDuplicate(d)) continue;
    try {
      await prisma.brainInsight.create({
        data: {
          type: d.type,
          title: d.title,
          summary: d.summary,
          detail: d.detail,
          recommendation: d.recommendation,
          confidence: Math.max(1, Math.min(10, Math.round(d.confidence))),
          dataPoints: d.dataPoints as Prisma.InputJsonValue,
          expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
        },
      });
      created++;
    } catch (err) {
      console.error("[brain] failed to create insight:", err);
    }
  }
  return created;
}

// ─── STEP 4 — DETERMINISTIC INSIGHTS ──────────────────────────────────────

async function generateDeterministicInsights(d: CollectedData): Promise<number> {
  let created = 0;

  // Helper to create an insight if a similar one isn't already NEW or SEEN.
  async function maybeCreate(
    type: BrainInsightDraft["type"],
    titleStartsWith: string,
    payload: {
      title: string;
      summary: string;
      detail: string;
      recommendation: string;
      confidence: number;
      dataPoints: Record<string, unknown>;
      expiresAt: Date | null;
    }
  ) {
    const existing = await prisma.brainInsight.findFirst({
      where: {
        type,
        title: { startsWith: titleStartsWith },
        status: { in: ["NEW", "SEEN"] },
      },
    });
    if (existing) return;
    await prisma.brainInsight.create({
      data: {
        type,
        ...payload,
        dataPoints: payload.dataPoints as Prisma.InputJsonValue,
      },
    });
    created++;
  }

  // ── Pipeline gap: top-performing categories with low pending stock ──
  const ccByCategory = groupBy(d.campaignContacts, (cc) => cc.contact?.category);
  const performance = Object.entries(ccByCategory).map(([cat, ccs]) => ({
    category: cat,
    replies: ccs.filter((c) => c.hasReplied).length,
    total: ccs.length,
    rate: safeRate(ccs.filter((c) => c.hasReplied).length, ccs.length),
  }));
  const topCats = performance
    .filter((p) => p.total >= 5)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3)
    .map((p) => p.category);

  for (const cat of topCats) {
    const pending = d.contacts.filter(
      (c) => c.category === cat && c.scrapeStatus === "PENDING"
    ).length;
    if (pending < 20) {
      await maybeCreate("PIPELINE_GAP", `Pipeline running low: ${cat}`, {
        title: `Pipeline running low: ${cat}`,
        summary: `Only ${pending} uncontacted prospects left for ${cat}, your top-performing category.`,
        detail: `${cat} is among the top 3 categories by reply rate. Pending prospect count is ${pending}, below the 20-prospect floor. Without a top-up, you'll run dry within the week.`,
        recommendation: `Run a scrape for ${cat} in your highest-converting borough today. Target at least 50 new prospects.`,
        confidence: 9,
        dataPoints: { category: cat, pending, performance: performance.find((p) => p.category === cat) },
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      });
    }
  }

  // ── Domain health: any domain at >80% of daily limit ──
  for (const dom of d.domains) {
    if (dom.isPaused) continue;
    if (dom.dailyLimit <= 0) continue;
    const util = dom.sendsToday / dom.dailyLimit;
    if (util > 0.8) {
      await maybeCreate("DOMAIN_HEALTH", `Domain ${dom.domain} near daily limit`, {
        title: `Domain ${dom.domain} near daily limit`,
        summary: `${dom.domain} has used ${Math.round(util * 100)}% of today's send capacity (${dom.sendsToday}/${dom.dailyLimit}).`,
        detail: `Daily limit is set by warmup day (${dom.warmupDay}). Pushing past the limit risks throttling and reputation damage. Other active domains will pick up overflow tomorrow.`,
        recommendation: `Either advance ${dom.domain}'s warmup day if reputation is healthy, or accept the cap and rely on rotation.`,
        confidence: 8,
        dataPoints: {
          domain: dom.domain,
          sendsToday: dom.sendsToday,
          dailyLimit: dom.dailyLimit,
          utilisation: util,
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }
  }

  // ── Scraper inactivity: no scrape run in 7 days ──
  const lastScrape = d.contacts
    .map((c) => c.scrapeLastRun)
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (!lastScrape || lastScrape < sevenDaysAgo) {
    await maybeCreate("SCRAPER_DIRECTION", "Scraper hasn't run in 7+ days", {
      title: "Scraper hasn't run in 7+ days",
      summary:
        "No new prospects have been sourced for over a week. Pipeline will starve.",
      detail: `Last scrape activity: ${lastScrape ? lastScrape.toISOString() : "never"}.`,
      recommendation:
        "Run a scrape for your top category today. Check the Brain's scraper directive box for the recommended target.",
      confidence: 9,
      dataPoints: { lastScrapeAt: lastScrape ?? null },
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    });
  }

  return created;
}

// ─── STEP 5 — FEEDBACK LOOP PROCESSING ────────────────────────────────────

async function processFeedbackLoops(): Promise<number> {
  // Insights that were ACTED or OVERRIDDEN with an outcome but no learning yet.
  const candidates = await prisma.brainInsight.findMany({
    where: {
      status: { in: ["ACTED", "OVERRIDDEN"] },
      outcome: { not: null },
    },
    include: {
      feedbackLoops: { where: { learningExtracted: { not: null } } },
    },
  });

  let learned = 0;
  for (const insight of candidates) {
    // Skip if we've already extracted a learning for the latest outcome.
    if (insight.feedbackLoops.length > 0) continue;

    let learning = "";
    try {
      learning = await extractFeedbackLearning(insight, insight.outcome ?? "");
    } catch (err) {
      console.error("[brain] extractFeedbackLearning failed:", err);
      continue;
    }

    if (!learning) continue;

    await prisma.feedbackLoop.create({
      data: {
        insightId: insight.id,
        action: insight.status,
        result: insight.outcome ?? "",
        learningExtracted: learning,
      },
    });

    // Persist the learning as a low-confidence pattern keyed by insight id so it
    // can be referenced by future Claude calls.
    const key = `learning:${insight.id}:applied`;
    await prisma.brainPattern.upsert({
      where: { patternKey: key },
      create: {
        patternKey: key,
        value: 1,
        sampleSize: 1,
        confidence: 4,
        trend: "stable",
      },
      update: { value: 1, sampleSize: 1, confidence: 4 },
    });
    learned++;
  }
  return learned;
}

// ─── PUBLIC: full Brain cycle ─────────────────────────────────────────────

export async function runBrainCycle(triggeredBy: string) {
  const start = Date.now();

  let patternsUpdated = 0;
  let insightsGenerated = 0;
  let summary = "";

  try {
    // Step 1
    const data = await collectData();

    // Step 2
    const { patternsUpdated: pu, rawData } = await extractPatterns(data);
    patternsUpdated = pu;

    // Step 3 — only call Claude if we have enough signal AND a key.
    const totalSignal =
      data.emailSends.length + data.calls.length + data.inboundLeads.length;
    const allPatterns = await prisma.brainPattern.findMany();

    if (totalSignal > 0 && process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "placeholder") {
      try {
        insightsGenerated += await generateAndStoreInsights(allPatterns, rawData);
      } catch (err) {
        console.error("[brain] insight generation failed:", err);
      }
    }

    // Step 4 — deterministic insights run regardless of Claude availability.
    insightsGenerated += await generateDeterministicInsights(data);

    // Step 5
    const learned = await processFeedbackLoops();

    summary = `${patternsUpdated} patterns, ${insightsGenerated} insights, ${learned} feedback learnings.`;
  } catch (err) {
    summary = `Cycle errored: ${err instanceof Error ? err.message : String(err)}`;
    console.error("[brain] cycle error:", err);
  }

  const durationMs = Date.now() - start;
  await prisma.brainCycle.create({
    data: {
      triggeredBy,
      insightsGenerated,
      patternsUpdated,
      durationMs,
      summary,
    },
  });

  return { insightsGenerated, patternsUpdated, durationMs, summary };
}

// Re-export for convenience.
export type { BrainInsight, BrainPattern };
