# Dimmlo Web - Workflow Guide

## Branch Strategy

- **`main`** = Live production (dimmlo.com and *.dimmlo.com)
- **`staging`** = Review/test environment (staging URLs from Vercel)

## Eddie's Workflow

### First Time Setup
```bash
git clone https://github.com/ari-mars/dimmlo-web.git
cd dimmlo-web
git checkout staging
```

### Daily Work
```bash
# Make sure you're on staging
git checkout staging

# Work on marketing site
# Work on main application
cd app
# Edit your files...

# When done
git add .
git commit -m "Description of what you changed"
git push origin staging
```

**IMPORTANT:** Never push to `main` - always work on `staging`

### Check Your Work
After pushing to staging, Vercel will deploy to staging URLs (check Vercel dashboard)

## Ari's Workflow (Publishing to Live)

### Review Eddie's Changes
1. Visit the staging URLs in Vercel
2. Check that everything looks good
3. If good → merge to main (see below)
4. If needs fixes → tell Eddie what to change

### Merge Staging to Production
```bash
cd /Users/ari/Development/dimmlo-web

# Get latest staging changes
git checkout staging
git pull origin staging

# Switch to main and merge
git checkout main
git pull origin main
git merge staging

# Push to production
git push origin main
```

**Within 30 seconds:** dimmlo.com and all client sites update.

### If Something Breaks

Revert the merge:
```bash
git checkout main
git revert HEAD
git push origin main
```

This undoes the last merge and rolls back to the previous version.

## Quick Reference

**Eddie's rule:** Only touch `staging` branch
**Ari's rule:** Only Ari merges `staging` → `main`

**Production URLs (live):**
- Main application (marketing site + admin/GTM engine): https://dimmlo.com
- Client sites: https://cafecolmado.dimmlo.com, https://dkelectrical.dimmlo.com, etc.
