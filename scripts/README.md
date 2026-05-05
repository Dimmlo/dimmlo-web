# Dimmlo Automation Scripts

Node.js scripts for processing WhatsApp messages and updating client content.

## Scripts

- `transcript_to_brief.js` - Extracts structured data from onboarding transcripts
- `message_to_content.js` - Processes client WhatsApp messages into publishable content
- `weekly_digest.js` - Generates weekly summary of client activity
- `update_from_questionnaire.js` - Updates client record from questionnaire responses

## Setup

```bash
npm install
cp .env.example .env
# Add your API keys to .env
```

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
AIRTABLE_TOKEN=pat...
AIRTABLE_BASE_ID=app8FpGeTDy1KSupZ
```

## Usage

Run scripts directly:
```bash
node transcript_to_brief.js
node message_to_content.js
```

Or integrate into your workflow via cron, webhooks, or manual triggers.

## Adding Eddie's Code

Place Eddie's marketing site code in `../marketing-site/`
These scripts are separate - they handle automation, not the public-facing sites.
