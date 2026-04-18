import { and, desc, eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import { db, brands, brandMonitoringSources, brandScrapedItems } from "@/lib/db";

type MonitoringBrandRow = {
  id: string;
  name: string;
  monitoringEnabled: boolean;
  monitoringTime: string;
  monitoringLastRunAt: Date | null;
};

type MonitoringSourceRow = {
  id: string;
  brandId: string;
  name: string;
  sourceType: "website" | "news" | "leadership";
  sourceUrl: string | null;
  query: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type MonitoringFeedItem = {
  id: string;
  brandId: string;
  sourceId?: string;
  sourceType: "website" | "news" | "leadership";
  title: string;
  summary?: string;
  url: string;
  imageUrl?: string;
  publisher?: string;
  publishedAt?: string;
  createdAt: string;
};

type CandidateItem = {
  title: string;
  summary?: string;
  url: string;
  imageUrl?: string;
  publisher?: string;
  publishedAt?: Date;
};

const RSS_PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
});

const DEFAULT_APIFY_WEBSITE_ACTOR_ID =
  process.env.APIFY_WEBSITE_ACTOR_ID || "apify/website-content-crawler";

function cleanText(value: string | null | undefined, maxLength = 320) {
  const cleaned = (value ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1)}…` : cleaned;
}

function normalizeUrl(value: string, base?: string) {
  try {
    return new URL(value, base).toString();
  } catch {
    return "";
  }
}

function parsePublishedDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBrandDue(brand: MonitoringBrandRow, now = new Date()) {
  if (!brand.monitoringEnabled) return false;
  const [hours, minutes] = brand.monitoringTime.split(":").map((value) => Number(value));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return false;

  const dueAt = new Date(now);
  dueAt.setHours(hours, minutes, 0, 0);
  if (now < dueAt) return false;
  if (brand.monitoringLastRunAt && isSameDay(new Date(brand.monitoringLastRunAt), now)) {
    return false;
  }
  return true;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CampaignMonitoringBot/1.0; +https://apps.kaleidotechlabs.com)",
      Accept:
        "text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function scrapeGoogleNews(query: string) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    `${query} when:1d`
  )}&hl=en-US&gl=US&ceid=US:en`;
  const xml = await fetchText(url);
  const data = RSS_PARSER.parse(xml);
  const items = data?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];

  return list
    .flatMap((item: any) => {
      const title = cleanText(item.title, 220);
      const url = normalizeUrl(item.link);
      if (!title || !url) return [];
      return [{
        title,
        summary: cleanText(item.description),
        url,
        publisher: cleanText(
          item.source?.["#text"] || item.source || item.author || "Google News",
          120
        ),
        publishedAt: parsePublishedDate(item.pubDate),
      } satisfies CandidateItem];
    })
    .slice(0, 12);
}

async function loadCheerio() {
  if (typeof globalThis.File === "undefined") {
    (globalThis as { File?: unknown }).File = class File {};
  }
  return import("cheerio");
}

async function extractWebsiteCandidates(html: string, sourceUrl: string, fallbackPublisher: string) {
  const cheerio = await loadCheerio();
  const $ = cheerio.load(html);
  const items: CandidateItem[] = [];
  const sourceHost = new URL(sourceUrl).hostname;

  const metaImage =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content");
  const pageTitle =
    cleanText($("title").first().text(), 220) ||
    cleanText($('meta[property="og:title"]').attr("content"), 220);
  const pageSummary =
    cleanText($('meta[name="description"]').attr("content")) ||
    cleanText($('meta[property="og:description"]').attr("content"));

  $("article a, main a, h1 a, h2 a, h3 a, a[href*='/news'], a[href*='/press'], a[href*='/media'], a[href*='/updates']")
    .slice(0, 60)
    .each((_, element) => {
      const href = $(element).attr("href");
      const title =
        cleanText($(element).text(), 220) ||
        cleanText($(element).attr("title"), 220);
      const url = href ? normalizeUrl(href, sourceUrl) : "";
      if (!title || !url) return;
      try {
        const candidateHost = new URL(url).hostname;
        if (candidateHost !== sourceHost) return;
      } catch {
        return;
      }
      items.push({
        title,
        url,
        publisher: fallbackPublisher,
      });
    });

  const uniqueByUrl = new Map<string, CandidateItem>();
  for (const item of items) {
    if (!uniqueByUrl.has(item.url)) {
      uniqueByUrl.set(item.url, item);
    }
  }

  const uniqueItems = [...uniqueByUrl.values()].slice(0, 12);
  if (uniqueItems.length > 0) return uniqueItems;

  if (pageTitle) {
    return [
      {
        title: pageTitle,
        summary: pageSummary,
        url: sourceUrl,
        imageUrl: metaImage ? normalizeUrl(metaImage, sourceUrl) : undefined,
        publisher: fallbackPublisher,
      },
    ];
  }

  return [];
}

async function scrapeWithApifyWebsiteCrawler(sourceUrl: string, publisher: string) {
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) return [];

  const response = await fetch(
    `https://api.apify.com/v2/acts/${DEFAULT_APIFY_WEBSITE_ACTOR_ID}/run-sync-get-dataset-items?token=${encodeURIComponent(
      token
    )}&limit=12`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        startUrls: [{ url: sourceUrl }],
        maxCrawlPages: 12,
        maxCrawlDepth: 1,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Apify actor failed: ${response.status}`);
  }

  const items = (await response.json()) as any[];
  return (Array.isArray(items) ? items : [])
    .flatMap((item) => {
      const title =
        cleanText(item.title, 220) ||
        cleanText(item.metadata?.title, 220) ||
        cleanText(item.url, 220);
      const url = normalizeUrl(item.url || sourceUrl);
      if (!title || !url) return [];
      return [{
        title,
        summary:
          cleanText(item.description) ||
          cleanText(item.metadata?.description) ||
          cleanText(item.text) ||
          cleanText(item.markdown),
        url,
        imageUrl:
          cleanText(item.image) ||
          cleanText(item.metadata?.image) ||
          undefined,
        publisher,
        publishedAt: parsePublishedDate(
          item.publishedAt || item.metadata?.publishedAt || item.lastModified
        ),
      } satisfies CandidateItem];
    })
    .slice(0, 12);
}

async function scrapeWebsiteOrLeadership(source: MonitoringSourceRow) {
  const sourceUrl = source.sourceUrl?.trim();
  if (!sourceUrl) return [];

  try {
    const fromApify = await scrapeWithApifyWebsiteCrawler(sourceUrl, source.name);
    if (fromApify.length > 0) return fromApify;
  } catch {
    // Fallback to direct parsing below.
  }

  const html = await fetchText(sourceUrl);
  return extractWebsiteCandidates(html, sourceUrl, source.name);
}

async function scrapeSource(source: MonitoringSourceRow) {
  if (source.sourceType === "news") {
    const query = cleanText(`${source.name} ${source.query ?? ""}`, 200) || source.name;
    return scrapeGoogleNews(query);
  }
  return scrapeWebsiteOrLeadership(source);
}

async function persistItems(
  brandId: string,
  source: MonitoringSourceRow,
  existingUrls: Set<string>,
  items: CandidateItem[]
) {
  const freshItems = items
    .map((item) => ({
      ...item,
      url: item.url.trim(),
    }))
    .filter((item) => item.title && item.url && !existingUrls.has(item.url));

  if (freshItems.length === 0) return 0;

  await db.insert(brandScrapedItems).values(
    freshItems.map((item) => ({
      brandId,
      sourceId: source.id,
      sourceType: source.sourceType,
      title: item.title,
      summary: item.summary ?? null,
      url: item.url,
      imageUrl: item.imageUrl ?? null,
      publisher: item.publisher ?? source.name,
      publishedAt: item.publishedAt ?? null,
      rawData: null,
    }))
  );

  for (const item of freshItems) existingUrls.add(item.url);
  return freshItems.length;
}

export async function getMonitoringFeedItems(brandId: string, limit = 30): Promise<MonitoringFeedItem[]> {
  const rows = await db
    .select()
    .from(brandScrapedItems)
    .where(eq(brandScrapedItems.brandId, brandId))
    .orderBy(desc(brandScrapedItems.publishedAt), desc(brandScrapedItems.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    brandId: row.brandId,
    sourceId: row.sourceId ?? undefined,
    sourceType: row.sourceType,
    title: row.title,
    summary: row.summary ?? undefined,
    url: row.url,
    imageUrl: row.imageUrl ?? undefined,
    publisher: row.publisher ?? undefined,
    publishedAt: row.publishedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function runBrandMonitoringSync(options: {
  brandId?: string;
  dueOnly?: boolean;
} = {}) {
  const { brandId, dueOnly = false } = options;
  const now = new Date();

  const brandRows = brandId
    ? await db
        .select({
          id: brands.id,
          name: brands.name,
          monitoringEnabled: brands.monitoringEnabled,
          monitoringTime: brands.monitoringTime,
          monitoringLastRunAt: brands.monitoringLastRunAt,
        })
        .from(brands)
        .where(eq(brands.id, brandId))
    : await db
        .select({
          id: brands.id,
          name: brands.name,
          monitoringEnabled: brands.monitoringEnabled,
          monitoringTime: brands.monitoringTime,
          monitoringLastRunAt: brands.monitoringLastRunAt,
        })
        .from(brands);

  const results: { brandId: string; brandName: string; insertedCount: number; sourceCount: number }[] = [];

  for (const brand of brandRows) {
    if (dueOnly && !isBrandDue(brand, now)) continue;

    const sources = await db
      .select()
      .from(brandMonitoringSources)
      .where(and(eq(brandMonitoringSources.brandId, brand.id), eq(brandMonitoringSources.isActive, true)))
      .orderBy(brandMonitoringSources.sortOrder);

    if (sources.length === 0) continue;

    const existingRows = await db
      .select({ url: brandScrapedItems.url })
      .from(brandScrapedItems)
      .where(eq(brandScrapedItems.brandId, brand.id));
    const existingUrls = new Set(existingRows.map((row) => row.url));

    let insertedCount = 0;
    for (const source of sources) {
      try {
        const items = await scrapeSource(source);
        insertedCount += await persistItems(brand.id, source, existingUrls, items);
      } catch (error) {
        console.error(`Monitoring sync failed for source ${source.id}`, error);
      }
    }

    await db
      .update(brands)
      .set({ monitoringLastRunAt: new Date() })
      .where(eq(brands.id, brand.id));

    results.push({
      brandId: brand.id,
      brandName: brand.name,
      insertedCount,
      sourceCount: sources.length,
    });
  }

  return {
    processedAt: now.toISOString(),
    brandCount: results.length,
    results,
  };
}
