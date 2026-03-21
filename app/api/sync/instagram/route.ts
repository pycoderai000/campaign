import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db, socialMetrics, brands } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { fetchInstagramMetrics } from "@/lib/meta-graph";

/**
 * POST /api/sync/instagram
 * Body: { brandId: string }
 * Admin only. Fetches Instagram Business metrics from Meta Graph API (using
 * META_PAGE_ID + META_PAGE_ACCESS_TOKEN) and saves them into social_metrics
 * for the given brand. Add your Meta credentials in .env – never commit them.
 */
export async function POST(request: Request) {
  try {
    await requireAuth("admin");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  let body: { brandId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const brandId = body.brandId;
  if (!brandId || typeof brandId !== "string") {
    return NextResponse.json({ error: "brandId is required" }, { status: 400 });
  }

  const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const metrics = await fetchInstagramMetrics();
  if (!metrics) {
    return NextResponse.json(
      {
        error:
          "Could not fetch Instagram metrics. Check META_PAGE_ID and META_PAGE_ACCESS_TOKEN in .env and that the Page is linked to an Instagram Business account.",
      },
      { status: 502 }
    );
  }

  const period = new Date().toISOString().slice(0, 7);

  const existing = await db
    .select()
    .from(socialMetrics)
    .where(
      and(
        eq(socialMetrics.brandId, brandId),
        eq(socialMetrics.platform, "instagram"),
        eq(socialMetrics.period, period)
      )
    )
    .limit(1);

  const row = {
    brandId,
    platform: "instagram" as const,
    period,
    followersCount: metrics.followersCount,
    engagementRate: metrics.engagementRate,
    seriesData: {
      followers: metrics.followersSeries,
      engagementGrowth: metrics.engagementGrowthSeries,
    },
  };

  if (existing.length > 0) {
    await db
      .update(socialMetrics)
      .set({
        followersCount: row.followersCount,
        engagementRate: row.engagementRate,
        seriesData: row.seriesData,
      })
      .where(eq(socialMetrics.id, existing[0].id));
  } else {
    await db.insert(socialMetrics).values(row);
  }

  return NextResponse.json({
    ok: true,
    brandId,
    platform: "instagram",
    period: row.period,
    followersCount: row.followersCount,
    engagementRate: row.engagementRate,
    message: "Instagram metrics synced from Meta Graph API.",
  });
}
