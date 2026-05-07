// Typed wrapper around the Outscraper Google Maps search API.
// Docs: https://app.outscraper.com/api-docs#tag/Businesses-and-POI/paths/~1maps~1search-v3/get

export type OutscraperResult = {
  businessName: string;
  phone: string;
  websiteUrl: string;
  googleMapsUrl: string;
  category: string;
  borough: string;
};

type RawResult = {
  name?: string;
  full_name?: string;
  phone?: string;
  phone_1?: string;
  site?: string;
  website?: string;
  google_id?: string;
  place_id?: string;
  url?: string;
  business_status?: string;
  status?: string;
  type?: string;
  category?: string;
};

const ENDPOINT = "https://api.app.outscraper.com/maps/search-v3";

// Sleep helper for backoff.
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function callOutscraper(
  query: string,
  limit: number,
  apiKey: string,
  attempt = 0
): Promise<{ data: RawResult[][] } | { id?: string; status?: string }> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("async", "false");
  url.searchParams.set("language", "en");
  url.searchParams.set("region", "US");

  const resp = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-API-KEY": apiKey,
      Accept: "application/json",
    },
  });

  if (resp.status === 429 || resp.status >= 500) {
    if (attempt >= 4) {
      throw new Error(`Outscraper failed after retries: ${resp.status}`);
    }
    const delay = 2 ** attempt * 1000;
    await sleep(delay);
    return callOutscraper(query, limit, apiKey, attempt + 1);
  }

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Outscraper error ${resp.status}: ${body}`);
  }

  return (await resp.json()) as { data: RawResult[][] };
}

function pickPhone(r: RawResult): string {
  return r.phone ?? r.phone_1 ?? "";
}

function pickWebsite(r: RawResult): string {
  return r.site ?? r.website ?? "";
}

function pickName(r: RawResult): string {
  return r.full_name ?? r.name ?? "";
}

function pickStatus(r: RawResult): string {
  return (r.business_status ?? r.status ?? "").toUpperCase();
}

// Search a category in a borough and return only contactable, operational
// records that have both a website and a phone number.
export async function scrapeCategory(
  category: string,
  borough: string,
  limit: number
): Promise<OutscraperResult[]> {
  const apiKey = process.env.OUTSCRAPER_API_KEY;
  if (!apiKey || apiKey === "placeholder") {
    throw new Error("OUTSCRAPER_API_KEY is not configured.");
  }

  const query = `${category} ${borough} New York`;
  const json = (await callOutscraper(query, limit, apiKey)) as {
    data?: RawResult[][];
  };

  const rows: RawResult[] = Array.isArray(json.data) ? json.data.flat() : [];

  const filtered = rows.filter((r) => {
    const phone = pickPhone(r);
    const website = pickWebsite(r);
    const status = pickStatus(r);
    return phone && website && status === "OPERATIONAL";
  });

  return filtered.map((r) => ({
    businessName: pickName(r),
    phone: pickPhone(r),
    websiteUrl: pickWebsite(r),
    googleMapsUrl: r.url ?? "",
    category,
    borough,
  }));
}
