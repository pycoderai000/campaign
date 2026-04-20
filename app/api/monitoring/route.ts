import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db, brands, brandMonitoringSources } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getMonitoringFeedItems, runBrandMonitoringSync } from "@/lib/brand-monitoring";

function hasValidCronSecret(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  return request.headers.get("x-cron-secret") === expected;
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const brandIdParam = searchParams.get("brandId") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? "30");

    if (user.role === "brand") {
      if (!user.brandId) {
        return NextResponse.json({ error: "Brand user has no brand" }, { status: 403 });
      }
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

    const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const items = await getMonitoringFeedItems(
      brandId,
      Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 30
    );
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
      .where(eq(brandMonitoringSources.brandId, brandId));
    return NextResponse.json({
      brandId: brand.id,
      brandName: brand.name,
      monitoringEnabled: brand.monitoringEnabled,
      monitoringTime: brand.monitoringTime,
      monitoringLastRunAt: brand.monitoringLastRunAt?.toISOString(),
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
      items,
    });
  } catch (error) {
    console.error("GET /api/monitoring failed", error);
    return NextResponse.json({ error: "Monitoring feed failed to load" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cronCall = hasValidCronSecret(request);
    if (!cronCall) {
      const user = await requireAuth("admin");
      if (user instanceof NextResponse) return user;
    }

    const body = await request.json().catch(() => ({}));
    const brandId =
      typeof body?.brandId === "string" && body.brandId.trim().length > 0
        ? body.brandId.trim()
        : undefined;
    const dueOnly =
      typeof body?.dueOnly === "boolean" ? body.dueOnly : cronCall ? true : false;
    const force = typeof body?.force === "boolean" ? body.force : false;

    const result = await runBrandMonitoringSync({ brandId, dueOnly, force });
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/monitoring failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Monitoring sync failed" },
      { status: 500 }
    );
  }
}
