import { NextResponse } from "next/server";
import { eq, and, inArray, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db, campaignMetrics, campaigns } from "@/lib/db";
import { z } from "zod";

const postMetricSchema = z.object({
  campaignId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  impressions: z.number().int().min(0).default(0),
  reach: z.number().int().min(0).default(0),
  likes: z.number().int().min(0).default(0),
  comments: z.number().int().min(0).default(0),
  engagement: z.number().int().min(0).default(0),
});

/** GET /api/metrics?campaignId= optional. Returns campaign metrics for charts. */
export async function GET(request: Request) {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  const { searchParams } = new URL(request.url);
  const campaignIdParam = searchParams.get("campaignId") ?? undefined;

  let allowedCampaignIds: string[] | null = null;
  if (user.role === "brand" && user.brandId) {
    const rows = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.brandId, user.brandId));
    allowedCampaignIds = rows.map((r) => r.id);
    if (allowedCampaignIds.length === 0) return NextResponse.json([]);
    if (campaignIdParam && !allowedCampaignIds.includes(campaignIdParam)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const conditions = [];
  if (campaignIdParam) conditions.push(eq(campaignMetrics.campaignId, campaignIdParam));
  if (allowedCampaignIds) conditions.push(inArray(campaignMetrics.campaignId, allowedCampaignIds));

  const rows =
    conditions.length > 0
      ? await db
          .select()
          .from(campaignMetrics)
          .where(and(...conditions))
          .orderBy(desc(campaignMetrics.date))
      : await db.select().from(campaignMetrics).orderBy(desc(campaignMetrics.date));

  return NextResponse.json(
    rows.map((r) => ({
      campaignId: r.campaignId,
      date: r.date,
      impressions: r.impressions,
      reach: r.reach,
      likes: r.likes,
      comments: r.comments,
      engagement: r.engagement,
    }))
  );
}

/** POST /api/metrics - store campaign metric (admin or system). */
export async function POST(request: Request) {
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  const parsed = postMetricSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const [inserted] = await db
    .insert(campaignMetrics)
    .values({
      campaignId: data.campaignId,
      date: data.date,
      impressions: data.impressions,
      reach: data.reach,
      likes: data.likes,
      comments: data.comments,
      engagement: data.engagement,
    })
    .returning();
  if (!inserted) {
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
  return NextResponse.json({
    id: inserted.id,
    campaignId: inserted.campaignId,
    date: inserted.date,
    impressions: inserted.impressions,
    reach: inserted.reach,
    likes: inserted.likes,
    comments: inserted.comments,
    engagement: inserted.engagement,
  });
}
