import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db, socialMetrics, brands } from "@/lib/db";
import { z } from "zod";

const platformEnum = z.enum(["instagram", "youtube", "tiktok"]);
const postSocialMetricSchema = z.object({
  brandId: z.string().uuid(),
  platform: platformEnum,
  period: z.string().max(20),
  followersCount: z.number().int().min(0).default(0),
  engagementRate: z.number().int().min(0).default(0),
  seriesData: z
    .object({
      followers: z.array(z.object({ month: z.string(), count: z.number() })).optional(),
      engagementGrowth: z.array(z.object({ month: z.string(), growth: z.number() })).optional(),
    })
    .optional(),
});

/** GET /api/social-metrics?brandId= required for brand user, optional for admin. */
export async function GET(request: Request) {
  const user = await requireAuth();
  const { searchParams } = new URL(request.url);
  const brandIdParam = searchParams.get("brandId") ?? undefined;

  if (user.role === "brand") {
    if (!user.brandId) return NextResponse.json({ error: "Brand user has no brand" }, { status: 403 });
    if (brandIdParam && brandIdParam !== user.brandId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const brandId = brandIdParam ?? (user.role === "brand" ? user.brandId : undefined);
  if (!brandId) {
    return NextResponse.json(
      { error: "brandId query param required when not a brand user" },
      { status: 400 }
    );
  }

  const rows = await db
    .select()
    .from(socialMetrics)
    .where(eq(socialMetrics.brandId, brandId))
    .orderBy(desc(socialMetrics.period));

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      brandId: r.brandId,
      platform: r.platform,
      period: r.period,
      followersCount: r.followersCount,
      engagementRate: r.engagementRate,
      seriesData: r.seriesData ?? undefined,
    }))
  );
}

/** POST /api/social-metrics - store social metric (admin or brand for own brand). */
export async function POST(request: Request) {
  const user = await requireAuth();
  const body = await request.json();
  const parsed = postSocialMetricSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  if (user.role === "brand" && user.brandId !== data.brandId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [inserted] = await db
    .insert(socialMetrics)
    .values({
      brandId: data.brandId,
      platform: data.platform,
      period: data.period,
      followersCount: data.followersCount,
      engagementRate: data.engagementRate,
      seriesData: data.seriesData ?? null,
    })
    .returning();
  if (!inserted) {
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
  return NextResponse.json({
    id: inserted.id,
    brandId: inserted.brandId,
    platform: inserted.platform,
    period: inserted.period,
    followersCount: inserted.followersCount,
    engagementRate: inserted.engagementRate,
    seriesData: inserted.seriesData ?? undefined,
  });
}
