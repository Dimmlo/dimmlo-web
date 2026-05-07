# Dimmlo GTM Engine

Local full-stack app that helps Eddie Robb find, qualify, and convert small US
businesses with stale websites into Dimmlo customers. Runs end-to-end on a
single MacBook with `npm run dev`.

## Stack
- Next.js 14 (App Router) + TypeScript
- PostgreSQL via Neon
- Prisma ORM
- Tailwind CSS (mobile-first)
- Anthropic Claude (`claude-sonnet-4-20250514`) — personalisation, scoring, briefings, the Brain
- OpenAI Whisper — call transcription
- Resend — email sending
- Twilio — outbound calls + recording
- Outscraper — Google Maps prospect sourcing
- Playwright — headless stale-site scoring

## First-time setup

```bash
cd ~/dimmlo-gtm
cp .env.local.example .env.local   # fill in real values (see checklist below)
npm install
npx playwright install chromium    # only the first time
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

App will be on http://localhost:3000.

Default admin password is `admin` (used when `ADMIN_PASSWORD` is unset or
"placeholder"). Login screen is at /login; the admin app is at /admin.

## Environment variables — required before real sending / calling

| Variable | Why it's needed |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string. Without this, every DB call fails (the UI degrades gracefully but is unusable in practice). |
| `ADMIN_PASSWORD` | Locks the /admin app. Falls back to `admin` if unset. |
| `ANTHROPIC_API_KEY` | Required for Claude personalisation, call scoring, daily briefing, and the Brain. The app boots without it; calls throw at use time with a clear error. |
| `OPENAI_API_KEY` | Required for Whisper transcription of call recordings. |
| `OUTSCRAPER_API_KEY` | Required for the Google Maps scraper. |
| `RESEND_API_KEY` | Required to send emails. |
| `RESEND_FROM_DOMAIN` | The domain you've verified in Resend (used as the default From host). |
| `TWILIO_ACCOUNT_SID` | Required for outbound calls. |
| `TWILIO_AUTH_TOKEN` | Required for outbound calls. |
| `TWILIO_PHONE_NUMBER` | Outbound caller ID. |
| `CRON_SECRET` | Header secret for cron routes. Cron routes return 500 if this is unset. |
| `BASE_URL` | Used for tracking pixel + click URLs. Defaults to `http://localhost:3000`. |

## Add a sending domain to Resend

1. Resend dashboard → Domains → Add domain → enter e.g. `1dimmlo.com`.
2. Add the SPF, DKIM, and DMARC DNS records Resend provides to your domain registrar.
3. Wait for the green "Verified" tick in Resend (usually under an hour).
4. In the Dimmlo admin: /admin/domains → "Add domain" → set the domain and a from email like `eddie@1dimmlo.com`.
5. Repeat for each warmup domain. The seed file pre-populates 5 placeholder
   domains (`1dimmlo.com` through `5dimmlo.com`); replace with your real ones.

## Run the scraper

Standalone (uses ts-node, doesn't require Next.js to be running):

```bash
npx ts-node --project tsconfig.scripts.json scripts/scrape.ts \
  --category="plumber" --borough="Brooklyn"
```

Optional `--limit=N` (default 25). Or use the `npm run scrape` shortcut.

## Trigger crons manually (local dev)

```bash
# Process due email sequences (one send per available domain per run)
curl -X POST -H "x-cron-secret: $CRON_SECRET" \
  http://localhost:3000/api/cron/process-sequences

# Reset daily send counters and snapshot domain stats
curl -X POST -H "x-cron-secret: $CRON_SECRET" \
  http://localhost:3000/api/cron/reset-daily-sends

# Run a Brain cycle
curl -X POST -H "x-cron-secret: $CRON_SECRET" \
  http://localhost:3000/api/cron/brain
```

Recommended schedules in production:
- `process-sequences` — hourly during business hours
- `reset-daily-sends` — daily at 00:05 UTC
- `brain` — every 6 hours

Local cron via shell loop (replace `$CRON_SECRET`):

```bash
while true; do
  curl -s -X POST -H "x-cron-secret: $CRON_SECRET" \
    http://localhost:3000/api/cron/brain > /dev/null
  sleep 21600
done
```

## The Brain

The Brain is the always-learning intelligence layer that reads every signal
in the system — scrape data, email performance, call transcripts, inbound
leads — and continuously evolves its understanding of what works.

### How it runs

- **Scheduled**: every 6 hours via `POST /api/cron/brain` with `x-cron-secret`
- **Manual**: `POST /api/admin/brain/run` from the Brain dashboard ("Run now")
- **Event-driven**: every 10th call in a category triggers a partial cycle
  (see `lib/brain-triggers.ts`)

### What a cycle does

1. Pulls 30 days of email sends, events, campaign contacts, calls, contacts,
   inbound leads, and domain stats in parallel.
2. Upserts `BrainPattern` records for category / borough / subject /
   send-time / objection metrics. Each pattern carries a `value`, `sampleSize`,
   `confidence`, and `trend` (`up` / `down` / `stable`).
3. Calls Claude with the full pattern set + raw aggregates. Claude returns
   up to 8 actionable insights (`BrainInsightDraft`s). Insights with
   confidence < 6, or near-duplicates of insights generated in the last 7
   days, are filtered out.
4. Generates deterministic insights without Claude:
   - `PIPELINE_GAP` if a top-3 reply-rate category has < 20 PENDING prospects
   - `DOMAIN_HEALTH` if any active domain has used > 80% of today's daily limit
   - `SCRAPER_DIRECTION` if no scrape has run in 7 days
5. Processes any closed feedback loops (insights with status ACTED or
   OVERRIDDEN and a non-null outcome) and stores the extracted learning in
   `FeedbackLoop` and a low-confidence `BrainPattern`.
6. Logs the run in `BrainCycle`.

### Insight types

| Type | What it means |
| --- | --- |
| `CATEGORY_PERFORMANCE` | A category is over- or under-performing on email or call metrics |
| `BOROUGH_PERFORMANCE` | A borough is over- or under-performing |
| `EMAIL_VARIANT` | A subject line / variant is winning |
| `CALL_PATTERN` | An objection is trending or call outcomes are shifting |
| `SCRAPER_DIRECTION` | The Brain recommends a new category / borough to scrape |
| `TIMING_PATTERN` | A specific day-hour is producing outsized open rates |
| `PROSPECT_QUALITY` | High-score sites convert differently than expected |
| `CONTENT_SUGGESTION` | A post / piece of content based on call transcript themes |
| `DOMAIN_HEALTH` | A sending domain is approaching a threshold |
| `PIPELINE_GAP` | Pipeline is running thin in a top category |

### Closing the feedback loop

When you act on an insight, click "Act on this" → an outcome textarea opens.
Tell the Brain what happened. That outcome triggers
`extractFeedbackLearning()` (Claude) which extracts a one-sentence learning
that's stored in `FeedbackLoop` and used in future cycles. **The more
outcomes you fill in, the smarter the Brain gets.** If you disagree with a
recommendation, click "Override" and explain why — that's also fed back.

### Where to read insights

`/admin/brain` — full feed, pattern map, scraper directive, current call
script, and brain activity log.

## Project structure

```
~/dimmlo-gtm/
├── app/
│   ├── page.tsx                       # public homepage
│   ├── [category]/page.tsx            # public landing pages
│   ├── login/page.tsx                 # admin login
│   ├── admin/                         # protected admin app
│   │   ├── page.tsx                   # dashboard + briefing
│   │   ├── brain/page.tsx             # the Brain
│   │   ├── prospects/page.tsx
│   │   ├── campaigns/page.tsx
│   │   ├── contacts/{,import/}page.tsx
│   │   ├── domains/page.tsx
│   │   ├── calls/page.tsx
│   │   └── landing-pages/page.tsx
│   └── api/                           # API routes
│       ├── inbound/                   # public lead capture
│       ├── email/track/{open,click}/  # tracking pixel + redirect
│       ├── email/unsubscribe/
│       ├── webhooks/twilio/
│       ├── cron/{process-sequences,reset-daily-sends,brain}/
│       └── admin/{prospects,campaigns,contacts,domains,calls,landing-pages,intelligence,brain,login}/
├── components/{admin,public}/
├── lib/                               # one-file-per-integration
│   ├── prisma.ts auth.ts
│   ├── claude.ts resend.ts twilio.ts whisper.ts
│   ├── outscraper.ts playwright-scorer.ts
│   ├── domain-rotation.ts warmup.ts email-builder.ts
│   ├── brain.ts brain-triggers.ts
├── prisma/schema.prisma + seed.ts
├── scripts/scrape.ts                  # standalone ts-node scraper
└── middleware.ts                      # admin auth gate
```
