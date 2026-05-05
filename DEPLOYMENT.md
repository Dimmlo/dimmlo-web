# Dimmlo Deployment Guide

## Overview

Two separate deployments from this repo:
1. **Marketing site** → `dimmlo.com`
2. **Client sites** → `*.dimmlo.com` (wildcard subdomain)

## Initial Setup

### 1. Push to GitHub

```bash
cd dimmlo-web
git add .
git commit -m "Initial Dimmlo web repo structure"
git branch -M main
git remote add origin git@github.com:yourusername/dimmlo-web.git
git push -u origin main
```

### 2. Vercel Setup - Marketing Site

1. Go to [vercel.com](https://vercel.com) and import the repo
2. Create project: **dimmlo-marketing**
3. Settings:
   - Root Directory: `marketing-site`
   - Build Command: (leave empty - static site)
   - Output Directory: `.`
4. Add custom domain: `dimmlo.com`
5. Deploy

### 3. Vercel Setup - Client Sites

1. Import the same repo again
2. Create project: **dimmlo-client-sites**
3. Settings:
   - Root Directory: `client-sites`
   - Build Command: `node build.js`
   - Output Directory: `build`
4. Add wildcard domain: `*.dimmlo.com`
5. Deploy

Now:
- `dimmlo.com` serves marketing site
- `cafecolmado.dimmlo.com` serves Café Colmado
- `dkelectrical.dimmlo.com` serves DK Electrical

## Adding New Clients

```bash
# 1. Create config
mkdir client-sites/clients/newclient
nano client-sites/clients/newclient/config.json

# 2. Commit and push
git add client-sites/clients/newclient/
git commit -m "Add newclient"
git push

# 3. Vercel auto-deploys
# Site available at newclient.dimmlo.com
```

## Updating Templates

```bash
# Edit template
nano client-sites/_template/styles.css

# Test locally
cd client-sites
npm run build
# Check build/cafecolmado/index.html

# Deploy
git add .
git commit -m "Update client site template"
git push
```

## Manual Deploy

If you need to deploy without pushing to git:

```bash
cd client-sites
vercel --prod
```

Or for marketing site:
```bash
cd marketing-site
vercel --prod
```

## DNS Configuration

### At your domain registrar (e.g., Namecheap, GoDaddy):

**For dimmlo.com:**
- Type: A
- Host: @
- Value: 76.76.21.21 (Vercel's IP)

**For wildcard subdomains:**
- Type: CNAME
- Host: *
- Value: cname.vercel-dns.com

Wait 24-48h for DNS propagation.

## Environment Variables

For automation scripts, add to Vercel environment variables:
- `ANTHROPIC_API_KEY`
- `AIRTABLE_TOKEN`
- `AIRTABLE_BASE_ID`

## Continuous Deployment

Both projects auto-deploy on push to main:
- Commit to `marketing-site/` → marketing site deploys
- Commit to `client-sites/` → all client sites rebuild

## Rollback

In Vercel dashboard:
- Deployments → find previous deployment → Promote to Production
