import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { updateCampaignSchema } from "@/lib/validations/campaigns";
import { db, campaigns, brands } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const [row] = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      type: campaigns.type,
      brandId: campaigns.brandId,
      brandName: brands.name,
      createdAt: campaigns.createdAt,
    })
    .from(campaigns)
    .innerJoin(brands, eq(campaigns.brandId, brands.id))
    .where(eq(campaigns.id, id))
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (user.role === "brand" && user.brandId && row.brandId !== user.brandId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(row);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await request.json();
  const parsed = updateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const [updated] = await db
    .update(campaigns)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.brandId !== undefined && { brandId: data.brandId }),
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, id))
    .returning();
  if (!updated) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  const [brand] = await db.select({ name: brands.name }).from(brands).where(eq(brands.id, updated.brandId)).limit(1);
  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    type: updated.type,
    brandId: updated.brandId,
    brandName: brand?.name ?? "",
    createdAt: updated.createdAt,
  });
}
