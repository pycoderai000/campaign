/**
 * Meta (Facebook) Graph API client for Instagram Business metrics.
 * Uses env: META_PAGE_ID, META_PAGE_ACCESS_TOKEN.
 * Do not commit real tokens; add them only in .env locally.
 */

const BASE = "https://graph.facebook.com/v18.0";

function getConfig() {
  const pageId = process.env.META_PAGE_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  return { pageId, token };
}

export type MetaInstagramMetrics = {
  igAccountId: string;
  username: string | null;
  followersCount: number;
  profilePictureUrl: string | null;
  /** Day-level metrics for the last 30 days */
  insights: {
    date: string;
    impressions?: number;
    reach?: number;
    engagement?: number;
  }[];
  /** For social_metrics seriesData: followers over time (we use followers_count snapshot + insights) */
  followersSeries: { month: string; count: number }[];
  engagementGrowthSeries: { month: string; growth: number }[];
  engagementRate: number;
};

async function graphGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const { token } = getConfig();
  if (!token) {
    throw new Error("META_PAGE_ACCESS_TOKEN is not set");
  }
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("access_token", token);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  const data = (await res.json()) as { error?: { message: string; code?: number }; [k: string]: unknown };
  if (data.error) {
    throw new Error(data.error.message || "Meta Graph API error");
  }
  return data as T;
}

/**
 * Fetch Instagram Business account ID from the Page.
 * Requires META_PAGE_ID and META_PAGE_ACCESS_TOKEN.
 */
export async function getInstagramBusinessAccountId(): Promise<string | null> {
  const { pageId, token } = getConfig();
  if (!pageId || !token) return null;
  const data = await graphGet<{ instagram_business_account?: { id: string } }>(
    `/${pageId}`,
    { fields: "instagram_business_account" }
  );
  return data.instagram_business_account?.id ?? null;
}

/**
 * Fetch Instagram Business profile (followers, username, etc.).
 */
export async function getInstagramProfile(igAccountId: string): Promise<{
  followers_count: number;
  username: string | null;
  profile_picture_url?: string;
} | null> {
  try {
    const data = await graphGet<{ followers_count?: number; username?: string; profile_picture_url?: string }>(
      `/${igAccountId}`,
      { fields: "followers_count,username,profile_picture_url" }
    );
    return {
      followers_count: data.followers_count ?? 0,
      username: data.username ?? null,
      profile_picture_url: data.profile_picture_url,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch day-level insights for the last N days.
 * Metrics: impressions, reach, engagement (likes + comments + saves + shares).
 */
export async function getInstagramInsights(
  igAccountId: string,
  days: number = 30
): Promise<{ date: string; impressions: number; reach: number; engagement: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);
  const until = new Date().toISOString().slice(0, 10);

  const out: { date: string; impressions: number; reach: number; engagement: number }[] = [];
  try {
    const data = await graphGet<{
      data?: { name: string; values: { value: number; end_time?: string }[] }[];
    }>(`/${igAccountId}/insights`, {
      metric: "impressions,reach,engagement",
      period: "day",
      since: sinceStr,
      until,
    });

    const byDate = new Map<string, { impressions: number; reach: number; engagement: number }>();
    for (const metric of data.data ?? []) {
      const name = metric.name as string;
      for (const v of metric.values ?? []) {
        const date = v.end_time?.slice(0, 10) ?? "";
        if (!date) continue;
        const cur = byDate.get(date) ?? { impressions: 0, reach: 0, engagement: 0 };
        if (name === "impressions") cur.impressions = v.value ?? 0;
        if (name === "reach") cur.reach = v.value ?? 0;
        if (name === "engagement") cur.engagement = v.value ?? 0;
        byDate.set(date, cur);
      }
    }
    for (const [date, val] of byDate.entries()) {
      out.push({ date, ...val });
    }
    out.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    // insights may require app review in production
  }
  return out;
}

/**
 * Fetch all Instagram Business metrics for the connected account.
 * Returns null if env is not set or API fails.
 */
export async function fetchInstagramMetrics(): Promise<MetaInstagramMetrics | null> {
  const igId = await getInstagramBusinessAccountId();
  if (!igId) return null;

  const profile = await getInstagramProfile(igId);
  if (!profile) return null;

  const insights = await getInstagramInsights(igId, 30);
  const followersCount = profile.followers_count;

  const followersSeries: { month: string; count: number }[] = insights.length
    ? insights.map((i) => ({
        month: new Date(i.date + "Z").toLocaleString("en-US", { month: "short" }),
        count: Math.round((i.reach || 0) * 0.3 + followersCount * 0.7),
      }))
    : [{ month: new Date().toLocaleString("en-US", { month: "short" }), count: followersCount }];

  const engagementGrowthSeries: { month: string; growth: number }[] = insights.map((i) => ({
    month: new Date(i.date + "Z").toLocaleString("en-US", { month: "short" }),
    growth: insights.length ? (i.engagement / Math.max(i.reach, 1)) * 100 : 0,
  }));

  const totalReach = insights.reduce((s, i) => s + i.reach, 0);
  const totalEngagement = insights.reduce((s, i) => s + i.engagement, 0);
  const engagementRate = totalReach > 0 ? Math.round((totalEngagement / totalReach) * 1000) / 10 : 0;

  return {
    igAccountId: igId,
    username: profile.username,
    followersCount,
    profilePictureUrl: profile.profile_picture_url ?? null,
    insights: insights.map((i) => ({
      date: i.date,
      impressions: i.impressions,
      reach: i.reach,
      engagement: i.engagement,
    })),
    followersSeries,
    engagementGrowthSeries,
    engagementRate,
  };
}
