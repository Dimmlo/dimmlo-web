# Eddie - Getting Started with Dimmlo Web

Hey Eddie! Here's everything you need to work on the Dimmlo main application (marketing site + admin/GTM engine).

## What You'll Be Working On

You'll be editing files in the `app/` folder. That's the main application (marketing site + admin/GTM engine).

Your changes go to a **staging site first** so Ari can review before they go live.

## First Time Setup (5 minutes)

### 1. Install Git (if you don't have it)
- Mac: Open Terminal, type `git --version` (it will install automatically)
- Windows: Download from git-scm.com

### 2. Clone the Repository
```bash
git clone https://github.com/ari-mars/dimmlo-web.git
cd dimmlo-web
```

### 3. Switch to Staging Branch
```bash
git checkout staging
```

You're now ready to work!

## Your Daily Workflow

### Making Changes

1. **Make sure you're on staging:**
   ```bash
   git checkout staging
   ```

2. **Edit files in `app/` folder:**
   - `index.html` - main page structure (or app entry files)
   - `css/styles.css` - styling
   - `js/main.js` - JavaScript
   - Add images to `public/` or `images/` folder as appropriate

3. **Save your work to Git:**
   ```bash
   git add .
   git commit -m "Brief description of what you changed"
   git push origin staging
   ```

### See Your Changes Live

After pushing, Vercel automatically deploys to staging in ~30 seconds.
Check Vercel dashboard for the staging URL.

### If You Need to Make More Changes

Just edit and push again:
```bash
# Edit more files...
git add .
git commit -m "Fixed navigation"
git push origin staging
```

## Important Rules

🚫 **Never push to `main` branch** - that's the live site
✅ **Always work on `staging` branch**
✅ **Ari merges staging → main after reviewing**

## Helpful Git Commands

```bash
# Check which branch you're on
git branch

# See what files you changed
git status

# Get latest changes from GitHub
git pull origin staging

# Undo changes to a file (before committing)
git checkout -- filename.html
```

## File Structure

```
app/
├── index.html          ← Main page or Next.js app entry
├── css/
│   └── styles.css     ← All styling
├── js/
│   └── main.js        ← JavaScript
└── images/            ← Put images here (or use `public/` for Next.js)
```

## Brand Colors Already Set

In `styles.css`, these are defined:
- Dark: `#1F2124`
- Teal: `#267D85`

Use these variables:
```css
color: var(--dimmlo-dark);
background: var(--dimmlo-teal);
```

## Questions?

Ask Ari or check out:
- `README.md` - overall project structure
- `WORKFLOW.md` - detailed staging/production workflow

---

**TL;DR:**
1. `git checkout staging`
2. Edit `app/` files
3. `git add . && git commit -m "message" && git push origin staging`
4. Tell Ari to review
