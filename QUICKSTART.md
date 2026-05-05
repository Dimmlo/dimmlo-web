# Quick Start - Dimmlo Web Repo

## What You Have

```
dimmlo-web/
├── marketing-site/          ← dimmlo.com (Eddie's code goes here)
├── client-sites/            ← cafecolmado.dimmlo.com, dkelectrical.dimmlo.com, etc.
└── scripts/                 ← Your Node.js automation scripts
```

## Next Steps

### 1. Push to GitHub (5 minutes)

```bash
# Create repo on GitHub (via web interface)
# Name it: dimmlo-web

# Then push:
cd /path/to/this/folder
git remote add origin git@github.com:YOUR_USERNAME/dimmlo-web.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel (10 minutes)

**Two separate projects:**

**Project 1: Marketing Site**
- Import: dimmlo-web repo
- Name: `dimmlo-marketing`
- Root Directory: `marketing-site`
- Build Command: (empty)
- Output: `.`
- Domain: `dimmlo.com`

**Project 2: Client Sites**
- Import: dimmlo-web repo (same repo, different project)
- Name: `dimmlo-client-sites`
- Root Directory: `client-sites`
- Build Command: `node build.js`
- Output: `build`
- Domain: `*.dimmlo.com` (wildcard)

### 3. Add Eddie's Code

```bash
# Copy Eddie's files into marketing-site/
cp -r /path/to/eddie/files/* marketing-site/

git add marketing-site/
git commit -m "Add Eddie's marketing site code"
git push
# Vercel auto-deploys
```

### 4. Test Client Sites

Visit:
- https://cafecolmado.dimmlo.com
- https://dkelectrical.dimmlo.com

Both should render with their custom branding from config.json.

### 5. Add Your Automation Scripts

```bash
cd scripts/

# Copy your existing scripts
cp /path/to/transcript_to_brief.js .
cp /path/to/message_to_content.js .
cp /path/to/weekly_digest.js .
cp /path/to/update_from_questionnaire.js .

# Install dependencies
npm install

# Set up environment
cp .env.example .env
nano .env  # Add your API keys

# Test
node transcript_to_brief.js
```

## Adding a New Client

```bash
# 1. Create config
mkdir client-sites/clients/newclientname
nano client-sites/clients/newclientname/config.json
# Copy structure from cafecolmado/config.json

# 2. Deploy
git add .
git commit -m "Add new client: newclientname"
git push

# 3. Done
# Site live at: https://newclientname.dimmlo.com
```

## Updating Template (affects ALL clients)

```bash
# Edit the shared template
nano client-sites/_template/styles.css

# Test locally first
cd client-sites
node build.js
# Check build/cafecolmado/index.html looks good

# Deploy
git add .
git commit -m "Update client site template"
git push
```

## Architecture Wins

✓ **One repo** - everything versioned together
✓ **One template** - fix bugs once, all clients benefit
✓ **Config-driven** - new client = one JSON file
✓ **Vercel handles scaling** - no infra to manage
✓ **Separate deployments** - marketing site changes don't affect clients

## When Things Scale

You have 10 clients? Same workflow.
You have 100 clients? Same workflow.
Template bug? Fix once, push, all clients updated.

The structure won't change until you're past 1000 clients or need dynamic server-side rendering.

---

**Questions?** You know where to find me.
