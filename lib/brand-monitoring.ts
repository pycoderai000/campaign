import { createHash } from "crypto";
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
  sourceType: "website" | "news" | "leadership" | "instagram" | "linkedin";
  sourceUrl: string | null;
  query: string | null;
  isActive: boolean;
  sortOrder: number;
  lastCheckedAt: Date | null;
  lastUsedApifyAt: Date | null;
  lastDiscoveryHash: string | null;
  lastError: string | null;
};

export type MonitoringFeedItem = {
  id: string;
  brandId: string;
  sourceId?: string;
  sourceType: "website" | "news" | "leadership" | "instagram" | "linkedin";
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

type SourceDiscoveryResult = {
  items: CandidateItem[];
  discoveryHash: string;
  fetchMethod: "direct" | "apify" | "news";
};

const RSS_PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
});

const DEFAULT_APIFY_WEBSITE_ACTOR_ID =
  process.env.APIFY_WEBSITE_ACTOR_ID || "apify/website-content-crawler";
const DEFAULT_APIFY_INSTAGRAM_ACTOR_ID =
  process.env.APIFY_INSTAGRAM_ACTOR_ID || "instagram-scraper/instagram-profile-posts-scraper";
const DEFAULT_APIFY_LINKEDIN_ACTOR_ID =
  process.env.APIFY_LINKEDIN_ACTOR_ID || "harvestapi/linkedin-company-posts";
const SOCIAL_POST_LIMIT = 6;
const SOURCE_COOLDOWN_HOURS = Math.max(
  1,
  Number(process.env.MONITORING_SOURCE_COOLDOWN_HOURS ?? "18")
);

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
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function createFingerprint(parts: Array<string | undefined>) {
  return createHash("sha256")
    .update(parts.filter(Boolean).join("\n"))
    .digest("hex");
}

function toApifyActorPath(actorId: string) {
  return actorId.trim().replace(/\//g, "~");
}

async function runApifyActor<T>(actorId: string, input: unknown, limit: number): Promise<T[]> {
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) return [];

  const response = await fetch(
    `https://api.apify.com/v2/acts/${toApifyActorPath(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(
      token
    )}&limit=${limit}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    throw new Error(`Apify actor failed: ${response.status}`);
  }

  const items = await response.json();
  return Array.isArray(items) ? (items as T[]) : [];
}

function fingerprintCandidateItems(items: CandidateItem[]) {
  return createFingerprint(
    items.slice(0, 20).flatMap((item) => [
      item.url,
      item.title,
      item.summary,
      item.publishedAt?.toISOString(),
    ])
  );
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

function isSourceOnCooldown(source: MonitoringSourceRow, now: Date, force: boolean) {
  if (force || !source.lastCheckedAt) return false;
  return now.getTime() - new Date(source.lastCheckedAt).getTime() < SOURCE_COOLDOWN_HOURS * 60 * 60 * 1000;
}

function extractInstagramUsername(source: MonitoringSourceRow) {
  const candidates = [source.sourceUrl, source.query, source.name]
    .map((value) => cleanText(value, 120))
    .filter(Boolean) as string[];

  for (const candidate of candidates) {
    const trimmed = candidate.trim();

    const urlMatch = trimmed.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
    if (urlMatch?.[1]) {
      return urlMatch[1].replace(/^@/, "");
    }

    if (/^@?[a-zA-Z0-9._]{1,30}$/.test(trimmed)) {
      return trimmed.replace(/^@/, "");
    }
  }

  return undefined;
}

function normalizeLinkedInTargetUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    return normalizeUrl(trimmed);
  }
  if (/^(company|in|school)\//i.test(trimmed)) {
    return normalizeUrl(`https://www.linkedin.com/${trimmed.replace(/^\/+/, "")}`);
  }
  return "";
}

function getLinkedInPrimaryImage(item: any) {
  const postImage = item.postImages?.[0]?.url;
  if (typeof postImage === "string" && postImage.trim()) return postImage.trim();

  const articleImage = item.article?.image?.url;
  if (typeof articleImage === "string" && articleImage.trim()) return articleImage.trim();

  const videoThumbnail = item.postVideo?.thumbnailUrl;
  if (typeof videoThumbnail === "string" && videoThumbnail.trim()) return videoThumbnail.trim();

  const authorImage = item.author?.avatar?.url || item.author?.picture?.url;
  if (typeof authorImage === "string" && authorImage.trim()) return authorImage.trim();

  return undefined;
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

async function scrapeGoogleNews(query: string): Promise<SourceDiscoveryResult> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    `${query} when:1d`
  )}&hl=en-US&gl=US&ceid=US:en`;
  const xml = await fetchText(url);
  const data = RSS_PARSER.parse(xml);
  const items = data?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];

  const normalizedItems = list
    .flatMap((item: any) => {
      const title = cleanText(item.title, 220);
      const normalizedItemUrl = normalizeUrl(item.link);
      if (!title || !normalizedItemUrl) return [];
      return [{
        title,
        summary: cleanText(item.description),
        url: normalizedItemUrl,
        publisher: cleanText(
          item.source?.["#text"] || item.source || item.author || "Google News",
          120
        ),
        publishedAt: parsePublishedDate(item.pubDate),
      } satisfies CandidateItem];
    })
    .slice(0, 12);

  return {
    items: normalizedItems,
    discoveryHash: fingerprintCandidateItems(normalizedItems),
    fetchMethod: "news",
  };
}

async function loadCheerio() {
  if (typeof globalThis.File === "undefined") {
    (globalThis as { File?: unknown }).File = class File {};
  }
  return import("cheerio");
}

async function extractWebsiteCandidates(
  html: string,
  sourceUrl: string,
  fallbackPublisher: string
): Promise<SourceDiscoveryResult> {
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
      const normalizedItemUrl = href ? normalizeUrl(href, sourceUrl) : "";
      if (!title || !normalizedItemUrl) return;
      try {
        const candidateHost = new URL(normalizedItemUrl).hostname;
        if (candidateHost !== sourceHost) return;
      } catch {
        return;
      }
      items.push({
        title,
        url: normalizedItemUrl,
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
  const fallbackItems =
    uniqueItems.length > 0
      ? uniqueItems
      : pageTitle
      ? [
          {
            title: pageTitle,
            summary: pageSummary,
            url: sourceUrl,
            imageUrl: metaImage ? normalizeUrl(metaImage, sourceUrl) : undefined,
            publisher: fallbackPublisher,
          },
        ]
      : [];

  return {
    items: fallbackItems,
    discoveryHash: createFingerprint([
      sourceUrl,
      pageTitle,
      pageSummary,
      metaImage ? normalizeUrl(metaImage, sourceUrl) : undefined,
      ...uniqueItems.slice(0, 20).flatMap((item) => [item.url, item.title]),
    ]),
    fetchMethod: "direct",
  };
}

async function scrapeWithApifyWebsiteCrawler(
  sourceUrl: string,
  publisher: string
): Promise<SourceDiscoveryResult> {
  const items = await runApifyActor<any>(
    DEFAULT_APIFY_WEBSITE_ACTOR_ID,
    {
      startUrls: [{ url: sourceUrl }],
      maxCrawlPages: 12,
      maxCrawlDepth: 1,
    },
    12
  );
  const normalizedItems = (Array.isArray(items) ? items : [])
    .flatMap((item) => {
      const title =
        cleanText(item.title, 220) ||
        cleanText(item.metadata?.title, 220) ||
        cleanText(item.url, 220);
      const normalizedItemUrl = normalizeUrl(item.url || sourceUrl);
      if (!title || !normalizedItemUrl) return [];
      return [{
        title,
        summary:
          cleanText(item.description) ||
          cleanText(item.metadata?.description) ||
          cleanText(item.text) ||
          cleanText(item.markdown),
        url: normalizedItemUrl,
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

  return {
    items: normalizedItems,
    discoveryHash: fingerprintCandidateItems(normalizedItems),
    fetchMethod: "apify",
  };
}

async function scrapeInstagramProfile(
  source: MonitoringSourceRow
): Promise<SourceDiscoveryResult> {
  const username = extractInstagramUsername(source);
  if (!username) {
    throw new Error("Instagram source requires a public profile URL or username");
  }

  const items = await runApifyActor<any>(
    DEFAULT_APIFY_INSTAGRAM_ACTOR_ID,
    {
      instagramUsernames: [username],
      postsPerProfile: SOCIAL_POST_LIMIT,
    },
    SOCIAL_POST_LIMIT
  );

  const normalizedItems = items
    .flatMap((item) => {
      const normalizedItemUrl = normalizeUrl(item.url || item.from_url || "");
      if (!normalizedItemUrl) return [];

      const caption = cleanText(item.caption, 320);
      const title =
        cleanText(item.caption, 220) ||
        cleanText(`${source.name} Instagram post`, 220);

      if (!title) return [];

      return [{
        title,
        summary: caption,
        url: normalizedItemUrl,
        imageUrl: normalizeUrl(item.image || "") || undefined,
        publisher:
          cleanText(
            item.owner?.username ? `@${item.owner.username}` : `@${username}`,
            120
          ) || source.name,
        publishedAt: parsePublishedDate(item.taken_at || item.crawled_at),
      } satisfies CandidateItem];
    })
    .slice(0, SOCIAL_POST_LIMIT);

  return {
    items: normalizedItems,
    discoveryHash: fingerprintCandidateItems(normalizedItems),
    fetchMethod: "apify",
  };
}

async function scrapeLinkedInPosts(
  source: MonitoringSourceRow
): Promise<SourceDiscoveryResult> {
  const sourceUrl = normalizeLinkedInTargetUrl(source.sourceUrl);
  if (!sourceUrl) {
    throw new Error("LinkedIn source requires a public company or profile URL");
  }

  const items = await runApifyActor<any>(
    DEFAULT_APIFY_LINKEDIN_ACTOR_ID,
    {
      targetUrls: [sourceUrl],
      maxPosts: SOCIAL_POST_LIMIT,
      postedLimit: "month",
      includeQuotePosts: true,
      includeReposts: true,
      scrapeReactions: false,
      scrapeComments: false,
    },
    SOCIAL_POST_LIMIT
  );

  const normalizedItems = items
    .flatMap((item) => {
      if (item?.type !== "post") return [];

      const normalizedItemUrl = normalizeUrl(
        item.article?.link || item.linkedinUrl || item.url || item.postUrl || sourceUrl
      );
      if (!normalizedItemUrl) return [];

      const content = cleanText(item.content, 320) || cleanText(item.commentary, 320);
      const title =
        cleanText(item.content, 220) ||
        cleanText(item.commentary, 220) ||
        cleanText(`${source.name} LinkedIn post`, 220);

      if (!title) return [];

      return [{
        title,
        summary: content,
        url: normalizedItemUrl,
        imageUrl: getLinkedInPrimaryImage(item),
        publisher:
          cleanText(item.author?.name, 120) ||
          cleanText(item.author?.fullName, 120) ||
          source.name,
        publishedAt: parsePublishedDate(
          item.postedAt?.date ||
            item.postedAt?.dateTime ||
            item.postedAt?.timestamp ||
            item.createdAt
        ),
      } satisfies CandidateItem];
    })
    .slice(0, SOCIAL_POST_LIMIT);

  return {
    items: normalizedItems,
    discoveryHash: fingerprintCandidateItems(normalizedItems),
    fetchMethod: "apify",
  };
}

async function scrapeWebsiteOrLeadership(
  source: MonitoringSourceRow
): Promise<SourceDiscoveryResult> {
  const sourceUrl = source.sourceUrl?.trim();
  if (!sourceUrl) {
    return { items: [], discoveryHash: "", fetchMethod: "direct" };
  }

  const html = await fetchText(sourceUrl);
  const directResult = await extractWebsiteCandidates(html, sourceUrl, source.name);

  // Cheap direct parsing is the default path. Only pay for Apify when direct discovery
  // cannot extract useful content and the page fingerprint changed since the last check.
  if (directResult.items.length > 0) {
    return directResult;
  }

  if (
    source.lastDiscoveryHash &&
    directResult.discoveryHash &&
    source.lastDiscoveryHash === directResult.discoveryHash
  ) {
    return directResult;
  }

  const apifyResult = await scrapeWithApifyWebsiteCrawler(sourceUrl, source.name);
  if (apifyResult.items.length > 0) {
    return {
      ...apifyResult,
      discoveryHash: directResult.discoveryHash || apifyResult.discoveryHash,
    };
  }

  return directResult;
}

async function scrapeSource(source: MonitoringSourceRow): Promise<SourceDiscoveryResult> {
  if (source.sourceType === "news") {
    const query = cleanText(`${source.name} ${source.query ?? ""}`, 200) || source.name;
    return scrapeGoogleNews(query);
  }
  if (source.sourceType === "instagram") {
    return scrapeInstagramProfile(source);
  }
  if (source.sourceType === "linkedin") {
    return scrapeLinkedInPosts(source);
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

async function updateSourceState(
  sourceId: string,
  patch: {
    lastCheckedAt?: Date;
    lastUsedApifyAt?: Date | null;
    lastDiscoveryHash?: string | null;
    lastError?: string | null;
  }
) {
  await db
    .update(brandMonitoringSources)
    .set({
      ...(patch.lastCheckedAt !== undefined && { lastCheckedAt: patch.lastCheckedAt }),
      ...(patch.lastUsedApifyAt !== undefined && { lastUsedApifyAt: patch.lastUsedApifyAt }),
      ...(patch.lastDiscoveryHash !== undefined && { lastDiscoveryHash: patch.lastDiscoveryHash }),
      ...(patch.lastError !== undefined && { lastError: patch.lastError }),
      updatedAt: new Date(),
    })
    .where(eq(brandMonitoringSources.id, sourceId));
}

export async function getMonitoringFeedItems(
  brandId: string,
  limit = 30
): Promise<MonitoringFeedItem[]> {
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
  force?: boolean;
} = {}) {
  const { brandId, dueOnly = false, force = false } = options;
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
      .where(
        and(
          eq(brandMonitoringSources.brandId, brand.id),
          eq(brandMonitoringSources.isActive, true)
        )
      )
      .orderBy(brandMonitoringSources.sortOrder);

    if (sources.length === 0) continue;

    const existingRows = await db
      .select({ url: brandScrapedItems.url })
      .from(brandScrapedItems)
      .where(eq(brandScrapedItems.brandId, brand.id));
    const existingUrls = new Set(existingRows.map((row) => row.url));

    let insertedCount = 0;
    for (const source of sources) {
      if (isSourceOnCooldown(source, now, force)) {
        continue;
      }

      try {
        const discovery = await scrapeSource(source);
        insertedCount += await persistItems(brand.id, source, existingUrls, discovery.items);
        await updateSourceState(source.id, {
          lastCheckedAt: now,
          lastUsedApifyAt:
            discovery.fetchMethod === "apify" ? now : undefined,
          lastDiscoveryHash: discovery.discoveryHash || null,
          lastError: null,
        });
      } catch (error) {
        console.error(`Monitoring sync failed for source ${source.id}`, error);
        await updateSourceState(source.id, {
          lastCheckedAt: now,
          lastError: error instanceof Error ? error.message : "Unknown monitoring sync error",
        });
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
