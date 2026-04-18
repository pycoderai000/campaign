import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { updateBrandSchema } from "@/lib/validations/brands";
import { db, brands, brandContentBuckets, brandMonitoringSources } from "@/lib/db";

function normalizeBuckets(input: { contentBucket?: string; contentBuckets?: string[] }): string[] {
  const fromArray = (input.contentBuckets || []).map((s) => s.trim()).filter(Boolean);
  const legacy = (input.contentBucket || "").trim();
  const merged = legacy ? [legacy, ...fromArray] : fromArray;
  return [...new Set(merged)];
}

function normalizeMonitoringSources(input: {
  monitoringSources?: {
    name: string;
    sourceType: "website" | "news" | "leadership" | "instagram" | "linkedin";
    sourceUrl?: string;
    query?: string;
    isActive?: boolean;
    sortOrder?: number;
  }[];
}) {
  return (input.monitoringSources ?? [])
    .map((source, index) => ({
      name: source.name.trim(),
      sourceType: source.sourceType,
      sourceUrl: (source.sourceUrl ?? "").trim(),
      query: (source.query ?? "").trim(),
      isActive: source.isActive ?? true,
      sortOrder: source.sortOrder ?? index,
    }))
    .filter((source) => source.name.length > 0)
    .map((source, index) => ({
      ...source,
      sortOrder: index,
    }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const [row] = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
  if (!row) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }
  const bucketRows = await db
    .select({ name: brandContentBuckets.name })
    .from(brandContentBuckets)
    .where(eq(brandContentBuckets.brandId, id));
  const sourceRows = await db
    .select({
      id: brandMonitoringSources.id,
      name: brandMonitoringSources.name,
      sourceType: brandMonitoringSources.sourceType,
      sourceUrl: brandMonitoringSources.sourceUrl,
      query: brandMonitoringSources.query,
      isActive: brandMonitoringSources.isActive,
      sortOrder: brandMonitoringSources.sortOrder,
      lastCheckedAt: brandMonitoringSources.lastCheckedAt,
      lastUsedApifyAt: brandMonitoringSources.lastUsedApifyAt,
      lastError: brandMonitoringSources.lastError,
    })
    .from(brandMonitoringSources)
    .where(eq(brandMonitoringSources.brandId, id));
  return NextResponse.json({
    id: row.id,
    name: row.name,
    poc: row.poc,
    email: row.email,
    contactNumber: row.contactNumber,
    contentBucket: row.contentBucket ?? undefined,
    contentBuckets: bucketRows.map((b) => b.name).length > 0 ? bucketRows.map((b) => b.name) : row.contentBucket ? [row.contentBucket] : [],
    monitoringEnabled: row.monitoringEnabled,
    monitoringTime: row.monitoringTime,
    monitoringLastRunAt: row.monitoringLastRunAt ?? undefined,
    monitoringSources: sourceRows
      .sort((a, z) => a.sortOrder - z.sortOrder)
      .map((source) => ({
        id: source.id,
        name: source.name,
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl ?? undefined,
        query: source.query ?? undefined,
        isActive: source.isActive,
        sortOrder: source.sortOrder,
        lastCheckedAt: source.lastCheckedAt?.toISOString(),
        lastUsedApifyAt: source.lastUsedApifyAt?.toISOString(),
        lastError: source.lastError ?? undefined,
      })),
    instagramLink: row.instagramLink ?? undefined,
    instagramHandle: row.instagramHandle ?? undefined,
    youtubeLink: row.youtubeLink ?? undefined,
    youtubeHandle: row.youtubeHandle ?? undefined,
    tiktokLink: row.tiktokLink ?? undefined,
    tiktokHandle: row.tiktokHandle ?? undefined,
    createdAt: row.createdAt,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await request.json();
  const parsed = updateBrandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const hasBucketPayload = data.contentBuckets !== undefined || data.contentBucket !== undefined;
  const nextBuckets = hasBucketPayload ? normalizeBuckets(data) : undefined;
  const hasMonitoringSourcePayload = data.monitoringSources !== undefined;
  const nextMonitoringSources = hasMonitoringSourcePayload ? normalizeMonitoringSources(data) : undefined;
  const nextMonitoringEnabled =
    data.monitoringEnabled !== undefined
      ? Boolean(data.monitoringEnabled && (hasMonitoringSourcePayload ? (nextMonitoringSources?.length ?? 0) > 0 : true))
      : hasMonitoringSourcePayload && (nextMonitoringSources?.length ?? 0) === 0
      ? false
      : undefined;
  const [updated] = await db.transaction(async (tx) => {
    const [u] = await tx
      .update(brands)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.poc !== undefined && { poc: data.poc }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.contactNumber !== undefined && { contactNumber: data.contactNumber }),
        ...(hasBucketPayload && { contentBucket: (nextBuckets && nextBuckets[0]) || null }),
        ...(nextMonitoringEnabled !== undefined && { monitoringEnabled: nextMonitoringEnabled }),
        ...(data.monitoringTime !== undefined && { monitoringTime: data.monitoringTime }),
        ...(data.instagramLink !== undefined && { instagramLink: data.instagramLink || null }),
        ...(data.instagramHandle !== undefined && { instagramHandle: data.instagramHandle || null }),
        ...(data.youtubeLink !== undefined && { youtubeLink: data.youtubeLink || null }),
        ...(data.youtubeHandle !== undefined && { youtubeHandle: data.youtubeHandle || null }),
        ...(data.tiktokLink !== undefined && { tiktokLink: data.tiktokLink || null }),
        ...(data.tiktokHandle !== undefined && { tiktokHandle: data.tiktokHandle || null }),
        updatedAt: new Date(),
      })
      .where(eq(brands.id, id))
      .returning();

    if (hasBucketPayload) {
      await tx.delete(brandContentBuckets).where(eq(brandContentBuckets.brandId, id));
      if (nextBuckets && nextBuckets.length > 0) {
        await tx.insert(brandContentBuckets).values(
          nextBuckets.map((name) => ({
            brandId: id,
            name,
          }))
        );
      }
    }
    if (hasMonitoringSourcePayload) {
      await tx.delete(brandMonitoringSources).where(eq(brandMonitoringSources.brandId, id));
      if (nextMonitoringSources && nextMonitoringSources.length > 0) {
        await tx.insert(brandMonitoringSources).values(
          nextMonitoringSources.map((source) => ({
            brandId: id,
            name: source.name,
            sourceType: source.sourceType,
            sourceUrl: source.sourceUrl || null,
            query: source.query || null,
            isActive: source.isActive,
            sortOrder: source.sortOrder,
          }))
        );
      }
    }
    return [u];
  });
  if (!updated) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }
  const bucketRows = await db
    .select({ name: brandContentBuckets.name })
    .from(brandContentBuckets)
    .where(eq(brandContentBuckets.brandId, id));
  const sourceRows = await db
    .select({
      id: brandMonitoringSources.id,
      name: brandMonitoringSources.name,
      sourceType: brandMonitoringSources.sourceType,
      sourceUrl: brandMonitoringSources.sourceUrl,
      query: brandMonitoringSources.query,
      isActive: brandMonitoringSources.isActive,
      sortOrder: brandMonitoringSources.sortOrder,
      lastCheckedAt: brandMonitoringSources.lastCheckedAt,
      lastUsedApifyAt: brandMonitoringSources.lastUsedApifyAt,
      lastError: brandMonitoringSources.lastError,
    })
    .from(brandMonitoringSources)
    .where(eq(brandMonitoringSources.brandId, id));
  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    poc: updated.poc,
    email: updated.email,
    contactNumber: updated.contactNumber,
    contentBucket: updated.contentBucket ?? undefined,
    contentBuckets: bucketRows.map((b) => b.name).length > 0 ? bucketRows.map((b) => b.name) : updated.contentBucket ? [updated.contentBucket] : [],
    monitoringEnabled: updated.monitoringEnabled,
    monitoringTime: updated.monitoringTime,
    monitoringLastRunAt: updated.monitoringLastRunAt ?? undefined,
    monitoringSources: sourceRows
      .sort((a, z) => a.sortOrder - z.sortOrder)
      .map((source) => ({
        id: source.id,
        name: source.name,
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl ?? undefined,
        query: source.query ?? undefined,
        isActive: source.isActive,
        sortOrder: source.sortOrder,
        lastCheckedAt: source.lastCheckedAt?.toISOString(),
        lastUsedApifyAt: source.lastUsedApifyAt?.toISOString(),
        lastError: source.lastError ?? undefined,
      })),
    instagramLink: updated.instagramLink ?? undefined,
    instagramHandle: updated.instagramHandle ?? undefined,
    youtubeLink: updated.youtubeLink ?? undefined,
    youtubeHandle: updated.youtubeHandle ?? undefined,
    tiktokLink: updated.tiktokLink ?? undefined,
    tiktokHandle: updated.tiktokHandle ?? undefined,
    createdAt: updated.createdAt,
  });
}
