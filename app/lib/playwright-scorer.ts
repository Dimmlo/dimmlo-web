import { chromium, type Browser } from "playwright";

export type SiteScore = {
  url: string;
  score: number | null;
  lastModified: Date | null;
  copyrightYear: number | null;
  cms: string | null;
  hasActiveBlog: boolean;
  lastBlogPost: Date | null;
  brokenLinksCount: number;
  notes: string[];
  redirectedToPlatform: string | null;
};

const PLATFORM_HOSTS = [
  "yelp.com",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "tiktok.com",
  "google.com",
];

const TIMEOUT_MS = 10_000;

function detectCms(html: string): string | null {
  const m = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i);
  if (m) return m[1].toLowerCase();
  if (/wix\.com/i.test(html)) return "wix";
  if (/squarespace/i.test(html)) return "squarespace";
  if (/wp-content|wordpress/i.test(html)) return "wordpress";
  return null;
}

function extractCopyrightYear(text: string): number | null {
  // Match the largest year that looks like a copyright (2000-2099) anywhere
  // near the © symbol or the word "Copyright".
  const re = /(?:©|copyright|&copy;)[^0-9]{0,40}(20\d{2})/gi;
  let best: number | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const y = parseInt(m[1], 10);
    if (best === null || y > best) best = y;
  }
  return best;
}

function looksLikeBlogLink(href: string, text: string): boolean {
  const h = href.toLowerCase();
  const t = text.toLowerCase();
  return /\/(blog|news|articles|posts|insights)(\/|$)/.test(h) ||
    /\b(blog|news|articles|insights)\b/.test(t);
}

function parseDateLoose(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) return _browser;
  _browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  return _browser;
}

export async function closeBrowser(): Promise<void> {
  if (_browser) {
    try {
      await _browser.close();
    } catch {
      // ignore
    }
    _browser = null;
  }
}

export async function scoreWebsite(url: string): Promise<SiteScore> {
  const result: SiteScore = {
    url,
    score: 0,
    lastModified: null,
    copyrightYear: null,
    cms: null,
    hasActiveBlog: false,
    lastBlogPost: null,
    brokenLinksCount: 0,
    notes: [],
    redirectedToPlatform: null,
  };

  const browser = await getBrowser();
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36",
  });
  const page = await ctx.newPage();

  try {
    let resp;
    try {
      resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.notes.push(`navigation failed: ${msg}`);
      result.score = null;
      return result;
    }

    const finalUrl = page.url();
    try {
      const finalHost = new URL(finalUrl).hostname.replace(/^www\./, "");
      const platform = PLATFORM_HOSTS.find((p) => finalHost.endsWith(p));
      if (platform) {
        result.redirectedToPlatform = platform;
        result.notes.push(`redirected to platform: ${platform}`);
        result.score = null;
        return result;
      }
    } catch {
      // ignore parse errors
    }

    const headers = resp?.headers() ?? {};
    const lastModHeader = headers["last-modified"];
    const lastModified = parseDateLoose(lastModHeader);
    if (lastModified) result.lastModified = lastModified;

    const html = await page.content();
    const text = await page.evaluate(() => document.body?.innerText ?? "");

    // Copyright year check
    const cYear = extractCopyrightYear(text) ?? extractCopyrightYear(html);
    result.copyrightYear = cYear;
    const currentYear = new Date().getFullYear();
    if (cYear !== null && cYear < currentYear - 1) {
      result.score! += 3;
      result.notes.push(`copyright year ${cYear} (>1 year old)`);
    }

    // Last-Modified header check
    if (lastModified) {
      const ageMonths =
        (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (ageMonths > 12) {
        result.score! += 2;
        result.notes.push(`Last-Modified header > 12 months old`);
      }
    }

    // Blog detection
    const blogLinks: string[] = await page.$$eval("a", (anchors) => {
      const out: { href: string; text: string }[] = [];
      for (const a of anchors as HTMLAnchorElement[]) {
        out.push({ href: a.href || "", text: (a.textContent ?? "").trim() });
      }
      return out
        .filter((x) =>
          /\/(blog|news|articles|posts|insights)(\/|$)/i.test(x.href) ||
          /\b(blog|news|articles|insights)\b/i.test(x.text.toLowerCase())
        )
        .map((x) => x.href)
        .filter((h) => h && /^https?:/i.test(h))
        .slice(0, 5);
    });

    if (blogLinks.length === 0) {
      result.score! += 1;
      result.notes.push("no blog or news section found");
    } else {
      // Visit the first plausible blog link, look for the most recent post date.
      try {
        await page.goto(blogLinks[0], { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
        const blogText = await page.evaluate(() => document.body?.innerText ?? "");
        // Look for any date strings of the last 5 years.
        const dateRe = /\b(20\d{2})[-\/\s](\d{1,2})[-\/\s](\d{1,2})\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(20\d{2})\b/gi;
        let mostRecent: Date | null = null;
        let m: RegExpExecArray | null;
        while ((m = dateRe.exec(blogText))) {
          let d: Date | null = null;
          if (m[1]) {
            d = new Date(`${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`);
          } else if (m[4]) {
            d = new Date(`${m[4]} ${m[5]}, ${m[6]}`);
          }
          if (d && !Number.isNaN(d.getTime())) {
            if (!mostRecent || d > mostRecent) mostRecent = d;
          }
        }
        result.lastBlogPost = mostRecent;
        if (mostRecent) {
          const months = (Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24 * 30);
          if (months > 6) {
            result.score! += 2;
            result.notes.push(`last blog post > 6 months ago (${mostRecent.toISOString().slice(0, 10)})`);
          } else {
            result.hasActiveBlog = true;
          }
        } else {
          // No dates parsed — treat as inactive blog.
          result.score! += 2;
          result.notes.push("blog has no parseable post dates");
        }
      } catch {
        result.notes.push("blog page failed to load");
      }
    }

    // Broken internal links — sample first 10 internal links and HEAD them.
    try {
      const origin = new URL(finalUrl).origin;
      const internalLinks: string[] = await page.$$eval(
        "a",
        (anchors, originArg: unknown) => {
          const o = originArg as string;
          const out: string[] = [];
          for (const a of anchors as HTMLAnchorElement[]) {
            const h = a.href;
            if (h && h.startsWith(o)) out.push(h);
          }
          return Array.from(new Set(out)).slice(0, 10);
        },
        origin
      );

      let broken = 0;
      await Promise.all(
        internalLinks.map(async (link) => {
          try {
            const r = await fetch(link, { method: "HEAD", redirect: "follow" });
            if (r.status >= 400) broken += 1;
          } catch {
            broken += 1;
          }
        })
      );
      result.brokenLinksCount = broken;
      if (broken > 2) {
        result.score! += 1;
        result.notes.push(`${broken} broken internal links`);
      }
    } catch {
      // ignore
    }

    // CMS detection + old-version flag
    const cms = detectCms(html);
    result.cms = cms;
    if (cms) {
      // Heuristic: if generator string contains a version like x.y where x < 5,
      // assume old CMS. Otherwise no penalty.
      const versionMatch = cms.match(/(\d+)\.(\d+)/);
      if (versionMatch) {
        const major = parseInt(versionMatch[1], 10);
        if (major > 0 && major < 5) {
          result.score! += 1;
          result.notes.push(`old CMS version detected: ${cms}`);
        }
      }
    }

    if (result.score !== null && result.score > 10) result.score = 10;
    return result;
  } finally {
    await page.close().catch(() => {});
    await ctx.close().catch(() => {});
  }
}
